// Vibration API supports duration, not motor amplitude; longer pulses distinguish the final taps.
export function counterVibration(count, target) {
  if (target <= 1) return count + 1 >= target ? [25, 45, 25] : 10
  const remaining = target - count
  if (remaining === 3) return 20
  if (remaining === 2) return 45
  if (remaining <= 1) return 90
  return 10
}
