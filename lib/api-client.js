/**
 * API Client for Digital English Academy
 * Based on Auth0 AI samples patterns for authenticated API calls
 */

import { getAccessToken, isAuthenticated } from '../auth.js';

export class APIClient {
    constructor(baseURL = '/api') {
        this.baseURL = baseURL;
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
    }

    /**
     * Make authenticated API request
     */
    async request(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            const headers = { ...this.defaultHeaders };

            // Add authentication header if user is authenticated
            if (isAuthenticated()) {
                try {
                    const token = await getAccessToken();
                    headers['Authorization'] = `Bearer ${token}`;
                } catch (tokenError) {
                    console.warn('Failed to get access token:', tokenError);
                    // Continue without auth header - some endpoints might be public
                }
            }

            const response = await fetch(url, {
                ...options,
                headers: {
                    ...headers,
                    ...options.headers
                }
            });

            // Handle different response types
            if (!response.ok) {
                const errorData = await this.parseErrorResponse(response);
                throw new APIError(response.status, errorData.message || response.statusText, errorData);
            }

            // Parse response based on content type
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('application/json')) {
                return await response.json();
            } else if (contentType?.includes('text/')) {
                return await response.text();
            } else {
                return response;
            }

        } catch (error) {
            if (error instanceof APIError) {
                throw error;
            }

            // Handle network errors
            throw new APIError(0, 'Network error', { originalError: error });
        }
    }

    /**
     * Parse error response
     */
    async parseErrorResponse(response) {
        try {
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('application/json')) {
                return await response.json();
            } else {
                return { message: await response.text() };
            }
        } catch (parseError) {
            return { message: response.statusText };
        }
    }

    // HTTP method helpers
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    }

    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async patch(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // User-related API calls
    async getCurrentUser() {
        return this.get('/user/profile');
    }

    async updateUserProfile(profileData) {
        return this.put('/user/profile', profileData);
    }

    async getUserProgress() {
        return this.get('/user/progress');
    }

    async updateUserProgress(progressData) {
        return this.post('/user/progress', progressData);
    }

    // Course-related API calls
    async getCourses(filters = {}) {
        return this.get('/courses', filters);
    }

    async getCourse(courseId) {
        return this.get(`/courses/${courseId}`);
    }

    async enrollInCourse(courseId) {
        return this.post(`/courses/${courseId}/enroll`);
    }

    async getLessons(courseId) {
        return this.get(`/courses/${courseId}/lessons`);
    }

    async getLesson(courseId, lessonId) {
        return this.get(`/courses/${courseId}/lessons/${lessonId}`);
    }

    async completeLesson(courseId, lessonId, completionData) {
        return this.post(`/courses/${courseId}/lessons/${lessonId}/complete`, completionData);
    }

    // Community-related API calls
    async getCommunityThreads(filters = {}) {
        return this.get('/community/threads', filters);
    }

    async createThread(threadData) {
        return this.post('/community/threads', threadData);
    }

    async getThread(threadId) {
        return this.get(`/community/threads/${threadId}`);
    }

    async addMessage(threadId, messageData) {
        return this.post(`/community/threads/${threadId}/messages`, messageData);
    }

    // Payment-related API calls
    async getSubscriptionStatus() {
        return this.get('/payments/subscription');
    }

    async createPaymentIntent(amount, currency = 'usd') {
        return this.post('/payments/create-intent', { amount, currency });
    }

    async confirmPayment(paymentIntentId) {
        return this.post('/payments/confirm', { paymentIntentId });
    }

    async cancelSubscription() {
        return this.delete('/payments/subscription');
    }

    // AI-powered features (based on Auth0 AI samples)
    async getChatCompletion(messages, options = {}) {
        return this.post('/ai/chat', { messages, ...options });
    }

    async getPersonalizedRecommendations() {
        return this.get('/ai/recommendations');
    }

    async analyzeUserProgress() {
        return this.get('/ai/progress-analysis');
    }

    async generateLessonContent(topic, level) {
        return this.post('/ai/generate-lesson', { topic, level });
    }

    async getLanguageAssessment(responses) {
        return this.post('/ai/assess-language', { responses });
    }
}

/**
 * Custom API Error class
 */
export class APIError extends Error {
    constructor(status, message, data = {}) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.data = data;
    }

    get isNetworkError() {
        return this.status === 0;
    }

    get isAuthError() {
        return this.status === 401 || this.status === 403;
    }

    get isServerError() {
        return this.status >= 500;
    }

    get isClientError() {
        return this.status >= 400 && this.status < 500;
    }
}

/**
 * API Client with retry logic
 */
export class RetryAPIClient extends APIClient {
    constructor(baseURL, options = {}) {
        super(baseURL);
        this.maxRetries = options.maxRetries || 3;
        this.retryDelay = options.retryDelay || 1000;
        this.retryCondition = options.retryCondition || this.defaultRetryCondition;
    }

    defaultRetryCondition(error) {
        // Retry on network errors and 5xx server errors
        return error.isNetworkError || error.isServerError;
    }

    async request(endpoint, options = {}) {
        let lastError;

        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            try {
                return await super.request(endpoint, options);
            } catch (error) {
                lastError = error;

                // Don't retry if condition is not met or on last attempt
                if (!this.retryCondition(error) || attempt === this.maxRetries) {
                    break;
                }

                // Wait before retrying
                const delay = this.retryDelay * Math.pow(2, attempt);
                console.log(`API request failed, retrying in ${delay}ms... (attempt ${attempt + 1}/${this.maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        throw lastError;
    }
}

// Export singleton instances
export const apiClient = new APIClient();
export const retryApiClient = new RetryAPIClient('/api', {
    maxRetries: 3,
    retryDelay: 1000
});

// Export default client
export default apiClient;