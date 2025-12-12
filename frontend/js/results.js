// Results Display Logic
const API_BASE_URL = '/api';

let updateInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    loadResults();
    
    // Setup refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadResults);
    }
    
    // Auto-refresh every 30 seconds
    updateInterval = setInterval(loadResults, 30000);
});

async function loadResults() {
    try {
        const response = await fetch(`${API_BASE_URL}/results`);
        const data = await response.json();
        
        if (response.ok) {
            displayResults(data);
            document.getElementById('loading').style.display = 'none';
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Load results error:', error);
        showMessage('error', 'Failed to load results. Retrying...');
    }
}

function displayResults(data) {
    const { results, totalVotes, serverId } = data;
    
    // Update total votes
    document.getElementById('total-votes').textContent = totalVotes;
    
    // Update last updated time
    const now = new Date();
    document.getElementById('last-updated').textContent = now.toLocaleTimeString();
    
    // Update server ID if available
    if (serverId) {
        const serverIdElement = document.getElementById('server-id');
        if (serverIdElement) {
            serverIdElement.textContent = serverId;
        }
    }
    
    // Display results
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.innerHTML = '';
    
    if (results.length === 0) {
        resultsContainer.innerHTML = '<p class="info-message">No votes have been cast yet. Be the first to vote!</p>';
        return;
    }
    
    // Sort results by vote count (descending)
    results.sort((a, b) => b.voteCount - a.voteCount);
    
    results.forEach((result, index) => {
        const percentage = totalVotes > 0 ? ((result.voteCount / totalVotes) * 100).toFixed(1) : 0;
        
        const resultCard = document.createElement('div');
        resultCard.className = 'result-card';
        
        // Add special styling for winner
        if (index === 0 && result.voteCount > 0) {
            resultCard.style.borderLeft = '5px solid var(--success-color)';
        }
        
        resultCard.innerHTML = `
            <div class="result-header">
                <div>
                    <h3>${index === 0 && result.voteCount > 0 ? '🏆 ' : ''}${result.candidateName}</h3>
                    <p style="color: var(--text-secondary); margin-top: 5px;">${result.party}</p>
                </div>
                <div class="vote-count">${result.voteCount}</div>
            </div>
            <div class="result-bar">
                <div class="result-bar-fill" style="width: ${percentage}%">
                    ${percentage > 10 ? percentage + '%' : ''}
                </div>
            </div>
            <div class="result-percentage">${percentage}% of total votes</div>
        `;
        
        resultsContainer.appendChild(resultCard);
    });
}

function showMessage(type, message) {
    const messageElement = document.getElementById('error-message');
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.style.display = 'block';
        
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 5000);
    }
}

// Clean up interval when page is unloaded
window.addEventListener('beforeunload', () => {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});
