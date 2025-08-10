import { writable } from 'svelte/store';

export interface Room {
  width: number;
  depth: number;
  height: number;
}

export const room = writable<Room>({
  width: 4000,
  depth: 3000,
  height: 2500
});

