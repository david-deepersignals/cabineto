<script lang="ts">
import { cabinets } from '../stores/cabinets';
import { createEventDispatcher } from 'svelte';
import { scale } from '../stores/scale';

const dispatch = createEventDispatcher();

let layoutSvg: SVGSVGElement;
let cabinetSvgs: Record<string, SVGSVGElement> = {};

const DIM_OFFSET = 20;
const MARGIN = 40;
// Constants for individual cabinet drawings
const CABINET_MARGIN = 20;
const CABINET_DIM = 20;

interface Bounds { minX: number; minY: number; width: number; height: number; }
let bounds: Bounds = { minX: 0, minY: 0, width: 0, height: 0 };
let sorted: any[] = [];
interface CabinetRow { y: number; cabinets: any[]; }
let rows: CabinetRow[] = [];


$: bounds = (() => {
  if ($cabinets.length === 0) return { minX: 0, minY: 0, width: 0, height: 0 };
  const minX = Math.min(...$cabinets.map(c => c.x ?? 0));
  const minY = Math.min(...$cabinets.map(c => c.y ?? 0));
  const maxX = Math.max(...$cabinets.map(c => (c.x ?? 0) + c.w / $scale));
  const maxY = Math.max(...$cabinets.map(c => (c.y ?? 0) + c.h / $scale));

  return { minX, minY, width: maxX - minX, height: maxY - minY };
})();

$: sorted = $cabinets.slice().sort((a, b) => (a.x ?? 0) - (b.x ?? 0));
$: rows = (() => {
  const map = new Map<number, any[]>();
  $cabinets.forEach(cab => {
    const y = Math.round(cab.y ?? 0);
    const arr = map.get(y) ?? [];
    arr.push(cab);
    map.set(y, arr);
  });
  return Array.from(map.entries())
    .map(([y, cabs]) => ({ y, cabinets: cabs.sort((a, b) => (a.x ?? 0) - (b.x ?? 0)) }))
    .sort((a, b) => a.y - b.y);
})();

let heightTicks: number[] = [];
interface HeightSegment { start: number; end: number; mid: number; size: number; }
let heightSegments: HeightSegment[] = [];

$: {
  const edges = new Set<number>();
  $cabinets.forEach(cab => {
    const top = (cab.y ?? 0) - bounds.minY;
    const bottom = top + cab.h / $scale;
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
    size: Math.round((heightTicks[i + 1] - start) * $scale)
  }));
}

const totalWidthMm = () => Math.round(bounds.width * $scale);
const totalHeightMm = () => Math.round(bounds.height * $scale);
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
    <defs>
      <pattern id="hatch" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="4" stroke="black" stroke-width="0.5" />
      </pattern>
    </defs>
    {#each sorted as cab, i}
      {@const prev = sorted[i - 1]}
      {@const next = sorted[i + 1]}
      {@const x = (cab.x ?? 0) - bounds.minX + MARGIN}
      {@const y = (cab.y ?? 0) - bounds.minY + MARGIN}
      {@const w = cab.w / $scale}
      {@const h = cab.h / $scale}
      {#if cab.type === 'corner' && (cab as any).fixedSide}
        {@const fixed = (cab as any).fixedSide / $scale}
        <rect x={x} y={y} width={fixed} height={h} fill="url(#hatch)" />
      {/if}
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="black" />

      {#if cab.type === 'corner' && (cab as any).fixedSide}
        <line x1={x + (cab as any).fixedSide / $scale} y1={y} x2={x + (cab as any).fixedSide / $scale} y2={y + h} stroke="black" stroke-dasharray="4 2" />
      {/if}

      {#if cab.type === 'door' && (cab as any).doors}
        {#each Array((cab as any).doors - 1) as _, i}
          <line x1={x + w * (i + 1) / (cab as any).doors} y1={y} x2={x + w * (i + 1) / (cab as any).doors} y2={y + h} stroke="black" stroke-dasharray="4 2" />
        {/each}
        {#each Array((cab as any).doors) as _, i}
          {@const doorWidth = w / (cab as any).doors}
          {@const doorX = x + i * doorWidth}
          {@const handleX = (cab as any).doors === 1 ? doorX + doorWidth - 5 : i === 0 ? doorX + doorWidth - 5 : doorX + 5}
          <line x1={handleX} y1={y + h / 2 - 5} x2={handleX} y2={y + h / 2 + 5} stroke="black" />
        {/each}
      {/if}

      {#if cab.type === 'drawer' && (cab as any).heights}
        {@const heights = (cab as any).heights}
        {#each heights.slice(0, -1) as _, i}
          {@const pos = heights.slice(0, i + 1).reduce((a: number, b: number) => a + b, 0)}
          <line x1={x} x2={x + w} y1={y + h * pos / 100} y2={y + h * pos / 100} stroke="black" stroke-dasharray="4 2" />
        {/each}
        {#each heights as height, i}
          {@const top = heights.slice(0, i).reduce((a: number, b: number) => a + b, 0)}
          {@const mid = top + height / 2}
          <line x1={x + w / 2 - 5} x2={x + w / 2 + 5} y1={y + h * mid / 100} y2={y + h * mid / 100} stroke="black" />
        {/each}
      {/if}

      {#if cab.type === 'oven' && (cab as any).drawerHeight}
        {@const drawerH = (cab as any).drawerHeight / $scale}
        <line x1={x} x2={x + w} y1={y + h - drawerH} y2={y + h - drawerH} stroke="black" stroke-dasharray="4 2" />
        <line x1={x + w / 2 - 5} x2={x + w / 2 + 5} y1={y + h - drawerH / 2} y2={y + h - drawerH / 2} stroke="black" />
        {@const ovenHeight = h - drawerH}
        <rect x={x + w * 0.1} y={y + ovenHeight * 0.1} width={w * 0.8} height={ovenHeight * 0.8} fill="none" stroke="black" />
        <rect x={x + w * 0.25} y={y + ovenHeight * 0.25} width={w * 0.5} height={ovenHeight * 0.5} fill="none" stroke="black" />
      {/if}

      <text x={x + w / 2} y={y + h / 2} text-anchor="middle" dominant-baseline="middle" font-size="12">{cab.id}</text>


    {/each}

    <!-- horizontal dimension line for cabinet widths -->
    {#if rows.length <= 1}
      <line x1={MARGIN} y1={bounds.height + MARGIN + DIM_OFFSET} x2={bounds.width + MARGIN} y2={bounds.height + MARGIN + DIM_OFFSET} stroke="black" />
      {#each sorted as cab}
        {@const x = (cab.x ?? 0) - bounds.minX + MARGIN}
        {@const w = cab.w / $scale}
        <line x1={x} y1={bounds.height + MARGIN + DIM_OFFSET - 5} x2={x} y2={bounds.height + MARGIN + DIM_OFFSET + 5} stroke="black" />
        <line x1={x + w} y1={bounds.height + MARGIN + DIM_OFFSET - 5} x2={x + w} y2={bounds.height + MARGIN + DIM_OFFSET + 5} stroke="black" />
        <text x={x + w / 2} y={bounds.height + MARGIN + DIM_OFFSET + 15} text-anchor="middle" font-size="12">{Math.round(cab.w)} mm</text>
      {/each}
      <text x={bounds.width / 2 + MARGIN} y={bounds.height + MARGIN + DIM_OFFSET + 35} text-anchor="middle" font-size="12">Total {totalWidthMm()} mm</text>
    {:else}
      {@const topRow = rows[0]}
      {@const bottomRow = rows[rows.length - 1]}
      <!-- bottom row dimension line -->
      <line x1={MARGIN} y1={bounds.height + MARGIN + DIM_OFFSET} x2={bounds.width + MARGIN} y2={bounds.height + MARGIN + DIM_OFFSET} stroke="black" />
      {#each bottomRow.cabinets as cab}
        {@const x = (cab.x ?? 0) - bounds.minX + MARGIN}
        {@const w = cab.w / $scale}
        <line x1={x} y1={bounds.height + MARGIN + DIM_OFFSET - 5} x2={x} y2={bounds.height + MARGIN + DIM_OFFSET + 5} stroke="black" />
        <line x1={x + w} y1={bounds.height + MARGIN + DIM_OFFSET - 5} x2={x + w} y2={bounds.height + MARGIN + DIM_OFFSET + 5} stroke="black" />
        <text x={x + w / 2} y={bounds.height + MARGIN + DIM_OFFSET + 15} text-anchor="middle" font-size="12">{Math.round(cab.w)} mm</text>
      {/each}
      <text x={bounds.width / 2 + MARGIN} y={bounds.height + MARGIN + DIM_OFFSET + 35} text-anchor="middle" font-size="12">Total {totalWidthMm()} mm</text>
      <!-- top row dimension line -->
      <line x1={MARGIN} y1={MARGIN - DIM_OFFSET} x2={bounds.width + MARGIN} y2={MARGIN - DIM_OFFSET} stroke="black" />
      {#each topRow.cabinets as cab}
        {@const x = (cab.x ?? 0) - bounds.minX + MARGIN}
        {@const w = cab.w / $scale}
        <line x1={x} y1={MARGIN - DIM_OFFSET - 5} x2={x} y2={MARGIN - DIM_OFFSET + 5} stroke="black" />
        <line x1={x + w} y1={MARGIN - DIM_OFFSET - 5} x2={x + w} y2={MARGIN - DIM_OFFSET + 5} stroke="black" />
        <text x={x + w / 2} y={MARGIN - DIM_OFFSET - 10} text-anchor="middle" font-size="12">{Math.round(cab.w)} mm</text>
      {/each}
    {/if}

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
    {@const w = cab.w / $scale}
    {@const h = cab.h / $scale}
    <div class="border p-2 flex flex-col items-center">
      <svg
        bind:this={cabinetSvgs[cab.id]}
        width={w + CABINET_MARGIN * 2 + CABINET_DIM * 3}
        height={h + CABINET_MARGIN * 2 + CABINET_DIM * 3}
        style="border:1px solid #000"
      >
        <defs>
          <pattern id={`hatch-${cab.id}`} patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="4" stroke="black" stroke-width="0.5" />
          </pattern>
        </defs>
        <g transform={`translate(${CABINET_MARGIN},${CABINET_MARGIN + CABINET_DIM})`}>
          {#if cab.type === 'corner' && (cab as any).fixedSide}
            {@const fixed = (cab as any).fixedSide / $scale}
            <rect x="0" y="0" width={fixed} height={h} fill={`url(#hatch-${cab.id})`} />
          {/if}
          <rect x="0" y="0" width={w} height={h} fill="none" stroke="black" />

          {#if cab.type === 'corner' && (cab as any).fixedSide}
            <line x1={(cab as any).fixedSide / $scale} y1="0" x2={(cab as any).fixedSide / $scale} y2={h} stroke="black" stroke-dasharray="4 2" />
          {/if}

          {#if cab.type === 'door' && (cab as any).doors}
            {#each Array((cab as any).doors - 1) as _, i}
              <line x1={w * (i + 1) / (cab as any).doors} y1="0" x2={w * (i + 1) / (cab as any).doors} y2={h} stroke="black" stroke-dasharray="4 2" />
            {/each}
            {#each Array((cab as any).doors) as _, i}
              {@const doorWidth = w / (cab as any).doors}
              {@const doorX = i * doorWidth}
              {@const handleX = (cab as any).doors === 1 ? doorX + doorWidth - 5 : i === 0 ? doorX + doorWidth - 5 : doorX + 5}
              <line x1={handleX} y1={h/2 - 5} x2={handleX} y2={h/2 + 5} stroke="black" />
            {/each}
          {/if}

          {#if cab.type === 'drawer' && (cab as any).heights}
            {@const heights = (cab as any).heights}
            {#each heights.slice(0, -1) as _, i}
              {@const pos = heights.slice(0, i + 1).reduce((a: number, b: number) => a + b, 0)}
              <line x1="0" x2={w} y1={h * pos / 100} y2={h * pos / 100} stroke="black" stroke-dasharray="4 2" />
            {/each}
            {#each heights as height, i}
              {@const top = heights.slice(0, i).reduce((a: number, b: number) => a + b, 0)}
              {@const mid = top + height / 2}
              <line x1={w/2 - 5} x2={w/2 + 5} y1={h * mid / 100} y2={h * mid / 100} stroke="black" />
            {/each}
          {/if}

          {#if cab.type === 'oven' && (cab as any).drawerHeight}
            {@const drawerH = (cab as any).drawerHeight / $scale}
            <line x1="0" x2={w} y1={h - drawerH} y2={h - drawerH} stroke="black" stroke-dasharray="4 2" />
            <line x1={w/2 - 5} x2={w/2 + 5} y1={h - drawerH/2} y2={h - drawerH/2} stroke="black" />
            {@const ovenHeight = h - drawerH}
            <rect x={w * 0.1} y={ovenHeight * 0.1} width={w * 0.8} height={ovenHeight * 0.8} fill="none" stroke="black" />
            <rect x={w * 0.25} y={ovenHeight * 0.25} width={w * 0.5} height={ovenHeight * 0.5} fill="none" stroke="black" />
          {/if}

          <text x={w/2} y={h/2} text-anchor="middle" dominant-baseline="middle" font-size="12">{cab.id}</text>
        </g>

        <!-- cabinet width dimension -->
        <line x1={CABINET_MARGIN} y1={h + CABINET_MARGIN + CABINET_DIM * 2} x2={w + CABINET_MARGIN} y2={h + CABINET_MARGIN + CABINET_DIM * 2} stroke="black" />
        <line x1={CABINET_MARGIN} y1={h + CABINET_MARGIN + CABINET_DIM * 2 - 5} x2={CABINET_MARGIN} y2={h + CABINET_MARGIN + CABINET_DIM * 2 + 5} stroke="black" />
        <line x1={w + CABINET_MARGIN} y1={h + CABINET_MARGIN + CABINET_DIM * 2 - 5} x2={w + CABINET_MARGIN} y2={h + CABINET_MARGIN + CABINET_DIM * 2 + 5} stroke="black" />
        <text x={CABINET_MARGIN + w / 2} y={h + CABINET_MARGIN + CABINET_DIM * 2 + 15} text-anchor="middle" font-size="10">{Math.round(cab.w)} mm</text>

        <!-- cabinet height dimension -->
        <line x1={w + CABINET_MARGIN + CABINET_DIM} y1={CABINET_MARGIN + CABINET_DIM} x2={w + CABINET_MARGIN + CABINET_DIM} y2={h + CABINET_MARGIN + CABINET_DIM} stroke="black" />
        <line x1={w + CABINET_MARGIN + CABINET_DIM - 5} y1={CABINET_MARGIN + CABINET_DIM} x2={w + CABINET_MARGIN + CABINET_DIM + 5} y2={CABINET_MARGIN + CABINET_DIM} stroke="black" />
        <line x1={w + CABINET_MARGIN + CABINET_DIM - 5} y1={h + CABINET_MARGIN + CABINET_DIM} x2={w + CABINET_MARGIN + CABINET_DIM + 5} y2={h + CABINET_MARGIN + CABINET_DIM} stroke="black" />
        <text x={w + CABINET_MARGIN + CABINET_DIM + 5} y={CABINET_MARGIN + CABINET_DIM + h / 2} font-size="10" dominant-baseline="middle">{Math.round(cab.h)} mm</text>

        <!-- door specific dimensions -->
        {#if cab.type === 'door' && (cab as any).doors}
          {#each Array((cab as any).doors) as _, i}
            {@const doorWidth = w / (cab as any).doors}
            {@const start = CABINET_MARGIN + i * doorWidth}
            {@const end = start + doorWidth}
            <line x1={start} y1={CABINET_MARGIN} x2={end} y2={CABINET_MARGIN} stroke="black" />
            <line x1={start} y1={CABINET_MARGIN - 5} x2={start} y2={CABINET_MARGIN + 5} stroke="black" />
            <line x1={end} y1={CABINET_MARGIN - 5} x2={end} y2={CABINET_MARGIN + 5} stroke="black" />
            <text x={(start + end)/2} y={CABINET_MARGIN - 10} text-anchor="middle" font-size="10">{Math.round(doorWidth * $scale)} mm</text>
          {/each}
        {/if}

        <!-- drawer specific dimensions -->
        {#if cab.type === 'drawer' && (cab as any).heights}
          {@const heights = (cab as any).heights}
          {#each heights as height, i}
            {@const top = CABINET_MARGIN + CABINET_DIM + h * heights.slice(0, i).reduce((a: number, b: number) => a + b, 0) / 100}
            {@const bottom = CABINET_MARGIN + CABINET_DIM + h * heights.slice(0, i + 1).reduce((a: number, b: number) => a + b, 0) / 100}
            <line x1={w + CABINET_MARGIN + CABINET_DIM * 2} y1={top} x2={w + CABINET_MARGIN + CABINET_DIM * 2} y2={bottom} stroke="black" />
            <line x1={w + CABINET_MARGIN + CABINET_DIM * 2 - 5} y1={top} x2={w + CABINET_MARGIN + CABINET_DIM * 2 + 5} y2={top} stroke="black" />
            <line x1={w + CABINET_MARGIN + CABINET_DIM * 2 - 5} y1={bottom} x2={w + CABINET_MARGIN + CABINET_DIM * 2 + 5} y2={bottom} stroke="black" />
            <text x={w + CABINET_MARGIN + CABINET_DIM * 2 + 5} y={(top + bottom)/2} font-size="10" dominant-baseline="middle">{Math.round(height / 100 * cab.h)} mm</text>
          {/each}
          {#if (cab as any).clearance}
            <text x={CABINET_MARGIN} y={CABINET_MARGIN + CABINET_DIM - 5} font-size="10">Clearance {(cab as any).clearance} mm</text>
          {/if}
        {/if}
      </svg>
      <div class="text-xs mt-1 text-center">
        <p>Width: {Math.round(cab.w)} mm</p>
        <p>Height: {Math.round(cab.h)} mm</p>
        <p>Depth: {Math.round(cab.d)} mm</p>
        {#if cab.type === 'door'}
          <p>Doors: {(cab as any).doors}</p>
        {/if}
        {#if cab.type === 'drawer'}
          <p>Drawers: {(cab as any).drawers}</p>
          {#if (cab as any).clearance}
            <p>Clearance: {(cab as any).clearance} mm</p>
          {/if}
        {/if}
        {#if cab.type === 'oven'}
          <p>Drawer Height: {(cab as any).drawerHeight} mm</p>
        {/if}
        {#if cab.type === 'corner' && (cab as any).fixedSide}
          <p>Fixed Side: {(cab as any).fixedSide} mm</p>
        {/if}
      </div>
      <button
        class="mt-2 px-2 py-1 bg-green-600 text-white rounded text-xs"
        on:click={() => exportCab(cab.id)}
      >
        Export {cab.id}
      </button>
    </div>
  {/each}
</div>
