/**
 * Sleep Detection Algorithm
 *
 * Monitors accelerometer data to classify sleep states:
 * - DEEP: Very low movement variance (user in deep sleep / phone still)
 * - LIGHT: Moderate movement (restless / transitioning — ideal wake window)
 * - AWAKE: High movement (user already moving around)
 *
 * Uses 30-second epochs of acceleration magnitude samples.
 */

export type SleepState = 'deep' | 'light' | 'awake' | 'unknown';

export interface EpochResult {
  variance: number;
  avgMagnitude: number;
  state: SleepState;
  sampleCount: number;
}

// Thresholds tuned for phone-on-bed accelerometer readings
const DEEP_THRESHOLD = 0.015;    // Very still
const LIGHT_THRESHOLD = 0.08;    // Restless movement
const AWAKE_THRESHOLD = 0.3;     // Active movement
const EPOCH_DURATION_MS = 30000; // 30 seconds
const SAMPLES_PER_EPOCH = 300;   // 10Hz × 30s

export class SleepEpochTracker {
  private samples: number[] = [];
  private epochStartTime: number = Date.now();
  private lightSleepCount: number = 0;
  private totalEpochs: number = 0;

  /** Add a raw accelerometer sample (x, y, z in m/s²) */
  addSample(x: number, y: number, z: number): void {
    // Compute magnitude (subtract ~9.81 gravity to get movement-only)
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    // Deviation from resting (gravity ≈ 9.81)
    const deviation = Math.abs(magnitude - 9.81);
    this.samples.push(deviation);
  }

  /** Check if current epoch is complete (30s of data) */
  isEpochComplete(): boolean {
    return this.samples.length >= SAMPLES_PER_EPOCH ||
           (Date.now() - this.epochStartTime) >= EPOCH_DURATION_MS;
  }

  /** Evaluate the current epoch and reset for next one */
  evaluateEpoch(): EpochResult {
    if (this.samples.length === 0) {
      return { variance: 0, avgMagnitude: 0, state: 'unknown', sampleCount: 0 };
    }

    const n = this.samples.length;
    const sum = this.samples.reduce((a, b) => a + b, 0);
    const mean = sum / n;

    // Compute variance
    const squaredDiffs = this.samples.map(s => (s - mean) ** 2);
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / n;

    // Classify sleep state
    let state: SleepState;
    if (variance < DEEP_THRESHOLD) {
      state = 'deep';
    } else if (variance < LIGHT_THRESHOLD) {
      state = 'light';
      this.lightSleepCount++;
    } else if (variance < AWAKE_THRESHOLD) {
      state = 'light';
      this.lightSleepCount++;
    } else {
      state = 'awake';
    }

    this.totalEpochs++;
    const result: EpochResult = {
      variance: Math.round(variance * 10000) / 10000,
      avgMagnitude: Math.round(mean * 1000) / 1000,
      state,
      sampleCount: n,
    };

    // Reset for next epoch
    this.samples = [];
    this.epochStartTime = Date.now();

    return result;
  }

  /** Get ratio of light sleep epochs (for UI display) */
  getLightSleepRatio(): number {
    if (this.totalEpochs === 0) return 0;
    return this.lightSleepCount / this.totalEpochs;
  }

  /** Reset all tracking */
  reset(): void {
    this.samples = [];
    this.epochStartTime = Date.now();
    this.lightSleepCount = 0;
    this.totalEpochs = 0;
  }
}

/**
 * Determine if the alarm should trigger based on sleep state + time window.
 * @param state Current sleep state from epoch evaluation
 * @param minutesUntilTarget Minutes remaining until the target alarm time
 * @param windowMin Smart-wake window size in minutes
 * @returns true if alarm should trigger now
 */
export function shouldTriggerSmartWake(
  state: SleepState,
  minutesUntilTarget: number,
  windowMin: number
): boolean {
  // Only trigger within the smart-wake window
  if (minutesUntilTarget > windowMin || minutesUntilTarget < -5) return false;

  // If past target time, always trigger
  if (minutesUntilTarget <= 0) return true;

  // During window: trigger on light sleep or awake state
  if (state === 'light' || state === 'awake') return true;

  return false;
}
