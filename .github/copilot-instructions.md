THE ONLY FOLDERS you are allowed to change in the backend are the scripts ones, all the other ones instead of changing you should ask me first, this is talking to you github copilot claude or chatgpt you shuold change the backend at all just the miniumun


# ROS Web Dashboard - Frontend Development Instructions

## Project Overview
Create a modular web dashboard for monitoring and controlling a ROS-based rover system running on a Raspberry Pi. The frontend will interface with the existing REST API endpoints documented in `/localbackend/API_DOCUMENTATION.md` to display system metrics, manage Docker containers, execute scripts, and provide basic infrastructure for future ROS integration via rosbridge.

## Technology Stack
- **Framework**: Vue.js 3 (Composition API) for modularity and maintainability
- **HTTP Client**: Axios for API communication
- **UI Framework**: Bulma CSS (lightweight and simple to implement)
- **Deployment**: Docker container with Nginx serving static files

## Core Requirements

### Dashboard Functionality

#### 1. System Monitoring
- Display real-time CPU, memory, disk usage metrics from `/api/system` endpoint
- Show Docker container status (running, stopped) from `/api/docker` endpoint  
- Visualize network interface statistics with simple graphs/indicators
- Display hardware status indicators for connected devices

#### 2. Command Execution
- Provide interface to execute system commands via `/api/execute` endpoint
- Include preset commands for common operations
- Display command output in a readable format
- Include emergency stop functionality

#### 3. Script Management
- List available custom scripts from `/api/scripts` endpoint
- Allow running scripts with required parameters
- Monitor running script processes via `/api/processes` endpoint
- Display script output and status when available

#### 4. Basic ROS Integration Foundation
- Create placeholder modules for future ROS integration
- Prepare WebSocket infrastructure for future rosbridge connection
- Design interfaces for displaying ROS node status and topic data

## Technical Requirements

### Modular Architecture
- Create a plugin-based architecture where each feature is a separate module
- Implement a module registry system for easy addition/removal of components
- Use a standardized API communication layer that all modules can leverage
- Ensure consistent error handling and loading states across modules

### User Interface
- Design a clean, functional interface optimized for desktop screens
- Implement periodic data refresh with configurable intervals (default: 2-5 seconds)
- Use clear visual indicators for status (green=running, red=stopped, yellow=warning)
- Include confirmation dialogs for critical actions like shutdown

### Reliability
- Implement proper error handling for API failures
- Include retry mechanisms for transient API errors
- Display meaningful error messages to users
- Cache recent data to handle brief disconnections

### Docker Deployment
- Create a complete Dockerfile for containerization
- Include multi-stage build for optimal image size
- Configure Nginx to serve the static files efficiently
- Ensure proper environment variable configuration
- Design for easy integration with the backend container

## Module System
Each dashboard module should:
1. Be a self-contained Vue component with its own state management
2. Handle its own API communication through a shared service
3. Register itself with the core application at runtime
4. Follow consistent UI patterns and behavior

## Core Modules to Implement

1. **System Status Module**
   - Display CPU, memory, disk metrics
   - Show visual indicators for usage levels
   - Include refresh controls
   
2. **Docker Container Module**
   - List running containers with status
   - Show container details on demand
   - Provide visual status indicators for each container
   
3. **Command Terminal Module**
   - Allow execution of whitelisted commands
   - Display command output in a terminal-like interface
   - Include command history functionality
   
4. **Script Management Module**
   - List available scripts from API
   - Provide form interface for script parameters
   - Display script execution status and results
   - Monitor asynchronous scripts
   
5. **Control Panel Module**
   - Include emergency stop functionality
   - Provide system reboot/shutdown options
   - Group critical system functions

## API Integration
- Use the endpoints documented in `/localbackend/API_DOCUMENTATION.md`
- Implement a service layer that handles all API communication
- Use proper error handling and retry logic
- Support both synchronous and asynchronous operations

## Testing Requirements
- Implement unit tests for all core functionality
- Include component tests for all modules
- Add integration tests for API communication
- Use mocking for API responses during testing
- Ensure at least 70% code coverage

## Configuration
- Make the dashboard configurable via:
  - Environment variables for API endpoints and global settings
  - User preferences stored in localStorage for individual settings
  - Runtime configuration options for modules

## Documentation Requirements
- Include clear developer documentation on the architecture and module system
- Document how to add new modules with examples
- Provide user documentation for dashboard features
- Include deployment and configuration instructions

## Deliverables
1. Complete Vue.js application with modular architecture
2. Dockerfile for containerization
3. Unit and integration tests
4. Complete documentation
5. Example modules implementing core functionality

## Development Approach
1. Start with the core framework and module system
2. Implement the API service layer
3. Create the basic UI components and layouts
4. Add the core modules one by one
5. Implement testing for each module
6. Create the Docker configuration
7. Document all functionality