<script lang="ts">
import { cabinets } from '../stores/cabinets';
import { createEventDispatcher } from 'svelte';

const dispatch = createEventDispatcher();

let layoutSvg: SVGSVGElement;
let cabinetSvgs: Record<string, SVGSVGElement> = {};

interface Bounds { minX: number; minY: number; width: number; height: number; }
let bounds: Bounds = { minX: 0, minY: 0, width: 0, height: 0 };

$: bounds = (() => {
  if ($cabinets.length === 0) return { minX: 0, minY: 0, width: 0, height: 0 };
  const minX = Math.min(...$cabinets.map(c => c.x ?? 0));
  const minY = Math.min(...$cabinets.map(c => c.y ?? 0));
  const maxX = Math.max(...$cabinets.map(c => (c.x ?? 0) + c.w));
  const maxY = Math.max(...$cabinets.map(c => (c.y ?? 0) + c.h));
  return { minX, minY, width: maxX - minX, height: maxY - minY };
})();

function exportSVG(el: SVGSVGElement, filename: string) {
  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(el);
  const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportLayout() {
  if (layoutSvg) exportSVG(layoutSvg, 'layout-summary.svg');
}

function exportCab(id: string) {
  const el = cabinetSvgs[id];
  if (el) exportSVG(el, `${id}.svg`);
}
</script>

<div class="mb-4 flex gap-2">
  <button class="px-4 py-2 bg-gray-600 text-white rounded" on:click={exportLayout}>Export Layout</button>
  <button class="px-4 py-2 bg-blue-600 text-white rounded" on:click={() => dispatch('close')}>Back</button>
</div>

<div class="mb-4">
  <svg bind:this={layoutSvg} width={bounds.width} height={bounds.height} style="border:1px solid #000">
    {#each $cabinets as cab}
      <rect x={(cab.x ?? 0) - bounds.minX} y={(cab.y ?? 0) - bounds.minY} width={cab.w/3} height={cab.h/3} fill="none" stroke="black" />
      <text x={(cab.x ?? 0) - bounds.minX + (cab.w/3)/2} y={(cab.y ?? 0) - bounds.minY + (cab.h/3)/2} text-anchor="middle" dominant-baseline="middle" font-size="12">{cab.id}</text>
    {/each}
  </svg>
  <p>Total width: {bounds.width} mm, Total height: {bounds.height} mm</p>
</div>

<h3 class="font-semibold mb-2">Cabinet Drawings</h3>
<div class="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
  {#each $cabinets as cab}
    <div class="border p-2 flex flex-col items-center">
      <svg bind:this={cabinetSvgs[cab.id]} width={cab.w/3} height={cab.h/3} style="border:1px solid #000">
        <rect x="0" y="0" width={cab.w/3} height={cab.h/3} fill="none" stroke="black" />
        <text x={(cab.w/3)/2} y={(cab.h/3)/2} text-anchor="middle" dominant-baseline="middle" font-size="12">{cab.id}</text>
      </svg>
      <button class="mt-2 px-2 py-1 bg-green-600 text-white rounded text-xs" on:click={() => exportCab(cab.id)}>Export {cab.id}</button>
    </div>
  {/each}
</div>
