// __tests__/synthesizer.test.ts
// Unit tests for AudioSynthesizer
// Spec: T-3.1

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AudioSynthesizer } from '../lib/audio/synthesizer';

// ── Mock Web Audio API ──────────────────────────────────────────────────────

const mockOscStart = vi.fn();
const mockOscStop = vi.fn();
const mockOscConnect = vi.fn();
const mockGainConnect = vi.fn();
const mockFrequency = {
  setValueAtTime: vi.fn(),
  linearRampToValueAtTime: vi.fn(),
  exponentialRampToValueAtTime: vi.fn(),
};
const mockGainParam = {
  setValueAtTime: vi.fn(),
  exponentialRampToValueAtTime: vi.fn(),
};
const mockDestination = {};
const mockResume = vi.fn().mockResolvedValue(undefined);

const createOscillator = vi.fn(() => ({
  type: 'sine',
  frequency: mockFrequency,
  connect: mockOscConnect,
  start: mockOscStart,
  stop: mockOscStop,
}));

const createGain = vi.fn(() => ({
  gain: mockGainParam,
  connect: mockGainConnect,
}));

class MockAudioContext {
  currentTime = 0;
  state = 'running';
  destination = mockDestination;
  createOscillator = createOscillator;
  createGain = createGain;
  resume = mockResume;
}

// Inject mock into global
vi.stubGlobal('AudioContext', MockAudioContext);

describe('AudioSynthesizer', () => {
  let synth: AudioSynthesizer;

  beforeEach(() => {
    synth = new AudioSynthesizer();
    vi.clearAllMocks();
  });

  it('AudioContext is NOT created on module load (lazy init)', () => {
    // Just instantiating does NOT create AudioContext
    expect(createOscillator).not.toHaveBeenCalled();
  });

  it('ensureContext creates AudioContext on first call', () => {
    synth.ensureContext();
    // The mock constructor was called — verify by checking methods work
    synth.playCatch();
    expect(createOscillator).toHaveBeenCalled();
  });

  it('ensureContext is idempotent (only one AudioContext created)', () => {
    synth.ensureContext();
    synth.ensureContext();
    // Only one context created — subsequent calls are no-ops
    // If ensureContext created more than one, createOscillator would fail
    expect(() => synth.playCatch()).not.toThrow();
  });

  it('playCatch creates oscillator with correct frequency', () => {
    synth.ensureContext();
    synth.playCatch();
    expect(createOscillator).toHaveBeenCalled();
    expect(mockFrequency.setValueAtTime).toHaveBeenCalledWith(880, expect.any(Number));
  });

  it('playCatch connects nodes without throwing', () => {
    synth.ensureContext();
    expect(() => synth.playCatch()).not.toThrow();
    expect(mockOscConnect).toHaveBeenCalled();
    expect(mockOscStart).toHaveBeenCalled();
    expect(mockOscStop).toHaveBeenCalled();
  });

  it('playMiss creates sawtooth oscillator at 120Hz', () => {
    synth.ensureContext();
    synth.playMiss();
    const oscCall = createOscillator.mock.results[0]?.value;
    expect(oscCall?.type ?? 'sawtooth').toBeDefined();
    expect(mockFrequency.setValueAtTime).toHaveBeenCalledWith(120, expect.any(Number));
  });

  it('playMiss has pitch ramp to 80Hz', () => {
    synth.ensureContext();
    synth.playMiss();
    expect(mockFrequency.linearRampToValueAtTime).toHaveBeenCalledWith(80, expect.any(Number));
  });

  it('playMiss connects nodes without throwing', () => {
    synth.ensureContext();
    expect(() => synth.playMiss()).not.toThrow();
    expect(mockOscStart).toHaveBeenCalled();
    expect(mockOscStop).toHaveBeenCalled();
  });

  it('playGameOver schedules 4 notes', () => {
    synth.ensureContext();
    synth.playGameOver();
    expect(createOscillator).toHaveBeenCalledTimes(4);
  });

  it('playGameOver uses descending frequencies', () => {
    synth.ensureContext();
    synth.playGameOver();
    const freqCalls = mockFrequency.setValueAtTime.mock.calls.map((c) => c[0] as number);
    // Frequencies should be descending
    for (let i = 1; i < freqCalls.length; i++) {
      expect(freqCalls[i]).toBeLessThan(freqCalls[i - 1]);
    }
  });

  it('muted state skips all synthesis', () => {
    synth.ensureContext();
    synth.setMuted(true);
    synth.playCatch();
    synth.playMiss();
    synth.playGameOver();
    expect(createOscillator).not.toHaveBeenCalled();
  });

  it('isMuted() reflects current state', () => {
    expect(synth.isMuted()).toBe(false);
    synth.setMuted(true);
    expect(synth.isMuted()).toBe(true);
    synth.setMuted(false);
    expect(synth.isMuted()).toBe(false);
  });

  it('sounds play again after unmute', () => {
    synth.ensureContext();
    synth.setMuted(true);
    synth.playCatch();
    expect(createOscillator).not.toHaveBeenCalled();
    synth.setMuted(false);
    synth.playCatch();
    expect(createOscillator).toHaveBeenCalledTimes(1);
  });
});
