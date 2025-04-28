# ROS Web Dashboard Frontend

A modular web dashboard for monitoring and controlling a ROS-based rover system running on a Raspberry Pi.

## Features

- **System Monitoring**: Real-time CPU, memory, disk, and network statistics
- **Docker Container Management**: View and control Docker containers (start/stop/restart)
- **Command Terminal**: Execute whitelisted system commands with output and history
- **Script Management**: List, execute, and monitor custom scripts (sync/async)
- **Control Panel**: Emergency stop, reboot, and shutdown options
- **Modular Architecture**: Each feature is a self-contained module
- **Responsive UI**: Optimized for desktop and tablet

## Architecture

- **Vue.js 3** (Composition API)
- **Vuex 4** for state management
- **Vue Router 4** for navigation
- **Axios** for API communication
- **Bulma CSS** for styling
- **Chart.js** for data visualization
- **Docker & Nginx** for deployment

### Directory Structure

```
frontend/
  ├── src/
  │   ├── modules/         # Dashboard modules (system, docker, terminal, scripts, control)
  │   ├── components/      # Shared Vue components
  │   ├── services/        # API service layer
  │   ├── store/           # Vuex store modules
  │   ├── router/          # Vue Router config
  │   ├── views/           # Page components
  │   └── ...
  ├── public/              # Static assets
  ├── Dockerfile           # Docker configuration
  ├── nginx.conf           # Nginx configuration
  └── ...
```

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation
```bash
npm install
npm run dev
```

### Build for Production
```bash
npm run build
```

### Run Tests
```bash
npm run test
```

## Configuration
- Environment variables in `.env` or via `VITE_` prefix (see below)
- User preferences stored in localStorage

### Key Environment Variables
- `VITE_API_BASE_URL`: Backend API URL (default: http://localhost:5000)
- `VITE_API_TIMEOUT`: API request timeout (ms, default: 15000)
- `VITE_REFRESH_INTERVAL`: Dashboard auto-refresh interval (ms, default: 5000)
- `VITE_DASHBOARD_TITLE`: Dashboard title

## Module System
Each dashboard feature is a module:
- Self-contained Vue component(s)
- Own Vuex store module
- Registers itself at runtime
- Handles its own API communication

See `src/modules/register.js` for module registration logic.

## API Integration
- All API calls are handled via `src/services/api.service.js`
- Endpoints are documented in `/localbackend/API_DOCUMENTATION.md`
- Supports error handling, retries, and both sync/async operations

## Testing
- Unit tests for stores and components
- Integration tests for API communication
- Mocking for API responses
- Run with `npm run test`

## Docker Deployment
```bash
docker build -t ros-web-dashboard-frontend .
docker run -p 80:80 ros-web-dashboard-frontend
```

## Documentation
- See `docs/` for detailed guides on modules, API, UI/UX, and contribution.
- Each module has its own `README.md`.

## License
MIT