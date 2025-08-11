<script lang="ts">
import { cabinets } from '../stores/cabinets';
import { createEventDispatcher } from 'svelte';
import { scale } from '../stores/scale';
import type { Panel } from '../cabinet/Corpus';

const dispatch = createEventDispatcher();

type View = 'top' | 'north' | 'west' | 'iso';
interface ViewConfig { id: View; label: string; }
const viewConfigs: ViewConfig[] = [
  { id: 'top', label: 'Top View' },
  { id: 'north', label: 'North View' },
  { id: 'west', label: 'West View' }
];

let layoutSvgs: Partial<Record<View, SVGSVGElement>> = {};
let cabinetSvgs: Record<string, SVGSVGElement> = {};

const DIM_OFFSET = 20;
const MARGIN = 40;
const CABINET_MARGIN = 20;
const CABINET_DIM = 20;

interface Bounds { minX: number; minY: number; width: number; height: number; }
interface HeightSegment { start: number; end: number; mid: number; size: number; }

let csvType: 'general' | 'max' = 'general';

let iso: { cabs: any[]; bounds: Bounds } = { cabs: [], bounds: { minX: 0, minY: 0, width: 0, height: 0 } };

$: iso = prepareIso();

function getAxes(view: View) {
  switch (view) {
    case 'north':
      return { left: 'x', width: 'w', top: 'z', height: 'h', filter: (c: any) => c.wall === 'north' } as const;
    case 'west':
      return { left: 'y', width: 'd', top: 'z', height: 'h', filter: (c: any) => c.wall === 'west' } as const;
    default:
      return { left: 'x', width: 'w', top: 'y', height: 'd', filter: (_: any) => true } as const;
  }
}

function getOrientedDims(cab: any) {
  return cab.rotation === 90 || cab.rotation === 270
    ? { w: cab.d, d: cab.w }
    : { w: cab.w, d: cab.d };
}

function getWidthPx(cab: any, axes: { width: 'w' | 'd' }) {
  const dims = getOrientedDims(cab);
  const w = axes.width === 'w' ? dims.w : dims.d;
  return w / $scale;
}

function getHeightPx(cab: any, axes: { height: 'h' | 'd' }) {
  if (axes.height === 'h') return cab.h / $scale;
  const dims = getOrientedDims(cab);
  return dims.d / $scale;
}

function prepare(view: View) {
  const axes = getAxes(view);
  const cabs = $cabinets.filter(axes.filter);
  if (!cabs.length)
    return {
      cabs,
      bounds: { minX: 0, minY: 0, width: 0, height: 0 },
      sorted: [],
      rows: [],
      heightTicks: [],
      heightSegments: [] as HeightSegment[]
    };

  const minX = Math.min(...cabs.map(c => c[axes.left] ?? 0));
  const maxX = Math.max(
    ...cabs.map(c => (c[axes.left] ?? 0) + getWidthPx(c, axes))
  );
  let minY: number;
  let maxY: number;
  if (view === 'top') {
    minY = Math.min(...cabs.map(c => c[axes.top] ?? 0));
    maxY = Math.max(
      ...cabs.map(c => (c[axes.top] ?? 0) + getHeightPx(c, axes))
    );
  } else {
    minY = 0;
    maxY = Math.max(
      ...cabs.map(c => (c[axes.top] ?? 0) / $scale + getHeightPx(c, axes))
    );
  }
  const bounds: Bounds = { minX, minY, width: maxX - minX, height: maxY - minY };

  const sorted = cabs
    .slice()
    .sort((a, b) =>
      view === 'west'
        ? (b[axes.left] ?? 0) - (a[axes.left] ?? 0)
        : (a[axes.left] ?? 0) - (b[axes.left] ?? 0)
    );

  let rows;
  if (view === 'top') {
    const map = new Map<number, any[]>();
    cabs.forEach(cab => {
      const y = Math.round(cab[axes.top] ?? 0);
      const arr = map.get(y) ?? [];
      arr.push(cab);
      map.set(y, arr);
    });
    rows = Array.from(map.entries())
      .map(([y, cabs]) => ({ y, cabinets: cabs.sort((a, b) => (a[axes.left] ?? 0) - (b[axes.left] ?? 0)) }))
      .sort((a, b) => a.y - b.y);
  } else {
    rows = [{ y: 0, cabinets: sorted }];
  }

  const edges = new Set<number>();
  cabs.forEach(cab => {
    if (view === 'top') {
      const top = (cab[axes.top] ?? 0) - minY;
      const bottom = top + getHeightPx(cab, axes);
      edges.add(top);
      edges.add(bottom);
    } else {
      const top =
        bounds.height - ((cab[axes.top] ?? 0) / $scale + getHeightPx(cab, axes));
      const bottom = bounds.height - (cab[axes.top] ?? 0) / $scale;
      edges.add(top);
      edges.add(bottom);
    }
  });
  edges.add(0);
  edges.add(bounds.height);
  const heightTicks = Array.from(edges).sort((a, b) => a - b);
  const heightSegments = heightTicks.slice(0, -1).map((start, i) => ({
    start,
    end: heightTicks[i + 1],
    mid: (start + heightTicks[i + 1]) / 2,
    size: Math.round((heightTicks[i + 1] - start) * $scale)
  }));

  return { cabs, bounds, sorted, rows, heightTicks, heightSegments };
}

function prepareIso() {
  const cabs = $cabinets;
  if (!cabs.length) return { cabs, bounds: { minX: 0, minY: 0, width: 0, height: 0 } };
  const points: { x: number; y: number }[] = [];
  cabs.forEach(cab => {
    const x = cab.x ?? 0;
    const y = cab.y ?? 0;
    const z = (cab.z ?? 0) / $scale;
    const dims = getOrientedDims(cab);
    const w = dims.w / $scale;
    const d = dims.d / $scale;
    const h = cab.h / $scale;
    const corners = [
      isoProject(x, y, z + h),
      isoProject(x + w, y, z + h),
      isoProject(x + w, y + d, z + h),
      isoProject(x, y + d, z + h),
      isoProject(x, y, z),
      isoProject(x + w, y, z),
      isoProject(x + w, y + d, z),
      isoProject(x, y + d, z)
    ];
    points.push(...corners);
  });
  const minX = Math.min(...points.map(p => p.x));
  const maxX = Math.max(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y));
  const maxY = Math.max(...points.map(p => p.y));
  const bounds: Bounds = { minX, minY, width: maxX - minX, height: maxY - minY };
  return { cabs, bounds };
}

function isoProject(x: number, y: number, z: number) {
  return {
    x: x - y,
    y: (x + y) / 2 - z
  };
}

const totalWidthMm = (b: Bounds) => Math.round(b.width * $scale);
const totalHeightMm = (b: Bounds) => Math.round(b.height * $scale);
const svgWidth = (b: Bounds) => b.width + MARGIN + DIM_OFFSET * 5;
const svgHeight = (b: Bounds) => b.height + MARGIN + DIM_OFFSET * 5;

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

function exportLayout(view: View) {
  const el = layoutSvgs[view];
  if (el) exportSVG(el, `${view}-layout-summary.svg`);
}

function exportCab(id: string) {
  const el = cabinetSvgs[id];
  if (el) exportSVG(el, `${id}.svg`);
}

function downloadCSV() {
  const csv = csvType === 'general' ? csvGeneral() : csvMaxMoris();
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cabinet_panels.csv';
  a.click();
}

function csvGeneral() {
  let csv = "length (mm),width (mm),quantity,edge banding length right,edge banding length left,edge banding width bottom,edge banding width top,label,hinge location,material name,material thickness\n";

  $cabinets.forEach(cab => {
    cab.panels().forEach((p: Panel) => {
      csv += [
        p.length,
        p.width,
        p.quantity,
        p.edgeBandingLengthRight,
        p.edgeBandingLengthLeft,
        p.edgeBandingWidthBottom,
        p.edgeBandingWidthTop,
        p.label,
        p.hingeLocation,
        p.material,
        p.materialThickness
      ].join(",") + "\n";
    });
  });

  return csv;
}

function csvMaxMoris() {
  let csv = "BR.,ŠIFRA MATERIJALA,DEB. mm,NAZIV ELEMENTA U KORPUSU,NAZIV KORPUSA,DUŽINA (Smjer goda) mm,ŠIRINA mm,KOM.,DUPLA PLOČA,ABS 2mm - DUŽINA (Prednji rub),ABS 2mm - DUŽINA (Stražnji rub),ABS 2mm - ŠIRINA (Lijevi rub),ABS 2mm - ŠIRINA (Desni rub),ABS 1mm - DUŽINA (Prednji rub),ABS 1mm - DUŽINA (Stražnji rub),ABS 1mm - ŠIRINA (Lijevi rub),ABS 1mm - ŠIRINA (Desni rub),ABS 0.5mm - DUŽINA (Prednji rub),ABS 0.5mm - DUŽINA (Stražnji rub),ABS 0.5mm - ŠIRINA (Lijevi rub),ABS 0.5mm - ŠIRINA (Desni rub),UTOR/LIMBEL,UKOP ZA BRITVELE,NAPOMENA\n";

  let index = 1;
  $cabinets.forEach(cab => {
    cab.panels().forEach((p: Panel) => {
      csv += [
        index,
        p.material,
        p.materialThickness,
        p.label.split("->")[1],
        p.label.split("->")[0],
        p.length,
        p.width,
        p.quantity,
        'NE',
        '',
        '',
        '',
        '',
        p.edgeBandingLengthRight,
        p.edgeBandingLengthLeft,
        p.edgeBandingWidthBottom,
        p.edgeBandingWidthTop,
        '',
        '',
        '',
        '',
        '',
        p.hingeLocation,
        ''
      ].join(",") + "\n";

      index++;
    });
  });

  return csv;
}
</script>

<div class="mb-4 flex gap-2 items-center">
  <select bind:value={csvType} class="border p-2">
    <option value="general">General</option>
    <option value="max">Max Moris</option>
  </select>
  <button class="px-4 py-2 bg-green-600 text-white rounded" on:click={downloadCSV}>Download CSV</button>
  <button class="px-4 py-2 bg-gray-600 text-white rounded" on:click={() => exportLayout('top')}>Export Top</button>
  <button class="px-4 py-2 bg-gray-600 text-white rounded" on:click={() => exportLayout('north')}>Export North</button>
  <button class="px-4 py-2 bg-gray-600 text-white rounded" on:click={() => exportLayout('west')}>Export West</button>
  <button class="px-4 py-2 bg-gray-600 text-white rounded" on:click={() => exportLayout('iso')}>Export 3D</button>
  <button class="px-4 py-2 bg-blue-600 text-white rounded" on:click={() => dispatch('close')}>Back</button>
</div>

<h3 class="font-semibold mb-2">3D View</h3>
<svg
  bind:this={layoutSvgs['iso']}
  width={iso.bounds.width + MARGIN * 2}
  height={iso.bounds.height + MARGIN * 2}
  style="border:1px solid #000"
>
  <defs>
    <pattern id="hatch-iso" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="4" stroke="black" stroke-width="0.5" />
    </pattern>
  </defs>
  <g transform={`translate(${MARGIN - iso.bounds.minX},${MARGIN - iso.bounds.minY})`}>
    {#each iso.cabs as cab}
      {@const x = cab.x ?? 0}
      {@const y = cab.y ?? 0}
      {@const z = (cab.z ?? 0) / $scale}
      {@const dims = cab.rotation === 90 || cab.rotation === 270 ? { w: cab.d, d: cab.w } : { w: cab.w, d: cab.d }}
      {@const w = dims.w / $scale}
      {@const d = dims.d / $scale}
      {@const h = cab.h / $scale}
      {@const p1 = isoProject(x, y, z)}
      {@const p2 = isoProject(x + w, y, z)}
      {@const p3 = isoProject(x + w, y + d, z)}
      {@const p4 = isoProject(x, y + d, z)}
      {@const p5 = isoProject(x, y, z + h)}
      {@const p6 = isoProject(x + w, y, z + h)}
      {@const p7 = isoProject(x + w, y + d, z + h)}
      {@const p8 = isoProject(x, y + d, z + h)}
      <polygon points={`${p5.x},${p5.y} ${p6.x},${p6.y} ${p7.x},${p7.y} ${p8.x},${p8.y}`} fill="none" stroke="black" />
      <polyline points={`${p1.x},${p1.y} ${p5.x},${p5.y}`} stroke="black" />
      <polyline points={`${p2.x},${p2.y} ${p6.x},${p6.y}`} stroke="black" />
      <polyline points={`${p3.x},${p3.y} ${p7.x},${p7.y}`} stroke="black" />
      <polyline points={`${p4.x},${p4.y} ${p8.x},${p8.y}`} stroke="black" />
      <polyline points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y} ${p1.x},${p1.y}`} stroke="black" fill="none" />

      {#if cab.type === 'corner' && (cab as any).fixedSide}
        {@const fixed = (cab as any).fixedSide / $scale}
        {@const c1 = isoProject(x, y, z + h)}
        {@const c2 = isoProject(x + fixed, y, z + h)}
        {@const c3 = isoProject(x + fixed, y + d, z + h)}
        {@const c4 = isoProject(x, y + d, z + h)}
        <polygon points={`${c1.x},${c1.y} ${c2.x},${c2.y} ${c3.x},${c3.y} ${c4.x},${c4.y}`} fill="url(#hatch-iso)" />
        {@const l1 = isoProject(x + fixed, y, z + h)}
        {@const l2 = isoProject(x + fixed, y + d, z + h)}
        <line x1={l1.x} y1={l1.y} x2={l2.x} y2={l2.y} stroke="black" stroke-dasharray="4 2" />
      {/if}

      {#if cab.wall === 'north'}
        {#if cab.type === 'door' && (cab as any).doors}
          {#each Array((cab as any).doors - 1) as _, i}
            {@const xPos = x + w * (i + 1) / (cab as any).doors}
            {@const pBottom = isoProject(xPos, y + d, z)}
            {@const pTop = isoProject(xPos, y + d, z + h)}
            <line x1={pBottom.x} y1={pBottom.y} x2={pTop.x} y2={pTop.y} stroke="black" stroke-dasharray="4 2" />
          {/each}
          {#each Array((cab as any).doors) as _, i}
            {@const doorWidth = w / (cab as any).doors}
            {@const doorX = x + i * doorWidth}
            {@const handleX = (cab as any).doors === 1 ? doorX + doorWidth - 5 : i === 0 ? doorX + doorWidth - 5 : doorX + 5}
            {@const pHandleBottom = isoProject(handleX, y + d, z + h / 2 - 5)}
            {@const pHandleTop = isoProject(handleX, y + d, z + h / 2 + 5)}
            <line x1={pHandleBottom.x} y1={pHandleBottom.y} x2={pHandleTop.x} y2={pHandleTop.y} stroke="black" />
          {/each}
        {/if}

        {#if cab.type === 'drawer' && (cab as any).heights}
          {@const heights = (cab as any).heights}
          {#each heights.slice(0, -1) as _, i}
            {@const pos = heights.slice(0, i + 1).reduce((a: number, b: number) => a + b, 0)}
            {@const pLeft = isoProject(x, y + d, z + h * pos / 100)}
            {@const pRight = isoProject(x + w, y + d, z + h * pos / 100)}
            <line x1={pLeft.x} y1={pLeft.y} x2={pRight.x} y2={pRight.y} stroke="black" stroke-dasharray="4 2" />
          {/each}
          {#each heights as height, i}
            {@const top = heights.slice(0, i).reduce((a: number, b: number) => a + b, 0)}
            {@const mid = top + height / 2}
            {@const pLeft = isoProject(x + w / 2 - 5, y + d, z + h * mid / 100)}
            {@const pRight = isoProject(x + w / 2 + 5, y + d, z + h * mid / 100)}
            <line x1={pLeft.x} y1={pLeft.y} x2={pRight.x} y2={pRight.y} stroke="black" />
          {/each}
        {/if}

        {#if cab.type === 'oven' && (cab as any).drawerHeight}
          {@const drawerH = (cab as any).drawerHeight / $scale}
          {@const pLeft = isoProject(x, y + d, z + drawerH)}
          {@const pRight = isoProject(x + w, y + d, z + drawerH)}
          <line x1={pLeft.x} y1={pLeft.y} x2={pRight.x} y2={pRight.y} stroke="black" stroke-dasharray="4 2" />
          {@const pHandleLeft = isoProject(x + w / 2 - 5, y + d, z + drawerH / 2)}
          {@const pHandleRight = isoProject(x + w / 2 + 5, y + d, z + drawerH / 2)}
          <line x1={pHandleLeft.x} y1={pHandleLeft.y} x2={pHandleRight.x} y2={pHandleRight.y} stroke="black" />
          {@const ovenHeight = h - drawerH}
          {@const o1 = isoProject(x + w * 0.1, y + d, z + drawerH + ovenHeight * 0.1)}
          {@const o2 = isoProject(x + w * 0.9, y + d, z + drawerH + ovenHeight * 0.1)}
          {@const o3 = isoProject(x + w * 0.9, y + d, z + drawerH + ovenHeight * 0.9)}
          {@const o4 = isoProject(x + w * 0.1, y + d, z + drawerH + ovenHeight * 0.9)}
          <polygon points={`${o1.x},${o1.y} ${o2.x},${o2.y} ${o3.x},${o3.y} ${o4.x},${o4.y}`} fill="none" stroke="black" />
          {@const i1 = isoProject(x + w * 0.25, y + d, z + drawerH + ovenHeight * 0.25)}
          {@const i2 = isoProject(x + w * 0.75, y + d, z + drawerH + ovenHeight * 0.25)}
          {@const i3 = isoProject(x + w * 0.75, y + d, z + drawerH + ovenHeight * 0.75)}
          {@const i4 = isoProject(x + w * 0.25, y + d, z + drawerH + ovenHeight * 0.75)}
          <polygon points={`${i1.x},${i1.y} ${i2.x},${i2.y} ${i3.x},${i3.y} ${i4.x},${i4.y}`} fill="none" stroke="black" />
        {/if}
      {:else if cab.wall === 'west'}
        {#if cab.type === 'door' && (cab as any).doors}
          {#each Array((cab as any).doors - 1) as _, i}
            {@const yPos = y + d * (i + 1) / (cab as any).doors}
            {@const pBottom = isoProject(x + w, yPos, z)}
            {@const pTop = isoProject(x + w, yPos, z + h)}
            <line x1={pBottom.x} y1={pBottom.y} x2={pTop.x} y2={pTop.y} stroke="black" stroke-dasharray="4 2" />
          {/each}
          {#each Array((cab as any).doors) as _, i}
            {@const doorWidth = d / (cab as any).doors}
            {@const doorY = y + i * doorWidth}
            {@const handleY = (cab as any).doors === 1 ? doorY + doorWidth - 5 : i === 0 ? doorY + doorWidth - 5 : doorY + 5}
            {@const pHandleBottom = isoProject(x + w, handleY, z + h / 2 - 5)}
            {@const pHandleTop = isoProject(x + w, handleY, z + h / 2 + 5)}
            <line x1={pHandleBottom.x} y1={pHandleBottom.y} x2={pHandleTop.x} y2={pHandleTop.y} stroke="black" />
          {/each}
        {/if}

        {#if cab.type === 'drawer' && (cab as any).heights}
          {@const heights = (cab as any).heights}
          {#each heights.slice(0, -1) as _, i}
            {@const pos = heights.slice(0, i + 1).reduce((a: number, b: number) => a + b, 0)}
            {@const pTopLeft = isoProject(x + w, y, z + h * pos / 100)}
            {@const pTopRight = isoProject(x + w, y + d, z + h * pos / 100)}
            <line x1={pTopLeft.x} y1={pTopLeft.y} x2={pTopRight.x} y2={pTopRight.y} stroke="black" stroke-dasharray="4 2" />
          {/each}
          {#each heights as height, i}
            {@const top = heights.slice(0, i).reduce((a: number, b: number) => a + b, 0)}
            {@const mid = top + height / 2}
            {@const pHandleLeft = isoProject(x + w, y + d / 2 - 5, z + h * mid / 100)}
            {@const pHandleRight = isoProject(x + w, y + d / 2 + 5, z + h * mid / 100)}
            <line x1={pHandleLeft.x} y1={pHandleLeft.y} x2={pHandleRight.x} y2={pHandleRight.y} stroke="black" />
          {/each}
        {/if}

        {#if cab.type === 'oven' && (cab as any).drawerHeight}
          {@const drawerH = (cab as any).drawerHeight / $scale}
          {@const pTopLeft = isoProject(x + w, y, z + drawerH)}
          {@const pTopRight = isoProject(x + w, y + d, z + drawerH)}
          <line x1={pTopLeft.x} y1={pTopLeft.y} x2={pTopRight.x} y2={pTopRight.y} stroke="black" stroke-dasharray="4 2" />
          {@const pHandleLeft = isoProject(x + w, y + d / 2 - 5, z + drawerH / 2)}
          {@const pHandleRight = isoProject(x + w, y + d / 2 + 5, z + drawerH / 2)}
          <line x1={pHandleLeft.x} y1={pHandleLeft.y} x2={pHandleRight.x} y2={pHandleRight.y} stroke="black" />
          {@const ovenHeight = h - drawerH}
          {@const o1 = isoProject(x + w, y + d * 0.1, z + drawerH + ovenHeight * 0.1)}
          {@const o2 = isoProject(x + w, y + d * 0.9, z + drawerH + ovenHeight * 0.1)}
          {@const o3 = isoProject(x + w, y + d * 0.9, z + drawerH + ovenHeight * 0.9)}
          {@const o4 = isoProject(x + w, y + d * 0.1, z + drawerH + ovenHeight * 0.9)}
          <polygon points={`${o1.x},${o1.y} ${o2.x},${o2.y} ${o3.x},${o3.y} ${o4.x},${o4.y}`} fill="none" stroke="black" />
          {@const i1 = isoProject(x + w, y + d * 0.25, z + drawerH + ovenHeight * 0.25)}
          {@const i2 = isoProject(x + w, y + d * 0.75, z + drawerH + ovenHeight * 0.25)}
          {@const i3 = isoProject(x + w, y + d * 0.75, z + drawerH + ovenHeight * 0.75)}
          {@const i4 = isoProject(x + w, y + d * 0.25, z + drawerH + ovenHeight * 0.75)}
          <polygon points={`${i1.x},${i1.y} ${i2.x},${i2.y} ${i3.x},${i3.y} ${i4.x},${i4.y}`} fill="none" stroke="black" />
        {/if}
      {/if}
    {/each}
  </g>
</svg>
<p>Total width: {totalWidthMm(iso.bounds)} mm, Total height: {totalHeightMm(iso.bounds)} mm</p>

{#each viewConfigs as v}
  {@const data = prepare(v.id)}
  {@const axes = getAxes(v.id)}
  <h3 class="font-semibold mb-2">{v.label}</h3>
  <svg
    bind:this={layoutSvgs[v.id]}
    width={svgWidth(data.bounds)}
    height={svgHeight(data.bounds)}
    style="border:1px solid #000"
  >
    <defs>
      <pattern id={`hatch-${v.id}`} patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="4" stroke="black" stroke-width="0.5" />
      </pattern>
    </defs>
    {#each data.sorted as cab}
      {@const baseX = (cab[axes.left] ?? 0) - data.bounds.minX}
      {@const w = getWidthPx(cab, axes)}
      {@const h = getHeightPx(cab, axes)}
      {@const x = v.id === 'west'
        ? data.bounds.width - (baseX + w) + MARGIN
        : baseX + MARGIN}
      {@const y = v.id === 'top'
        ? (cab[axes.top] ?? 0) - data.bounds.minY + MARGIN
        : data.bounds.height - ((cab[axes.top] ?? 0) / $scale + h) + MARGIN}
      {#if cab.type === 'corner' && (cab as any).fixedSide}
        {@const fixed = (cab as any).fixedSide / $scale}
        <rect x={x} y={y} width={fixed} height={h} fill={`url(#hatch-${v.id})`} />
      {/if}
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="black" />

      {#if cab.type === 'corner' && (cab as any).fixedSide}
        <line x1={x + (cab as any).fixedSide / $scale} y1={y} x2={x + (cab as any).fixedSide / $scale} y2={y + h} stroke="black" stroke-dasharray="4 2" />
      {/if}

      {#if v.id !== 'top'}
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
      {/if}

      <text x={x + w / 2} y={y + h / 2} text-anchor="middle" dominant-baseline="middle" font-size="12">{cab.id}</text>
    {/each}

    <!-- horizontal dimension line -->
    <line x1={MARGIN} y1={data.bounds.height + MARGIN + DIM_OFFSET} x2={data.bounds.width + MARGIN} y2={data.bounds.height + MARGIN + DIM_OFFSET} stroke="black" />
    {#each data.sorted as cab}
      {@const baseX = (cab[axes.left] ?? 0) - data.bounds.minX}
      {@const w = getWidthPx(cab, axes)}
      {@const x = v.id === 'west'
        ? data.bounds.width - (baseX + w) + MARGIN
        : baseX + MARGIN}
      {@const widthMm = axes.width === 'w'
        ? getOrientedDims(cab).w
        : getOrientedDims(cab).d}
      <line x1={x} y1={data.bounds.height + MARGIN + DIM_OFFSET - 5} x2={x} y2={data.bounds.height + MARGIN + DIM_OFFSET + 5} stroke="black" />
      <line x1={x + w} y1={data.bounds.height + MARGIN + DIM_OFFSET - 5} x2={x + w} y2={data.bounds.height + MARGIN + DIM_OFFSET + 5} stroke="black" />
      <text x={x + w / 2} y={data.bounds.height + MARGIN + DIM_OFFSET + 15} text-anchor="middle" font-size="12">{Math.round(widthMm)} mm</text>
    {/each}
    <text x={data.bounds.width / 2 + MARGIN} y={data.bounds.height + MARGIN + DIM_OFFSET + 35} text-anchor="middle" font-size="12">Total {totalWidthMm(data.bounds)} mm</text>

    <!-- total height dimension line -->
    <line x1={data.bounds.width + MARGIN + DIM_OFFSET} y1={MARGIN} x2={data.bounds.width + MARGIN + DIM_OFFSET} y2={data.bounds.height + MARGIN} stroke="black" />
    {#each data.heightTicks as pos}
      <line x1={data.bounds.width + MARGIN + DIM_OFFSET - 5} y1={MARGIN + pos} x2={data.bounds.width + MARGIN + DIM_OFFSET + 5} y2={MARGIN + pos} stroke="black" />
    {/each}
    {#each data.heightSegments as seg}
      <text x={data.bounds.width + MARGIN + DIM_OFFSET + 5} y={MARGIN + seg.mid} font-size="12" dominant-baseline="middle">{seg.size} mm</text>
    {/each}
  </svg>
  <p>Total width: {totalWidthMm(data.bounds)} mm, Total height: {totalHeightMm(data.bounds)} mm</p>
{/each}

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
