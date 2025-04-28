# Docker Container Module

Displays and manages Docker containers on the host system.

## API Usage
- `GET /api/docker` for container list
- `POST /api/docker/start`, `/stop`, `/restart` for actions (if implemented)

## State
- List of containers (ID, name, image, status, etc.)
- Selected container
- Loading and error states

## UI
- Table/list of containers
- Status indicators (running/stopped)
- Start/stop/restart buttons
- Container details view

## Main Methods
- `fetchData`: Loads container info from API
- `startContainer`, `stopContainer`, `restartContainer`: Control actions

## Component
- `DockerContainerModule.vue`
