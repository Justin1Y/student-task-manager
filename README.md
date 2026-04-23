# Student Task Manager

Student Task Manager is a small task-tracking app with:

- a static frontend built with HTML, CSS, and vanilla JavaScript
- a Node.js + Express backend
- MongoDB Atlas for persistence
- JWT-based authentication
- tenant isolation for task data

## Features

- Account login
- Self-service registration
- Task create, read, update, and delete
- Dashboard summary
- Calendar view
- Backend API tests

## Project Structure

```text
student-task-manager/
  css/
  js/
  login.html
  register.html
  index.html
  tasks.html
  calendar.html
  settings.html
  server/
```

## Frontend

The frontend is served as static files.

Example:

```bash
cd /Users/tzh/Projects/student-task-manager
python3 -m http.server 4173 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:4173/login.html
```

## Backend

Install dependencies:

```bash
cd /Users/tzh/Projects/student-task-manager/server
npm install
```

Create a local env file:

```bash
cp .env.example .env
```

Required values in `server/.env`:

```env
PORT=5001
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_long_random_secret
CLIENT_ORIGIN=http://127.0.0.1:4173
```

Start the backend:

```bash
cd /Users/tzh/Projects/student-task-manager/server
npm run dev
```

Health check:

```text
http://127.0.0.1:5001/api/health
```

## Registration Flow

This project uses the simple multi-tenant flow:

- a new user registers from the frontend
- registration creates a new tenant
- the first user becomes that tenant's first account
- all task queries are scoped to the authenticated tenant

## Tests

Backend integration tests run against an in-memory MongoDB instance, not your Atlas database.

Run tests:

```bash
cd /Users/tzh/Projects/student-task-manager/server
npm test
```

## Notes

- Frontend default port: `4173`
- Backend default port: `5001`
- The backend expects MongoDB Atlas access to allow your current IP
