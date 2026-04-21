# Watchdog - Monitoring SaaS

Watchdog is a robust, real-time monitoring solution designed to track website uptime, performance, and incidents. It provides a comprehensive dashboard for users to manage their monitors, view detailed metrics, and receive notifications when services go down.

## 🚀 Features

- **Real-time Monitoring:** Automated polling of HTTP/HTTPS endpoints to ensure availability.
- **Incident Tracking:** Automatic detection and logging of downtime incidents.
- **Performance Metrics:** Visualize response times and uptime history with interactive charts.
- **Secure Authentication:** Support for local email/password login and Google OAuth2.
- **Email Notifications:** Automated alerts via SMTP when monitors change status.
- **Dashboard Interface:** A modern, high-density UI inspired by professional monitoring tools.

## 🛠️ Tech Stack

### Backend
- **Node.js & TypeScript:** Core runtime and language.
- **Express:** Web framework for the API.
- **Passport.js:** Authentication middleware (Local & Google OAuth2).
- **PostgreSQL:** Data persistence (hosted on Supabase).
- **Nodemailer:** For sending alert notifications.

### Frontend
- **React & TypeScript:** UI library and type-safe development.
- **Vite:** Fast build tool and dev server.
- **Tailwind CSS:** Utility-first styling.
- **Recharts:** Data visualization for monitor performance.
- **Lucide React:** Icon set for a clean UI.

### Infrastructure
- **Supabase:** Managed database and authentication services.
- **Docker & Docker Compose:** Containerization for easy development and deployment.

## 📁 Project Structure

```text
.
├── backend/            # Express API and monitoring worker
│   ├── src/
│   │   ├── config/     # Configuration (Passport, Env, etc.)
│   │   ├── controllers/# Request handlers
│   │   ├── middleware/ # Custom Express middleware
│   │   ├── routes/     # API route definitions
│   │   ├── services/   # Business logic (Monitoring worker, Mailer)
│   │   └── utils/      # Utility functions
├── frontend/           # React SPA
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── pages/      # View components
│   │   ├── services/   # API client and services
│   │   └── styles/     # global CSS/Tailwind
└── supabase/           # Database migrations and configuration
```

## 🚦 Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js (v18+)
- Supabase account (or local Supabase CLI)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd MonitoringAPI
   ```

2. **Environment Setup:**
   Create `.env` files in both `backend/` and `frontend/` directories based on the provided examples (if available) or the configuration required (see `backend/src/config/env.ts`).

3. **Run with Docker:**
   ```bash
   docker-compose up --build
   ```
   The backend will be available at `http://localhost:4000` and the frontend at `http://localhost:5173`.

### Manual Development

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 📄 License

This project is licensed under the ISC License.

## Author

- Developed by Renan Campos Cavalcanti
- GitHub: https://github.com/renanipx/
- LinkedIn: https://www.linkedin.com/in/renanccavalcanti/
