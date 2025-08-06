import { writable } from 'svelte/store';
import { cabinets } from './cabinets';

function createScale() {
  const { subscribe, update } = writable(1);

  return {
    subscribe,
    set: (value: number) => {
      update(old => {
        const ratio = old / value;
        cabinets.update(cabs =>
          cabs.map(c => {
            c.x = (c.x ?? 0) * ratio;
            c.y = (c.y ?? 0) * ratio;
            return c;
          })
        );
        return value;
      });
    },
    update: (fn: (n: number) => number) => {
      update(old => {
        const newScale = fn(old);
        const ratio = old / newScale;
        cabinets.update(cabs =>
          cabs.map(c => {
            c.x = (c.x ?? 0) * ratio;
            c.y = (c.y ?? 0) * ratio;
            return c;
          })
        );
        return newScale;
      });
    }
  };
}

export const scale = createScale();
