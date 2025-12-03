import type { Panel } from '../src/cabinet/Corpus';
import { materials, type MaterialsState } from '../src/stores/materials';

export const baseMaterials: MaterialsState = {
  corpus: { name: 'Corpus', thickness: 18, cost: 1 },
  front: { name: 'Front', thickness: 18, cost: 1 },
  back: { name: 'Back', thickness: 3, cost: 1 },
  drawer: { name: 'Drawer', thickness: 16, cost: 1 },
  edgeBandingCostPerMeter: 1,
  cutCostPerMeter: 1,
};

export function resetMaterials(overrides: Partial<MaterialsState> = {}): MaterialsState {
  const next: MaterialsState = {
    corpus: { ...baseMaterials.corpus, ...overrides.corpus },
    front: { ...baseMaterials.front, ...overrides.front },
    back: { ...baseMaterials.back, ...overrides.back },
    drawer: { ...baseMaterials.drawer, ...overrides.drawer },
    edgeBandingCostPerMeter: overrides.edgeBandingCostPerMeter ?? baseMaterials.edgeBandingCostPerMeter,
    cutCostPerMeter: overrides.cutCostPerMeter ?? baseMaterials.cutCostPerMeter,
  };

  materials.set(next);
  return next;
}

const PANEL_KEYS: (keyof Panel)[] = [
  'label',
  'length',
  'width',
  'quantity',
  'edgeBandingLengthRight',
  'edgeBandingLengthLeft',
  'edgeBandingWidthBottom',
  'edgeBandingWidthTop',
  'hingeLocation',
  'material',
  'materialThickness',
];

export function normalizePanel(panel: Panel): Partial<Panel> {
  const normalized: Partial<Panel> = {};

  PANEL_KEYS.forEach((key) => {
    const value = panel[key];
    if (value !== undefined) {
      // @ts-expect-error dynamic assignment is safe for test normalization
      normalized[key] = value;
    }
  });

  if (panel.dados) {
    normalized.dados = panel.dados.map((d) => ({ ...d }));
  }

  if (panel.rabbets) {
    normalized.rabbets = panel.rabbets.map((r) => ({ ...r }));
  }

  return normalized;
}

export function normalizePanels(panels: Panel[]): Partial<Panel>[] {
  return panels.map(normalizePanel);
}

export function findPanel(panels: Panel[], label: string): Panel {
  const panel = panels.find((p) => p.label === label);
  if (!panel) {
    throw new Error(`Panel with label "${label}" not found`);
  }
  return panel;
}
