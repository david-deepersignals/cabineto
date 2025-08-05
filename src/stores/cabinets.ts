import { writable } from 'svelte/store';
import type { Corpus } from '../cabinet/Corpus';

/**
 * Global store holding all created cabinets.
 */
export const cabinets = writable<Corpus[]>([]);
