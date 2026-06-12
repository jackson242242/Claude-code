/**
 * audio.ts — unit tests for the procedural ambient audio engine.
 * Uses a full AudioContext mock so no real Web Audio is needed in jsdom.
 */

// --------------------------------------------------------------------------
// AudioContext mock — set up BEFORE importing the module under test.
// --------------------------------------------------------------------------

const mockResume = jest.fn().mockResolvedValue(undefined);
const mockSuspend = jest.fn().mockResolvedValue(undefined);
const mockConnect = jest.fn();
const mockStart = jest.fn();
const mockStop = jest.fn();
const mockDisconnect = jest.fn();

const makeOscillator = () => ({
  type: 'sine' as OscillatorType,
  frequency: { setValueAtTime: jest.fn(), linearRampToValueAtTime: jest.fn() },
  detune: { setValueAtTime: jest.fn() },
  connect: mockConnect,
  start: mockStart,
  stop: mockStop,
  disconnect: mockDisconnect,
});

const makeGain = () => ({
  gain: { setValueAtTime: jest.fn() },
  connect: mockConnect,
  disconnect: mockDisconnect,
});

const makeFilter = () => ({
  type: 'lowpass' as BiquadFilterType,
  frequency: { setValueAtTime: jest.fn(), linearRampToValueAtTime: jest.fn() },
  connect: mockConnect,
  disconnect: mockDisconnect,
});

// Track state for ctx.state
let ctxState: AudioContextState = 'suspended';

const mockCreateOscillator = jest.fn(() => makeOscillator());
const mockCreateGain = jest.fn(() => makeGain());
const mockCreateBiquadFilter = jest.fn(() => makeFilter());

const MockAudioContext = jest.fn().mockImplementation(() => ({
  get state() { return ctxState; },
  currentTime: 0,
  destination: {},
  resume: jest.fn().mockImplementation(() => {
    ctxState = 'running';
    return mockResume();
  }),
  suspend: jest.fn().mockImplementation(() => {
    ctxState = 'suspended';
    return mockSuspend();
  }),
  createOscillator: mockCreateOscillator,
  createGain: mockCreateGain,
  createBiquadFilter: mockCreateBiquadFilter,
}));

// Install mock globally before anything imports the audio module.
Object.defineProperty(globalThis, 'AudioContext', {
  writable: true,
  configurable: true,
  value: MockAudioContext,
});

// --------------------------------------------------------------------------
// Now import the module under test (after the mock is installed).
// Use jest.isolateModules to get a fresh singleton for each test.
// --------------------------------------------------------------------------

describe('audio module', () => {
  let audio: typeof import('@/lib/audio').audio;

  beforeEach(() => {
    // Reset mock call counts
    MockAudioContext.mockClear();
    mockCreateOscillator.mockClear();
    mockCreateGain.mockClear();
    mockCreateBiquadFilter.mockClear();
    mockStart.mockClear();
    mockResume.mockClear();
    mockSuspend.mockClear();

    // Reset context state
    ctxState = 'suspended';

    // Clear localStorage
    window.localStorage.clear();

    // Reload the module to get a fresh singleton (engine = null).
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      audio = require('@/lib/audio').audio as typeof import('@/lib/audio').audio;
    });
  });

  it('audio.start() creates AudioContext on first call', () => {
    audio.start();
    expect(MockAudioContext).toHaveBeenCalledTimes(1);
  });

  it('audio.start() is idempotent — called twice, only one AudioContext', () => {
    audio.start();
    audio.start();
    expect(MockAudioContext).toHaveBeenCalledTimes(1);
  });

  it('audio.start() sets up oscillators and filter', () => {
    audio.start();
    // At least one oscillator and filter created
    expect(mockCreateOscillator).toHaveBeenCalled();
    expect(mockCreateBiquadFilter).toHaveBeenCalled();
  });

  it('audio.isPlaying() returns true after start() when pref is on', () => {
    window.localStorage.setItem('skyempire.audio', 'on');
    audio.start();
    // After start with pref=on, ctx.state was set to 'running' via resume
    // The mock context starts suspended; start() calls resume() when pref=on
    // We simulate running state:
    ctxState = 'running';
    expect(audio.isPlaying()).toBe(true);
  });

  it('audio.isPlaying() returns false before start()', () => {
    expect(audio.isPlaying()).toBe(false);
  });

  it('audio.toggle() creates context when called before start()', () => {
    audio.toggle();
    expect(MockAudioContext).toHaveBeenCalledTimes(1);
  });

  it('audio.toggle() suspends when context is running', () => {
    audio.start();
    ctxState = 'running'; // Simulate running state
    audio.toggle();
    // Should suspend
    expect(window.localStorage.getItem('skyempire.audio')).toBe('off');
  });

  it('audio.toggle() resumes when context is suspended', () => {
    window.localStorage.setItem('skyempire.audio', 'off');
    audio.start();
    ctxState = 'suspended';
    audio.toggle(); // flip to on
    expect(window.localStorage.getItem('skyempire.audio')).toBe('on');
  });

  it('persists preference to localStorage on toggle', () => {
    audio.start();
    ctxState = 'running';
    audio.toggle(); // running → off
    expect(window.localStorage.getItem('skyempire.audio')).toBe('off');
    audio.toggle(); // off → on
    expect(window.localStorage.getItem('skyempire.audio')).toBe('on');
  });

  it('audio.start() reads "off" preference and suspends context', () => {
    window.localStorage.setItem('skyempire.audio', 'off');
    audio.start();
    // With pref=off, after start() the context should be suspended
    expect(ctxState).toBe('suspended');
  });

  it('audio.stop() sets engine to null (isPlaying returns false)', () => {
    audio.start();
    ctxState = 'running';
    expect(audio.isPlaying()).toBe(true);
    audio.stop();
    expect(audio.isPlaying()).toBe(false);
  });

  it('audio.stop() calls suspend on the context', () => {
    audio.start();
    // Grab the mock ctx suspend fn
    const ctxInstance = MockAudioContext.mock.results[0]?.value as { suspend: jest.Mock } | undefined;
    audio.stop();
    expect(ctxInstance?.suspend).toHaveBeenCalled();
  });
});
