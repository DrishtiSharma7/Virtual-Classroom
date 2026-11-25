# Virtual Classroom

A full-stack virtual classroom platform for live, interactive online teaching. Teachers can run live video sessions with a shared whiteboard, quizzes, and screen sharing, while students join sessions, take quizzes, review recordings, and track their own attendance, all with role-based dashboards and analytics for both sides.

## Features

**Classrooms & Sessions**
- Create/join classrooms via a join code, teacher/student role separation
- Start, run, and end live class sessions
- Sessions auto-end for everyone if the host is disconnected for longer than a configurable inactivity timeout (default 20 minutes), and end immediately for everyone when the host ends the session

**Live Classroom**
- WebRTC audio/video calling (mic, camera, screen share) via Socket.IO signaling
- Real-time shared whiteboard (draw, erase, undo/redo, multi-page, per-student draw permission)
- Live chat with typing indicators and reactions
- Host controls: mute/kick a student, force camera off, screen share
- In-session live quiz launch with real-time answer reveal

**Quizzes**
- Build quizzes manually or import questions from Excel
- Launch quizzes live during a session, or open them for self-paced retakes
- Auto-graded results, per-student breakdown, export results to Excel

**Attendance**
- Automatic attendance tracking from session connect/disconnect events
- Teacher dashboard of per-student attendance across classrooms
- Student view of their own attendance history
- Export attendance to Excel

**Recordings**
- Upload and store recorded lectures per classroom
- Students can watch recordings on demand

**Analytics**
- Teacher analytics: engagement, attendance, session activity, quiz performance
- Student analytics: personal attendance, quiz scores, and participation over time

**Other**
- Class materials upload/sharing
- Account settings
- Session persisted login — a logged-in user is routed straight to the dashboard

## Live Deployed Link

[virtual-classroom-kbnc.vercel.app](https://virtual-classroom-kbnc.vercel.app/)

## Tech Stack

**Backend**
- Node.js, Express 5
- MongoDB with Mongoose
- Socket.IO for real-time signaling (WebRTC, whiteboard, chat, quiz, presence)
- JWT authentication, bcrypt password hashing
- Multer for file uploads (recordings, materials)
- Jest + mongodb-memory-server for testing

**Frontend**
- React 19 + Vite
- Redux Toolkit for state management
- React Router
- Tailwind CSS
- Recharts for analytics charts
- Socket.IO client, native WebRTC APIs
- xlsx / jsPDF for Excel and PDF export

## Project Structure

```
virtual-classroom/
├── backend/
│   ├── server.js                # HTTP + Socket.IO server entry point
│   └── src/
│       ├── app.js               # Express app & route mounting
│       ├── config/               # DB connection config
│       ├── middleware/          # Auth & role guards, upload handling
│       ├── sockets/              # Socket.IO wiring, room registry, session lifecycle
│       └── features/            # One folder per domain (routes + controller + model + service)
│           ├── auth/
│           ├── classroom/
│           ├── session/
│           ├── attendance/
│           ├── Quiz/
│           ├── chat/
│           ├── whiteboard/
│           ├── webrtc/
│           ├── recording/
│           ├── material/
│           ├── dashboard/
│           ├── analytics/
│           └── settings/
└── frontend/
    └── src/
        ├── routes/               # AppRouter, ProtectedRoute, PublicRoute, RoleRoute
        ├── layouts/              # AuthLayout, DashboardLayout
        ├── store/                # Redux store
        └── features/             # One folder per domain (pages, components, api)
            ├── auth/
            ├── classroom/        # Classroom, quiz, attendance, recordings pages
            ├── dashboard/        # Dashboard, live classroom, shared widgets
            ├── analytics/
            ├── settings/
            └── marketing/        # Public landing page
```

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- A MongoDB instance (local or hosted, e.g. MongoDB Atlas)

### Backend setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```
PORT=8000
MONGO_URI=<your MongoDB connection string>
JWT_SECRET=<a secret string for signing JWTs>
```

Run the server:

```bash
npm run dev    # nodemon, auto-restart on changes
npm start      # production
npm test       # run the Jest test suite
```

### Frontend setup

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/`:

```
VITE_API_URL=http://localhost:8000
VITE_SOCKET_URL=http://localhost:8000
```

Run the dev server:

```bash
npm run dev       # start Vite dev server
npm run build     # production build
npm run preview   # preview a production build
npm run lint      # run ESLint
```

By default the frontend runs on `http://localhost:5173` and expects the backend on `http://localhost:8000`.

## Roles

- **Teacher** — creates classrooms and sessions, hosts live classes, builds/launches quizzes, uploads recordings, views class-wide attendance and analytics.
- **Student** — joins classrooms and live sessions, takes quizzes, watches recordings, views their own attendance and analytics.

Role is set at registration and enforced both by frontend route guards (`RoleRoute`) and backend middleware (`role.middleware.js`).
