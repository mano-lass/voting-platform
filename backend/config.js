require('dotenv').config();
const os = require('os');

module.exports = {
    // Server configuration
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    serverId: process.env.SERVER_ID || os.hostname(),
    
    // Database configuration
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'voting_user',
        password: process.env.DB_PASSWORD || 'voting_password',
        database: process.env.DB_NAME || 'voting_db',
        connectionLimit: parseInt(process.env.DB_POOL_SIZE || '10'),
        waitForConnections: true,
        queueLimit: 0
    },
    
    // JWT configuration
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '30m'
    },
    
    // CORS configuration
    corsOrigin: process.env.CORS_ORIGIN || '*',
    
    // Security
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10')
};
