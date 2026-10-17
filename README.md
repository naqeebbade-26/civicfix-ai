# CivicFix AI

### AI-Powered Civic Issue Reporting and Tracking

CivicFix AI helps citizens report local civic issues using photographs,
GPS-assisted location selection, and AI-generated complaint descriptions.

The project uses Google's Gemma model to analyse uploaded images and
suggest an issue category, formal complaint description, and priority.
Users can review the suggestions before saving a report and track its
status through their account.

## Features

- Photograph-based civic issue reporting
- GPS location detection and interactive map selection
- AI-assisted issue classification and complaint drafting
- Priority suggestions with supporting explanations
- User authentication and personal report tracking
- Administrator dashboard for reviewing reports
- Report status management and photo viewing

## Technology Stack

### Frontend
- Next.js
- React
- TypeScript
- Leaflet and React Leaflet
- OpenStreetMap

### Backend
- Python
- Flask
- SQLite
- Google GenAI SDK
- Gemma model

## Project Structure

- `frontend/` — Web application and user interface
- `backend/` — API, authentication, report management and AI integration
- `README.md` — Project documentation
- `LICENSE` — Project licence

## Local Setup

### 1. Frontend

Open a terminal in the `frontend` directory and run:

```bash
npm install
npm run dev