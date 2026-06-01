import { describe, expect, it } from 'vitest';
import { fixedMap, MAP_SIZE } from './fixedMap';

describe('fixed 11x11 map', () => {
  it('uses one fixed 11x11 layout with one start and one enemy tile', () => {
    expect(MAP_SIZE).toBe(11);
    expect(fixedMap).toHaveLength(121);
    expect(fixedMap.filter((tile) => tile.type === 'start')).toEqual([{ x: 5, y: 9, type: 'start' }]);
    expect(fixedMap.filter((tile) => tile.type === 'enemy')).toEqual([{ x: 5, y: 1, type: 'enemy' }]);
  });
});
