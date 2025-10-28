# Video Processing App

This is a Node.js application for processing videos. It uses Express.js for the server, `bullmq` for queueing video processing jobs, and `ffmpeg` to process the videos.

## How it Works

1.  **Upload:** The user uploads a video file through the `/api/upload` endpoint.
2.  **Queue:** The video is added to a `video-queue` using `bullmq`.
3.  **Process:** A background worker picks up the job from the queue and processes the video using `ffmpeg`. The processing can include creating thumbnails, compressing the video, and changing the resolution.
4.  **Status:** The user can check the status of the video processing by using the `/api/status/:videoId` endpoint.

## Features

- Video upload with `multer`.
- Queue-based video processing with `bullmq`.
- Video processing with `ffmpeg` (thumbnail generation, compression, resolution change).
- Background worker to process videos without blocking the main thread.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Redis](https://redis.io/)
- [ffmpeg](https://ffmpeg.org/)

### Installation

1.  Clone the repo
    ```sh
    git clone https://github.com/tomarrohitt/video-processing-app.git
    ```
2.  Install NPM packages
    ```sh
    npm install
    ```
    or
    ```sh
    yarn install
    ```
3.  Make sure your Redis server is running.

## Usage

1.  **Start the server:**

    ```sh
    npm run dev
    ```

    This will start the Express server on port 4000.

2.  **Start the worker:**
    ```sh
    npm run worker
    ```
    This will start the background worker that processes the video jobs.

## Project Structure

```
/video-processing-app/

├───.git/...
├───node_modules/...
└───src/
    ├───config/
    │   └───index.ts
    ├───controller/
    │   └───video-controller.ts
    ├───middlewares/
    │   ├───upload-middleware.ts
    │   └───upload.ts
    ├───queues/
    │   ├───queue-event.ts
    │   └───video-queue.ts
    ├───routes/
    │   └───video-route.ts
    ├───services/
    │   ├───ffmpeg-service.ts
    │   └───video-service.ts
    ├───types/
    │   ├───express.d.ts
    │   └───index.ts
    └───workers/
        └───video-worker.ts
├───.gitignore
├───index.ts
├───package.json
├───README.md
├───tsconfig.json
```

- **`config`**: Configuration files.
- **`controller`**: Express controllers that handle incoming requests.
- **`middlewares`**: Custom middlewares for Express.
- **`queues`**: `bullmq` queue definitions.
- **`routes`**: Express routes.
- **`services`**: Business logic and services (e.g., `ffmpeg` wrapper).
- **`types`**: TypeScript type definitions.
- **`workers`**: Background workers that process queue jobs.

## API Endpoints

### `POST /api/upload`

Uploads a video for processing.

- **Request:** `multipart/form-data` with a `video` field containing the video file.
- **Response:**
  - `202 Accepted`: If the video is successfully uploaded and added to the queue.
  - `400 Bad Request`: If no file is uploaded or if the file is invalid.
  - `500 Internal Server Error`: If there is a server error.

### `GET /api/stats`

Gets the status of a video processing jobs in queue.

- **Response:**
  - `200 OK`: Returns the status of the video.
