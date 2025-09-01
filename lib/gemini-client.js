import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateChatResponse(messages) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro"});
    const chat = model.startChat({
      history: messages.slice(0, -1).map(m => ({ role: m.role, parts: m.parts.map(p => p.text).join("") })),
      generationConfig: {
        maxOutputTokens: 100,
      },
    });

    const msg = messages[messages.length - 1].parts.map(p => p.text).join("");
    const result = await chat.sendMessage(msg);
    const response = await result.response;
    const text = response.text();
    return { content: text, fallback: false };
  } catch (error) {
    console.error("Error generating chat response from Gemini:", error);
    return { content: "Lo siento, no puedo responder en este momento.", fallback: true };
  }
}

async function generateImageFromPrompt(prompt) {
  const promptForImage = `Generate a markdown image tag for a picture that represents: "${prompt}". Use a placeholder image from unsplash.`;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(promptForImage);
    const response = await result.response;
    const text = response.text();
    const match = text.match(/\!\[.*\]\((.*)\)/);
    if (match && match[1]) {
      return { url: match[1], prompt, fallback: false };
    }
    return { url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=450&fit=crop&q=80', prompt, fallback: true };
  } catch (error) {
    console.error("Error generating image from Gemini:", error);
    return { url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=450&fit=crop&q=80', prompt, fallback: true };
  }
}

export { generateChatResponse, generateImageFromPrompt };