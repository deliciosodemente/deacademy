import { generateChatResponse, generateImageFromPrompt } from '../../../../lib/gemini-client.js';

const chat = async (req, res) => {
    try {
        const { messages } = req.body;
        const response = await generateChatResponse(messages);
        return res.status(200).json({ ...response, timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('Error in /api/ai/chat:', error);
        res.status(500).json({ content: 'Internal server error', fallback: true });
    }
};

const images = async (req, res) => {
    try {
        const { prompt } = req.body;
        const response = await generateImageFromPrompt(prompt);
        return res.status(200).json(response);
    } catch (error) {
        console.error('Error in /api/ai/images:', error);
        res.status(500).json({ url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=450&fit=crop&q=80', prompt, fallback: true });
    }
};

export { chat, images };