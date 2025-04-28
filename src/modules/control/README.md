# Control Panel Module

Provides critical system controls: emergency stop, reboot, shutdown, etc.

## API Usage
- Uses command execution or custom endpoints for actions

## State
- Performing action state
- Last action performed
- Error and confirmation states
- System status

## UI
- Emergency stop button
- Reboot/shutdown controls
- Confirmation dialogs
- Status indicators

## Main Methods
- `performAction`: Executes a control action
- `setConfirmingAction`: Handles confirmation dialogs
- `fetchData`: Loads system status

## Component
- `ControlPanelModule.vue`
