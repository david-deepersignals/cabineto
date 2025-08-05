import { writable } from 'svelte/store';

export interface Material {
  thickness: number;
}

export interface MaterialsState {
  corpus: Material;
  front: Material;
  back: Material;
}

/**
 * Global material configuration with default thickness values.
 */
export const materials = writable<MaterialsState>({
  corpus: { thickness: 18 },
  front: { thickness: 19 },
  back: { thickness: 3 }
});
