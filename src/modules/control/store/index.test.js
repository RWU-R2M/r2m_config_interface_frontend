import { describe, it, expect } from 'vitest';
import control from './index';

describe('control store', () => {
  it('sets system status in state', () => {
    const state = { ...control.state };
    const status = { 
      status: 'operational',
      ready: true
    };
    
    control.mutations.SET_SYSTEM_STATUS(state, status);
    expect(state.systemStatus).toEqual(status);
  });
  
  it('sets performing action state', () => {
    const state = { ...control.state };
    control.mutations.SET_PERFORMING_ACTION(state, true);
    expect(state.isPerformingAction).toBe(true);
  });
  
  it('sets error state', () => {
    const state = { ...control.state };
    const error = { message: 'Test error' };
    control.mutations.SET_ERROR(state, error);
    expect(state.error).toEqual(error);
  });
});