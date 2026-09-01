# QuickChat

A real-time full-stack chat application built with React, Node.js, Socket.IO, and MongoDB.

**Live Demo:** [quick-chat-by-naeem.vercel.app](https://quick-chat-by-naeem.vercel.app)

---

## Features

- Real-time messaging with Socket.IO
- Live typing indicators
- Online/offline presence
- Image sharing with Cloudinary
- Read receipts (single ✓ / double ✓✓)
- Multi-step signup with password strength validation (Yup)
- JWT authentication with auto session refresh
- Shared media gallery per conversation
- Delete conversations
- Responsive — works on mobile and desktop
- CI/CD pipeline via GitHub Actions → Vercel

---

## Tech Stack

**Frontend**
- React 19 + Vite 7
- Tailwind CSS v4
- Socket.IO Client
- Axios
- React Router v7
- Yup (form validation)
- React Hot Toast

**Backend**
- Node.js + Express 5
- Socket.IO
- MongoDB + Mongoose
- Cloudinary (image storage)
- JWT + bcryptjs (auth)
- Helmet + Compression + Morgan

**Infrastructure**
- Vercel (frontend + backend hosting)
- GitHub Actions (CI/CD)

---

## Project Structure

```
Chat-App/
├── client/               # React frontend (Vite)
│   ├── src/
│   │   ├── api/          # Axios API modules
│   │   ├── components/   # UI components
│   │   ├── context/      # Auth + Chat context providers
│   │   ├── hooks/        # Custom hooks
│   │   ├── pages/        # Route pages
│   │   └── lib/          # Utility functions
│   └── vercel.json
│
├── server/               # Node.js backend
│   ├── controllers/      # Route handlers
│   ├── middleware/        # Auth, error handler
│   ├── models/           # Mongoose schemas
│   ├── routes/           # Express routers
│   ├── config/           # DB + Cloudinary config
│   └── server.js         # Entry point
│
└── .github/workflows/    # CI/CD pipeline
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB Atlas account
- Cloudinary account

### 1. Clone the repo

```bash
git clone https://github.com/Naeemsajjad066/Chat-App.git
cd Chat-App
```

### 2. Set up the server

```bash
cd server
npm install
```

Create `server/.env`:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:5173
```

```bash
npm run dev
```

### 3. Set up the client

```bash
cd client
npm install
```

Create `client/.env`:

```env
VITE_BACKEND_URL=http://localhost:5000
```

```bash
npm run dev
```

App runs at `http://localhost:5173`

---

## Environment Variables

### Server (`server/.env`)

| Variable | Description |
|---|---|
| `PORT` | Server port (default `5000`) |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `CLIENT_URL` | Frontend URL for CORS |

### Client (`client/.env`)

| Variable | Description |
|---|---|
| `VITE_BACKEND_URL` | Backend API base URL |

---

## API Endpoints

### Auth — `/api/auth`

| Method | Path | Description |
|---|---|---|
| POST | `/register` | Create account |
| POST | `/login` | Sign in, returns JWT |
| GET | `/check` | Verify token, return user |
| PUT | `/update-profile` | Update name/avatar/bio |
| DELETE | `/delete` | Delete account |

### Messages — `/api/messages`

| Method | Path | Description |
|---|---|---|
| GET | `/user` | Get all users + unseen counts |
| GET | `/:id` | Get messages with a user |
| POST | `/send/:id` | Send text or image message |
| PUT | `/mark/:id` | Mark message as seen |
| DELETE | `/delete/:id` | Delete conversation |

---

## Socket Events

| Event | Direction | Description |
|---|---|---|
| `newMessage` | Server → Client | New message received |
| `messagesSeen` | Server → Client | Messages marked as seen |
| `lastMessageUpdate` | Server → Client | Sidebar preview update |
| `messagesDeleted` | Server → Client | Conversation deleted |
| `getOnlineUsers` | Server → Client | Online users list |
| `userTyping` | Server → Client | Typing indicator start |
| `userStopTyping` | Server → Client | Typing indicator stop |
| `openChat` | Client → Server | User opened a conversation |
| `closeChat` | Client → Server | User closed a conversation |
| `typing` | Client → Server | User is typing |
| `stopTyping` | Client → Server | User stopped typing |

---

## CI/CD Pipeline

Every push to `main` triggers the GitHub Actions pipeline:

```
Push to main
    │
    ├── CI (all branches)
    │   ├── Client: install → build → lint
    │   └── Server: install → eslint → node --check
    │
    └── Deploy (main only, after CI passes)
        ├── Deploy client → Vercel (chat-app)
        └── Deploy server → Vercel (chat-app-backend)
```

### Required GitHub Secrets

| Secret | Description |
|---|---|
| `VERCEL_TOKEN` | Vercel personal access token |
| `VITE_BACKEND_URL` | Deployed backend URL |

---

## Scripts

### Client

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # Run ESLint
npm run preview   # Preview production build
```

### Server

```bash
npm run dev       # Start with --watch (auto-restart)
npm start         # Production start
npm run lint      # ESLint + syntax check
```

---

## License

MIT
