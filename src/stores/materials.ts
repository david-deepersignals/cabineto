import { writable } from 'svelte/store';

export interface Material {
  name: string;
  thickness: number;
  /** Cost per square meter of the raw board */
  cost?: number;
}

export interface MaterialsState {
  corpus: Material;
  front: Material;
  back: Material;
  drawer: Material;
  /** Cost per meter of edge banding */
  edgeBandingCostPerMeter: number;
  /** Cost per meter of cutting */
  cutCostPerMeter: number;
}

/**
 * Global material configuration with default thickness values.
 */
export const materials = writable<MaterialsState>({
  corpus: { name: 'Corpus', thickness: 18, cost: 1 },
  front: { name: 'Front', thickness: 18, cost: 1 },
  back: { name: 'Back', thickness: 3, cost: 1 },
  drawer: { name: 'Drawer', thickness: 16, cost: 1 },
  edgeBandingCostPerMeter: 1,
  cutCostPerMeter: 1
});
