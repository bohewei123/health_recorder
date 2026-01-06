# Health Recorder Design Document

## Architecture Overview

The application follows a **Separation of Concerns** principle with a distinct Frontend and Backend.

### Frontend
- **Framework**: React.js (Vite)
- **UI Library**: Ant Design (Antd)
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Charts**: Recharts

**Key Components**:
- `DailyRecord`: Form for submitting daily health status.
- `Exercises`: Tabbed interface for tracking rehabilitation exercises and managing the exercise list.
- `Trends`: Visual analytics using line charts to track symptom trends over time.
- `History`: Tabular view of all records with export functionality.

### Backend
- **Framework**: FastAPI (Python)
- **Database**: SQLite (via `sqlite3` driver, encapsulated in `DBManager`)
- **API Documentation**: OpenAPI (Swagger/ReDoc) auto-generated.

**Layered Architecture**:
1.  **API Layer (`app/api`)**: Handles HTTP requests, validation (Pydantic), and routing.
2.  **Service Layer (`app/services`)**: Contains business logic (e.g., template parsing, data formatting).
3.  **Data Access Layer (`app/db`)**: Handles direct database interactions and SQL queries.

## Database Schema

### `daily_records`
Stores daily symptom logs.
- `id`: PK
- `date`: TEXT (YYYY-MM-DD)
- `time_of_day`: TEXT
- `pain_level`...`fatigue_level`: INTEGER
- `notes`, `triggers`, `interventions`: TEXT (JSON)

### `exercise_config`
Stores the list of exercises.
- `key`: TEXT (PK) - Fixed as "exercise_list"
- `value`: TEXT (JSON List)

### `exercise_logs`
Stores daily exercise feedback.
- `date`: TEXT (PK)
- `data`: TEXT (JSON)

## Version History

### v2.0.0 (Current)
- **Refactoring**: Migrated from monolithic Streamlit app to React + FastAPI.
- **Frontend**: Complete rewrite in React with Ant Design.
- **Backend**: New FastAPI backend with RESTful endpoints.
- **Features**: 
    - Preserved all original functionality.
    - Added responsive design.
    - Improved data management with Redux.
    - Interactive charts with Recharts.

### v1.0.0 (Legacy)
- Monolithic Streamlit application.
- Single `app.py` file containing UI and Logic.
