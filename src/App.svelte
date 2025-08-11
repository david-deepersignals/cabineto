<script lang="ts">
import Form from "./components/Form.svelte";
import SettingsModal from "./components/SettingsModal.svelte";
import LayoutSummary from "./components/LayoutSummary.svelte";
import BackupModal from "./components/BackupModal.svelte";
import { cabinets } from './stores/cabinets';
import { scale } from './stores/scale';
import { room } from './stores/room';
import type { Corpus } from './cabinet/Corpus';

const GRID_SIZE = 5;
let layoutWidthMm = 1000;
let layoutHeightMm = 500;
let layout: HTMLDivElement;

type View = 'top' | 'front' | 'side';
let view: View = 'top';
let plane = 0;
const DEFAULT_PLANES = [0];

$: planeOptions = Array.from(new Set([...DEFAULT_PLANES, ...$cabinets.map(c => c.z ?? 0)])).sort((a,b) => a - b);
$: {
  if (planeOptions.length && !planeOptions.includes(plane)) plane = planeOptions[0];
}

function getAxes(v: View) {
  switch (v) {
    case 'front':
      return { left: 'x', top: 'z', width: 'w', height: 'h' } as const;
    case 'side':
      return { left: 'y', top: 'z', width: 'd', height: 'h' } as const;
    default:
      return { left: 'x', top: 'y', width: 'w', height: 'd' } as const;
  }
}

function viewChange(v: View){
  view = v
  cabinets.update(cabs => [...cabs]);
}

$: axes = getAxes(view);

function getOrientedDims(cab: any) {
  return cab.rotation === 90 || cab.rotation === 270
    ? { w: cab.d, d: cab.w }
    : { w: cab.w, d: cab.d };
}

function getCabinetWidthRaw(cab: any) {
  const dims = getOrientedDims(cab);
  return axes.width === 'w' ? dims.w : dims.d;
}

function getCabinetHeightRaw(cab: any) {
  if (axes.height === 'h') return cab.h;
  const dims = getOrientedDims(cab);
  return dims.d;
}

function getCabinetWidth(cab: any) {
  return getCabinetWidthRaw(cab) / $scale;
}

function getCabinetHeight(cab: any) {
  return getCabinetHeightRaw(cab) / $scale;
}

function getCabinetLeft(cab: any) {
  if (view === 'side') {
    const w = getCabinetWidth(cab);
    return layoutWidth - (cab.y ?? 0) - w;
  }
  return cab[axes.left] ?? 0;
}

function setCabinetLeft(cab: any, left: number, w: number) {
  if (view === 'side') {
    cab.y = layoutWidth - left - w;
  } else {
    cab[axes.left] = left;
  }
}

function getCabinetTop(cab: any) {
  if (view === 'top') return cab[axes.top] ?? 0;
  const bottom = (cab.z ?? 0) / $scale;
  const h = getCabinetHeight(cab);
  return layoutHeight - bottom - h;
}

function setCabinetTop(cab: any, top: number, h: number) {
  if (view === 'top') {
    cab[axes.top] = top;
  } else {
    cab.z = layoutHeightMm - (top + h) * $scale;
  }
}

function getRotationTransform(rot: number) {
  const angle = ((rot % 360) + 360) % 360;
  switch (angle) {
    case 90:
      return 'rotate(90deg) translate(0, -100%)';
    case 180:
      return 'rotate(180deg) translate(-100%, -100%)';
    case 270:
      return 'rotate(270deg) translate(-100%, 0)';
    default:
      return '';
  }
}

function getCabinetRect(cab: any) {
  return {
    x: getCabinetLeft(cab),
    y: getCabinetTop(cab),
    w: getCabinetWidth(cab) || 100,
    h: getCabinetHeight(cab) || 100
  };
}

function isAligned(cab: any) {
  if (view === 'front') {
    return cab.wall === 'north';
  }
  if (view === 'side') {
    return cab.wall === 'west';
  }
  return true;
}

function isActive(cab: any) {
  if (view === 'top') {
    return (cab.z ?? 0) === plane;
  }
  return isAligned(cab);
}

$: layoutWidthMm = view === 'side' ? $room.depth : $room.width;
$: layoutHeightMm = view === 'top' ? $room.depth : $room.height;
$: layoutWidth = layoutWidthMm / $scale;
$: layoutHeight = layoutHeightMm / $scale;

let showForm = false;
  let showSettings = false;
  let showSummary = false;
  let showBackup = false;
  let editingCabinet: Corpus | null = null;

  const openAddForm = () => {
    editingCabinet = null;
    showForm = true;
  };

  const openEditForm = (cab: Corpus) => {
    editingCabinet = cab;
    showForm = true;
  };

  const closeForm = () => {
    showForm = false;
    editingCabinet = null;
  };

  const toggleSettings = () => {
    showSettings = !showSettings;
  };

  const toggleBackup = () => {
    showBackup = !showBackup;
  };

  const deleteCabinet = (id: string) => {
    cabinets.update(cabs => cabs.filter(c => c.id !== id));
  };

  const rotateCabinet = (id: string) => {
    cabinets.update(current => {
      const index = current.findIndex(c => c.id === id);
      if (index !== -1) {
        const cab: any = current[index];
        cab.rotation = ((cab.rotation ?? 0) + 90) % 360;
        const w = getCabinetWidth(cab);
        const h = getCabinetHeight(cab);
        cab.x = Math.max(0, Math.min(layoutWidth - w, cab.x ?? 0));
        cab.y = Math.max(0, Math.min(layoutHeight - h, cab.y ?? 0));
        let leftPos = cab.x ?? 0;
        let topPos = cab.y ?? 0;
        const distances = [
          { side: 'west', val: leftPos },
          { side: 'north', val: topPos },
          { side: 'east', val: layoutWidth - (leftPos + w) },
          { side: 'south', val: layoutHeight - (topPos + h) }
        ];
        const nearest = distances.reduce((a, b) => (a.val < b.val ? a : b));
        switch (nearest.side) {
          case 'west':
            leftPos = 0;
            cab.wall = 'west';
            break;
          case 'north':
            topPos = 0;
            cab.wall = 'north';
            break;
          case 'east':
            leftPos = layoutWidth - w;
            cab.wall = 'east';
            break;
          case 'south':
            topPos = layoutHeight - h;
            cab.wall = 'south';
            break;
        }
        cab.x = leftPos;
        cab.y = topPos;
        current[index] = cab;
      }
      return [...current];
    });
  };

  const zoomIn = () => scale.update(s => Math.max(0.5, s - 0.5));
  const zoomOut = () => scale.update(s => s + 0.5);

  let dragInfo: {
    isDragging: boolean;
    offsetX: number;
    offsetY: number;
    targetId: string | null;
    layoutLeft: number;
    layoutTop: number;
  } = {
    isDragging: false,
    offsetX: 0,
    offsetY: 0,
    targetId: null,
    layoutLeft: 0,
    layoutTop: 0
  };


  function startDrag(event: MouseEvent, cabinetId: string) {
    // Find the cabinet being dragged
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const layoutRect = layout.getBoundingClientRect();

    dragInfo.isDragging = true;
    dragInfo.targetId = cabinetId;
    dragInfo.offsetX = event.clientX - rect.left;
    dragInfo.offsetY = event.clientY - rect.top;
    dragInfo.layoutLeft = layoutRect.left;
    dragInfo.layoutTop = layoutRect.top;
  }

  function handleDrag(event: MouseEvent) {
    if (!dragInfo.isDragging || dragInfo.targetId === null) return;

    let left = event.clientX - dragInfo.layoutLeft - dragInfo.offsetX;
    let top = event.clientY - dragInfo.layoutTop - dragInfo.offsetY;

    const index = $cabinets.findIndex((cab) => cab.id === dragInfo.targetId);
    const currentCab: any = $cabinets[index];
    const w = getCabinetWidth(currentCab);
    const h = getCabinetHeight(currentCab);
    left = Math.max(0, Math.min(layoutWidth - w, left));
    top = Math.max(0, Math.min(layoutHeight - h, top));

    cabinets.update((current) => {
      const i = current.findIndex((cab) => cab.id === dragInfo.targetId);
      if (i !== -1) {
        const cab: any = current[i];
        setCabinetLeft(cab, left, w);
        setCabinetTop(cab, top, h);
        current[i] = cab;
      }
      return [...current];
    });
  }

  function stopDrag() {
    if (!dragInfo.isDragging) return;

    cabinets.update((current) => {
      const index = current.findIndex((cab) => cab.id === dragInfo.targetId);
      if (index === -1) return current;

      const draggedCabinet: any = current[index];
      let finalLeft = Math.round((getCabinetLeft(draggedCabinet) / GRID_SIZE)) * GRID_SIZE;
      let finalTop = Math.round((getCabinetTop(draggedCabinet) / GRID_SIZE)) * GRID_SIZE;

      const w = getCabinetWidth(draggedCabinet) || 100;
      const h = getCabinetHeight(draggedCabinet) || 100;

      finalLeft = Math.max(0, Math.min(layoutWidth - w, finalLeft));
      finalTop = Math.max(0, Math.min(layoutHeight - h, finalTop));

      const rect1 = { x: finalLeft, y: finalTop, w, h };

      let collision = false;
      let bestSnap = null;

      // Check for collisions
      current.forEach((otherCabinet: any, i) => {
        if (i === index) return;

        const rect2 = getCabinetRect(otherCabinet);

        if (
                rect1.x < rect2.x + rect2.w &&
                rect1.x + rect1.w > rect2.x &&
                rect1.y < rect2.y + rect2.h &&
                rect1.y + rect1.h > rect2.y
        ) {
          collision = true;

          const snapOptions: [number, number][] = [
            [rect2.x - rect1.w, rect2.y],         // Snap to left of other
            [rect2.x + rect2.w, rect2.y],         // Snap to right of other
            [rect2.x, rect2.y - rect1.h],         // Snap above other
            [rect2.x, rect2.y + rect2.h],         // Snap below other
            [rect2.x, rect2.y]                   // Snap to overlap other
          ];

          for (let [snapX, snapY] of snapOptions) {
            snapX = Math.round(snapX / GRID_SIZE) * GRID_SIZE;
            snapY = Math.round(snapY / GRID_SIZE) * GRID_SIZE;

            snapX = Math.max(0, Math.min(layoutWidth - rect1.w, snapX));
            snapY = Math.max(0, Math.min(layoutHeight - rect1.h, snapY));

            const testRect = { x: snapX, y: snapY, w: rect1.w, h: rect1.h };

            // Check if the new position overlaps with other cabinets
            const overlap = current.some((other2, j) => {
              if (j === index || j === i) return false;

            const rect3 = getCabinetRect(other2);

              return (
                      testRect.x < rect3.x + rect3.w &&
                      testRect.x + testRect.w > rect3.x &&
                      testRect.y < rect3.y + rect3.h &&
                      testRect.y + testRect.h > rect3.y
              );
            });

            if (!overlap) {
              bestSnap = [snapX, snapY];
              break;
            }
          }
        }
      });

      // Update cabinet position based on collision resolution
      if (!collision || bestSnap === null) {
        setCabinetLeft(draggedCabinet, finalLeft, w);
        setCabinetTop(draggedCabinet, finalTop, h);
      } else {
        setCabinetLeft(draggedCabinet, bestSnap[0], w);
        setCabinetTop(draggedCabinet, bestSnap[1], h);
      }

      if (view === 'top') {
        let leftPos = getCabinetLeft(draggedCabinet);
        let topPos = getCabinetTop(draggedCabinet);
        const distances = [
          { side: 'west', val: leftPos },
          { side: 'north', val: topPos },
          { side: 'east', val: layoutWidth - (leftPos + w) },
          { side: 'south', val: layoutHeight - (topPos + h) }
        ];
        const nearest = distances.reduce((a, b) => (a.val < b.val ? a : b));
        switch (nearest.side) {
          case 'west':
            leftPos = 0;
            draggedCabinet.wall = 'west';
            break;
          case 'north':
            topPos = 0;
            draggedCabinet.wall = 'north';
            break;
          case 'east':
            leftPos = layoutWidth - w;
            draggedCabinet.wall = 'east';
            break;
          case 'south':
            topPos = layoutHeight - h;
            draggedCabinet.wall = 'south';
            break;
        }
        setCabinetLeft(draggedCabinet, leftPos, w);
        setCabinetTop(draggedCabinet, topPos, h);
      }

      current[index] = draggedCabinet;
      return [...current];
    });

    dragInfo.isDragging = false;
    dragInfo.targetId = null;
  }


  // Attach event listeners to handle global mouse move and mouse up
  window.addEventListener("mousemove", handleDrag);
  window.addEventListener("mouseup", stopDrag);





  $: depthMismatch = new Set<string>();
  $: {
    depthMismatch.clear();
    if (view === 'top') {
      const list = $cabinets;
      for (let i = 0; i < list.length; i++) {
        const a: any = list[i];
        const aw = getCabinetWidth(a);
        const ah = getCabinetHeight(a);
        const adepth = (a.rotation === 90 || a.rotation === 270) ? a.w : a.d;
        const ax = a.x ?? 0;
        const ay = a.y ?? 0;
        for (let j = i + 1; j < list.length; j++) {
          const b: any = list[j];
          const bw = getCabinetWidth(b);
          const bh = getCabinetHeight(b);
          const bdepth = (b.rotation === 90 || b.rotation === 270) ? b.w : b.d;
          const bx = b.x ?? 0;
          const by = b.y ?? 0;
          const verticalOverlap = ay < by + bh && by < ay + ah;
          const touching = Math.abs(ax + aw - bx) < 1 || Math.abs(bx + bw - ax) < 1;
          if (verticalOverlap && touching && adepth !== bdepth) {
            depthMismatch.add(a.id);
            depthMismatch.add(b.id);
          }
        }
      }
    }
  }

</script>

<style>
  .layout-container {
    position: relative;
    margin-bottom: 40px;
    margin-right: 40px;
  }
  #layout {
    border: 2px dashed #ccc;
    position: relative;
    background-color: #f8fafc;
    background-image: linear-gradient(#e5e7eb 1px, transparent 1px),
      linear-gradient(90deg, #e5e7eb 1px, transparent 1px);
    background-size: 10px 10px;
  }
  .cabinet {
    position: absolute;
    border: 2px solid #444;
    background: linear-gradient(135deg, rgba(100,150,240,0.6), rgba(100,150,240,0.3));
    box-shadow: 3px 3px 4px rgba(0,0,0,0.2);
    padding: 4px;
    text-align: center;
    font-size: 10px;
    cursor: move;
  }
  .cabinet.inactive {
    border-color: #ccc;
    cursor: default;
    opacity: 0.3;
    box-shadow: none;
    pointer-events: none;
  }
  .cabinet .controls {
    position: absolute;
    top: 2px;
    right: 2px;
    display: flex;
    gap: 2px;
  }
  .cabinet .controls button {
    background: #fff;
    border: 1px solid #ccc;
    padding: 0 2px;
    font-size: 10px;
    cursor: pointer;
  }
  .dim-x {
    position: absolute;
    bottom: -20px;
    left: 0;
    width: 100%;
    height: 20px;
    border-top: 1px solid #999;
  }
  .dim-y {
    position: absolute;
    top: 0;
    right: -20px;
    width: 20px;
    height: 100%;
    border-left: 1px solid #999;
  }
  .dim-x .tick {
    position: absolute;
    bottom: 0;
    border-left: 1px solid #999;
    height: 10px;
  }
  .dim-x .tick span {
    position: absolute;
    top: 10px;
    transform: translateX(-50%);
    font-size: 10px;
  }
  .dim-y .tick {
    position: absolute;
    right: 0;
    border-top: 1px solid #999;
    width: 10px;
  }
  .dim-y .tick span {
    position: absolute;
    left: 10px;
    transform: translateY(-50%);
    font-size: 10px;
  }
  .plane-line {
    position: absolute;
    left: 0;
    width: 100%;
    height: 2px;
    background: rgba(59,130,246,0.4);
    pointer-events: none;
  }
  .plane-line.active {
    background: rgba(59,130,246,0.8);
  }
  .plane-line span {
    position: absolute;
    left: 0;
    bottom: 0;
    transform: translateY(-100%);
    font-size: 10px;
    background: rgba(255,255,255,0.7);
    padding: 0 2px;
  }
  .wall-label {
    position: absolute;
    font-size: 12px;
    background: rgba(255,255,255,0.7);
    padding: 0 4px;
  }
  .wall-label.north {
    top: -18px;
    left: 50%;
    transform: translateX(-50%);
  }
  .wall-label.west {
    left: -18px;
    top: 50%;
    transform: translateY(-50%) rotate(-90deg);
    transform-origin: left top;
  }
  .wall-label.center {
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
  }
</style>

<div class="h-full">
  <h2 class="text-xl font-bold mb-4">Visual Cabinet Planner</h2>

  {#if showSummary}
    <LayoutSummary on:close={() => showSummary = false} />
  {:else}
    <div class="flex gap-4 mb-4">
      <button on:click={openAddForm} class="px-4 py-2 bg-blue-600 text-white rounded">
        Add Cabinet
      </button>
      <button on:click={toggleSettings} class="px-4 py-2 bg-purple-600 text-white rounded">
        {showSettings ? 'Close Settings' : 'Settings'}
      </button>
      <button class="px-4 py-2 bg-yellow-600 text-white rounded" on:click={toggleBackup}>
        Backups
      </button>
      <button class="px-4 py-2 bg-gray-600 text-white rounded" on:click={() => showSummary = true}>
        Layout Summary
      </button>
    </div>

    <div class="flex gap-2 mb-2">
      <button class="px-2 py-1 rounded border {view === 'top' ? 'bg-blue-500 text-white' : 'bg-white'}" on:click={() => viewChange('top')}>Top View</button>
      <button class="px-2 py-1 rounded border {view === 'front' ? 'bg-blue-500 text-white' : 'bg-white'}" on:click={() => viewChange('front')}>North Wall</button>
      <button class="px-2 py-1 rounded border {view === 'side' ? 'bg-blue-500 text-white' : 'bg-white'}" on:click={() => viewChange('side')}>West Wall</button>
    </div>
    {#if view === 'top' && planeOptions.length > 1}
      <div class="mb-4">
        <label>Plane:
          <select bind:value={plane} on:change={() => viewChange('top')}  class="border p-1">
            {#each planeOptions as p}
              <option value={p}>{p === 0 ? 'Base cabinets' : `Upper cabinets (${p} mm)`}</option>
            {/each}
          </select>
        </label>
      </div>
    {/if}

    <div class="layout-container relative" style="width: {layoutWidth}px; height: {layoutHeight}px;">
      <div id="layout" bind:this={layout} style="width: {layoutWidth}px; height: {layoutHeight}px;">
        {#if view === 'top'}
          <div class="wall-label north">North</div>
          <div class="wall-label west">West</div>
        {:else if view === 'front'}
          <div class="wall-label center">North Wall</div>
        {:else}
          <div class="wall-label center">West Wall</div>
        {/if}
        {#each $cabinets as cabinet, index}
          <div
            class="cabinet {isActive(cabinet) ? '' : 'inactive'}"
            role="button"
            tabindex="{index}"
            style="left: {getCabinetLeft(cabinet)}px; {view === 'top' ? `top: ${getCabinetTop(cabinet)}px; transform-origin: top left; transform: ${getRotationTransform(cabinet.rotation ?? 0)};` : `bottom: ${(cabinet.z ?? 0) / $scale}px;`} width: {getCabinetWidth(cabinet)}px; height: {getCabinetHeight(cabinet)}px; border-color: {view === 'top' && depthMismatch.has(cabinet.id) ? 'red' : undefined};"
            on:mousedown={(e) => isActive(cabinet) && startDrag(e, cabinet.id)}
          >
            <div class="controls" style={view === 'top' ? `transform: rotate(${- (cabinet.rotation ?? 0)}deg); transform-origin: top left;` : undefined}>
              {#if view === 'top'}
                <button on:click|stopPropagation={() => rotateCabinet(cabinet.id)}>↺</button>
              {/if}
              <button on:click|stopPropagation={() => openEditForm(cabinet)}>✎</button>
              <button on:click|stopPropagation={() => deleteCabinet(cabinet.id)}>✕</button>
            </div>
            {`Cabinet ${cabinet.id}`}<br/>
            W:{cabinet.w} H:{cabinet.h} D:{cabinet.d}
            {#if cabinet.type === 'door'}
              <br/>🚪 {(cabinet as any).doors} door(s)
            {/if}
            {#if cabinet.type === 'drawer'}
              <br/>🗄️ {(cabinet as any).drawers} drawer(s)<br>{(cabinet as any).heights.join("% / ")}
            {/if}
            {#if cabinet.type === 'corner'}
              <br/>🔻 corner {(cabinet as any).fixedSide}mm fixed
            {/if}
            {#if cabinet.type === 'oven'}
              <br/>🔥 oven with drawer
            {/if}
          </div>
        {/each}
        {#if view !== 'top'}
          {#each planeOptions as p}
            <div class="plane-line {p === plane ? 'active' : ''}" style="bottom: {p / $scale}px;">
              <span>{p === 0 ? 'Base' : `${p} mm`}</span>
            </div>
          {/each}
        {/if}
      </div>
      <div class="dim-x">
          {#each $cabinets as cab}
            <div class="tick" style="left: {getCabinetLeft(cab) + (getCabinetWidth(cab) / 2)}px;">
              <span>{Math.round(getCabinetWidthRaw(cab))}</span>
            </div>
          {/each}
      </div>
      <div class="dim-y">
          {#each $cabinets as cab}
            <div class="tick" style="top: {getCabinetTop(cab) + (getCabinetHeight(cab) / 2)}px;">
              <span>{Math.round(getCabinetHeightRaw(cab))}</span>
            </div>
          {/each}
      </div>
      <div class="absolute bottom-2 right-2 flex flex-col gap-2">
        <button class="px-2 py-1 bg-gray-600 text-white rounded" on:click={zoomIn}>+</button>
        <button class="px-2 py-1 bg-gray-600 text-white rounded" on:click={zoomOut}>-</button>
      </div>
    </div>

    {#if showForm}
      <Form cabinet={editingCabinet} on:close={closeForm} />
    {/if}
    {#if showSettings}
      <SettingsModal on:close={() => showSettings = false} />
    {/if}
  {/if}
  {#if showBackup}
    <BackupModal on:close={() => showBackup = false} />
  {/if}
</div>
