import { geminiClient } from '../lib/gemini-client.js';

class ChatInterface {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.messages = [];
        this.isInitialized = false;
        this.init();
    }

    async init() {
        if (!this.container) {
            console.error('Chat container not found');
            return;
        }

        await geminiClient.initialize();
        this.render();
        this.attachEventListeners();
        this.isInitialized = true;
        
        // Add welcome message
        this.addMessage({
            role: 'assistant',
            content: 'Hi! I\'m your English learning assistant. How can I help you practice English today?',
            timestamp: new Date()
        });
    }

    render() {
        this.container.innerHTML = `
            <div class="chat-interface">
                <div class="chat-header">
                    <h3>English Learning Assistant</h3>
                    <div class="chat-status ${geminiClient.isReady() ? 'online' : 'offline'}">
                        ${geminiClient.isReady() ? 'AI Assistant Ready' : 'Demo Mode'}
                    </div>
                </div>
                <div class="chat-messages" id="chat-messages"></div>
                <div class="chat-input-container">
                    <input type="text" id="chat-input" placeholder="Type your message here..." maxlength="500">
                    <button id="chat-send" type="button">Send</button>
                </div>
            </div>
        `;

        this.messagesContainer = this.container.querySelector('#chat-messages');
        this.inputField = this.container.querySelector('#chat-input');
        this.sendButton = this.container.querySelector('#chat-send');
    }

    attachEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    async sendMessage() {
        const message = this.inputField.value.trim();
        if (!message) return;

        // Add user message
        this.addMessage({
            role: 'user',
            content: message,
            timestamp: new Date()
        });

        // Clear input
        this.inputField.value = '';
        this.inputField.disabled = true;
        this.sendButton.disabled = true;

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Prepare messages for Gemini
            const geminiMessages = this.messages.map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }));

            // Get response from Gemini
            const response = await geminiClient.generateChatResponse(geminiMessages);
            
            // Remove typing indicator
            this.hideTypingIndicator();

            // Add assistant response
            this.addMessage({
                role: 'assistant',
                content: response.content,
                timestamp: new Date(),
                fallback: response.fallback
            });
        } catch (error) {
            console.error('Error sending message:', error);
            this.hideTypingIndicator();
            this.addMessage({
                role: 'assistant',
                content: 'I\'m sorry, I encountered an error. Please try again.',
                timestamp: new Date(),
                fallback: true
            });
        } finally {
            this.inputField.disabled = false;
            this.sendButton.disabled = false;
            this.inputField.focus();
        }
    }

    addMessage(message) {
        this.messages.push(message);
        this.renderMessage(message);
        this.scrollToBottom();
    }

    renderMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${message.role}`;
        
        const time = message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const fallbackIndicator = message.fallback ? '<span class="fallback-indicator" title="Demo response">🤖</span>' : '';
        
        messageElement.innerHTML = `
            <div class="message-content">
                <div class="message-text">${this.formatMessage(message.content)}</div>
                <div class="message-time">${time} ${fallbackIndicator}</div>
            </div>
        `;

        this.messagesContainer.appendChild(messageElement);
    }

    formatMessage(content) {
        // Basic markdown-like formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'chat-message assistant typing-indicator';
        indicator.id = 'typing-indicator';
        indicator.innerHTML = `
            <div class="message-content">
                <div class="message-text">
                    <div class="typing-dots">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            </div>
        `;
        this.messagesContainer.appendChild(indicator);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    clearChat() {
        this.messages = [];
        this.messagesContainer.innerHTML = '';
        this.addMessage({
            role: 'assistant',
            content: 'Chat cleared. How can I help you with English learning?',
            timestamp: new Date()
        });
    }
}

export { ChatInterface };
export default ChatInterface;