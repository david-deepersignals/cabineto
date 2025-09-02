<script lang="ts">
import { createEventDispatcher } from 'svelte';
import { cabinets } from '../stores/cabinets';
import type { Corpus } from '../cabinet/Corpus';
import { DoorCabinet } from '../cabinet/DoorCabinet';
import { DrawerCabinet } from '../cabinet/DrawerCabinet';
import { CornerCabinet } from '../cabinet/CornerCabinet';
import { OvenCabinet } from '../cabinet/OvenCabinet';

const dispatch = createEventDispatcher();

function downloadJSON() {
  const json = JSON.stringify($cabinets, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cabinets.json';
  a.click();
  URL.revokeObjectURL(url);
}

function reviveCabinet(raw: any): Corpus {
  let cab: Corpus;
  switch (raw.type) {
    case 'drawer':
      cab = new DrawerCabinet(
        raw.id,
        raw.w,
        raw.h,
        raw.d,
        raw.drawers,
        raw.heights ?? [],
        raw.drawerSystem ?? 'standard',
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
        raw.options,
        raw.isUpper
      );
      break;
    case 'door':
    default:
      cab = new DoorCabinet(raw.id, raw.w, raw.h, raw.d, raw.doors, raw.options, raw.isUpper);
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

function uploadJSON(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files && input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result as string);
      const restored: Corpus[] = Array.isArray(data) ? data.map(reviveCabinet) : [];
      cabinets.set(restored);
      dispatch('close');
    } catch (e) {
      alert('Invalid JSON file');
    }
  };
  reader.readAsText(file);
}
</script>

<div class="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50">
  <div class="bg-white p-6 rounded shadow-md w-full max-w-sm">
    <h3 class="text-lg font-semibold mb-4">Backups</h3>
    <div class="space-y-4">
      <button class="px-4 py-2 bg-green-600 text-white rounded w-full" on:click={downloadJSON}>Download JSON</button>
      <div>
        <label class="block mb-2" for="backup-upload">Upload JSON</label>
        <input id="backup-upload" type="file" accept="application/json" on:change={uploadJSON} class="border p-1 w-full" />
      </div>
      <div class="flex justify-end">
        <button class="px-3 py-1 bg-gray-400 text-white rounded" on:click={() => dispatch('close')}>Close</button>
      </div>
    </div>
  </div>
</div>
