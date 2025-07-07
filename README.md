# Todo App Workspace

This repository contains the frontend (material-todo-app) and backend for a Todo application.

## Prerequisites

- Docker
- Docker Compose

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd todo-app-workspace
    ```

2.  **Set up environment variables:**
    Copy the example environment file and customize it as needed:
    ```bash
    cp .env.example .env
    ```
    Review and update the variables in `.env`, especially `JWT_SECRET` and `SESSION_SECRET`.

3.  **Build and run the application using Docker Compose:**
    ```bash
    docker-compose up --build
    ```
    This command will:
    - Build the Docker images for the backend and frontend services if they don't exist or if the Dockerfiles have changed.
    - Start all services defined in `docker-compose.yml` (PostgreSQL, Redis, backend, frontend, pgAdmin, Redis Commander).

    You might need to run `docker-compose up --build -d` to run in detached mode.

4.  **Access the application:**
    -   **Frontend (Todo App):** [http://localhost](http://localhost) (or the port you configured for the frontend if different from 80)
    -   **Backend API:** [http://localhost:3001](http://localhost:3001) (or the `BACKEND_PORT` you configured)
    -   **pgAdmin (Database UI):** [http://localhost:8080](http://localhost:8080)
    -   **Redis Commander (Redis UI):** [http://localhost:8081](http://localhost:8081)

## Development

### Frontend (material-todo-app)

-   Located in the `material-todo-app/` directory.
-   Uses Vite, React, TypeScript, and Bun.
-   To run development server locally (outside Docker):
    ```bash
    cd material-todo-app
    bun install
    bun run dev
    ```

### Backend

-   Located in the `backend/` directory.
-   Uses Node.js, Fastify, TypeScript, PostgreSQL, and Redis.
-   To run development server locally (outside Docker):
    ```bash
    cd backend
    npm install
    npm run dev
    ```

## Available Scripts (Root)

-   `npm run frontend:dev`: Starts the frontend development server.
-   `npm run frontend:build`: Builds the frontend application.
-   `npm run backend:dev`: Starts the backend development server.
-   `npm run backend:build`: Builds the backend application.
-   `npm run dev`: Starts both frontend and backend development servers concurrently.

Refer to `package.json` in the root, `material-todo-app/package.json`, and `backend/package.json` for more scripts.

## Stopping the Application

-   If running in the foreground (without `-d`), press `Ctrl+C` in the terminal where `docker-compose up` is running.
-   If running in detached mode, use:
    ```bash
    docker-compose down
    ```
    To stop and remove containers, networks, and volumes (optional, add `-v` to remove volumes):
    ```bash
    docker-compose down -v
    ```

## Troubleshooting

-   Ensure Docker and Docker Compose are installed and running.
-   Check that the ports defined in `.env` and `docker-compose.yml` are not already in use on your system.
-   Review the logs from `docker-compose up` for any error messages.
-   If you encounter issues with database initialization, you might need to remove the `postgres_data` volume and restart:
    ```bash
    docker-compose down -v
    docker volume rm todo-app-workspace_postgres_data # Verify volume name with "docker volume ls"
    docker-compose up --build
    ```
