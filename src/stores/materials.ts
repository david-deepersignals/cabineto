import { writable } from 'svelte/store';

export interface Material {
  name: string;
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
  corpus: { name: 'Corpus', thickness: 18 },
  front: { name: 'Front', thickness: 19 },
  back: { name: 'Back', thickness: 3 }
});
