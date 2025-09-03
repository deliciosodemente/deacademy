import { put } from '@vercel/blob';
import { createReadStream } from 'fs';
import { pipeline } from 'stream/promises';

/**
 * Middleware para manejar rutas API en el servidor de desarrollo Vite
 * Simula el comportamiento de las API routes de Vercel
 */
export function apiMiddleware() {
    return {
        name: 'api-middleware',
        configureServer(server) {
            server.middlewares.use('/api', async (req, res, next) => {
                try {
                    // Manejar ruta de subida de avatar
                    if (req.url.startsWith('/upload/avatar') && req.method === 'POST') {
                        await handleAvatarUpload(req, res);
                        return;
                    }

                    // Manejar feature flags
                    if (req.url === '/feature-flags') {
                        await handleFeatureFlags(req, res);
                        return;
                    }
                    
                    // Continuar con el siguiente middleware si no es una ruta API conocida
                    next();
                } catch (error) {
                    console.error('API Middleware Error:', error);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ 
                        error: 'Internal server error',
                        details: process.env.NODE_ENV === 'development' ? error.message : undefined
                    }));
                }
            });
        }
    };
}

/**
 * Maneja las solicitudes de feature flags
 */
async function handleFeatureFlags(req, res) {
    if (req.method !== 'GET') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
    }

    try {
        // Feature flags de demostración
        const featureFlags = {
            'my_feature_flag': false,
            'avatar_upload_enabled': true,
            'chat_interface_v2': false,
            'premium_features_enabled': true,
            'dark_mode_enabled': false,
            'advanced_analytics': false,
            'beta_features': false
        };

        const response = {
            success: true,
            flags: featureFlags,
            metadata: {
                timestamp: new Date().toISOString(),
                source: 'vite-dev-server'
            }
        };

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'no-cache');
        res.end(JSON.stringify(response));
    } catch (error) {
        console.error('Error handling feature flags:', error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
}

/**
 * Maneja la subida de avatares usando Vercel Blob
 */
async function handleAvatarUpload(req, res) {
    try {
        // Parsear query parameters
        const url = new URL(req.url, `http://${req.headers.host}`);
        const filename = url.searchParams.get('filename');
        
        if (!filename) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Filename is required' }));
            return;
        }

        // Validar tipo de archivo
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        const fileExtension = filename.toLowerCase().split('.').pop();
        const mimeTypes = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'webp': 'image/webp',
            'gif': 'image/gif'
        };

        const mimeType = mimeTypes[fileExtension];
        if (!mimeType || !allowedTypes.includes(mimeType)) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ 
                error: 'Invalid file type. Only JPEG, PNG, WebP and GIF are allowed.' 
            }));
            return;
        }

        // Verificar que BLOB_READ_WRITE_TOKEN esté configurado
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ 
                error: 'Blob storage not configured. Please set BLOB_READ_WRITE_TOKEN environment variable.' 
            }));
            return;
        }

        // Generar nombre único para el archivo
        const timestamp = Date.now();
        const uniqueFilename = `avatars/${timestamp}-${filename}`;

        // Recopilar datos del cuerpo de la petición
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        
        await new Promise((resolve, reject) => {
            req.on('end', resolve);
            req.on('error', reject);
        });

        const fileBuffer = Buffer.concat(chunks);
        
        // Validar tamaño (4.5MB)
        if (fileBuffer.length > 4.5 * 1024 * 1024) {
            res.statusCode = 413;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ 
                error: 'File too large. Maximum size is 4.5MB for server uploads.' 
            }));
            return;
        }

        // Subir archivo a Vercel Blob
        const blob = await put(uniqueFilename, fileBuffer, {
            access: 'public',
            contentType: mimeType,
            addRandomSuffix: false // Ya tenemos timestamp
        });

        // Respuesta exitosa
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            success: true,
            blob: {
                url: blob.url,
                downloadUrl: blob.downloadUrl,
                pathname: blob.pathname,
                size: fileBuffer.length,
                uploadedAt: new Date().toISOString()
            },
            message: 'Avatar uploaded successfully'
        }));

    } catch (error) {
        console.error('Error uploading avatar:', error);
        
        // Manejar errores específicos de Vercel Blob
        let statusCode = 500;
        let errorMessage = 'Failed to upload avatar';
        
        if (error.message?.includes('size')) {
            statusCode = 413;
            errorMessage = 'File too large. Maximum size is 4.5MB for server uploads.';
        } else if (error.message?.includes('token') || error.message?.includes('unauthorized')) {
            statusCode = 500;
            errorMessage = 'Blob storage configuration error. Please check BLOB_READ_WRITE_TOKEN.';
        }

        res.statusCode = statusCode;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ 
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }));
    }
}

export default apiMiddleware;