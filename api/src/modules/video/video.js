import AWS from 'aws-sdk';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// AWS S3 Configuration
const s3Client = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-2'
});

// Configure CloudFront
const cloudfront = new AWS.CloudFront({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;
const ACCESS_POINT_ARN = process.env.S3_ACCESS_POINT_ARN;
const ACCESS_POINT_ALIAS = process.env.S3_ACCESS_POINT_ALIAS;
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;
const CLOUDFRONT_KEY_PAIR_ID = process.env.CLOUDFRONT_KEY_PAIR_ID;
const CLOUDFRONT_PRIVATE_KEY_PATH = process.env.CLOUDFRONT_PRIVATE_KEY_PATH;

// Generate CloudFront signed URL
const generateCloudFrontSignedUrl = (videoKey, expirationTime) => {
    try {
        if (!CLOUDFRONT_DOMAIN || !CLOUDFRONT_KEY_PAIR_ID || !CLOUDFRONT_PRIVATE_KEY_PATH) {
            throw new Error('CloudFront configuration is incomplete');
        }

        const url = `https://${CLOUDFRONT_DOMAIN}/${videoKey}`;
        const policy = {
            Statement: [{
                Resource: url,
                Condition: {
                    DateLessThan: {
                        'AWS:EpochTime': Math.floor(expirationTime / 1000)
                    }
                }
            }]
        };

        const policyString = JSON.stringify(policy);
        const privateKey = fs.readFileSync(CLOUDFRONT_PRIVATE_KEY_PATH, 'utf8');
        
        const signature = crypto.sign('RSA-SHA1', Buffer.from(policyString), privateKey, 'base64')
            .replace(/\+/g, '-')
            .replace(/=/g, '_')
            .replace(/\//g, '~');

        const encodedPolicy = Buffer.from(policyString).toString('base64')
            .replace(/\+/g, '-')
            .replace(/=/g, '_')
            .replace(/\//g, '~');

        return `${url}?Expires=${Math.floor(expirationTime / 1000)}&Signature=${signature}&Key-Pair-Id=${CLOUDFRONT_KEY_PAIR_ID}`;
    } catch (error) {
        console.error('Error generating CloudFront signed URL:', error);
        return null;
    }
};

// Get video metadata from S3
const getVideoMetadata = async (videoKey) => {
    try {
        const bucketParam = ACCESS_POINT_ARN || BUCKET_NAME;
        const params = {
            Bucket: bucketParam,
            Key: videoKey
        };

        const headObject = await s3Client.headObject(params).promise();
        
        return {
            size: headObject.ContentLength,
            lastModified: headObject.LastModified,
            contentType: headObject.ContentType,
            metadata: headObject.Metadata || {},
            accessPoint: ACCESS_POINT_ARN ? 'used' : 'not_used'
        };
    } catch (error) {
        console.error('Error getting video metadata:', error);
        return null;
    }
};

// Main function to get signed URL with enhanced features
const getSignedUrl = async (req, res) => {
    try {
        const { videoKey, useCloudFront = true, expirationHours = 1 } = req.body;

        if (!videoKey) {
            return res.status(400).json({ 
                error: 'videoKey is required',
                code: 'MISSING_VIDEO_KEY'
            });
        }

        // Validate video key format
        if (!/^[a-zA-Z0-9\/\-_.]+\.(mp4|webm|ogg|mov)$/i.test(videoKey)) {
            return res.status(400).json({ 
                error: 'Invalid video key format',
                code: 'INVALID_VIDEO_KEY'
            });
        }

        const expirationTime = Date.now() + (expirationHours * 60 * 60 * 1000);
        let signedUrl;
        let metadata = null;

        // Get video metadata
        try {
            metadata = await getVideoMetadata(videoKey);
        } catch (metaError) {
            console.warn('Could not retrieve video metadata:', metaError.message);
        }

        // Try CloudFront first if enabled and configured
        if (useCloudFront && process.env.FEATURE_VIDEO_STREAMING === 'true') {
            signedUrl = generateCloudFrontSignedUrl(videoKey, expirationTime);
        }

        // Fallback to S3 signed URL if CloudFront fails or is disabled
        if (!signedUrl) {
            // Use S3 Access Point for signed URL
            const bucketParam = ACCESS_POINT_ARN || BUCKET_NAME;
            const params = {
                Bucket: bucketParam,
                Key: videoKey,
                Expires: expirationHours * 60 * 60
            };

            signedUrl = await s3Client.getSignedUrlPromise('getObject', params);
        }

        const response = {
            signedUrl,
            videoKey,
            expiresAt: new Date(expirationTime).toISOString(),
            source: signedUrl.includes('cloudfront') ? 'cloudfront' : 's3',
            accessPoint: ACCESS_POINT_ALIAS ? 'enabled' : 'disabled',
            metadata: metadata ? {
                size: metadata.size,
                duration: metadata.metadata.duration || null,
                resolution: metadata.metadata.resolution || null,
                bitrate: metadata.metadata.bitrate || null
            } : null
        };

        res.json(response);

    } catch (error) {
        console.error('Error generating signed URL:', error);
        res.status(500).json({ 
            error: 'Failed to generate signed URL',
            code: 'SIGNED_URL_GENERATION_FAILED',
            message: error.message
        });
    }
};

// List available videos in a course
const listCourseVideos = async (req, res) => {
    try {
        const { courseId } = req.params;
        
        if (!courseId) {
            return res.status(400).json({ 
                error: 'courseId is required',
                code: 'MISSING_COURSE_ID'
            });
        }

        const params = {
            Bucket: BUCKET_NAME,
            Prefix: `${courseId}/`,
            Delimiter: '/'
        };

        const data = await s3Client.listObjectsV2(params).promise();
        
        const videos = data.Contents
            .filter(obj => /\.(mp4|webm|ogg|mov)$/i.test(obj.Key))
            .map(obj => ({
                key: obj.Key,
                size: obj.Size,
                lastModified: obj.LastModified,
                lessonId: path.basename(obj.Key, path.extname(obj.Key))
            }));

        res.json({
            courseId,
            videos,
            totalVideos: videos.length,
            totalSize: videos.reduce((sum, video) => sum + video.size, 0)
        });

    } catch (error) {
        console.error('Error listing course videos:', error);
        res.status(500).json({ 
            error: 'Failed to list course videos',
            code: 'LIST_VIDEOS_FAILED',
            message: error.message
        });
    }
};

// Health check for video service
const healthCheck = async (req, res) => {
    try {
        const checks = {
            s3: false,
            cloudfront: false,
            bucket: false
        };

        // Test S3 connection
        try {
            const bucketParam = ACCESS_POINT_ARN || BUCKET_NAME;
            await s3Client.headBucket({ Bucket: bucketParam }).promise();
            checks.s3 = true;
            checks.bucket = true;
        } catch (error) {
            console.error('S3 health check failed:', error.message);
        }

        // Test CloudFront configuration
        if (CLOUDFRONT_DOMAIN && CLOUDFRONT_KEY_PAIR_ID) {
            checks.cloudfront = true;
        }

        const isHealthy = checks.s3 && checks.bucket;

        res.status(isHealthy ? 200 : 503).json({
            status: isHealthy ? 'healthy' : 'unhealthy',
            checks,
            timestamp: new Date().toISOString(),
            features: {
                videoStreaming: process.env.FEATURE_VIDEO_STREAMING === 'true',
                cloudfront: checks.cloudfront
            }
        });

    } catch (error) {
        console.error('Health check failed:', error);
        res.status(503).json({ 
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

export { getSignedUrl, listCourseVideos, healthCheck };