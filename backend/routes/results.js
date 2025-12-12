const express = require('express');
const router = express.Router();
const { query } = require('../database');
const config = require('../config');

// GET /api/results - Get election results
router.get('/', async (req, res) => {
    try {
        // Get vote counts per candidate
        const results = await query(`
            SELECT 
                c.candidate_id,
                c.candidate_name as candidateName,
                c.party,
                COUNT(v.vote_id) as voteCount
            FROM candidates c
            LEFT JOIN votes v ON c.candidate_id = v.candidate_id
            GROUP BY c.candidate_id, c.candidate_name, c.party
            ORDER BY voteCount DESC, c.candidate_name ASC
        `, []);

        // Get total vote count
        const totalVotes = results.reduce((sum, result) => sum + parseInt(result.voteCount), 0);

        res.json({
            results,
            totalVotes,
            serverId: config.serverId,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Get results error:', error);
        res.status(500).json({ 
            message: 'Failed to retrieve results' 
        });
    }
});

// GET /api/results/summary - Get election summary statistics
router.get('/summary', async (req, res) => {
    try {
        // Total votes
        const [totalVotesResult] = await query('SELECT COUNT(*) as count FROM votes', []);
        const totalVotes = totalVotesResult.count;

        // Total registered voters
        const [totalVotersResult] = await query('SELECT COUNT(*) as count FROM voters', []);
        const totalVoters = totalVotersResult.count;

        // Voters who have voted
        const [votedCountResult] = await query('SELECT COUNT(*) as count FROM voters WHERE has_voted = TRUE', []);
        const votedCount = votedCountResult.count;

        // Turnout percentage
        const turnoutPercentage = totalVoters > 0 
            ? ((votedCount / totalVoters) * 100).toFixed(2) 
            : 0;

        // Winner
        const winners = await query(`
            SELECT 
                c.candidate_name as candidateName,
                c.party,
                COUNT(v.vote_id) as voteCount
            FROM candidates c
            LEFT JOIN votes v ON c.candidate_id = v.candidate_id
            GROUP BY c.candidate_id, c.candidate_name, c.party
            ORDER BY voteCount DESC
            LIMIT 1
        `, []);

        const winner = winners.length > 0 ? winners[0] : null;

        res.json({
            totalVotes,
            totalVoters,
            votedCount,
            turnoutPercentage: parseFloat(turnoutPercentage),
            winner,
            serverId: config.serverId,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Get summary error:', error);
        res.status(500).json({ 
            message: 'Failed to retrieve summary' 
        });
    }
});

module.exports = router;
