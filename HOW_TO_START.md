# EXACT STEPS TO RUN YOUR VOTING APP

## Option 1: Super Simple (ONE CLICK)

**Just double-click this file:**
- `START_APP.bat` (in the voting-platform folder)

That's it! Wait 30 seconds and open: http://localhost

---

## Option 2: Manual Commands

### Open PowerShell as Administrator and run:

```powershell
# Allow scripts to run
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force

# Go to your project
cd c:\Users\eiman\Downloads\voting-platform

# Build and start everything
cd deployment
docker-compose down -v
docker-compose up -d --build
```

### Wait 30 seconds, then open:
- **Frontend**: http://localhost
- **API Health Check**: http://localhost/api/health
- **HAProxy Stats**: http://localhost:8404 (user: admin, pass: admin)

---

## Useful Commands

### View logs:
```powershell
cd c:\Users\eiman\Downloads\voting-platform\deployment
docker-compose logs -f
```

### Stop everything:
```powershell
cd c:\Users\eiman\Downloads\voting-platform\deployment
docker-compose down
```

### Restart one service:
```powershell
cd c:\Users\eiman\Downloads\voting-platform\deployment
docker-compose restart app-server-1
```

### Check status:
```powershell
cd c:\Users\eiman\Downloads\voting-platform\deployment
docker-compose ps
```

---

## Auto-Allow Everything (For Future)

To avoid PowerShell script restrictions permanently:

1. **Open PowerShell as Administrator**
2. **Run this ONE time:**
   ```powershell
   Set-ExecutionPolicy RemoteSigned -Force
   ```

That's it! All scripts will work from now on.

---

## If Docker Desktop Isn't Running

1. Open Docker Desktop
2. Wait until it says "Docker is running"
3. Then run the commands above

---

## Troubleshooting

**Problem**: "Docker command not found"
- **Solution**: Start Docker Desktop and wait for it to fully start

**Problem**: Port already in use
- **Solution**: 
  ```powershell
  docker-compose down
  # Then try again
  docker-compose up -d
  ```

**Problem**: Services unhealthy
- **Solution**:
  ```powershell
  docker-compose restart db-primary
  docker-compose restart load-balancer
  ```
