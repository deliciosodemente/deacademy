import { GoogleGenerativeAI } from '@google/generative-ai';
import { configManager } from './configuration-manager.js';

class GeminiClient {
    constructor() {
        this.genAI = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            const apiKey = configManager.get('GEMINI_API_KEY') || window.GEMINI_API_KEY;
            if (!apiKey) {
                console.warn('⚠️ Gemini API key not found. Chat functionality will use fallback responses.');
                return false;
            }
            
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.isInitialized = true;
            console.log('🤖 Gemini AI client initialized');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Gemini client:', error);
            return false;
        }
    }

    isReady() {
        return this.isInitialized && this.genAI;
    }

    async generateChatResponse(messages) {
        if (!this.isReady()) {
            return { 
                content: "Hi! I'm your English learning assistant. How can I help you today?", 
                fallback: true 
            };
        }

        try {
            const model = this.genAI.getGenerativeModel({ model: "gemini-pro"});
            const chat = model.startChat({
                history: messages.slice(0, -1).map(m => ({ 
                    role: m.role, 
                    parts: m.parts.map(p => p.text).join("") 
                })),
                generationConfig: {
                    maxOutputTokens: 500,
                    temperature: 0.7,
                },
            });

            const msg = messages[messages.length - 1].parts.map(p => p.text).join("");
            const result = await chat.sendMessage(msg);
            const response = await result.response;
            const text = response.text();
            return { content: text, fallback: false };
        } catch (error) {
            console.error("Error generating chat response from Gemini:", error);
            return { 
                content: "I'm sorry, I can't respond right now. Please try again later.", 
                fallback: true 
            };
        }
    }

    async generateImageFromPrompt(prompt) {
        const promptForImage = `Generate a markdown image tag for a picture that represents: "${prompt}". Use a placeholder image from unsplash.`;
        
        if (!this.isReady()) {
            return { 
                url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=450&fit=crop&q=80', 
                prompt, 
                fallback: true 
            };
        }

        try {
            const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
            const result = await model.generateContent(promptForImage);
            const response = await result.response;
            const text = response.text();
            const match = text.match(/\!\[.*\]\((.*)\)/);
            if (match && match[1]) {
                return { url: match[1], prompt, fallback: false };
            }
            return { 
                url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=450&fit=crop&q=80', 
                prompt, 
                fallback: true 
            };
        } catch (error) {
            console.error("Error generating image from Gemini:", error);
            return { 
                url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=450&fit=crop&q=80', 
                prompt, 
                fallback: true 
            };
        }
    }
}

// Create singleton instance
const geminiClient = new GeminiClient();

// Legacy function exports for backward compatibility
export async function generateChatResponse(messages) {
    return await geminiClient.generateChatResponse(messages);
}

export async function generateImageFromPrompt(prompt) {
    return await geminiClient.generateImageFromPrompt(prompt);
}

export { geminiClient };