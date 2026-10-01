# API Specification

## Base URL
- Local Development: `http://localhost:8000`
- API Prefix: `/api/v1`
- Interactive OpenAPI Docs (Swagger UI): `http://localhost:8000/docs`
- ReDoc Docs: `http://localhost:8000/redoc`

## Current Endpoints (Phase 1)

### Health Check
- **Endpoint**: `GET /health`
- **Description**: Verifies that the API service is online and responding.
- **Response**: `200 OK`
  ```json
  {
    "status": "ok"
  }
  ```

## Upcoming Endpoints (Phase 2+)
Business APIs for user authentication, events management, ticket tiers, bookings, and payments will be added in upcoming phases.
