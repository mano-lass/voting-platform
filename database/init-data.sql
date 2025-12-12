-- Initial Data for Voting Platform
-- This script populates the database with sample data for testing

USE voting_db;

-- Insert sample candidates
INSERT INTO candidates (candidate_name, party, bio) VALUES
('Alice Johnson', 'Progressive Party', 'Former Senator with 15 years of experience in public service. Focus on education and healthcare reform.'),
('Bob Williams', 'Conservative Alliance', 'Business executive and economist. Advocates for fiscal responsibility and economic growth.'),
('Carol Martinez', 'Green Coalition', 'Environmental activist and former mayor. Champion of climate action and renewable energy.'),
('David Chen', 'Independent', 'Tech entrepreneur and philanthropist. Focuses on innovation, education, and digital infrastructure.');

-- Insert sample voters
-- Password for all demo voters: "password123"
-- Hash generated using bcryptjs with 10 rounds: $2a$10$YourHashHere
-- Note: In production, use proper password hashing on application side

INSERT INTO voters (voter_id, password_hash, first_name, last_name, email, has_voted) VALUES
('voter001', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'John', 'Doe', 'john.doe@example.com', FALSE),
('voter002', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Jane', 'Smith', 'jane.smith@example.com', FALSE),
('voter003', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Michael', 'Brown', 'michael.brown@example.com', FALSE),
('voter004', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Emily', 'Davis', 'emily.davis@example.com', FALSE),
('voter005', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'David', 'Wilson', 'david.wilson@example.com', FALSE),
('voter006', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Sarah', 'Taylor', 'sarah.taylor@example.com', FALSE),
('voter007', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'James', 'Anderson', 'james.anderson@example.com', FALSE),
('voter008', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Lisa', 'Thomas', 'lisa.thomas@example.com', FALSE),
('voter009', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Robert', 'Jackson', 'robert.jackson@example.com', FALSE),
('voter010', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Mary', 'White', 'mary.white@example.com', FALSE);

-- Optional: Insert some sample votes for testing results display
-- Uncomment the following lines to add test votes

-- INSERT INTO votes (voter_id, candidate_id) VALUES
-- ('voter001', 1),
-- ('voter002', 1),
-- ('voter003', 2),
-- ('voter004', 3),
-- ('voter005', 1);

-- UPDATE voters SET has_voted = TRUE WHERE voter_id IN ('voter001', 'voter002', 'voter003', 'voter004', 'voter005');

-- Verify data insertion
SELECT 'Candidates:' as '';
SELECT * FROM candidates;

SELECT 'Voters (count):' as '';
SELECT COUNT(*) as total_voters FROM voters;

SELECT 'Sample Voters:' as '';
SELECT voter_id, first_name, last_name, email, has_voted FROM voters LIMIT 5;

SELECT 'Votes (count):' as '';
SELECT COUNT(*) as total_votes FROM votes;
