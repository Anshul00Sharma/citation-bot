# Citation Bot Backend - API Documentation

This document describes the structure and payloads for all API endpoints to make frontend integration simple.

All endpoints are hosted at: `http://localhost:8000` (or your deployed cloud URL).

---

## 1. User Handshake
Initiates a user session. If the user doesn't exist, it creates a new record. If they do, it returns their existing data.

- **Endpoint:** `POST /api/users/handshake`
- **Headers:** `Content-Type: application/json`

**Request Body:**
```json
{
  "session_id": "unique-uuid-or-session-string"
}
```

**Response (200 OK):**
```json
{
  "session_id": "unique-uuid-or-session-string",
  "created_at": "2026-03-20T12:00:00.000000Z",
  "name": null,
  "file_id": null,
  "chat_room_id": null
}
```

---

## 2. Get User by Session (GET Handshake)
Retrieves all stored user data for a given session ID.

- **Endpoint:** `GET /api/users/handshake`
- **Query Parameters:**
  - `session_id` (string, required): The user's session ID.

**Request Body:** None

**Response (200 OK):**
```json
{
  "session_id": "unique-uuid-or-session-string",
  "created_at": "2026-03-20T12:00:00.000000Z",
  "name": null,
  "file_id": null,
  "chat_room_id": null
}
```

**Error Response (404 Not Found):**
```json
{
  "detail": "User with session_id 'unknown-id' not found"
}
```

---

## 3. Upload File Data
Uploads file data (an array of strings representing pages/chunks) and associates it with the user's session.

- **Endpoint:** `POST /api/files/`
- **Query Parameters:**
  - `session_id` (string, required): The user's active session ID.
  - `file_id` (string, required): The unique identifier for this file upload.
- **Headers:** `Content-Type: application/json`

**Request Body:**
```json
{
  "data": [
    "This is the first page or chunk of the file.",
    "This is the second page or chunk of the file."
  ]
}
```

**Response (201 Created):**
```json
{
  "message": "File data uploaded successfully"
}
```

---

## 4. Retrieve File Data
Fetches the previously uploaded file data as an ordered array of strings.

- **Endpoint:** `GET /api/files/`
- **Query Parameters:**
  - `session_id` (string, required)
  - `file_id` (string, required)

**Request Body:** None

**Response (200 OK):**
```json
{
  "session_id": "unique-uuid-or-session-string",
  "file_id": "file-123456",
  "data": [
    "This is the first page or chunk of the file.",
    "This is the second page or chunk of the file."
  ]
}
```

---

## 5. Send Chat Message (Gemini AI)
Sends a message from the user to the Gemini AI and returns the AI's response.

- **Endpoint:** `POST /api/chats/`
- **Headers:** `Content-Type: application/json`

**Request Body:**
```json
{
  "session_id": "unique-uuid-or-session-string",
  "message": "Hello, what is in the document?"
}
```

**Response (201 Created):**
*(The response object is the AI's reply)*
```json
{
  "session_id": "unique-uuid-or-session-string",
  "sender": "ai",
  "message": "Based on the document, here is the information...",
  "created_at": "2026-03-20T12:05:00.000000Z"
}
```

---

## 6. Get Chat History
Fetches the entire chronological string of messages (both `user` and `ai`) for a given session.

- **Endpoint:** `GET /api/chats/`
- **Query Parameters:**
  - `session_id` (string, required)

**Request Body:** None

**Response (200 OK):**
```json
[
  {
    "session_id": "unique-uuid-or-session-string",
    "sender": "user",
    "message": "Hello, what is in the document?",
    "created_at": "2026-03-20T12:04:55.000000Z"
  },
  {
    "session_id": "unique-uuid-or-session-string",
    "sender": "ai",
    "message": "Based on the document, here is the information...",
    "created_at": "2026-03-20T12:05:00.000000Z"
  }
]
```
