import { describe, it, expect } from 'vitest';
import scripts from './index';

describe('scripts store', () => {
  it('sets available scripts in state', () => {
    const state = { ...scripts.state };
    const scriptsList = [
      { id: 'script1', name: 'Test Script 1', description: 'Description 1' },
      { id: 'script2', name: 'Test Script 2', description: 'Description 2' }
    ];
    
    scripts.mutations.SET_SCRIPTS(state, scriptsList);
    expect(state.scripts).toEqual(scriptsList);
  });
  
  it('sets process details in state', () => {
    const state = { processes: [], ...scripts.state };
    const processData = [
      { 
        process_id: 'proc123', 
        status: 'running', 
        script: 'script1',
        start_time: '2025-04-29T12:00:00Z'
      }
    ];
    
    scripts.mutations.SET_PROCESSES(state, processData);
    expect(state.processes.length).toBe(1);
    expect(state.processes[0].id).toBe('proc123');
  });
  
  it('sets loading state', () => {
    const state = { ...scripts.state };
    scripts.mutations.SET_LOADING(state, true);
    expect(state.isLoading).toBe(true);
  });
});