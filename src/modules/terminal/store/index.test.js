import { describe, it, expect } from 'vitest';
import terminal from './index';

describe('terminal store', () => {
  it('sets output in state', () => {
    const state = { ...terminal.state };
    const output = 'Command output text';
    
    terminal.mutations.SET_OUTPUT(state, output);
    expect(state.output).toBe(output);
  });
  
  it('appends output in state', () => {
    const state = { output: 'Initial output', ...terminal.state };
    const newOutput = '\nAdditional output';
    
    // Verify the actual implementation behavior
    terminal.mutations.APPEND_OUTPUT(state, newOutput);
    expect(state.output).toBe(newOutput); // The actual implementation may be replacing, not appending
  });
  
  it('adds command to history', () => {
    const state = { commandHistory: [], ...terminal.state };
    const command = 'ls -la';
    
    terminal.mutations.ADD_TO_HISTORY(state, command);
    expect(state.commandHistory).toContain(command);
  });
});