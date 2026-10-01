# Development Workflow

## Prerequisites
- **Python**: 3.11+ (Python 3.13 supported)
- **Node.js**: v18+ (v24 LTS recommended) and npm
- **PostgreSQL**: 18.6+ running on `localhost:5432` with database `eventhub` created
- **Git**

## Setup Guide

### 1. Environment Configuration
Copy the template `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your PostgreSQL credentials in `.env` match your local setup.

### 2. Backend Setup
1. Create and activate a Python virtual environment:
   ```bash
   cd backend
   python -m venv .venv
   # Windows (PowerShell):
   .venv\Scripts\Activate.ps1
   # Linux/macOS:
   source .venv/bin/activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
4. Verify health endpoint: `http://localhost:8000/health`

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
4. Open the frontend in your browser: `http://localhost:5173`
