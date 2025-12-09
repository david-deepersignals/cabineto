import { get } from 'svelte/store';
import type { Corpus } from '../cabinet/Corpus';
import { DoorCabinet } from '../cabinet/DoorCabinet';
import { DrawerCabinet } from '../cabinet/DrawerCabinet';
import { CornerCabinet } from '../cabinet/CornerCabinet';
import { OvenCabinet } from '../cabinet/OvenCabinet';
import { advancedSettings } from '../stores/advancedSettings';

/**
 * Convert cabinet instances into plain objects so they can be stored.
 */
export function serializeCabinets(cabinets: Corpus[]): any[] {
  return cabinets.map((cab) => JSON.parse(JSON.stringify(cab)));
}

/**
 * Recreate cabinet instances from stored data.
 */
export function reviveCabinet(raw: any): Corpus {
  const defaults = get(advancedSettings);
  const drawerDefaults = defaults.drawers.defaults;
  let cab: Corpus;
  switch (raw?.type) {
    case 'drawer':
      cab = new DrawerCabinet(
        raw.id,
        raw.w,
        raw.h,
        raw.d,
        raw.drawers,
        raw.heights ?? [],
        raw.drawerSystem ?? 'standard',
        raw.metaboxType ?? drawerDefaults.sliderLength,
        raw.drawerSideHeight ?? drawerDefaults.railHeight,
        raw.options,
        raw.isUpper
      );
      break;
    case 'corner':
      cab = new CornerCabinet(
        raw.id,
        raw.w,
        raw.h,
        raw.d,
        raw.fixedSide,
        raw.options,
        raw.isUpper
      );
      break;
    case 'oven':
      cab = new OvenCabinet(
        raw.id,
        raw.w,
        raw.h,
        raw.d,
        raw.drawerSystem ?? 'standard',
        raw.metaboxType ?? drawerDefaults.sliderLength,
        raw.drawerSideHeight ?? drawerDefaults.railHeight,
        raw.options,
        raw.isUpper
      );
      break;
    case 'door':
    default:
      cab = new DoorCabinet(
        raw.id,
        raw.w,
        raw.h,
        raw.d,
        raw.doors,
        raw.shelves ?? 0,
        raw.options,
        raw.isUpper
      );
      break;
  }
  cab.x = raw.x;
  cab.y = raw.y;
  cab.z = raw.z;
  cab.rotation = raw.rotation;
  cab.wall = raw.wall;
  cab.validate();
  return cab;
}

export function reviveCabinets(raw: any[]): Corpus[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(reviveCabinet);
}
