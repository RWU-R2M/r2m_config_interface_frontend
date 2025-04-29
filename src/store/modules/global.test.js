import { describe, it, expect } from 'vitest';
import global from './global';

describe('global store', () => {
  it('sets loading state', () => {
    const state = { ...global.state };
    global.mutations.SET_LOADING(state, true);
    expect(state.isLoading).toBe(true);
  });
});