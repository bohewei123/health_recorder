# Deployment Guide

## Prerequisites
- Node.js (v16+)
- Python (v3.9+)

## Backend Setup

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```

2.  Create and activate a virtual environment:
    ```bash
    python -m venv venv
    # macOS/Linux
    source venv/bin/activate
    # Windows
    .\venv\Scripts\activate
    ```

3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

4.  Run the server:
    ```bash
    uvicorn app.main:app --reload --port 8000
    ```
    The API will be available at `http://localhost:8000`.

## Frontend Setup

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run the development server:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173` (or the port shown in terminal).

## Production Build

### Frontend
Build the React app for production:
```bash
npm run build
```
The output will be in `frontend/dist`. You can serve these static files using Nginx, Apache, or by mounting them in FastAPI.

### Backend
Run with multiple workers for production:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Docker (Optional)
You can create a `Dockerfile` to containerize both services.
