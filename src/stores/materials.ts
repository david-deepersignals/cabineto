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
  /** Cost per meter of edge banding */
  edgeBandingCostPerMeter: number;
  /** Cost per meter of cutting */
  cutCostPerMeter: number;
}

/**
 * Global material configuration with default thickness values.
 */
export const materials = writable<MaterialsState>({
  corpus: { name: 'Corpus', thickness: 18, cost: 0 },
  front: { name: 'Front', thickness: 19, cost: 0 },
  back: { name: 'Back', thickness: 3, cost: 0 },
  edgeBandingCostPerMeter: 0,
  cutCostPerMeter: 0
});
