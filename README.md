# Greenhouse Cibatu

Greenhouse Cibatu is a Smart Greenhouse Irrigation Dashboard built to monitor and control greenhouse solenoids automatically or manually 

## Features

- **Manual Control**: Toggle Water and Fertilizer solenoids directly from the dashboard.
- **Automation Engine**: Add, edit, and manage automation schedules. Set start times, durations, and active days for different zones.
- **Real-time Weather**: Integrated with the Open-Meteo API to fetch and display the live temperature and humidity for Cibatu, Garut.
- **Activity History**: Keeps track of completed irrigation cycles, manual toggles, and system alerts.
- **Notification System**: In-app notifications to track recent activities and alerts.
- **PWA Ready**: The dashboard can be installed directly onto your mobile device (Android/iOS) as a Progressive Web App.
- **Gemini Live AI Assistant (Beta)**: Natural speech-to-speech scheduling assistant with clarification, conflict checks, recommendations, and explicit confirmation before saving or deleting a schedule.

## Tech Stack

- **Frontend**: React.js, Vite, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Containerization**: Docker & Docker Compose

## Getting Started

The easiest way to run this project is by using Docker. This setup will automatically start the MySQL database (with seed data), the Express backend, and the Vite frontend

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)

### Installation & Run

1. Clone this repository:
   ```bash
   git clone <your-github-repo-url>
   cd greenhouse-cibatu
   ```

2. Start the services using Docker Compose:
   ```bash
   docker compose up --build
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```
   *(If you are testing the PWA on a mobile device, use your computer's local IP address, e.g., `http://192.168.1.X:5173`)*

### Gemini Live AI Assistant (Beta)

The AI entry point is intentionally placed at the bottom of **Pengaturan → Fitur dalam pengembangan**. Existing manual controls, schedules, and the original voice-command assistant remain unchanged.

1. Copy the variables from `backend/.env.example` into your local backend `.env` or deployment environment.
2. Set `GEMINI_API_KEY` on the backend. Never expose this key through a `VITE_` variable or frontend code. The backend only returns a single-use, short-lived Gemini Live token.
3. Optional overrides are `GEMINI_LIVE_MODEL=gemini-3.1-flash-live-preview` and `GEMINI_LIVE_VOICE=Kore`.
4. Serve the deployed app over HTTPS so the browser can access the microphone and establish the Gemini Live WebSocket connection.

The assistant creates a proposal first, checks active schedules, reads warnings aloud, and only saves after the user explicitly confirms in the next turn. Deletion uses a separate proposal: the assistant identifies one exact schedule, reads its details, and waits for a new explicit confirmation before deleting it.
Google currently lists this preview model's input and output as free of charge on the Free Tier, subject to project rate limits and preview availability. Free Tier submissions may be used to improve Google's products; review the current Gemini API pricing and data-use terms before production use.

## Project Structure

- `/frontend` - Contains the React + Vite frontend application.
- `/backend` - Contains the Node.js Express server acting as the REST API.
- `/db` - Contains the `schema.sql` which Docker uses to automatically seed the MySQL database on the first run.
- `docker-compose.yml` - Configuration to orchestrate the db, backend, and frontend containers.

## Mobile App (PWA)

To install this dashboard on your phone:
1. Ensure your phone and computer are on the same local network.
2. Open Chrome (Android) or Safari (iOS) and navigate to the local IP of the machine running Docker (e.g., `http://192.168.1.X:5173`).
3. Click the **"Add to Home Screen"** prompt that appears, or select it from the browser menu.

