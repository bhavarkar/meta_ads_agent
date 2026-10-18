# Testing Guide for MetaPilot AI

## 1. Backend Testing with Pytest
The backend includes test coverage for:
- Root and health endpoints (`/health`, `/api/v1/health`)
- Campaign draft creation (`status="PAUSED"` guarantee)
- Unapproved activation block (returns HTTP 400)
- Lifecycle: creation -> explicit approval -> live activation
- Instagram Reels aspect ratio and duration bounds verification
- 2-step Reels approval and live publishing pipeline
- 5 prioritized AI recommendations and 1-click execution

### Running Pytest (Windows PowerShell)
```powershell
cd backend
python -m pytest -v
```

## 2. Frontend Testing with Vitest
Unit tests verify:
- Navigation tab rendering
- Safety badge display ("DEMO MODE: Synthetic Data Active" vs "CONNECTED")
- Client switcher state updates
- Form validation

### Running Vitest (Windows PowerShell)
```powershell
cd frontend
npm.cmd run test
```
