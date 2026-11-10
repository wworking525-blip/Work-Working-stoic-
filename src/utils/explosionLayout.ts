export interface CardItem {
  id: string;
  system?: string;
  width: number;
  height: number;
}

export interface LayoutCell {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExplosionLayoutResult {
  cells: Map<string, LayoutCell>;
  width: number;
  height: number;
}

/**
 * Packs 3D bounding cards into a grid for exploded anatomical views.
 * Ported from human-atlas architecture for optimal screen-space arrangement.
 */
export function createExplosionLayout(items: CardItem[], aspect = 1.0): ExplosionLayoutResult {
  if (items.length === 0) {
    return { cells: new Map(), width: 0, height: 0 };
  }

  const cards = items.map((p) => ({
    id: p.id,
    system: p.system,
    width: Math.max(0.04, p.width) + 0.04,
    height: Math.max(0.04, p.height) + 0.04,
  }));

  const area = cards.reduce((acc, c) => acc + c.width * c.height, 0);
  const maxWidth = Math.max(0.3, ...cards.map((c) => c.width));
  const targetWidth = Math.max(
    maxWidth,
    Math.sqrt(area * Math.max(0.5, Math.min(1.8, aspect))) * 1.15
  );

  cards.sort((a, b) => b.height - a.height || a.id.localeCompare(b.id));

  const cells = new Map<string, LayoutCell>();
  let x = 0;
  let y = 0;
  let rowHeight = 0;
  let usedWidth = 0;

  for (const c of cards) {
    if (x > 0 && x + c.width > targetWidth) {
      x = 0;
      y += rowHeight;
      rowHeight = 0;
    }
    cells.set(c.id, {
      x: x + c.width / 2,
      y: -y - c.height / 2,
      width: c.width,
      height: c.height,
    });
    x += c.width;
    usedWidth = Math.max(usedWidth, x);
    rowHeight = Math.max(rowHeight, c.height);
  }

  const totalHeight = y + rowHeight;
  // Center all cells around origin
  cells.forEach((c) => {
    c.x -= usedWidth / 2;
    c.y += totalHeight / 2;
  });

  return { cells, width: usedWidth, height: totalHeight };
}
