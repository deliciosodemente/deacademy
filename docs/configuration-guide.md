# Configuration Guide - Digital English Academy

## Overview

The Digital English Academy uses a robust configuration system that handles Auth0, Stripe, MongoDB, and feature flags across different environments.

## Quick Start

### 1. Basic Setup

The application automatically detects the environment and loads appropriate configuration:

```javascript
// The app initializes automatically on page load
// No manual configuration needed for basic setup
```

### 2. Environment Detection

Environments are detected automatically:

- `localhost` or `127.0.0.1` → Development
- Domains with `staging` or `dev` → Staging  
- All other domains → Production

### 3. Override Environment

```javascript
// Force specific environment
localStorage.setItem('dea_environment', 'development');

// Or use URL parameter
// https://yoursite.com?environment=staging
```

## Configuration Options

### Auth0 Configuration

```javascript
// Set via window.deaConfig (recommended for WordPress integration)
window.deaConfig = {
  auth0Domain: 'your-domain.auth0.com',
  auth0ClientId: 'your-client-id'
};

// Or via localStorage for development
localStorage.setItem('dea_auth0_domain', 'your-domain.auth0.com');
localStorage.setItem('dea_auth0_client_id', 'your-client-id');
```

### Stripe Configuration

```javascript
// Set via window.deaConfig
window.deaConfig = {
  stripePublishableKey: 'pk_test_your_key',
  stripePaymentLink: 'https://buy.stripe.com/your_link'
};

// Or via localStorage
localStorage.setItem('dea_stripe_publishable_key', 'pk_test_your_key');
```

### MongoDB Configuration

MongoDB connection is pre-configured but can be overridden:

```javascript
// The connection string is set in config/database.js
// Different databases are used per environment:
// - Development: digital_english_academy_dev
// - Staging: digital_english_academy_staging  
// - Production: digital_english_academy
```

## Feature Flags

### Enable/Disable Features

```javascript
// Via JavaScript API
window.dea.setFeature('auth0', true);
window.dea.setFeature('stripe', false);

// Via localStorage
localStorage.setItem('dea_feature_auth0', 'true');
localStorage.setItem('dea_feature_stripe', 'false');

// Via URL parameters (temporary)
// https://yoursite.com?feature_auth0=1&feature_stripe=0
```

### Available Feature Flags

- `auth0` - Enable Auth0 authentication
- `stripe` - Enable Stripe payments
- `mongodb` - Enable MongoDB integration
- `analytics` - Enable analytics tracking
- `serviceWorker` - Enable service worker
- `realtime` - Enable real-time features

## Development Tools

### Debug Mode

```javascript
// Enable debug mode
window.dea.config.setDevelopmentMode(true);

// Check if debug mode is enabled
window.dea.config.isDevelopmentMode();
```

### Configuration Inspector

```javascript
// View current configuration (secure - no sensitive data)
console.log(window.dea.config.getSecureConfig());

// Check initialization status
console.log(window.dea.getStatus());

// View feature flags
console.log(window.dea.config.getConfig().features);
```

### Restart Application

```javascript
// Restart with new configuration
window.dea.restart();
```

## WordPress Integration

For WordPress sites, set configuration in your theme's functions.php:

```php
function dea_config() {
    ?>
    <script>
    window.deaConfig = {
        auth0Domain: '<?php echo get_option('dea_auth0_domain'); ?>',
        auth0ClientId: '<?php echo get_option('dea_auth0_client_id'); ?>',
        stripePublishableKey: '<?php echo get_option('dea_stripe_key'); ?>',
        stripePaymentLink: '<?php echo get_option('dea_stripe_link'); ?>'
    };
    </script>
    <?php
}
add_action('wp_head', 'dea_config');
```

## Error Handling

### Configuration Validation

The system automatically validates configuration on startup:

```javascript
// Check validation status
const status = window.dea.bootstrap.getInitializationStatus();
console.log('Errors:', status.errors);
console.log('Is Complete:', status.isComplete);
```

### Common Issues

1. **Auth0 not working**: Check domain and client ID
2. **Stripe not loading**: Verify publishable key format
3. **MongoDB connection**: Ensure connection string is valid

### Fallback Mode

If initialization fails, the app falls back to basic mode with limited functionality.

## Production Deployment

### Required Environment Variables

Set these in your hosting environment:

```bash
# Auth0
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id

# Stripe  
STRIPE_PUBLISHABLE_KEY=pk_live_your_key
STRIPE_PAYMENT_LINK=https://buy.stripe.com/your_link

# MongoDB (already configured)
MONGODB_CONNECTION_STRING=mongodb+srv://...
```

### Performance Optimization

```javascript
// Enable production mode
localStorage.setItem('dea_prod', '1');
// Or use URL parameter: ?prod=1
```

## API Reference

### ConfigurationManager

```javascript
const config = window.dea.config;

// Methods
config.loadEnvironmentConfig()
config.validateConfiguration()
config.getFeatureFlag(name)
config.setFeatureFlag(name, value)
config.setDevelopmentMode(enabled)
config.getSecureConfig()
```

### AppBootstrap

```javascript
const bootstrap = window.dea.bootstrap;

// Methods
bootstrap.initialize(customConfig)
bootstrap.getInitializationStatus()
bootstrap.handleInitializationError(error)
```

## Troubleshooting

### Enable Verbose Logging

```javascript
// Enable debug mode for detailed logs
window.dea.config.setDevelopmentMode(true);
location.reload();
```

### Reset Configuration

```javascript
// Clear all localStorage configuration
Object.keys(localStorage)
  .filter(key => key.startsWith('dea_'))
  .forEach(key => localStorage.removeItem(key));
  
location.reload();
```

### Check Module Status

```javascript
// See which modules loaded successfully
const status = window.dea.getStatus();
console.log('Loaded modules:', status.modules);
console.log('Failed steps:', status.errors);
```
