import { put } from '@vercel/blob';

/**
 * API endpoint para subir avatares usando Vercel Blob
 * Adaptado para aplicación Vite con estructura de API personalizada
 */
export default async function handler(req, res) {
    // Solo permitir método POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { filename } = req.query;
        
        if (!filename) {
            return res.status(400).json({ error: 'Filename is required' });
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
            return res.status(400).json({ 
                error: 'Invalid file type. Only JPEG, PNG, WebP and GIF are allowed.' 
            });
        }

        // Generar nombre único para el archivo
        const timestamp = Date.now();
        const uniqueFilename = `avatars/${timestamp}-${filename}`;

        // Subir archivo a Vercel Blob
        const blob = await put(uniqueFilename, req.body, {
            access: 'public',
            contentType: mimeType,
            // Agregar metadatos
            addRandomSuffix: false // Ya tenemos timestamp
        });

        // Respuesta exitosa
        return res.status(200).json({
            success: true,
            blob: {
                url: blob.url,
                downloadUrl: blob.downloadUrl,
                pathname: blob.pathname,
                size: blob.size,
                uploadedAt: new Date().toISOString()
            },
            message: 'Avatar uploaded successfully'
        });

    } catch (error) {
        console.error('Error uploading avatar:', error);
        
        // Manejar errores específicos de Vercel Blob
        if (error.message?.includes('size')) {
            return res.status(413).json({ 
                error: 'File too large. Maximum size is 4.5MB for server uploads.' 
            });
        }

        if (error.message?.includes('token')) {
            return res.status(500).json({ 
                error: 'Blob storage configuration error. Please check BLOB_READ_WRITE_TOKEN.' 
            });
        }

        return res.status(500).json({ 
            error: 'Failed to upload avatar',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

// Configuración para manejar archivos binarios
export const config = {
    api: {
        bodyParser: false,
    },
};