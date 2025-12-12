// Voting Logic
const API_BASE_URL = '/api';

let candidates = [];
let selectedCandidateId = null;

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Display voter name
    const voterInfo = getVoterInfo();
    const voterNameElement = document.getElementById('voter-name');
    if (voterNameElement) {
        voterNameElement.textContent = `Welcome, ${voterInfo.voterName || voterInfo.voterId}`;
    }
    
    // Setup logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
    
    // Setup form submission
    const voteForm = document.getElementById('vote-form');
    if (voteForm) {
        voteForm.addEventListener('submit', handleVoteSubmission);
    }
    
    // Setup cancel button
    const cancelBtn = document.getElementById('cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
    
    // Load candidates and check voting status
    checkVotingStatus();
});

async function checkVotingStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/vote/status`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (data.hasVoted) {
                showAlreadyVoted();
            } else {
                loadCandidates();
            }
        } else {
            showMessage('error', 'Failed to check voting status');
        }
    } catch (error) {
        console.error('Status check error:', error);
        showMessage('error', 'Connection error. Please try again.');
    }
}

async function loadCandidates() {
    try {
        const response = await fetch(`${API_BASE_URL}/vote/candidates`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            candidates = data.candidates;
            displayCandidates();
            document.getElementById('loading').style.display = 'none';
            document.getElementById('vote-form').style.display = 'block';
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Load candidates error:', error);
        document.getElementById('loading').innerHTML = '<p class="error-message">Failed to load candidates. Please refresh the page.</p>';
    }
}

function displayCandidates() {
    const candidatesList = document.getElementById('candidates-list');
    candidatesList.innerHTML = '';
    
    candidates.forEach(candidate => {
        const candidateCard = document.createElement('div');
        candidateCard.className = 'candidate-card';
        candidateCard.innerHTML = `
            <input type="radio" name="candidate" value="${candidate.id}" id="candidate-${candidate.id}">
            <h4>${candidate.name}</h4>
            <p>${candidate.party}</p>
        `;
        
        candidateCard.addEventListener('click', () => {
            document.getElementById(`candidate-${candidate.id}`).checked = true;
            selectCandidate(candidate.id);
        });
        
        candidatesList.appendChild(candidateCard);
    });
}

function selectCandidate(candidateId) {
    // Remove previous selection styling
    document.querySelectorAll('.candidate-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Add selection styling to selected card
    const selectedCard = document.querySelector(`#candidate-${candidateId}`).closest('.candidate-card');
    selectedCard.classList.add('selected');
    
    selectedCandidateId = candidateId;
}

async function handleVoteSubmission(event) {
    event.preventDefault();
    
    if (!selectedCandidateId) {
        showMessage('error', 'Please select a candidate before submitting.');
        return;
    }
    
    // Show confirmation modal
    const selectedCandidate = candidates.find(c => c.id == selectedCandidateId);
    document.getElementById('selected-candidate-name').textContent = `${selectedCandidate.name} (${selectedCandidate.party})`;
    showModal();
}

function showModal() {
    const modal = document.getElementById('confirm-modal');
    modal.style.display = 'flex';
    
    document.getElementById('confirm-vote').onclick = submitVote;
    document.getElementById('cancel-vote').onclick = hideModal;
}

function hideModal() {
    const modal = document.getElementById('confirm-modal');
    modal.style.display = 'none';
}

async function submitVote() {
    hideModal();
    
    const submitBtn = document.querySelector('#vote-form button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/vote/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({
                candidateId: selectedCandidateId
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('success', '✓ Vote submitted successfully! Redirecting to results...');
            setTimeout(() => {
                window.location.href = 'results.html';
            }, 2000);
        } else {
            showMessage('error', data.message || 'Failed to submit vote. Please try again.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Vote';
        }
    } catch (error) {
        console.error('Vote submission error:', error);
        showMessage('error', 'Connection error. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Vote';
    }
}

function showAlreadyVoted() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('already-voted').style.display = 'block';
}

function showMessage(type, message) {
    const messageElement = document.getElementById(`${type}-message`);
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 5000);
    }
}

// Include auth functions from auth.js
function isAuthenticated() {
    return localStorage.getItem('authToken') !== null;
}

function getAuthToken() {
    return localStorage.getItem('authToken');
}

function getVoterInfo() {
    return {
        voterId: localStorage.getItem('voterId'),
        voterName: localStorage.getItem('voterName')
    };
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('voterId');
    localStorage.removeItem('voterName');
    window.location.href = 'login.html';
}
