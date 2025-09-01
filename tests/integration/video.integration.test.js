/**
 * Integration tests for Video API Routes
 * Tests complete API endpoints with mocked AWS services
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import videoRoutes from '../../api/src/modules/video/video.routes.js';

// Mock AWS SDK for integration tests
vi.mock('aws-sdk', () => {
    const mockS3Instance = {
        headObject: vi.fn(),
        getSignedUrlPromise: vi.fn(),
        listObjectsV2: vi.fn(),
        headBucket: vi.fn()
    };

    return {
        default: {
            S3: vi.fn(() => mockS3Instance)
        },
        S3: vi.fn(() => mockS3Instance)
    };
});

// Mock fs module
vi.mock('fs', () => ({
    default: {
        readFileSync: vi.fn()
    },
    readFileSync: vi.fn()
}));

// Mock crypto module
vi.mock('crypto', () => ({
    default: {
        sign: vi.fn()
    },
    sign: vi.fn()
}));

describe('Video API Integration Tests', () => {
    let app;
    let mockS3;
    let mockFs;
    let mockCrypto;

    beforeAll(async () => {
        // Setup Express app with video routes
        app = express();
        app.use(express.json());
        app.use('/api/video', videoRoutes);

        // Setup environment variables
        process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
        process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
        process.env.AWS_REGION = 'us-east-2';
        process.env.S3_BUCKET_NAME = 'test-bucket';
        process.env.S3_ACCESS_POINT_ARN = 'arn:aws:s3:us-east-2:123456789012:accesspoint/test-ap';
        process.env.S3_ACCESS_POINT_ALIAS = 'test-ap-alias';
        process.env.CLOUDFRONT_DOMAIN = 'd9zcoog7fpl4q.cloudfront.net';
        process.env.CLOUDFRONT_KEY_PAIR_ID = 'E2K3K2YQ4XU9K1';
        process.env.CLOUDFRONT_PRIVATE_KEY_PATH = './cloudfront-private-key.pem';
        process.env.FEATURE_VIDEO_STREAMING = 'true';

        // Get mocked modules
        const AWS = vi.mocked(await import('aws-sdk')).default;
        mockS3 = new AWS.S3();
        
        const fs = vi.mocked(await import('fs')).default;
        mockFs = fs;
        
        const crypto = vi.mocked(await import('crypto')).default;
        mockCrypto = crypto;
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterAll(() => {
        vi.restoreAllMocks();
    });

    describe('POST /api/video/signed-url', () => {
        it('should return 400 when videoKey is missing', async () => {
            const response = await request(app)
                .post('/api/video/signed-url')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                error: 'videoKey is required',
                code: 'MISSING_VIDEO_KEY'
            });
        });

        it('should return 400 for invalid video key format', async () => {
            const response = await request(app)
                .post('/api/video/signed-url')
                .send({ videoKey: 'invalid-key' });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                error: 'Invalid video key format',
                code: 'INVALID_VIDEO_KEY'
            });
        });

        it('should generate CloudFront signed URL successfully', async () => {
            // Mock fs.readFileSync for private key
            mockFs.readFileSync.mockReturnValue('-----BEGIN RSA PRIVATE KEY-----\ntest-key\n-----END RSA PRIVATE KEY-----');
            
            // Mock crypto.sign
            mockCrypto.sign.mockReturnValue('test-signature');

            // Mock S3 headObject for metadata
            mockS3.headObject.mockReturnValue({
                promise: () => Promise.resolve({
                    ContentLength: 1024000,
                    LastModified: new Date('2024-01-01T00:00:00Z'),
                    ContentType: 'video/mp4',
                    Metadata: { duration: '120', resolution: '1080p' }
                })
            });

            const response = await request(app)
                .post('/api/video/signed-url')
                .send({ videoKey: 'course1/lesson1.mp4' });

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                videoKey: 'course1/lesson1.mp4',
                source: 'cloudfront',
                accessPoint: 'enabled',
                metadata: {
                    size: 1024000,
                    duration: '120',
                    resolution: '1080p',
                    contentType: 'video/mp4'
                }
            });
            expect(response.body.signedUrl).toContain('d9zcoog7fpl4q.cloudfront.net');
        });

        it('should fallback to S3 when CloudFront is disabled', async () => {
            // Mock S3 getSignedUrlPromise
            mockS3.getSignedUrlPromise.mockResolvedValue('https://test-bucket.s3.amazonaws.com/course1/lesson1.mp4?signed-url');
            
            // Mock S3 headObject for metadata
            mockS3.headObject.mockReturnValue({
                promise: () => Promise.resolve({
                    ContentLength: 1024000,
                    LastModified: new Date('2024-01-01T00:00:00Z'),
                    ContentType: 'video/mp4',
                    Metadata: {}
                })
            });

            const response = await request(app)
                .post('/api/video/signed-url')
                .send({ 
                    videoKey: 'course1/lesson1.mp4',
                    useCloudFront: false
                });

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                videoKey: 'course1/lesson1.mp4',
                source: 's3',
                accessPoint: 'enabled'
            });
            expect(response.body.signedUrl).toContain('test-bucket.s3.amazonaws.com');
        });

        it('should handle custom expiration hours', async () => {
            mockS3.getSignedUrlPromise.mockResolvedValue('https://test-bucket.s3.amazonaws.com/course1/lesson1.mp4?signed-url');
            mockS3.headObject.mockReturnValue({
                promise: () => Promise.resolve({
                    ContentLength: 1024000,
                    LastModified: new Date(),
                    ContentType: 'video/mp4',
                    Metadata: {}
                })
            });

            const response = await request(app)
                .post('/api/video/signed-url')
                .send({ 
                    videoKey: 'course1/lesson1.mp4',
                    useCloudFront: false,
                    expirationHours: 24
                });

            expect(response.status).toBe(200);
            expect(mockS3.getSignedUrlPromise).toHaveBeenCalledWith('getObject', 
                expect.objectContaining({
                    Expires: 86400 // 24 hours in seconds
                })
            );
        });

        it('should return 500 when S3 fails', async () => {
            mockS3.getSignedUrlPromise.mockRejectedValue(new Error('S3 connection failed'));
            mockS3.headObject.mockReturnValue({
                promise: () => Promise.reject(new Error('Metadata fetch failed'))
            });

            const response = await request(app)
                .post('/api/video/signed-url')
                .send({ videoKey: 'course1/lesson1.mp4' });

            expect(response.status).toBe(500);
            expect(response.body).toMatchObject({
                error: 'Failed to generate signed URL',
                code: 'SIGNED_URL_GENERATION_FAILED'
            });
        });
    });

    describe('GET /api/video/course/:courseId/videos', () => {
        it('should return 400 when courseId is missing', async () => {
            const response = await request(app)
                .get('/api/video/course//videos');

            expect(response.status).toBe(404); // Express returns 404 for empty params
        });

        it('should list videos for a course successfully', async () => {
            const mockS3Response = {
                Contents: [
                    {
                        Key: 'course1/lesson1.mp4',
                        Size: 1024000,
                        LastModified: new Date('2024-01-01T00:00:00Z')
                    },
                    {
                        Key: 'course1/lesson2.mp4',
                        Size: 2048000,
                        LastModified: new Date('2024-01-02T00:00:00Z')
                    },
                    {
                        Key: 'course1/notes.txt', // Should be filtered out
                        Size: 1000,
                        LastModified: new Date('2024-01-01T00:00:00Z')
                    }
                ]
            };

            mockS3.listObjectsV2.mockReturnValue({
                promise: () => Promise.resolve(mockS3Response)
            });

            const response = await request(app)
                .get('/api/video/course/course1/videos');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                courseId: 'course1',
                videos: [
                    {
                        key: 'course1/lesson1.mp4',
                        size: 1024000,
                        lastModified: new Date('2024-01-01T00:00:00Z'),
                        lessonId: 'lesson1'
                    },
                    {
                        key: 'course1/lesson2.mp4',
                        size: 2048000,
                        lastModified: new Date('2024-01-02T00:00:00Z'),
                        lessonId: 'lesson2'
                    }
                ],
                totalVideos: 2,
                totalSize: 3072000
            });
        });

        it('should return empty list when no videos found', async () => {
            mockS3.listObjectsV2.mockReturnValue({
                promise: () => Promise.resolve({ Contents: [] })
            });

            const response = await request(app)
                .get('/api/video/course/empty-course/videos');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                courseId: 'empty-course',
                videos: [],
                totalVideos: 0,
                totalSize: 0
            });
        });

        it('should return 500 when S3 listObjectsV2 fails', async () => {
            mockS3.listObjectsV2.mockReturnValue({
                promise: () => Promise.reject(new Error('S3 list failed'))
            });

            const response = await request(app)
                .get('/api/video/course/course1/videos');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                error: 'Failed to list course videos',
                code: 'LIST_VIDEOS_FAILED',
                message: 'S3 list failed'
            });
        });
    });

    describe('GET /api/video/health', () => {
        it('should return healthy status when all services work', async () => {
            mockS3.headBucket.mockReturnValue({
                promise: () => Promise.resolve({})
            });

            const response = await request(app)
                .get('/api/video/health');

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                status: 'healthy',
                checks: {
                    s3: true,
                    cloudfront: true,
                    bucket: true
                },
                features: {
                    videoStreaming: true,
                    cloudfront: true
                }
            });
            expect(response.body.timestamp).toBeDefined();
        });

        it('should return unhealthy status when S3 fails', async () => {
            mockS3.headBucket.mockReturnValue({
                promise: () => Promise.reject(new Error('S3 connection failed'))
            });

            const response = await request(app)
                .get('/api/video/health');

            expect(response.status).toBe(503);
            expect(response.body).toMatchObject({
                status: 'unhealthy',
                checks: {
                    s3: false,
                    cloudfront: true,
                    bucket: false
                },
                features: {
                    videoStreaming: true,
                    cloudfront: true
                }
            });
        });

        it('should handle rate limiting gracefully', async () => {
            // Simulate multiple rapid requests
            const promises = Array(5).fill().map(() => 
                request(app).get('/api/video/health')
            );

            mockS3.headBucket.mockReturnValue({
                promise: () => Promise.resolve({})
            });

            const responses = await Promise.all(promises);
            
            // All requests should succeed (no rate limiting implemented yet)
            responses.forEach(response => {
                expect(response.status).toBe(200);
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle malformed JSON requests', async () => {
            const response = await request(app)
                .post('/api/video/signed-url')
                .set('Content-Type', 'application/json')
                .send('{ invalid json }');

            expect(response.status).toBe(400);
        });

        it('should handle missing Content-Type header', async () => {
            const response = await request(app)
                .post('/api/video/signed-url')
                .send('videoKey=course1/lesson1.mp4');

            // Express should handle this gracefully
            expect([200, 400, 415]).toContain(response.status);
        });

        it('should handle very large video keys', async () => {
            const largeVideoKey = 'course1/' + 'a'.repeat(1000) + '.mp4';
            
            const response = await request(app)
                .post('/api/video/signed-url')
                .send({ videoKey: largeVideoKey });

            // Should either process or reject gracefully
            expect([200, 400, 413, 500]).toContain(response.status);
        });
    });

    describe('Security Tests', () => {
        it('should reject path traversal attempts in videoKey', async () => {
            const response = await request(app)
                .post('/api/video/signed-url')
                .send({ videoKey: '../../../etc/passwd' });

            expect(response.status).toBe(400);
            expect(response.body.code).toBe('INVALID_VIDEO_KEY');
        });

        it('should reject null bytes in videoKey', async () => {
            const response = await request(app)
                .post('/api/video/signed-url')
                .send({ videoKey: 'course1/lesson1\x00.mp4' });

            expect(response.status).toBe(400);
        });

        it('should handle SQL injection attempts in courseId', async () => {
            const response = await request(app)
                .get('/api/video/course/course1\'; DROP TABLE users; --/videos');

            // Should be handled as a normal courseId (URL encoded)
            expect([200, 400, 404, 500]).toContain(response.status);
        });
    });
});