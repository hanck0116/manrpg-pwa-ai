export type TileType = 'floor' | 'wall' | 'start' | 'enemy';

export type MapTile = {
  x: number;
  y: number;
  type: TileType;
};

const layout: TileType[][] = [
  ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'wall', 'enemy', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'floor', 'wall', 'floor', 'wall', 'floor', 'wall', 'floor', 'wall', 'floor', 'wall'],
  ['wall', 'floor', 'wall', 'floor', 'floor', 'floor', 'wall', 'floor', 'wall', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'wall', 'wall', 'floor', 'wall', 'floor', 'wall', 'wall', 'wall', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall', 'floor', 'wall'],
  ['wall', 'floor', 'wall', 'wall', 'wall', 'floor', 'wall', 'floor', 'wall', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'wall', 'floor', 'wall', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'floor', 'wall', 'floor', 'floor', 'start', 'floor', 'floor', 'wall', 'floor', 'wall'],
  ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall']
];

export const MAP_SIZE = 11;

export const fixedMap: MapTile[] = layout.flatMap((row, y) => row.map((type, x) => ({ x, y, type })));

export const getTile = (x: number, y: number): MapTile | undefined => fixedMap.find((tile) => tile.x === x && tile.y === y);

export const isWalkable = (x: number, y: number): boolean => {
  const tile = getTile(x, y);

  return tile?.type === 'floor' || tile?.type === 'start' || tile?.type === 'enemy';
};
