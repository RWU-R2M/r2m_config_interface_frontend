# Script Management Module

Lists, executes, and monitors custom scripts (sync and async).

## API Usage
- `GET /api/scripts` for available scripts
- `POST /api/scripts/<script_name>` to execute
- `GET /api/processes` for running/completed scripts
- `GET /api/processes/<process_id>` for status

## State
- List of scripts
- List of processes
- Selected script
- Script output
- Loading, executing, and error states

## UI
- Script list with descriptions
- Parameter form for scripts
- Output/status display
- Process monitoring for async scripts

## Main Methods
- `fetchData`: Loads scripts and processes
- `executeScript`: Runs a script
- `fetchProcessStatus`: Monitors async script

## Component
- `ScriptManagementModule.vue`
