/**
 * API Configuration for Production
 * Configure your AI service endpoints here
 */

export class APIConfig {
    constructor() {
        this.baseURL = this.getAPIBaseURL();
        this.endpoints = {
            chat: '/api/ai/chat',
            images: '/api/ai/images',
            auth: '/api/auth',
            users: '/api/users',
            courses: '/api/courses',
            progress: '/api/progress'
        };
    }

    getAPIBaseURL() {
        // Detect environment and return appropriate API base URL
        const hostname = window.location.hostname;

        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3001'; // Local development API
        } else if (hostname.includes('staging')) {
            return 'https://api-staging.digitalenglishacademy.com';
        } else {
            return 'https://api.digitalenglishacademy.com';
        }
    }

    getEndpoint(name) {
        return `${this.baseURL}${this.endpoints[name]}`;
    }

    async makeRequest(endpoint, options = {}) {
        const url = this.getEndpoint(endpoint);
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        // Add authentication if available
        const token = await this.getAuthToken();
        if (token) {
            defaultOptions.headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            ...defaultOptions,
            ...options
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    async getAuthToken() {
        if (window.deaAuth?.manager) {
            try {
                return await window.deaAuth.manager.getAccessToken();
            } catch (error) {
                console.warn('Failed to get auth token:', error);
            }
        }
        return null;
    }

    // AI Service Integration
    async callAIService(options) {
        try {
            const response = await this.makeRequest('chat', {
                method: 'POST',
                body: JSON.stringify(options)
            });

            return response;
        } catch (error) {
            console.error('AI service error:', error);
            return this.getFallbackResponse(options);
        }
    }

    getFallbackResponse(options) {
        // Provide fallback responses when AI service is unavailable
        if (options.json) {
            return {
                content: JSON.stringify({
                    persona: "Estudiante motivado",
                    titulo: "Aprendiz de inglés",
                    nivel: "Intermedio",
                    intereses: ["conversación", "gramática", "vocabulario"],
                    estilo: "visual"
                })
            };
        }

        const fallbackResponses = [
            "¡Hola! Estoy aquí para ayudarte con tu aprendizaje de inglés.",
            "¿En qué puedo ayudarte hoy?",
            "¿Tienes alguna pregunta sobre gramática o vocabulario?",
            "¡Excelente pregunta! Te recomiendo practicar más con nuestras lecciones.",
            "Servicio de IA temporalmente no disponible. Por favor, intenta más tarde."
        ];

        return {
            content: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]
        };
    }

    // Image Service Integration
    async generateImage(prompt, options = {}) {
        try {
            const response = await this.makeRequest('images', {
                method: 'POST',
                body: JSON.stringify({
                    prompt,
                    ...options
                })
            });

            return response;
        } catch (error) {
            console.error('Image generation error:', error);

            // Return placeholder image
            return {
                url: `https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=450&fit=crop&q=80`
            };
        }
    }
}

// Export singleton instance
export const apiConfig = new APIConfig();