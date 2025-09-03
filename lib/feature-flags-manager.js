/**
 * Feature Flags Manager
 * Maneja la lógica de feature flags en el lado del cliente
 */

class FeatureFlagsManager {
    constructor() {
        this.flags = new Map();
        this.initialized = false;
    }

    /**
     * Inicializa el manager de feature flags
     * En una implementación real, esto obtendría los flags del servidor
     */
    async initialize() {
        try {
            // En producción, esto haría una llamada al endpoint de feature flags
            // const response = await fetch('/api/feature-flags');
            // const flags = await response.json();
            
            // Para la demo, usamos valores por defecto
            const defaultFlags = {
                'my_feature_flag': false,
                'avatar_upload_enabled': true,
                'chat_interface_v2': false,
                'premium_features_enabled': true,
                'dark_mode_enabled': false,
                'advanced_analytics': false,
                'beta_features': false
            };

            Object.entries(defaultFlags).forEach(([key, value]) => {
                this.flags.set(key, value);
            });

            this.initialized = true;
            console.log('Feature Flags Manager initialized with flags:', Object.fromEntries(this.flags));
        } catch (error) {
            console.error('Error initializing feature flags:', error);
            this.initialized = false;
        }
    }

    /**
     * Verifica si un feature flag está habilitado
     * @param {string} flagKey - La clave del feature flag
     * @param {boolean} defaultValue - Valor por defecto si el flag no existe
     * @returns {boolean}
     */
    isEnabled(flagKey, defaultValue = false) {
        if (!this.initialized) {
            console.warn('Feature Flags Manager not initialized. Using default value.');
            return defaultValue;
        }

        return this.flags.get(flagKey) ?? defaultValue;
    }

    /**
     * Actualiza el valor de un feature flag
     * @param {string} flagKey - La clave del feature flag
     * @param {boolean} value - El nuevo valor
     */
    setFlag(flagKey, value) {
        this.flags.set(flagKey, value);
        this.notifyListeners(flagKey, value);
    }

    /**
     * Obtiene todos los feature flags
     * @returns {Object}
     */
    getAllFlags() {
        return Object.fromEntries(this.flags);
    }

    /**
     * Registra un listener para cambios en feature flags
     * @param {string} flagKey - La clave del feature flag
     * @param {Function} callback - Función a ejecutar cuando cambie el flag
     */
    onFlagChange(flagKey, callback) {
        if (!this.listeners) {
            this.listeners = new Map();
        }
        
        if (!this.listeners.has(flagKey)) {
            this.listeners.set(flagKey, []);
        }
        
        this.listeners.get(flagKey).push(callback);
    }

    /**
     * Notifica a los listeners sobre cambios en feature flags
     * @param {string} flagKey - La clave del feature flag
     * @param {boolean} value - El nuevo valor
     */
    notifyListeners(flagKey, value) {
        if (this.listeners && this.listeners.has(flagKey)) {
            this.listeners.get(flagKey).forEach(callback => {
                try {
                    callback(value, flagKey);
                } catch (error) {
                    console.error('Error in feature flag listener:', error);
                }
            });
        }
    }

    /**
     * Actualiza los feature flags desde el servidor
     */
    async refresh() {
        try {
            // En producción, esto haría una llamada al servidor
            // const response = await fetch('/api/feature-flags');
            // const serverFlags = await response.json();
            
            // Para la demo, simulamos cambios aleatorios
            const flagKeys = Array.from(this.flags.keys());
            flagKeys.forEach(key => {
                if (Math.random() > 0.8) {
                    const newValue = !this.flags.get(key);
                    this.setFlag(key, newValue);
                }
            });
            
            console.log('Feature flags refreshed');
        } catch (error) {
            console.error('Error refreshing feature flags:', error);
        }
    }
}

// Instancia global del manager
const featureFlagsManager = new FeatureFlagsManager();

// Funciones de utilidad para usar en otros módulos
export const initializeFeatureFlags = () => featureFlagsManager.initialize();
export const isFeatureEnabled = (flagKey, defaultValue) => featureFlagsManager.isEnabled(flagKey, defaultValue);
export const setFeatureFlag = (flagKey, value) => featureFlagsManager.setFlag(flagKey, value);
export const getAllFeatureFlags = () => featureFlagsManager.getAllFlags();
export const onFeatureFlagChange = (flagKey, callback) => featureFlagsManager.onFlagChange(flagKey, callback);
export const refreshFeatureFlags = () => featureFlagsManager.refresh();

// Para compatibilidad con módulos que no usan ES6
if (typeof window !== 'undefined') {
    window.FeatureFlags = {
        initialize: initializeFeatureFlags,
        isEnabled: isFeatureEnabled,
        setFlag: setFeatureFlag,
        getAllFlags: getAllFeatureFlags,
        onFlagChange: onFeatureFlagChange,
        refresh: refreshFeatureFlags
    };
}

export default featureFlagsManager;