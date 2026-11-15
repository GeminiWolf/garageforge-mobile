import { makeBadge } from './makeBadge';

describe('makeBadge', () => {
  it('uses the first letter and a stable colour per make', () => {
    expect(makeBadge('Toyota').initial).toBe('T');
    expect(makeBadge('Toyota')).toEqual(makeBadge(' toyota '.trim()));
    expect(makeBadge('toyota').color).toBe(makeBadge('Toyota').color);
  });

  it('handles an empty make', () => {
    expect(makeBadge('').initial).toBe('?');
  });
});
