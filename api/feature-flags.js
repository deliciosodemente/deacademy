/**
 * API Endpoint para Feature Flags
 * Proporciona los estados actuales de los feature flags usando Vercel Flags SDK
 */

// En un entorno de producción, importarías desde flags.ts
// import { createFeatureFlag } from '../flags';

/**
 * Maneja las solicitudes de feature flags
 * @param {Request} request - La solicitud HTTP
 * @returns {Response} - La respuesta con los feature flags
 */
export default async function handler(request) {
    // Solo permitir métodos GET
    if (request.method !== 'GET') {
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            {
                status: 405,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            }
        );
    }

    try {
        // En producción, aquí evaluarías los feature flags usando Statsig
        // const myFeatureFlag = await createFeatureFlag('my_feature_flag')();
        // const avatarUploadFlag = await createFeatureFlag('avatar_upload_enabled')();
        // etc.

        // Para la demo, devolvemos valores estáticos
        const featureFlags = {
            'my_feature_flag': false,
            'avatar_upload_enabled': true,
            'chat_interface_v2': false,
            'premium_features_enabled': true,
            'dark_mode_enabled': false,
            'advanced_analytics': false,
            'beta_features': false
        };

        // Obtener información del usuario desde headers o query params
        const userAgent = request.headers.get('user-agent') || '';
        const userID = new URL(request.url).searchParams.get('userID') || 'anonymous';

        // En producción, aquí podrías personalizar los flags basado en el usuario
        // Por ejemplo, habilitar beta features solo para ciertos usuarios
        if (userID === 'beta-tester') {
            featureFlags['beta_features'] = true;
        }

        // Log para debugging (en producción, usar un logger apropiado)
        console.log(`Feature flags requested by user: ${userID}`);

        return new Response(
            JSON.stringify({
                success: true,
                flags: featureFlags,
                metadata: {
                    userID,
                    timestamp: new Date().toISOString(),
                    source: 'vercel-flags-sdk'
                }
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            }
        );

    } catch (error) {
        console.error('Error fetching feature flags:', error);
        
        return new Response(
            JSON.stringify({
                success: false,
                error: 'Internal server error',
                flags: {
                    // Valores por defecto en caso de error
                    'my_feature_flag': false,
                    'avatar_upload_enabled': true,
                    'chat_interface_v2': false,
                    'premium_features_enabled': false,
                    'dark_mode_enabled': false,
                    'advanced_analytics': false,
                    'beta_features': false
                }
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
        );
    }
}

// Para compatibilidad con diferentes entornos de deployment
export const config = {
    runtime: 'edge'
};