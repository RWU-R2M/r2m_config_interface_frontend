import { describe, it, expect } from 'vitest';
import scripts from './index';

describe('scripts store', () => {
  it('sets available scripts in state', () => {
    const state = { ...scripts.state };
    const scriptsList = [
      { id: 'script1', name: 'Test Script 1', description: 'Description 1', script_path: 'examples/script1.py' },
      { id: 'script2', name: 'Test Script 2', description: 'Description 2', script_path: 'production/script2.sh' }
    ];
    
    scripts.mutations.SET_SCRIPTS(state, scriptsList);
    expect(state.scripts).toEqual(scriptsList);
    expect(state.scripts[0].script_path).toBe('examples/script1.py'); // Verify script_path is stored
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

  it('sets error state', () => {
    const state = { ...scripts.state };
    const error = { message: 'Test error' };
    scripts.mutations.SET_ERROR(state, error);
    expect(state.error).toEqual(error);
  });

  it('sets executing state', () => {
    const state = { ...scripts.state };
    scripts.mutations.SET_EXECUTING(state, true);
    expect(state.isExecuting).toBe(true);
  });

  it('sets selected script', () => {
    const state = { ...scripts.state };
    const script = { id: 'script1', name: 'Test Script 1' };
    scripts.mutations.SET_SELECTED_SCRIPT(state, script);
    expect(state.selectedScript).toEqual(script);
  });

  it('clears script output', () => {
    const state = { scriptOutput: 'some output', ...scripts.state };
    scripts.mutations.CLEAR_SCRIPT_OUTPUT(state);
    expect(state.scriptOutput).toBe('');
  });

  it('sets script output', () => {
    const state = { ...scripts.state };
    const output = 'new output';
    scripts.mutations.SET_SCRIPT_OUTPUT(state, output);
    expect(state.scriptOutput).toBe(output);
  });

  it('appends script output in state', () => {
    const state = { ...scripts.state, scriptOutput: 'initial' };
    const output = ' appended';
    
    scripts.mutations.APPEND_SCRIPT_OUTPUT(state, output);
    expect(state.scriptOutput).toBe('initial appended');
  });

  it('appends script output with newline', () => {
    // Fix the problem by putting scriptOutput first in state and using raw string
    const state = { scriptOutput: 'Initial output' };
    const newOutput = '\nAdditional output';
    
    scripts.mutations.APPEND_SCRIPT_OUTPUT(state, newOutput);
    expect(state.scriptOutput).toBe('Initial output\nAdditional output');
  });

  it('sets last process ID', () => {
    const state = { ...scripts.state };
    const processId = 'proc-xyz';
    scripts.mutations.SET_LAST_PROCESS_ID(state, processId);
    expect(state.lastProcessId).toBe(processId);
  });

  it('sets last run result', () => {
    const state = { ...scripts.state };
    const result = { success: true, output: 'done' };
    scripts.mutations.SET_LAST_RUN_RESULT(state, result);
    expect(state.lastRunResult).toEqual(result);
  });
});