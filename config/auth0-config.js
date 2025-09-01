/**
 * Auth0 Configuration for Digital English Academy
 * Based on Auth0 AI samples patterns
 */

// Auth0 configuration for different environments
export const auth0Config = {
    development: {
        domain: process.env.AUTH0_DOMAIN,
        clientId: process.env.AUTH0_CLIENT_ID,
        audience: process.env.AUTH0_AUDIENCE,
        scope: 'openid profile email read:user_metadata update:user_metadata',
        redirectUri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
        logoutUri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
    },

    staging: {
        domain: process.env.AUTH0_DOMAIN,
        clientId: process.env.AUTH0_CLIENT_ID,
        audience: process.env.AUTH0_AUDIENCE,
        scope: 'openid profile email read:user_metadata update:user_metadata',
        redirectUri: typeof window !== 'undefined' ? window.location.origin : 'https://staging.denglishacademy.com',
        logoutUri: typeof window !== 'undefined' ? window.location.origin : 'https://staging.denglishacademy.com'
    },

    production: {
        domain: process.env.AUTH0_DOMAIN,
        clientId: process.env.AUTH0_CLIENT_ID,
        audience: process.env.AUTH0_AUDIENCE,
        scope: 'openid profile email read:user_metadata update:user_metadata',
        redirectUri: typeof window !== 'undefined' ? window.location.origin : 'https://denglishacademy.com',
        logoutUri: typeof window !== 'undefined' ? window.location.origin : 'https://denglishacademy.com'
    }
};

// Auth0 rules and hooks configuration
export const auth0Rules = {
    // Add user metadata on first login
    addUserMetadata: `
    function addUserMetadata(user, context, callback) {
      const namespace = 'https://denglishacademy.com/';
      
      // Add custom claims
      context.idToken[namespace + 'user_metadata'] = user.user_metadata || {};
      context.idToken[namespace + 'app_metadata'] = user.app_metadata || {};
      
      // Add role information
      context.idToken[namespace + 'roles'] = user.app_metadata?.roles || ['student'];
      
      // Add subscription information
      context.idToken[namespace + 'subscription'] = user.app_metadata?.subscription || 'free';
      
      callback(null, user, context);
    }
  `,

    // Sync user with database
    syncUserWithDatabase: `
    function syncUserWithDatabase(user, context, callback) {
      const axios = require('axios');
      
      // Only sync on first login or if user data changed
      if (context.stats.loginsCount === 1 || context.user_metadata_changed) {
        const userData = {
          auth0Id: user.user_id,
          email: user.email,
          name: user.name,
          picture: user.picture,
          emailVerified: user.email_verified,
          lastLogin: new Date(),
          metadata: user.user_metadata || {}
        };
        
        // Call your API to sync user
        axios.post('https://api.denglishacademy.com/auth/sync-user', userData, {
          headers: {
            'Authorization': 'Bearer ' + configuration.API_TOKEN
          }
        }).then(() => {
          callback(null, user, context);
        }).catch((error) => {
          console.error('User sync failed:', error);
          // Don't fail auth if sync fails
          callback(null, user, context);
        });
      } else {
        callback(null, user, context);
      }
    }
  `
};

// Auth0 Actions (new way to handle rules)
export const auth0Actions = {
    // Post-login action
    postLogin: {
        name: 'Digital English Academy Post-Login',
        code: `
      exports.onExecutePostLogin = async (event, api) => {
        const namespace = 'https://denglishacademy.com/';
        
        // Add custom claims to tokens
        api.idToken.setCustomClaim(namespace + 'user_metadata', event.user.user_metadata || {});
        api.idToken.setCustomClaim(namespace + 'app_metadata', event.user.app_metadata || {});
        api.idToken.setCustomClaim(namespace + 'roles', event.user.app_metadata?.roles || ['student']);
        api.idToken.setCustomClaim(namespace + 'subscription', event.user.app_metadata?.subscription || 'free');
        
        // Sync user with database on first login
        if (event.stats.logins_count === 1) {
          try {
            const axios = require('axios');
            
            const userData = {
              auth0Id: event.user.user_id,
              email: event.user.email,
              name: event.user.name,
              picture: event.user.picture,
              emailVerified: event.user.email_verified,
              lastLogin: new Date(),
              metadata: event.user.user_metadata || {}
            };
            
            await axios.post('https://api.denglishacademy.com/auth/sync-user', userData, {
              headers: {
                'Authorization': 'Bearer ' + event.secrets.API_TOKEN
              }
            });
            
            console.log('User synced successfully');
          } catch (error) {
            console.error('User sync failed:', error);
            // Don't fail auth if sync fails
          }
        }
      };
    `,
        dependencies: [
            {
                name: 'axios',
                version: '^1.6.0'
            }
        ],
        secrets: [
            'API_TOKEN'
        ]
    },

    // Pre-user registration action
    preUserRegistration: {
        name: 'Digital English Academy Pre-Registration',
        code: `
      exports.onExecutePreUserRegistration = async (event, api) => {
        // Set default user metadata
        api.user.setUserMetadata('preferences', {
          language: 'es',
          notifications: true,
          theme: 'light'
        });
        
        // Set default app metadata
        api.user.setAppMetadata('roles', ['student']);
        api.user.setAppMetadata('subscription', 'free');
        api.user.setAppMetadata('registrationDate', new Date().toISOString());
      };
    `
    }
};

// Auth0 Universal Login customization
export const auth0UniversalLogin = {
    // Custom CSS for branding
    css: `
    .auth0-lock-header-logo {
      background-image: url('https://denglishacademy.com/logo.png') !important;
      background-size: contain !important;
      width: 150px !important;
      height: 60px !important;
    }
    
    .auth0-lock-widget {
      border-radius: 12px !important;
      box-shadow: 0 6px 20px rgba(0,0,0,0.08) !important;
    }
    
    .auth0-lock-submit {
      background: #0a66ff !important;
      border-radius: 8px !important;
    }
    
    .auth0-lock-submit:hover {
      background: #0a5be6 !important;
    }
    
    .auth0-lock-social-button {
      border-radius: 8px !important;
    }
  `,

    // Custom HTML template
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
      <title>Digital English Academy - Login</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="icon" href="https://denglishacademy.com/favicon.ico" type="image/x-icon">
    </head>
    <body>
      <div id="auth0-login-container"></div>
      
      <script src="https://cdn.auth0.com/js/auth0/9.20.2/auth0.min.js"></script>
      <script src="https://cdn.auth0.com/js/lock/11.32.2/lock.min.js"></script>
      
      <script>
        var lock = new Auth0Lock(config.clientID, config.auth0Domain, {
          auth: {
            redirectUrl: config.callbackURL,
            responseType: 'code',
            audience: config.extraParams.audience,
            params: config.internalOptions
          },
          theme: {
            logo: 'https://denglishacademy.com/logo.png',
            primaryColor: '#0a66ff'
          },
          languageDictionary: {
            title: 'Digital English Academy',
            emailInputPlaceholder: 'tu@email.com',
            passwordInputPlaceholder: 'tu contraseña'
          },
          language: 'es',
          socialButtonStyle: 'big',
          allowedConnections: ['Username-Password-Authentication', 'google-oauth2'],
          rememberLastLogin: true,
          autoclose: true
        });
        
        lock.show();
      </script>
    </body>
    </html>
  `
};

// Helper function to get Auth0 config for current environment
export function getAuth0Config(environment = 'development') {
    const config = auth0Config[environment];

    if (!config) {
        console.warn(`No Auth0 config found for environment: ${environment}`);
        return auth0Config.development;
    }

    return config;
}

// Helper function to validate Auth0 configuration
export function validateAuth0Config(config) {
    const required = ['domain', 'clientId'];
    const missing = required.filter(key => !config[key]);

    if (missing.length > 0) {
        throw new Error(`Missing required Auth0 configuration: ${missing.join(', ')}`);
    }

    // Validate domain format
    if (!config.domain.includes('.auth0.com') && !config.domain.includes('.eu.auth0.com')) {
        console.warn('Auth0 domain might be invalid:', config.domain);
    }

    // Validate client ID format
    if (config.clientId.length < 20) {
        console.warn('Auth0 client ID might be invalid:', config.clientId);
    }

    return true;
}

// Export default configuration
export default {
    auth0Config,
    auth0Rules,
    auth0Actions,
    auth0UniversalLogin,
    getAuth0Config,
    validateAuth0Config
};
