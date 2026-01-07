# API Documentation

The Health Recorder API is built with FastAPI. It provides interactive API documentation (Swagger UI) and ReDoc.

## Accessing Documentation

Once the backend is running (default port 8000):

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs) - Interactive testing and exploration.
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc) - Alternative documentation view.

## Core Endpoints

### Daily Records

- `GET /api/records/`: Retrieve all daily records.
- `GET /api/records/{date}/{time_of_day}`: Retrieve a specific record.
- `POST /api/records/`: Create or update a daily record.
- `DELETE /api/records/{record_id}`: Delete a record.

### Exercises

- `GET /api/exercises/config`: Get exercise list configuration.
- `POST /api/exercises/config`: Update exercise list configuration.
- `GET /api/exercises/logs`: Get all exercise logs.
- `GET /api/exercises/export`: Export exercise logs to Markdown (Query params: `start_date`, `end_date`).
- `GET /api/exercises/logs/{date}`: Get exercise log for a specific date.
- `POST /api/exercises/logs/{date}`: Save exercise log for a specific date.

## Data Models

Refer to the Swagger UI for detailed JSON schemas of Request and Response bodies.
