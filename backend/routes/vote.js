const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../database');
const authMiddleware = require('../middleware/auth');

// GET /api/vote/candidates - Get list of candidates
router.get('/candidates', authMiddleware, async (req, res) => {
    try {
        const candidates = await query(
            'SELECT candidate_id as id, candidate_name as name, party FROM candidates ORDER BY candidate_id',
            []
        );

        res.json({ 
            candidates 
        });
    } catch (error) {
        console.error('Get candidates error:', error);
        res.status(500).json({ 
            message: 'Failed to retrieve candidates' 
        });
    }
});

// GET /api/vote/status - Check if voter has already voted
router.get('/status', authMiddleware, async (req, res) => {
    try {
        const voterId = req.voterId;

        const votes = await query(
            'SELECT vote_id FROM votes WHERE voter_id = ?',
            [voterId]
        );

        res.json({ 
            hasVoted: votes.length > 0 
        });
    } catch (error) {
        console.error('Get vote status error:', error);
        res.status(500).json({ 
            message: 'Failed to check voting status' 
        });
    }
});

// POST /api/vote/submit - Submit a vote
router.post('/submit', [
    authMiddleware,
    body('candidateId').isInt({ min: 1 }).withMessage('Valid candidate ID is required')
], async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            message: 'Validation error', 
            errors: errors.array() 
        });
    }

    const { candidateId } = req.body;
    const voterId = req.voterId;

    try {
        // Use transaction to ensure atomicity
        await transaction(async (connection) => {
            // Check if voter has already voted (with row lock)
            const [existingVotes] = await connection.execute(
                'SELECT vote_id FROM votes WHERE voter_id = ? FOR UPDATE',
                [voterId]
            );

            if (existingVotes.length > 0) {
                throw new Error('ALREADY_VOTED');
            }

            // Verify candidate exists
            const [candidates] = await connection.execute(
                'SELECT candidate_id FROM candidates WHERE candidate_id = ?',
                [candidateId]
            );

            if (candidates.length === 0) {
                throw new Error('INVALID_CANDIDATE');
            }

            // Insert vote
            await connection.execute(
                'INSERT INTO votes (voter_id, candidate_id, vote_timestamp) VALUES (?, ?, NOW())',
                [voterId, candidateId]
            );

            // Mark voter as having voted
            await connection.execute(
                'UPDATE voters SET has_voted = TRUE WHERE voter_id = ?',
                [voterId]
            );
        });

        res.json({ 
            message: 'Vote submitted successfully',
            success: true
        });

    } catch (error) {
        console.error('Vote submission error:', error);
        
        if (error.message === 'ALREADY_VOTED') {
            return res.status(400).json({ 
                message: 'You have already voted' 
            });
        }
        
        if (error.message === 'INVALID_CANDIDATE') {
            return res.status(400).json({ 
                message: 'Invalid candidate selected' 
            });
        }

        res.status(500).json({ 
            message: 'Failed to submit vote' 
        });
    }
});

module.exports = router;
