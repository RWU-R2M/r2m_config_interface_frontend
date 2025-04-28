# Command Terminal Module

Allows execution of whitelisted system commands and displays output.

## API Usage
- `POST /api/execute` to run a command

## State
- Output string
- Command history
- Preset commands
- Loading and error states

## UI
- Terminal-like output area
- Input for commands
- Preset command buttons
- Command history list

## Main Methods
- `executeCommand`: Runs a command via API
- `SET_OUTPUT`, `APPEND_OUTPUT`, `CLEAR_OUTPUT`: Manage output state

## Component
- `CommandTerminalModule.vue`
