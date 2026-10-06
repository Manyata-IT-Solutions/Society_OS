import { isValidStatusTransition, ALLOWED_STATUS_TRANSITIONS } from './status-machine.js';

describe('Status State Machine', () => {
  it('allows ACTIVE -> SUSPENDED and ACTIVE -> ARCHIVED', () => {
    expect(isValidStatusTransition('ACTIVE', 'SUSPENDED')).toBe(true);
    expect(isValidStatusTransition('ACTIVE', 'ARCHIVED')).toBe(true);
    expect(isValidStatusTransition('ACTIVE', 'ACTIVE')).toBe(true);
  });

  it('allows SUSPENDED -> ACTIVE and SUSPENDED -> ARCHIVED', () => {
    expect(isValidStatusTransition('SUSPENDED', 'ACTIVE')).toBe(true);
    expect(isValidStatusTransition('SUSPENDED', 'ARCHIVED')).toBe(true);
    expect(isValidStatusTransition('SUSPENDED', 'SUSPENDED')).toBe(true);
  });

  it('prohibits ARCHIVED from transitioning to ACTIVE or SUSPENDED (Terminal State)', () => {
    expect(isValidStatusTransition('ARCHIVED', 'ACTIVE')).toBe(false);
    expect(isValidStatusTransition('ARCHIVED', 'SUSPENDED')).toBe(false);
    expect(isValidStatusTransition('ARCHIVED', 'ARCHIVED')).toBe(true);
  });

  it('has strict transition sets defined', () => {
    expect(ALLOWED_STATUS_TRANSITIONS.ARCHIVED.size).toBe(1);
    expect(ALLOWED_STATUS_TRANSITIONS.ACTIVE.size).toBe(3);
    expect(ALLOWED_STATUS_TRANSITIONS.SUSPENDED.size).toBe(3);
  });
});
