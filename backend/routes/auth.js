const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../database');
const config = require('../config');

// POST /api/auth/login - Authenticate voter
router.post('/login', [
    body('voterId').trim().notEmpty().withMessage('Voter ID is required'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            message: 'Validation error', 
            errors: errors.array() 
        });
    }

    const { voterId, password } = req.body;

    try {
        // Query voter from database
        const voters = await query(
            'SELECT voter_id, password_hash, first_name, last_name FROM voters WHERE voter_id = ?',
            [voterId]
        );

        if (voters.length === 0) {
            return res.status(401).json({ 
                message: 'Invalid voter ID or password' 
            });
        }

        const voter = voters[0];

        // Verify password
        const passwordMatch = await bcrypt.compare(password, voter.password_hash);
        
        if (!passwordMatch) {
            return res.status(401).json({ 
                message: 'Invalid voter ID or password' 
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { voterId: voter.voter_id },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        // Return success with token
        res.json({
            message: 'Login successful',
            token,
            voterName: `${voter.first_name} ${voter.last_name}`
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            message: 'Server error during authentication' 
        });
    }
});

// POST /api/auth/verify - Verify JWT token
router.post('/verify', async (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(token, config.jwt.secret);
        res.json({ 
            valid: true, 
            voterId: decoded.voterId 
        });
    } catch (error) {
        res.status(401).json({ 
            valid: false, 
            message: 'Invalid or expired token' 
        });
    }
});

module.exports = router;
