import { createId, isUuid } from './createId';

describe('createId', () => {
  it('creates version 4 UUIDs', () => {
    for (let i = 0; i < 200; i += 1) {
      expect(isUuid(createId())).toBe(true);
    }
  });

  it('does not repeat', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => createId()));
    expect(ids.size).toBe(1000);
  });

  it('rejects the old id format', () => {
    expect(isUuid('veh_lq3k2_x8f2abc')).toBe(false);
  });
});
