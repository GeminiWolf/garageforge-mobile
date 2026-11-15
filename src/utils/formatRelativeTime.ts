/** "just now", "5 min ago", "3 h ago", or a date for older times. */
export function formatRelativeTime(
  iso: string,
  now: Date = new Date(),
): string {
  const seconds = Math.max(0, (now.getTime() - Date.parse(iso)) / 1000);
  if (seconds < 60) {
    return 'just now';
  }
  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)} min ago`;
  }
  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)} h ago`;
  }
  return new Date(iso).toLocaleDateString();
}
