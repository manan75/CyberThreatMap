// Central place for environment-specific settings.
// Every value the server reads from the environment is listed here so it is
// obvious what needs to be configured locally vs. on Render.
//
//   NODE_ENV      development | test | production   (default: development)
//   PORT          port to listen on                  (default: 4000, Render sets this)
//   CORS_ORIGINS  comma-separated list of allowed browser origins,
//                 e.g. "https://my-frontend.onrender.com" or "*"

const DEFAULT_PORT = 4000;
const DEFAULT_DEV_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000'];

function parseOrigins(value) {
    if (!value) return [];
    return value
        .split(',')
        .map(origin => origin.trim().replace(/\/+$/, '')) // "https://x.com/" -> "https://x.com"
        .filter(Boolean);
}

function parsePort(value) {
    if (value === undefined || value === '') return DEFAULT_PORT;
    const port = Number(value);
    if (!Number.isInteger(port) || port < 0 || port > 65535) {
        throw new Error(`Invalid PORT "${value}": expected an integer between 0 and 65535`);
    }
    return port;
}

function loadConfig(env = process.env) {
    const nodeEnv = env.NODE_ENV || 'development';
    const configuredOrigins = parseOrigins(env.CORS_ORIGINS);
    const warnings = [];

    let corsOrigin;
    if (configuredOrigins.includes('*')) {
        corsOrigin = '*';
    } else if (configuredOrigins.length > 0) {
        corsOrigin = configuredOrigins;
    } else if (nodeEnv === 'production') {
        // Keep the previous behaviour so an existing deployment does not break,
        // but make it visible in the logs so it can be tightened.
        corsOrigin = '*';
        warnings.push('CORS_ORIGINS is not set in production; allowing all origins. ' +
            'Set CORS_ORIGINS to the frontend URL to restrict access.');
    } else {
        corsOrigin = DEFAULT_DEV_ORIGINS;
    }

    return {
        nodeEnv,
        port: parsePort(env.PORT),
        cors: {
            origin: corsOrigin,
            methods: ['GET', 'POST']
        },
        warnings
    };
}

module.exports = { loadConfig, parseOrigins, DEFAULT_DEV_ORIGINS };
