# System Status Module

Displays real-time system metrics: CPU, memory, disk, and network statistics.

## API Usage
- `GET /api/system` for all stats

## State
- CPU usage, temperature, per-core stats
- Memory total/used/free/percent
- Disk total/used/free/percent
- Network interfaces, bytes sent/received
- Loading and error states

## UI
- Usage bars and indicators
- Network stats table
- Refresh button and auto-refresh

## Main Methods
- `fetchData`: Loads system stats from API
- `SET_SYSTEM_DATA`: Maps API response to state
- `SET_NETWORK_DATA`: Maps network data

## Component
- `SystemStatusModule.vue`
