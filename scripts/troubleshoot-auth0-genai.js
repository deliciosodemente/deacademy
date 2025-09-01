/**
 * Auth0 GenAI Troubleshooting System
 * Comprehensive diagnostics and auto-repair
 */

export class Auth0GenAITroubleshooter {
    constructor() {
        this.diagnostics = [];
        this.fixes = [];
        this.isRunning = false;
    }

    /**
     * Run comprehensive diagnostics
     */
    async runDiagnostics() {
        if (this.isRunning) {
            console.warn('Diagnostics already running...');
            return;
        }

        this.isRunning = true;
        this.diagnostics = [];
        this.fixes = [];

        console.log('🔍 Starting Auth0 GenAI diagnostics...');

        try {
            // Core diagnostics
            await this.checkAuth0Configuration();
            await this.checkAuth0Connectivity();
            await this.checkUserAuthentication();
            await this.checkTokenValidity();
            await this.checkAIIntegration();
            await this.checkPermissions();
            await this.checkPerformance();
            await this.checkSecurityHeaders();

            // Generate report
            const report = this.generateDiagnosticReport();
            console.log('📊 Diagnostic Report:', report);

            return report;

        } catch (error) {
            console.error('❌ Diagnostics failed:', error);
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Check Auth0 configuration
     */
    async checkAuth0Configuration() {
        const check = {
            name: 'Auth0 Configuration',
            status: 'checking',
            issues: [],
            fixes: []
        };

        try {
            // Check environment variables
            const config = window.deaConfig || {};

            if (!config.auth0Domain) {
                check.issues.push('AUTH0_DOMAIN not configured');
                check.fixes.push('Set window.deaConfig.auth0Domain');
            }

            if (!config.auth0ClientId) {
                check.issues.push('AUTH0_CLIENT_ID not configured');
                check.fixes.push('Set window.deaConfig.auth0ClientId');
            }

            // Validate domain format
            if (config.auth0Domain && !config.auth0Domain.includes('.auth0.com')) {
                check.issues.push('Invalid Auth0 domain format');
                check.fixes.push('Use format: your-tenant.auth0.com');
            }

            // Check client ID format
            if (config.auth0ClientId && config.auth0ClientId.length < 20) {
                check.issues.push('Invalid Auth0 client ID format');
                check.fixes.push('Verify client ID from Auth0 dashboard');
            }

            // Check Auth0 SDK availability
            if (!window.createAuth0Client) {
                check.issues.push('Auth0 SDK not loaded');
                check.fixes.push('Include Auth0 SDK script in HTML');
            }

            check.status = check.issues.length === 0 ? 'passed' : 'failed';

        } catch (error) {
            check.status = 'error';
            check.issues.push(`Configuration check failed: ${error.message}`);
        }

        this.diagnostics.push(check);
    }

    /**
     * Check Auth0 connectivity
     */
    async checkAuth0Connectivity() {
        const check = {
            name: 'Auth0 Connectivity',
            status: 'checking',
            issues: [],
            fixes: []
        };

        try {
            const config = window.deaConfig || {};

            if (!config.auth0Domain) {
                check.status = 'skipped';
                check.issues.push('No Auth0 domain configured');
                this.diagnostics.push(check);
                return;
            }

            // Test Auth0 well-known endpoint
            const wellKnownUrl = `https://${config.auth0Domain}/.well-known/openid_configuration`;

            const response = await fetch(wellKnownUrl, {
                method: 'GET',
                mode: 'cors'
            });

            if (!response.ok) {
                check.issues.push(`Auth0 endpoint unreachable: ${response.status}`);
                check.fixes.push('Check Auth0 domain and network connectivity');
            } else {
                const data = await response.json();
                if (!data.issuer) {
                    check.issues.push('Invalid Auth0 configuration response');
                    check.fixes.push('Verify Auth0 tenant configuration');
                }
            }

            check.status = check.issues.length === 0 ? 'passed' : 'failed';

        } catch (error) {
            check.status = 'error';
            check.issues.push(`Connectivity test failed: ${error.message}`);
            check.fixes.push('Check network connection and CORS settings');
        }

        this.diagnostics.push(check);
    }

    /**
     * Check user authentication status
     */
    async checkUserAuthentication() {
        const check = {
            name: 'User Authentication',
            status: 'checking',
            issues: [],
            fixes: []
        };

        try {
            if (!window.deaAuth?.manager) {
                check.issues.push('Auth0Manager not initialized');
                check.fixes.push('Initialize Auth0Manager before checking authentication');
                check.status = 'failed';
                this.diagnostics.push(check);
                return;
            }

            const isAuthenticated = window.deaAuth.manager.isUserAuthenticated();
            const user = await window.deaAuth.manager.getUser();

            if (!isAuthenticated) {
                check.issues.push('User not authenticated');
                check.fixes.push('User needs to log in');
                check.status = 'warning';
            } else if (!user) {
                check.issues.push('User authenticated but profile not available');
                check.fixes.push('Refresh user session');
                check.status = 'warning';
            } else {
                check.status = 'passed';
                check.info = {
                    userId: user.sub,
                    email: user.email,
                    name: user.name
                };
            }

        } catch (error) {
            check.status = 'error';
            check.issues.push(`Authentication check failed: ${error.message}`);
        }

        this.diagnostics.push(check);
    }

    /**
     * Check token validity
     */
    async checkTokenValidity() {
        const check = {
            name: 'Token Validity',
            status: 'checking',
            issues: [],
            fixes: []
        };

        try {
            if (!window.deaAuth?.manager?.isUserAuthenticated()) {
                check.status = 'skipped';
                check.issues.push('User not authenticated');
                this.diagnostics.push(check);
                return;
            }

            // Try to get access token
            const token = await window.deaAuth.manager.getAccessToken();

            if (!token) {
                check.issues.push('No access token available');
                check.fixes.push('Re-authenticate user');
            } else {
                // Decode token to check expiration
                const payload = this.decodeJWT(token);

                if (payload.exp && payload.exp * 1000 < Date.now()) {
                    check.issues.push('Access token expired');
                    check.fixes.push('Refresh token automatically');
                } else {
                    check.status = 'passed';
                    check.info = {
                        expiresAt: new Date(payload.exp * 1000).toISOString(),
                        audience: payload.aud,
                        scope: payload.scope
                    };
                }
            }

            if (check.status !== 'passed') {
                check.status = check.issues.length > 0 ? 'failed' : 'warning';
            }

        } catch (error) {
            check.status = 'error';
            check.issues.push(`Token validation failed: ${error.message}`);
            check.fixes.push('Clear auth cache and re-authenticate');
        }

        this.diagnostics.push(check);
    }

    /**
     * Check AI integration
     */
    async checkAIIntegration() {
        const check = {
            name: 'AI Integration',
            status: 'checking',
            issues: [],
            fixes: []
        };

        try {
            // Check AI context availability
            if (!window.aiUserContext) {
                check.issues.push('AI user context not available');
                check.fixes.push('Initialize AI context after authentication');
            }

            // Check AI authentication function
            if (typeof window.authenticateAIAgent !== 'function') {
                check.issues.push('AI authentication function not available');
                check.fixes.push('Load Auth0 GenAI setup script');
            }

            // Test AI authentication if user is logged in
            if (window.deaAuth?.manager?.isUserAuthenticated()) {
                const aiAuth = await window.authenticateAIAgent?.();

                if (!aiAuth) {
                    check.issues.push('AI agent authentication failed');
                    check.fixes.push('Check AI authentication permissions');
                } else {
                    check.status = 'passed';
                    check.info = {
                        hasToken: !!aiAuth.token,
                        hasPermissions: !!aiAuth.permissions,
                        userId: aiAuth.user?.sub
                    };
                }
            } else {
                check.status = 'warning';
                check.issues.push('Cannot test AI integration - user not authenticated');
            }

            if (check.status !== 'passed' && check.status !== 'warning') {
                check.status = check.issues.length > 0 ? 'failed' : 'passed';
            }

        } catch (error) {
            check.status = 'error';
            check.issues.push(`AI integration check failed: ${error.message}`);
        }

        this.diagnostics.push(check);
    }

    /**
     * Check user permissions
     */
    async checkPermissions() {
        const check = {
            name: 'User Permissions',
            status: 'checking',
            issues: [],
            fixes: []
        };

        try {
            if (!window.deaAuth?.manager?.isUserAuthenticated()) {
                check.status = 'skipped';
                check.issues.push('User not authenticated');
                this.diagnostics.push(check);
                return;
            }

            const permissions = await window.deaAuth.manager.getUserPermissions();
            const roles = await window.deaAuth.manager.getUserRoles();
            const subscription = await window.deaAuth.manager.getSubscriptionStatus();

            check.status = 'passed';
            check.info = {
                roles,
                subscription: subscription.plan,
                permissions: Object.keys(permissions).filter(key => permissions[key])
            };

            // Check for common permission issues
            if (!permissions.canViewCourses) {
                check.issues.push('User cannot view courses');
                check.fixes.push('Check user role assignment');
            }

            if (subscription.plan === 'free' && !permissions.canAccessPremiumCourses) {
                check.issues.push('User has limited access (free plan)');
                check.fixes.push('Upgrade subscription for full access');
            }

        } catch (error) {
            check.status = 'error';
            check.issues.push(`Permission check failed: ${error.message}`);
        }

        this.diagnostics.push(check);
    }

    /**
     * Check performance metrics
     */
    async checkPerformance() {
        const check = {
            name: 'Performance',
            status: 'checking',
            issues: [],
            fixes: []
        };

        try {
            const startTime = performance.now();

            // Test Auth0 initialization time
            if (window.deaAuth?.manager) {
                const authStartTime = performance.now();
                await window.deaAuth.manager.checkAuthState();
                const authTime = performance.now() - authStartTime;

                if (authTime > 2000) {
                    check.issues.push(`Auth check slow: ${authTime.toFixed(0)}ms`);
                    check.fixes.push('Optimize Auth0 configuration or check network');
                }
            }

            // Test API response time
            try {
                const apiStartTime = performance.now();
                await fetch('/api/health', { method: 'HEAD' });
                const apiTime = performance.now() - apiStartTime;

                if (apiTime > 1000) {
                    check.issues.push(`API response slow: ${apiTime.toFixed(0)}ms`);
                    check.fixes.push('Optimize server configuration');
                }
            } catch (apiError) {
                check.issues.push('API health check failed');
                check.fixes.push('Check API server status');
            }

            const totalTime = performance.now() - startTime;
            check.status = check.issues.length === 0 ? 'passed' : 'warning';
            check.info = {
                totalCheckTime: `${totalTime.toFixed(0)}ms`
            };

        } catch (error) {
            check.status = 'error';
            check.issues.push(`Performance check failed: ${error.message}`);
        }

        this.diagnostics.push(check);
    }

    /**
     * Check security headers
     */
    async checkSecurityHeaders() {
        const check = {
            name: 'Security Headers',
            status: 'checking',
            issues: [],
            fixes: []
        };

        try {
            const response = await fetch(window.location.href, { method: 'HEAD' });
            const headers = response.headers;

            const requiredHeaders = {
                'x-frame-options': 'Clickjacking protection',
                'x-content-type-options': 'MIME type sniffing protection',
                'x-xss-protection': 'XSS protection',
                'strict-transport-security': 'HTTPS enforcement',
                'content-security-policy': 'Content security policy'
            };

            for (const [header, description] of Object.entries(requiredHeaders)) {
                if (!headers.get(header)) {
                    check.issues.push(`Missing ${description} header`);
                    check.fixes.push(`Add ${header} header to server configuration`);
                }
            }

            check.status = check.issues.length === 0 ? 'passed' : 'warning';

        } catch (error) {
            check.status = 'error';
            check.issues.push(`Security header check failed: ${error.message}`);
        }

        this.diagnostics.push(check);
    }

    /**
     * Generate diagnostic report
     */
    generateDiagnosticReport() {
        const passed = this.diagnostics.filter(d => d.status === 'passed').length;
        const failed = this.diagnostics.filter(d => d.status === 'failed').length;
        const warnings = this.diagnostics.filter(d => d.status === 'warning').length;
        const errors = this.diagnostics.filter(d => d.status === 'error').length;

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: this.diagnostics.length,
                passed,
                failed,
                warnings,
                errors,
                score: Math.round((passed / this.diagnostics.length) * 100)
            },
            diagnostics: this.diagnostics,
            recommendations: this.generateRecommendations()
        };

        return report;
    }

    /**
     * Generate recommendations based on diagnostics
     */
    generateRecommendations() {
        const recommendations = [];

        // Critical issues first
        const criticalIssues = this.diagnostics.filter(d => d.status === 'failed');
        if (criticalIssues.length > 0) {
            recommendations.push({
                priority: 'critical',
                title: 'Fix Critical Issues',
                description: 'These issues prevent core functionality',
                actions: criticalIssues.flatMap(issue => issue.fixes)
            });
        }

        // Performance issues
        const performanceIssues = this.diagnostics.filter(d =>
            d.name === 'Performance' && d.issues.length > 0
        );
        if (performanceIssues.length > 0) {
            recommendations.push({
                priority: 'high',
                title: 'Optimize Performance',
                description: 'Improve user experience with better performance',
                actions: performanceIssues.flatMap(issue => issue.fixes)
            });
        }

        // Security improvements
        const securityIssues = this.diagnostics.filter(d =>
            d.name === 'Security Headers' && d.issues.length > 0
        );
        if (securityIssues.length > 0) {
            recommendations.push({
                priority: 'medium',
                title: 'Enhance Security',
                description: 'Improve security posture',
                actions: securityIssues.flatMap(issue => issue.fixes)
            });
        }

        return recommendations;
    }

    /**
     * Auto-fix common issues
     */
    async autoFix() {
        console.log('🔧 Starting auto-fix...');
        const fixes = [];

        try {
            // Fix 1: Refresh expired tokens
            if (window.deaAuth?.manager?.isUserAuthenticated()) {
                try {
                    await window.deaAuth.manager.getAccessToken({ ignoreCache: true });
                    fixes.push('Refreshed access token');
                } catch (error) {
                    console.warn('Could not refresh token:', error);
                }
            }

            // Fix 2: Reinitialize AI context
            if (window.deaAuth?.manager?.isUserAuthenticated() && !window.aiUserContext) {
                try {
                    const user = await window.deaAuth.manager.getUser();
                    if (user && window.auth0GenAI?.updateAIUserContext) {
                        await window.auth0GenAI.updateAIUserContext(user);
                        fixes.push('Reinitialized AI user context');
                    }
                } catch (error) {
                    console.warn('Could not reinitialize AI context:', error);
                }
            }

            // Fix 3: Clear corrupted cache
            try {
                const authKeys = Object.keys(localStorage).filter(key =>
                    key.startsWith('@@auth0spajs@@')
                );
                if (authKeys.length > 10) { // Too many cached items
                    authKeys.forEach(key => localStorage.removeItem(key));
                    fixes.push('Cleared excessive auth cache');
                }
            } catch (error) {
                console.warn('Could not clear cache:', error);
            }

            console.log('✅ Auto-fix completed:', fixes);
            return fixes;

        } catch (error) {
            console.error('❌ Auto-fix failed:', error);
            throw error;
        }
    }

    /**
     * Decode JWT token
     */
    decodeJWT(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (error) {
            throw new Error('Invalid JWT token');
        }
    }

    /**
     * Export diagnostic report
     */
    exportReport(format = 'json') {
        const report = this.generateDiagnosticReport();

        if (format === 'json') {
            const blob = new Blob([JSON.stringify(report, null, 2)], {
                type: 'application/json'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `auth0-genai-diagnostics-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
    }
}

// Export singleton instance
export const troubleshooter = new Auth0GenAITroubleshooter();

// Global access for debugging
if (typeof window !== 'undefined') {
    window.troubleshooter = troubleshooter;
}