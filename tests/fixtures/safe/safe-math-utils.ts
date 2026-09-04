export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
export function average(nums) {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
