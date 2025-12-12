const jwt = require('jsonwebtoken');
const config = require('../config');

// Authentication middleware
function authMiddleware(req, res, next) {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            message: 'Access denied. No token provided.' 
        });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
        // Verify token
        const decoded = jwt.verify(token, config.jwt.secret);
        
        // Add voter ID to request object
        req.voterId = decoded.voterId;
        
        // Continue to next middleware
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                message: 'Token has expired. Please login again.' 
            });
        }
        
        return res.status(401).json({ 
            message: 'Invalid token.' 
        });
    }
}

module.exports = authMiddleware;
