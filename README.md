# Kanban Pro

A Trello-like MERN project management tool with authentication, projects, boards, cards, drag-and-drop movement, team invitations, activity tracking, and Socket.io-powered live updates.

## Tech Stack

- Frontend: React, Vite, React DnD, Axios, Socket.io Client
- Backend: Node.js, Express, MongoDB, Mongoose, JWT
- Real-time: Socket.io

## Features

- Register and log in with JWT-based authentication
- Create projects with default workflow boards
- Rename and delete boards
- Create, edit, delete, and comment on task cards
- Assign tasks, track deadlines, and update statuses
- Reorder cards within a board and move them across boards with drag and drop
- Invite team members into projects with admin/member roles
- View project activity feed and progress metrics
- Receive board and card updates in real time through sockets

## Folder Structure

```text
MiniProj/
  backend/
    src/
      config/
      controllers/
      middleware/
      models/
      routes/
      services/
      socket/
      utils/
  frontend/
    src/
      api/
      components/
      context/
      hooks/
      layouts/
      pages/
      styles/
      utils/
```

## Setup

### 1. Backend

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Set these values in `backend/.env`:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/kanban-pro
JWT_SECRET=change_me
```

### 2. Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Set these values in `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## API Overview

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Projects and Boards

- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:projectId`
- `POST /api/projects/:projectId/invite`
- `POST /api/projects/:projectId/boards`
- `PATCH /api/projects/boards/:boardId`
- `DELETE /api/projects/boards/:boardId`

### Cards

- `POST /api/cards/boards/:boardId`
- `PATCH /api/cards/:cardId`
- `DELETE /api/cards/:cardId`
- `PATCH /api/cards/:cardId/move`
- `POST /api/cards/:cardId/comments`

### Activity

- `GET /api/activities/:projectId`

## Notes

- The backend emits `project:updated` to the project room whenever boards or cards change.
- The frontend uses Context API for state management and keeps the active project synchronized with the server.
- File attachments and persistent notifications are left as natural next-step enhancements.
