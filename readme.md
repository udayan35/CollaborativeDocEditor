# CollaborativeDocEditor

CollaborativeDocEditor is a full-stack collaborative document editor where users can create and edit documents together in real time. Built with the MERN stack, Quill, Socket.IO, and Yjs, it synchronizes concurrent edits and keeps collaborators in sync.

## Features

- **Real-time collaboration:** Create documents and edit them simultaneously with other users.
- **Conflict resolution:** Yjs synchronizes concurrent edits and persists document state.
- **Collaborator presence:** See who is currently active in a document.
- **Email verification:** Verify accounts using a link sent during registration.
- **Rich-text editing:** Write and format content with the Quill editor.

## Technologies

- MongoDB, Express.js, React, and Node.js (MERN)
- Socket.IO for real-time communication and collaborator presence
- Yjs for collaborative document synchronization
- Quill for rich-text editing

## Getting Started

### Prerequisites

- Node.js and npm
- A MongoDB connection string
- Email account credentials for sending verification emails

### Install

Clone the repository and install the backend and frontend dependencies:

```bash
git clone https://github.com/udayan35/CollaborativeDocEditor.git
cd CollaborativeDocEditor/src
npm install
cd client
npm install
```

### Configure environment variables

Create `src/.env`:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=8080
EMAIL=your_email_address
PASSWORD=your_email_app_password
BACKEND_URL=http://localhost:8080/api/v1
FRONTEND_URL=http://localhost:5173
```

Create `src/client/.env`:

```env
VITE_APP_BACKEND_URL=http://localhost:8080/api/v1
VITE_APP_SOCKET_URL=http://localhost:8080
```

Use an app password or provider-approved SMTP credentials for email. Keep these files private and do not commit secrets.

### Run locally

Start the backend in one terminal:

```bash
cd src
npm run dev
```

Start the frontend in a second terminal:

```bash
cd src/client
npm run dev
```

Open the local URL printed by Vite (usually http://localhost:5173), create an account, and start collaborating.

## Contributing

Contributions are welcome. See [contributing.md](contributing.md) for guidelines.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
