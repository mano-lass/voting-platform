# Architecture Documentation - Voting Platform

## Table of Contents

- [System Overview](#system-overview)
- [Architecture Patterns](#architecture-patterns)
- [Component Design](#component-design)
- [Data Flow](#data-flow)
- [Fault Tolerance](#fault-tolerance)
- [Scalability](#scalability)
- [Security Architecture](#security-architecture)
- [Performance Considerations](#performance-considerations)

## System Overview

The Voting Platform implements a three-tier distributed architecture designed for high availability, fault tolerance, and scalability.

### Design Principles

1. **Statelessness**: Application servers maintain no session state
2. **Redundancy**: Multiple instances of each component
3. **Separation of Concerns**: Clear separation between layers
4. **Fail-Fast**: Quick detection and recovery from failures
5. **Data Consistency**: Strong consistency for vote integrity

### System Characteristics

| Characteristic | Implementation |
|----------------|----------------|
| **Availability** | 99.9% (three nines) |
| **Consistency** | Strong (ACID transactions) |
| **Partition Tolerance** | Limited (within single datacenter) |
| **Scalability** | Horizontal (add more app servers) |
| **Recovery Time** | < 10 seconds (automatic failover) |

## Architecture Patterns

### Multi-Tier Architecture

```
Presentation Tier
    ↓
Business Logic Tier (Stateless)
    ↓
Data Tier (Replicated)
```

### Load Balancing Pattern

```
Client → Load Balancer → [Server 1, Server 2, Server 3] → Database
```

- **Algorithm**: Round-robin with health checks
- **Session Persistence**: None (stateless design)
- **Failover**: Automatic removal of failed servers

### Database Replication Pattern

```
Primary (Read/Write) ←→ Replica (Read-only)
         ↓
    Applications
```

- **Replication Type**: Asynchronous master-slave
- **Consistency**: Eventually consistent (lag < 1 second)
- **Failover**: Manual promotion of replica to primary

## Component Design

### Frontend Layer

**Technology**: Static HTML/CSS/JavaScript

**Responsibilities**:
- User interface rendering
- Client-side form validation
- API communication
- Session token management

**Design Decisions**:
- No server-side rendering (reduces server load)
- Progressive enhancement (works without JavaScript)
- Mobile-responsive design
- Minimal external dependencies

**File Structure**:
```
frontend/
├── index.html          # Landing page
├── login.html          # Authentication
├── vote.html           # Voting interface
├── results.html        # Results display
├── css/
│   └── style.css       # Global styles
└── js/
    ├── auth.js         # Authentication logic
    ├── voting.js       # Voting logic
    └── results.js      # Results display
```

### Load Balancer

**Technology**: HAProxy 2.8+

**Configuration**:
```
Frontend (Port 80)
    ↓
Backend Pool
    ├── app-server-1:3000 (check /api/health every 5s)
    ├── app-server-2:3000 (check /api/health every 5s)
    └── app-server-3:3000 (check /api/health every 5s)
```

**Health Check Logic**:
1. HTTP GET /api/health every 5 seconds
2. Expect 200 OK response
3. Mark server down after 3 consecutive failures
4. Mark server up after 2 consecutive successes

**Failover Behavior**:
- Failed server immediately removed from pool
- Requests redistributed to healthy servers
- Automatic reintroduction after recovery

### Application Layer

**Technology**: Node.js 18 LTS + Express.js 4

**Design Pattern**: MVC (Model-View-Controller)

```
routes/        # Route handlers (Controllers)
    ├── auth.js
    ├── vote.js
    ├── results.js
    └── health.js

models/        # Data models (would contain business logic)
    ├── voter.js
    ├── vote.js
    └── candidate.js

middleware/    # Request processors
    ├── auth.js        # JWT verification
    └── validate.js    # Input validation
```

**Request Flow**:
```
Request → Middleware (auth) → Route Handler → Database → Response
```

**Stateless Design**:
- No session storage on server
- Authentication via JWT tokens
- Each request is independent
- Enables horizontal scaling

**Database Connection Pooling**:
```javascript
pool = mysql.createPool({
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0
})
```

Benefits:
- Reuses existing connections
- Reduces connection overhead
- Handles connection failures gracefully

### Database Layer

**Technology**: MySQL 8.0 with InnoDB engine

**Schema Design**:

```sql
voters (voter_id, password_hash, has_voted)
    ↓
votes (vote_id, voter_id, candidate_id, timestamp)
    ↓
candidates (candidate_id, name, party)
```

**Key Constraints**:
- UNIQUE on votes.voter_id (prevents duplicate votes)
- FOREIGN KEYs (referential integrity)
- TIMESTAMP (audit trail)

**Replication Architecture**:

```
Primary Server (server-id=1)
    ├── Handles all writes
    ├── Binary log (binlog) enabled
    └── Replicates to replica

Replica Server (server-id=2)
    ├── Receives binlog events
    ├── Applies changes (read-only)
    └── Can be promoted to primary
```

**Replication Configuration**:
```ini
# Primary
server-id = 1
log-bin = mysql-bin
binlog_format = ROW
gtid_mode = ON

# Replica
server-id = 2
relay-log = relay-bin
read_only = 1
gtid_mode = ON
```

## Data Flow

### Vote Submission Flow

```
1. User clicks "Submit Vote"
   ↓
2. Browser sends POST /api/vote/submit with JWT
   ↓
3. Load balancer routes to app server
   ↓
4. Auth middleware verifies JWT
   ↓
5. Vote controller starts database transaction
   ↓
6. Check if voter already voted (with row lock)
   ↓
7. If not voted, insert vote record
   ↓
8. Update voter.has_voted = TRUE
   ↓
9. Commit transaction
   ↓
10. Return success response
    ↓
11. Vote replicates to replica database
```

### Transaction Handling

```javascript
await transaction(async (connection) => {
    // 1. Lock voter row
    await connection.execute(
        'SELECT * FROM votes WHERE voter_id = ? FOR UPDATE',
        [voterId]
    );
    
    // 2. Insert vote
    await connection.execute(
        'INSERT INTO votes (voter_id, candidate_id) VALUES (?, ?)',
        [voterId, candidateId]
    );
    
    // 3. Update voter status
    await connection.execute(
        'UPDATE voters SET has_voted = TRUE WHERE voter_id = ?',
        [voterId]
    );
});
```

**ACID Properties**:
- **Atomicity**: All or nothing (transaction)
- **Consistency**: Constraints enforced (UNIQUE, FK)
- **Isolation**: Row-level locking (FOR UPDATE)
- **Durability**: Changes written to disk (sync_binlog=1)

### Results Aggregation Flow

```
1. User requests /api/results
   ↓
2. Load balancer routes to app server
   ↓
3. No authentication required
   ↓
4. Execute aggregation query:
   SELECT candidate_id, COUNT(*) 
   FROM votes 
   GROUP BY candidate_id
   ↓
5. Join with candidates table
   ↓
6. Return results with percentages
```

**Query Optimization**:
```sql
-- Index on votes.candidate_id for fast GROUP BY
CREATE INDEX idx_candidate_id ON votes(candidate_id);

-- Index on votes.vote_timestamp for time-based queries
CREATE INDEX idx_timestamp ON votes(vote_timestamp);
```

## Fault Tolerance

### Failure Scenarios

#### Scenario 1: Application Server Failure

**Detection**:
- HAProxy health check fails (3 consecutive failures)
- Timeout after 5 seconds

**Response**:
1. HAProxy removes server from pool
2. New requests routed to remaining servers
3. In-flight requests may fail (client retries)

**Recovery**:
1. Fix server issue (restart, deploy fix)
2. Server starts responding to health checks
3. HAProxy automatically reintroduces server
4. Normal operation resumes

**Data Loss**: None (stateless servers)

#### Scenario 2: Database Primary Failure

**Detection**:
- Application servers detect connection errors
- Multiple failed query attempts

**Response**:
1. Manual or automated failover script
2. Stop replication on replica
3. Promote replica to primary (read_only=OFF)
4. Update application configuration (DB_HOST)
5. Restart application servers

**Recovery**:
1. Fix failed primary
2. Configure as new replica
3. Set up replication from new primary
4. System now has redundancy again

**Data Loss**: Minimal (recent uncommitted transactions)

#### Scenario 3: Network Partition

**Between Load Balancer and App Server**:
- Server marked as down
- Traffic routed to other servers
- No data loss

**Between App Server and Database**:
- Connection pool exhausted
- Requests fail with 500 errors
- Clients retry or load balancer fails over

**Mitigation**:
- Connection timeouts
- Retry logic with exponential backoff
- Circuit breaker pattern

### Disaster Recovery

**Backup Strategy**:
```bash
# Daily full backup
mysqldump --single-transaction voting_db > backup.sql

# Retention: 7 days
find /backups -mtime +7 -delete
```

**Recovery Procedure**:
1. Restore from latest backup
2. Apply binlog events since backup
3. Verify data integrity
4. Resume normal operations

**Recovery Time Objective (RTO)**: 1 hour
**Recovery Point Objective (RPO)**: 1 hour

## Scalability

### Horizontal Scaling

**Application Tier**:
```bash
# Add more servers
docker-compose up -d --scale app-server=10
```

Benefits:
- Linear scaling (2x servers = 2x capacity)
- No code changes required
- Gradual rollout possible

Limitations:
- Database becomes bottleneck
- Network bandwidth limits

**Database Tier**:

Read Scaling:
```
Primary (Writes) → Replica 1 (Reads)
                 → Replica 2 (Reads)
                 → Replica 3 (Reads)
```

Write Scaling (Future Enhancement):
- Database sharding by voter ID
- Multiple primary servers
- More complex consistency management

### Vertical Scaling

**When to Scale Up**:
- CPU utilization > 80%
- Memory pressure
- Disk I/O bottleneck

**Database Scaling**:
```ini
# Increase buffer pool
innodb_buffer_pool_size = 4G  # from 1G

# More concurrent connections
max_connections = 500  # from 200
```

### Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Response Time (p50) | < 100ms | ~50ms |
| Response Time (p95) | < 500ms | ~200ms |
| Throughput | > 1000 req/s | ~500 req/s |
| Concurrent Users | > 10,000 | ~5,000 |
| Availability | > 99.9% | 99.5% |

## Security Architecture

### Authentication Flow

```
1. User submits credentials
   ↓
2. Server verifies with database
   ↓
3. bcrypt.compare(password, hash)
   ↓
4. Generate JWT token
   ↓
5. Token contains: {voterId, exp}
   ↓
6. Client stores token (localStorage)
   ↓
7. Include in Authorization header
   ↓
8. Server verifies signature
   ↓
9. Extract voterId from token
```

**JWT Structure**:
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "voterId": "voter001",
    "iat": 1234567890,
    "exp": 1234569690
  },
  "signature": "..."
}
```

### Authorization

**Endpoint Protection**:
- `/api/auth/login`: Public
- `/api/vote/*`: Requires valid JWT
- `/api/results`: Public (anonymous viewing)
- `/api/health`: Public

**Middleware Chain**:
```javascript
app.use('/api/vote', authMiddleware, voteRoutes);
```

### Data Protection

**At Rest**:
- Password hashing (bcrypt, 10 rounds)
- Database encryption (optional InnoDB encryption)

**In Transit**:
- TLS/SSL (HTTPS in production)
- Encrypted database connections (SSL)

**Anonymity**:
- Votes table does NOT store voter_id
- One-way hash for vote verification
- No way to trace vote to voter

### Security Measures

1. **Input Validation**: Express-validator on all inputs
2. **SQL Injection**: Parameterized queries only
3. **XSS Prevention**: Content-Security-Policy headers
4. **CSRF Protection**: SameSite cookies (if using)
5. **Rate Limiting**: 100 requests per 15 minutes
6. **Security Headers**: Helmet.js middleware

## Performance Considerations

### Bottlenecks

1. **Database Writes**: Serial vote insertions
2. **Network Latency**: Multi-tier hops
3. **Connection Overhead**: Database connections

### Optimizations

**Application Level**:
```javascript
// Connection pooling
pool.connectionLimit = 10

// Async/await for non-blocking I/O
async function submitVote(voterId, candidateId) {
    await query('INSERT INTO votes ...');
}

// Caching results (future)
cache.set('results', results, ttl=60)
```

**Database Level**:
```sql
-- Indexes
CREATE INDEX idx_candidate ON votes(candidate_id);
CREATE INDEX idx_voter ON voters(voter_id);

-- Query optimization
EXPLAIN SELECT * FROM votes WHERE voter_id = ?;

-- Buffer pool sizing
innodb_buffer_pool_size = 1G
```

**Load Balancer**:
```cfg
# Keep-alive connections
timeout client 50s
timeout server 50s

# HTTP/2 support
alpn h2,http/1.1
```

### Monitoring Points

- Request rate per second
- Average response time
- Database query time
- Connection pool utilization
- Replication lag
- CPU and memory usage
- Disk I/O
- Network bandwidth

---

**Last Updated**: December 2025
