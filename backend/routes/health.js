const express = require('express');
const router = express.Router();
const { pool } = require('../database');
const config = require('../config');

// GET /api/health - Health check endpoint
router.get('/', async (req, res) => {
    const healthCheck = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        serverId: config.serverId,
        uptime: process.uptime(),
        database: 'unknown'
    };

    try {
        // Check database connection
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        
        healthCheck.database = 'connected';
    } catch (error) {
        healthCheck.status = 'unhealthy';
        healthCheck.database = 'disconnected';
        healthCheck.error = error.message;
        
        return res.status(503).json(healthCheck);
    }

    res.json(healthCheck);
});

// GET /api/health/detailed - Detailed health check
router.get('/detailed', async (req, res) => {
    const detailedHealth = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        serverId: config.serverId,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: {
            status: 'unknown',
            connectionPool: {}
        }
    };

    try {
        // Check database connection
        const connection = await pool.getConnection();
        await connection.ping();
        
        // Get pool statistics (if available)
        detailedHealth.database.status = 'connected';
        detailedHealth.database.connectionPool = {
            total: pool.pool._allConnections.length,
            free: pool.pool._freeConnections.length,
            inUse: pool.pool._allConnections.length - pool.pool._freeConnections.length
        };
        
        connection.release();
    } catch (error) {
        detailedHealth.status = 'unhealthy';
        detailedHealth.database.status = 'disconnected';
        detailedHealth.error = error.message;
        
        return res.status(503).json(detailedHealth);
    }

    res.json(detailedHealth);
});

module.exports = router;
