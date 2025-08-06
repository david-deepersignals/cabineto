<script lang="ts">
import { cabinets } from '../stores/cabinets';
import { createEventDispatcher } from 'svelte';

const dispatch = createEventDispatcher();

let layoutSvg: SVGSVGElement;
let cabinetSvgs: Record<string, SVGSVGElement> = {};

const SCALE = 3; // 1px represents 3mm
const DIM_OFFSET = 20;
const MARGIN = 40;

interface Bounds { minX: number; minY: number; width: number; height: number; }
let bounds: Bounds = { minX: 0, minY: 0, width: 0, height: 0 };
let sorted: any[] = [];


$: bounds = (() => {
  if ($cabinets.length === 0) return { minX: 0, minY: 0, width: 0, height: 0 };
  const minX = Math.min(...$cabinets.map(c => c.x ?? 0));
  const minY = Math.min(...$cabinets.map(c => c.y ?? 0));
  const maxX = Math.max(...$cabinets.map(c => (c.x ?? 0) + c.w / SCALE));
  const maxY = Math.max(...$cabinets.map(c => (c.y ?? 0) + c.h / SCALE));

  return { minX, minY, width: maxX - minX, height: maxY - minY };
})();

$: sorted = $cabinets.slice().sort((a, b) => (a.x ?? 0) - (b.x ?? 0));

let heightTicks: number[] = [];
interface HeightSegment { start: number; end: number; mid: number; size: number; }
let heightSegments: HeightSegment[] = [];

$: {
  const edges = new Set<number>();
  $cabinets.forEach(cab => {
    const top = (cab.y ?? 0) - bounds.minY;
    const bottom = top + cab.h / SCALE;
    edges.add(top);
    edges.add(bottom);
  });
  edges.add(0);
  edges.add(bounds.height);
  heightTicks = Array.from(edges).sort((a, b) => a - b);
  heightSegments = heightTicks.slice(0, -1).map((start, i) => ({
    start,
    end: heightTicks[i + 1],
    mid: (start + heightTicks[i + 1]) / 2,
    size: Math.round((heightTicks[i + 1] - start) * SCALE)
  }));
}

const totalWidthMm = () => Math.round(bounds.width * SCALE);
const totalHeightMm = () => Math.round(bounds.height * SCALE);
const svgWidth = () => bounds.width + MARGIN + DIM_OFFSET * 5;
const svgHeight = () => bounds.height + MARGIN + DIM_OFFSET * 5;

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
  <svg bind:this={layoutSvg} width={svgWidth()} height={svgHeight()} style="border:1px solid #000">
    {#each sorted as cab, i}
      {@const prev = sorted[i - 1]}
      {@const next = sorted[i + 1]}
      {@const x = (cab.x ?? 0) - bounds.minX + MARGIN}
      {@const y = (cab.y ?? 0) - bounds.minY + MARGIN}
      {@const w = cab.w / SCALE}
      {@const h = cab.h / SCALE}
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="black" />

      {#if cab.type === 'door' && (cab as any).doors}
        {#each Array((cab as any).doors - 1) as _, i}
          <line x1={x + w * (i + 1) / (cab as any).doors} y1={y} x2={x + w * (i + 1) / (cab as any).doors} y2={y + h} stroke="black" stroke-dasharray="4 2" />
        {/each}
      {/if}

      {#if cab.type === 'drawer' && (cab as any).heights}
        {@const heights = (cab as any).heights}
        {#each heights.slice(0, -1) as _, i}
          {@const pos = heights.slice(0, i + 1).reduce((a: number, b: number) => a + b, 0)}
          <line x1={x} x2={x + w} y1={y + h * pos / 100} y2={y + h * pos / 100} stroke="black" stroke-dasharray="4 2" />
        {/each}
      {/if}

      <text x={x + w / 2} y={y + h / 2} text-anchor="middle" dominant-baseline="middle" font-size="12">{cab.id}</text>

      {@const prevSame = prev && prev.h === cab.h && (prev.y ?? 0) === (cab.y ?? 0) && Math.abs((prev.x ?? 0) + prev.w / SCALE - (cab.x ?? 0)) < 0.01}
      {@const nextSame = next && next.h === cab.h && (next.y ?? 0) === (cab.y ?? 0) && Math.abs((cab.x ?? 0) + cab.w / SCALE - (next.x ?? 0)) < 0.01}

<!--      <line x1={bounds.width + MARGIN + DIM_OFFSET - 5} y1={y} x2={bounds.width + MARGIN + DIM_OFFSET + 5} y2={y} stroke="red" />-->
<!--      <text x={bounds.width + MARGIN + DIM_OFFSET - 5} y={y}  stroke="red" text-anchor="middle" dominant-baseline="middle" font-size="12">{totalHeightMm() - cab.h}</text>-->

      <!--{#if !prevSame}-->
      <!--  <line x1={x - DIM_OFFSET / 2} y1={y} x2={x - DIM_OFFSET / 2} y2={y + h} stroke="black" />-->
      <!--  <line x1={x - DIM_OFFSET / 2 - 5} y1={y} x2={x - DIM_OFFSET / 2 + 5} y2={y} stroke="black" />-->
      <!--  <line x1={x - DIM_OFFSET / 2 - 5} y1={y + h} x2={x - DIM_OFFSET / 2 + 5} y2={y + h} stroke="black" />-->
      <!--  <text x={x - DIM_OFFSET} y={y + h / 2} text-anchor="end" dominant-baseline="middle" font-size="12">{Math.round(cab.h)} mm</text>-->
      <!--{/if}-->

      <!--<line x1={x + w + DIM_OFFSET / 2} y1={y} x2={x + w + DIM_OFFSET / 2} y2={y + h} stroke="black" />-->
      <!--<line x1={x + w + DIM_OFFSET / 2 - 5} y1={y} x2={x + w + DIM_OFFSET / 2 + 5} y2={y} stroke="black" />-->
      <!--<line x1={x + w + DIM_OFFSET / 2 - 5} y1={y + h} x2={x + w + DIM_OFFSET / 2 + 5} y2={y + h} stroke="black" />-->
      <!--{#if !nextSame}-->
      <!--  <text x={x + w + DIM_OFFSET} y={y + h / 2} dominant-baseline="middle" font-size="12">{Math.round(cab.h)} mm</text>-->
      <!--{/if}-->
    {/each}

    <!-- horizontal dimension line for cabinet widths -->
    <line x1={MARGIN} y1={bounds.height + MARGIN + DIM_OFFSET} x2={bounds.width + MARGIN} y2={bounds.height + MARGIN + DIM_OFFSET} stroke="black" />
    {#each sorted as cab}
      {@const x = (cab.x ?? 0) - bounds.minX + MARGIN}
      {@const w = cab.w / SCALE}
      <line x1={x} y1={bounds.height + MARGIN + DIM_OFFSET - 5} x2={x} y2={bounds.height + MARGIN + DIM_OFFSET + 5} stroke="black" />
      <line x1={x + w} y1={bounds.height + MARGIN + DIM_OFFSET - 5} x2={x + w} y2={bounds.height + MARGIN + DIM_OFFSET + 5} stroke="black" />
      <text x={x + w / 2} y={bounds.height + MARGIN + DIM_OFFSET + 15} text-anchor="middle" font-size="12">{Math.round(cab.w)} mm</text>
    {/each}
    <text x={bounds.width / 2 + MARGIN} y={bounds.height + MARGIN + DIM_OFFSET + 35} text-anchor="middle" font-size="12">Total {totalWidthMm()} mm</text>

    <!-- total height dimension line -->
    <line x1={bounds.width + MARGIN + DIM_OFFSET} y1={MARGIN} x2={bounds.width + MARGIN + DIM_OFFSET} y2={bounds.height + MARGIN} stroke="black" />
    {#each heightTicks as pos}
      <line x1={bounds.width + MARGIN + DIM_OFFSET - 5} y1={MARGIN + pos} x2={bounds.width + MARGIN + DIM_OFFSET + 5} y2={MARGIN + pos} stroke="black" />
    {/each}
    {#each heightSegments as seg}
      <text x={bounds.width + MARGIN + DIM_OFFSET + 5} y={MARGIN + seg.mid} font-size="12" dominant-baseline="middle">{seg.size} mm</text>
    {/each}
  </svg>
  <p>Total width: {totalWidthMm()} mm, Total height: {totalHeightMm()} mm</p>
</div>

<h3 class="font-semibold mb-2">Cabinet Drawings</h3>
<div class="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
  {#each $cabinets as cab}
    <div class="border p-2 flex flex-col items-center">
      <svg bind:this={cabinetSvgs[cab.id]} width={cab.w/3} height={cab.h/3} style="border:1px solid #000">
        <rect x="0" y="0" width={cab.w/3} height={cab.h/3} fill="none" stroke="black" />

        {#if cab.type === 'door' && (cab as any).doors}
          {#each Array((cab as any).doors - 1) as _, i}
            <line x1={(cab.w/3) * (i + 1) / (cab as any).doors} y1="0" x2={(cab.w/3) * (i + 1) / (cab as any).doors} y2={cab.h/3} stroke="black" stroke-dasharray="4 2" />
          {/each}
        {/if}

        {#if cab.type === 'drawer' && (cab as any).heights}
          {@const heights = (cab as any).heights}
          {#each heights.slice(0, -1) as _, i}
            {@const pos = heights.slice(0, i + 1).reduce((a: number, b: number) => a + b, 0)}
            <line x1="0" x2={cab.w/3} y1={(cab.h/3) * pos / 100} y2={(cab.h/3) * pos / 100} stroke="black" stroke-dasharray="4 2" />
          {/each}
        {/if}

        <text x={(cab.w/3)/2} y={(cab.h/3)/2} text-anchor="middle" dominant-baseline="middle" font-size="12">{cab.id}</text>
      </svg>
      <button class="mt-2 px-2 py-1 bg-green-600 text-white rounded text-xs" on:click={() => exportCab(cab.id)}>Export {cab.id}</button>
    </div>
  {/each}
</div>
