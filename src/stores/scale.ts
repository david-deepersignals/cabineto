import { writable } from 'svelte/store';
import { cabinets } from './cabinets';

function createScale() {
  const { subscribe, update: updateStore, set: setStore } = writable(2.5);

  const rescale = (oldScale: number, newScale: number) => {
    const ratio = oldScale / newScale;
    cabinets.update(cabs =>
      cabs.map(c => {
        c.x = (c.x ?? 0) * ratio;
        c.y = (c.y ?? 0) * ratio;
        return c;
      })
    );
  };

  return {
    subscribe,
    set: (value: number) => {
      updateStore(old => {
        rescale(old, value);
        return value;
      });
    },
    update: (fn: (n: number) => number) => {
      updateStore(old => {
        const newScale = fn(old);
        rescale(old, newScale);
        return newScale;
      });
    },
    /**
     * Replace the scale without moving cabinets (used when hydrating projects).
     */
    replace: (value: number) => setStore(value)
  };
}

export const scale = createScale();
