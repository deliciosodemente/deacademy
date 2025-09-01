/**
 * Role-Based Access Control (RBAC) for Digital English Academy
 * Provides utilities for managing user roles and permissions
 */

export class RoleBasedAccess {
    constructor() {
        this.roleHierarchy = {
            'admin': ['admin', 'teacher', 'moderator', 'student'],
            'teacher': ['teacher', 'student'],
            'moderator': ['moderator', 'student'],
            'student': ['student']
        };

        this.permissions = {
            // Content permissions
            'view_courses': ['admin', 'teacher', 'moderator', 'student'],
            'view_premium_courses': ['admin', 'teacher', 'premium_student'],
            'create_courses': ['admin', 'teacher'],
            'edit_courses': ['admin', 'teacher'],
            'delete_courses': ['admin'],

            // User management permissions
            'view_users': ['admin', 'teacher', 'moderator'],
            'edit_users': ['admin'],
            'delete_users': ['admin'],
            'manage_roles': ['admin'],

            // Community permissions
            'view_community': ['admin', 'teacher', 'moderator', 'student'],
            'post_community': ['admin', 'teacher', 'moderator', 'student'],
            'moderate_community': ['admin', 'moderator'],
            'delete_posts': ['admin', 'moderator'],

            // Analytics permissions
            'view_analytics': ['admin', 'teacher'],
            'view_detailed_analytics': ['admin'],

            // System permissions
            'manage_system': ['admin'],
            'view_logs': ['admin'],
            'manage_subscriptions': ['admin']
        };

        this.subscriptionPermissions = {
            'free': ['view_basic_content', 'participate_community'],
            'premium': ['view_basic_content', 'view_premium_content', 'download_content', 'participate_community', 'priority_support'],
            'enterprise': ['view_basic_content', 'view_premium_content', 'download_content', 'participate_community', 'priority_support', 'custom_branding']
        };
    }

    /**
     * Check if user has specific role
     */
    hasRole(userRoles, requiredRole) {
        if (!Array.isArray(userRoles)) {
            userRoles = [userRoles];
        }

        return userRoles.some(role => {
            const hierarchy = this.roleHierarchy[role] || [role];
            return hierarchy.includes(requiredRole);
        });
    }

    /**
     * Check if user has any of the required roles
     */
    hasAnyRole(userRoles, requiredRoles) {
        if (!Array.isArray(requiredRoles)) {
            requiredRoles = [requiredRoles];
        }

        return requiredRoles.some(role => this.hasRole(userRoles, role));
    }

    /**
     * Check if user has all required roles
     */
    hasAllRoles(userRoles, requiredRoles) {
        if (!Array.isArray(requiredRoles)) {
            requiredRoles = [requiredRoles];
        }

        return requiredRoles.every(role => this.hasRole(userRoles, role));
    }

    /**
     * Check if user has specific permission
     */
    hasPermission(userRoles, permission) {
        const requiredRoles = this.permissions[permission];

        if (!requiredRoles) {
            console.warn(`Unknown permission: ${permission}`);
            return false;
        }

        return this.hasAnyRole(userRoles, requiredRoles);
    }

    /**
     * Check if user has subscription-based permission
     */
    hasSubscriptionPermission(subscriptionPlan, permission) {
        const planPermissions = this.subscriptionPermissions[subscriptionPlan] || [];
        return planPermissions.includes(permission);
    }

    /**
     * Get all permissions for user roles
     */
    getUserPermissions(userRoles) {
        const permissions = [];

        Object.entries(this.permissions).forEach(([permission, requiredRoles]) => {
            if (this.hasAnyRole(userRoles, requiredRoles)) {
                permissions.push(permission);
            }
        });

        return permissions;
    }

    /**
     * Get all subscription permissions for plan
     */
    getSubscriptionPermissions(subscriptionPlan) {
        return this.subscriptionPermissions[subscriptionPlan] || [];
    }

    /**
     * Check comprehensive access (roles + subscription)
     */
    async checkAccess(user, requiredPermission, options = {}) {
        try {
            // Get user roles
            const userRoles = user.roles || ['student'];

            // Get subscription info
            const subscription = user.subscription || { plan: 'free', status: 'active' };

            // Check role-based permission
            const hasRolePermission = this.hasPermission(userRoles, requiredPermission);

            // Check subscription-based permission if specified
            let hasSubscriptionPermission = true;
            if (options.requiresSubscription) {
                hasSubscriptionPermission = this.hasSubscriptionPermission(
                    subscription.plan,
                    options.requiresSubscription
                ) && subscription.status === 'active';
            }

            // Check premium access if required
            let hasPremiumAccess = true;
            if (options.requiresPremium) {
                hasPremiumAccess = subscription.plan !== 'free' && subscription.status === 'active';
            }

            return hasRolePermission && hasSubscriptionPermission && hasPremiumAccess;

        } catch (error) {
            console.error('❌ Access check failed:', error);
            return false;
        }
    }

    /**
     * Create access control middleware for routes
     */
    createRouteGuard(requiredPermission, options = {}) {
        return async (user) => {
            if (!user) {
                return {
                    allowed: false,
                    reason: 'authentication_required',
                    message: 'Se requiere iniciar sesión'
                };
            }

            const hasAccess = await this.checkAccess(user, requiredPermission, options);

            if (!hasAccess) {
                let reason = 'insufficient_permissions';
                let message = 'No tienes permisos suficientes';

                if (options.requiresPremium && user.subscription?.plan === 'free') {
                    reason = 'premium_required';
                    message = 'Se requiere suscripción Premium';
                } else if (options.requiresSubscription) {
                    reason = 'subscription_required';
                    message = 'Se requiere suscripción activa';
                }

                return {
                    allowed: false,
                    reason,
                    message
                };
            }

            return {
                allowed: true,
                reason: 'access_granted',
                message: 'Acceso permitido'
            };
        };
    }

    /**
     * Filter content based on user access
     */
    filterContent(content, user, options = {}) {
        if (!Array.isArray(content)) {
            return content;
        }

        return content.filter(item => {
            // Check if item has access requirements
            if (!item.accessRequirements) {
                return true; // No restrictions
            }

            const { roles, permissions, subscription, premium } = item.accessRequirements;

            // Check role requirements
            if (roles && !this.hasAnyRole(user.roles || ['student'], roles)) {
                return false;
            }

            // Check permission requirements
            if (permissions && !permissions.every(perm => this.hasPermission(user.roles || ['student'], perm))) {
                return false;
            }

            // Check subscription requirements
            if (subscription && !this.hasSubscriptionPermission(user.subscription?.plan || 'free', subscription)) {
                return false;
            }

            // Check premium requirements
            if (premium && (user.subscription?.plan === 'free' || user.subscription?.status !== 'active')) {
                return false;
            }

            return true;
        });
    }

    /**
     * Add custom role
     */
    addRole(roleName, inheritsFrom = []) {
        this.roleHierarchy[roleName] = [roleName, ...inheritsFrom];
    }

    /**
     * Add custom permission
     */
    addPermission(permissionName, requiredRoles) {
        this.permissions[permissionName] = requiredRoles;
    }

    /**
     * Get role hierarchy
     */
    getRoleHierarchy() {
        return { ...this.roleHierarchy };
    }

    /**
     * Get all permissions
     */
    getAllPermissions() {
        return { ...this.permissions };
    }

    /**
     * Validate role configuration
     */
    validateRoles(userRoles) {
        if (!Array.isArray(userRoles)) {
            return false;
        }

        return userRoles.every(role =>
            Object.keys(this.roleHierarchy).includes(role)
        );
    }

    /**
     * Get effective roles (including inherited roles)
     */
    getEffectiveRoles(userRoles) {
        const effectiveRoles = new Set();

        userRoles.forEach(role => {
            const hierarchy = this.roleHierarchy[role] || [role];
            hierarchy.forEach(inheritedRole => effectiveRoles.add(inheritedRole));
        });

        return Array.from(effectiveRoles);
    }

    /**
     * Check if role can be assigned by current user
     */
    canAssignRole(currentUserRoles, targetRole) {
        // Only admins can assign roles by default
        if (!this.hasRole(currentUserRoles, 'admin')) {
            return false;
        }

        // Admins can assign any role except admin (prevent privilege escalation)
        if (targetRole === 'admin') {
            return this.hasRole(currentUserRoles, 'admin');
        }

        return true;
    }
}

// Export singleton instance
export const rbac = new RoleBasedAccess();

// Utility functions for common checks
export async function requireAuth(user) {
    if (!user) {
        throw new Error('Authentication required');
    }
    return true;
}

export async function requireRole(user, role) {
    if (!user) {
        throw new Error('Authentication required');
    }

    if (!rbac.hasRole(user.roles || ['student'], role)) {
        throw new Error(`Role '${role}' required`);
    }

    return true;
}

export async function requirePermission(user, permission) {
    if (!user) {
        throw new Error('Authentication required');
    }

    if (!rbac.hasPermission(user.roles || ['student'], permission)) {
        throw new Error(`Permission '${permission}' required`);
    }

    return true;
}

export async function requirePremium(user) {
    if (!user) {
        throw new Error('Authentication required');
    }

    const subscription = user.subscription || { plan: 'free', status: 'inactive' };

    if (subscription.plan === 'free' || subscription.status !== 'active') {
        throw new Error('Premium subscription required');
    }

    return true;
}

// Decorators for easy access control
export function withAuth(fn) {
    return async function (...args) {
        const user = await getCurrentUser();
        await requireAuth(user);
        return fn.apply(this, [user, ...args]);
    };
}

export function withRole(role) {
    return function (fn) {
        return async function (...args) {
            const user = await getCurrentUser();
            await requireRole(user, role);
            return fn.apply(this, [user, ...args]);
        };
    };
}

export function withPermission(permission) {
    return function (fn) {
        return async function (...args) {
            const user = await getCurrentUser();
            await requirePermission(user, permission);
            return fn.apply(this, [user, ...args]);
        };
    };
}

export function withPremium(fn) {
    return async function (...args) {
        const user = await getCurrentUser();
        await requirePremium(user);
        return fn.apply(this, [user, ...args]);
    };
}

// Helper to get current user
async function getCurrentUser() {
    if (window.deaAuth?.manager) {
        return await window.deaAuth.manager.getUserProfile();
    }

    return window.deaAuth?.user || null;
}