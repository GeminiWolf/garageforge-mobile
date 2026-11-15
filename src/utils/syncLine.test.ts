import { describeSyncLine } from './syncLine';

const now = new Date('2026-11-15T12:00:00.000Z');
const hourAgo = '2026-11-15T11:00:00.000Z';

describe('describeSyncLine', () => {
  it('shows the last sync when all is well', () => {
    expect(describeSyncLine('idle', hourAgo, now)).toEqual({
      text: expect.stringMatching(/^synced /),
      problem: false,
    });
  });

  it('flags a failed sync instead of an old success time', () => {
    const line = describeSyncLine('error', hourAgo, now);
    expect(line.problem).toBe(true);
    expect(line.text).toMatch(/^not synced since /);
  });

  it('handles a first sync that failed', () => {
    expect(describeSyncLine('error', undefined, now)).toEqual({
      text: 'not synced yet',
      problem: true,
    });
  });

  it('says when it is syncing', () => {
    expect(describeSyncLine('syncing', hourAgo, now).text).toBe('syncing…');
  });
});
