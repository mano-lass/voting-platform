-- Voting Platform Database Schema
-- MySQL 8.0+

-- Drop existing tables if they exist (for fresh installation)
DROP TABLE IF EXISTS votes;
DROP TABLE IF EXISTS voters;
DROP TABLE IF EXISTS candidates;

-- Create candidates table
CREATE TABLE candidates (
    candidate_id INT PRIMARY KEY AUTO_INCREMENT,
    candidate_name VARCHAR(100) NOT NULL,
    party VARCHAR(100) NOT NULL,
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create voters table
CREATE TABLE voters (
    voter_id VARCHAR(50) PRIMARY KEY,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    has_voted BOOLEAN DEFAULT FALSE,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_has_voted (has_voted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create votes table
CREATE TABLE votes (
    vote_id INT PRIMARY KEY AUTO_INCREMENT,
    voter_id VARCHAR(50) NOT NULL,
    candidate_id INT NOT NULL,
    vote_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_voter (voter_id),
    FOREIGN KEY (voter_id) REFERENCES voters(voter_id) ON DELETE CASCADE,
    FOREIGN KEY (candidate_id) REFERENCES candidates(candidate_id) ON DELETE CASCADE,
    INDEX idx_candidate (candidate_id),
    INDEX idx_timestamp (vote_timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create audit log table (optional - for tracking all database changes)
CREATE TABLE audit_log (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    table_name VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL,
    record_id VARCHAR(100),
    user_id VARCHAR(50),
    changed_data TEXT,
    log_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_table_action (table_name, action),
    INDEX idx_timestamp (log_timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comments to tables
ALTER TABLE candidates COMMENT = 'Stores information about election candidates';
ALTER TABLE voters COMMENT = 'Stores registered voter information and authentication data';
ALTER TABLE votes COMMENT = 'Stores cast votes with referential integrity';
ALTER TABLE audit_log COMMENT = 'Audit trail for database changes';

-- Show table structure
SHOW TABLES;
DESCRIBE candidates;
DESCRIBE voters;
DESCRIBE votes;
