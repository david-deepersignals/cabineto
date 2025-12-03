import type { MaterialsState } from '../stores/materials';
import type { Panel } from '../cabinet/Corpus';

const BOARD_W = 2800;
const BOARD_H = 2070;
const BOARD_AREA_M2 = (BOARD_W * BOARD_H) / 1_000_000;

interface Rect { w: number; h: number; }
export interface MaterialDetail { material: string; boards: number; cost: number; }
export interface Bom { screws: number; dowels: number; hinges: number; slides: number; }

function packBoards(rects: Rect[]): number {
  const boards: { spaces: Rect[] }[] = [{ spaces: [{ w: BOARD_W, h: BOARD_H }] }];
  for (const rect of rects) {
    let placed = false;
    outer: for (const board of boards) {
      for (let i = 0; i < board.spaces.length; i++) {
        const space = board.spaces[i];
        if ((rect.w <= space.w && rect.h <= space.h) || (rect.h <= space.w && rect.w <= space.h)) {
          let w = rect.w;
          let h = rect.h;
          if (rect.w > space.w || rect.h > space.h) {
            w = rect.h;
            h = rect.w;
          }
          board.spaces.splice(i, 1);
          const right = { w: space.w - w, h };
          const bottom = { w: space.w, h: space.h - h };
          if (right.w > 0 && right.h > 0) board.spaces.push(right);
          if (bottom.w > 0 && bottom.h > 0) board.spaces.push(bottom);
          placed = true;
          break outer;
        }
      }
    }
    if (!placed) {
      const newBoard = { spaces: [{ w: BOARD_W, h: BOARD_H }] };
      boards.push(newBoard);
      const space = newBoard.spaces[0];
      let w = rect.w;
      let h = rect.h;
      if (w > BOARD_W || h > BOARD_H) {
        w = Math.min(rect.w, BOARD_W);
        h = Math.min(rect.h, BOARD_H);
      }
      newBoard.spaces = [];
      const right = { w: space.w - w, h };
      const bottom = { w: space.w, h: space.h - h };
      if (right.w > 0 && right.h > 0) newBoard.spaces.push(right);
      if (bottom.w > 0 && bottom.h > 0) newBoard.spaces.push(bottom);
    }
  }
  return boards.length;
}

export function summarizeCosts(cabs: any[], mats: MaterialsState) {
  const panels: Panel[] = cabs.flatMap((c: any) => c.panels());
  const materialsMap = new Map<string, number>([
    [mats.corpus.name, mats.corpus.cost ?? 0],
    [mats.front.name, mats.front.cost ?? 0],
    [mats.back.name, mats.back.cost ?? 0],
    [mats.drawer.name, mats.drawer.cost ?? 0]
  ]);

  const grouped: Record<string, Rect[]> = {};
  let edgeBandLength = 0;
  let cutLength = 0;
  let hinges = 0;
  let connections = 0;
  let drawers = 0;

  panels.forEach(p => {
    for (let i = 0; i < p.quantity; i++) {
      const arr = grouped[p.material] ?? [];
      arr.push({ w: p.width, h: p.length });
      grouped[p.material] = arr;
    }
    const lengthEdges = (p.edgeBandingLengthRight + p.edgeBandingLengthLeft) * p.length;
    const widthEdges = (p.edgeBandingWidthTop + p.edgeBandingWidthBottom) * p.width;
    edgeBandLength += (lengthEdges + widthEdges) * p.quantity;
    cutLength += 2 * (p.length + p.width) * p.quantity;
    if (p.hingeLocation) {
      const match = p.hingeLocation.match(/^(\d+)x/);
      if (match) hinges += parseInt(match[1]);
    }
  });

  const matDetails: MaterialDetail[] = [];
  let materialsCost = 0;
  for (const material in grouped) {
    const rects = grouped[material];
    const boards = packBoards(rects);
    const costPerM2 = materialsMap.get(material) ?? 0;
    const cost = boards * BOARD_AREA_M2 * costPerM2;
    materialsCost += cost;
    matDetails.push({ material, boards, cost });
  }

  const edgeBandCost = (edgeBandLength / 1000) * (mats.edgeBandingCostPerMeter || 0);
  const cutCost = (cutLength / 1000) * (mats.cutCostPerMeter || 0);
  const total = materialsCost + edgeBandCost + cutCost;
  cabs.forEach((c: any) => {
    connections += 4;
    if(!c.full){
      connections+=2;
    }
    if (c.type === 'drawer' && c.drawers) {
      drawers += c.drawers;
    }
    if(c.type === 'oven'){
      drawers += 1;
    }

  });
  const bom: Bom = {
    screws: connections * 2,
    dowels: connections * 2,
    hinges,
    slides: drawers * 2
  };
  return { materials: matDetails, edgeBandCost, cutCost, materialsCost, total, bom };
}
