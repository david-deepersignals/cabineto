<script lang="ts">
import Form from "./components/Form.svelte";
import MaterialForm from "./components/MaterialForm.svelte";
import LayoutSummary from "./components/LayoutSummary.svelte";
import BackupModal from "./components/BackupModal.svelte";
import { cabinets } from './stores/cabinets';
import { scale } from './stores/scale';
import type { Corpus } from './cabinet/Corpus';
import { onMount } from 'svelte';

const GRID_SIZE = 10;
let layoutWidthMm = 1000;
let layoutHeightMm = 500;
let layout: HTMLDivElement;

type View = 'top' | 'front' | 'side';
let view: View = 'top';

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
  return cab.rotation === 90 ? { w: cab.d, d: cab.w } : { w: cab.w, d: cab.d };
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

function isAligned(cab: any) {
  if (view === 'front') {
    return Math.abs(cab.y ?? 0) < GRID_SIZE / 2;
  }
  if (view === 'side') {
    const w = getCabinetWidth(cab);
    return Math.abs((cab.x ?? 0) + w - layoutWidth) < GRID_SIZE / 2;
  }
  return true;
}

function updateLayoutSize() {
  layoutWidthMm = window.innerWidth - 100;
  layoutHeightMm = window.innerHeight - 250;
}

onMount(() => {
  updateLayoutSize();
  window.addEventListener('resize', updateLayoutSize);
  return () => window.removeEventListener('resize', updateLayoutSize);
});

$: layoutWidth = layoutWidthMm;
$: layoutHeight = layoutHeightMm;

let showForm = false;
  let showMaterialForm = false;
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

  const toggleMaterialForm = () => {
    showMaterialForm = !showMaterialForm;
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
        cab.rotation = cab.rotation === 90 ? 0 : 90;
        const w = getCabinetWidth(cab);
        const h = getCabinetHeight(cab);
        cab.x = Math.max(0, Math.min(layoutWidth - w, cab.x ?? 0));
        cab.y = Math.max(0, Math.min(layoutHeight - h, cab.y ?? 0));
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
    const target = event.target as HTMLElement;
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
        cab[axes.top] = top;
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
      let finalLeft = Math.round(((draggedCabinet[axes.left] ?? 0) / GRID_SIZE)) * GRID_SIZE;
      let finalTop = Math.round(((draggedCabinet[axes.top] ?? 0) / GRID_SIZE)) * GRID_SIZE;

      const w = getCabinetWidth(draggedCabinet) || 100;
      const h = getCabinetHeight(draggedCabinet) || 100;

      finalLeft = Math.max(0, Math.min(layoutWidth - w, finalLeft));
      finalTop = Math.max(0, Math.min(layoutHeight - h, finalTop));

      const rect1 = {
        x: finalLeft,
        y: finalTop,
        w,
        h
      };

      let collision = false;
      let bestSnap = null;

      // Check for collisions
      current.forEach((otherCabinet: any, i) => {
        if (i === index) return;

        const rect2 = {
          x: otherCabinet[axes.left] ?? 0,
          y: otherCabinet[axes.top] ?? 0,
          w: getCabinetWidth(otherCabinet) || 100,
          h: getCabinetHeight(otherCabinet) || 100
        };

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

            const rect3 = {
                x: other2[axes.left] ?? 0,
                y: other2[axes.top] ?? 0,
                w: getCabinetWidth(other2) || 100,
                h: getCabinetHeight(other2) || 100
              };

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
        draggedCabinet[axes.left] = finalLeft;
        draggedCabinet[axes.top] = finalTop;
        current[index] = draggedCabinet;
      } else {
        draggedCabinet[axes.left] = bestSnap[0];
        draggedCabinet[axes.top] = bestSnap[1];
        current[index] = draggedCabinet;
      }

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
        const adepth = a.rotation === 90 ? a.w : a.d;
        const ax = a.x ?? 0;
        const ay = a.y ?? 0;
        for (let j = i + 1; j < list.length; j++) {
          const b: any = list[j];
          const bw = getCabinetWidth(b);
          const bh = getCabinetHeight(b);
          const bdepth = b.rotation === 90 ? b.w : b.d;
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
    background-color: rgba(100, 150, 240, 0.3);
    padding: 4px;
    text-align: center;
    font-size: 10px;
    cursor: move;
  }
  .cabinet.inactive {
    border-color: #ccc;
    cursor: default;
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
      <button on:click={toggleMaterialForm} class="px-4 py-2 bg-purple-600 text-white rounded">
        {showMaterialForm ? 'Close Materials' : 'Materials'}
      </button>
      <button class="px-4 py-2 bg-yellow-600 text-white rounded" on:click={toggleBackup}>
        Backups
      </button>
      <button class="px-4 py-2 bg-gray-600 text-white rounded" on:click={() => showSummary = true}>
        Layout Summary
      </button>
    </div>

    <div class="flex gap-2 mb-4">
      <button class="px-2 py-1 rounded border {view === 'top' ? 'bg-blue-500 text-white' : 'bg-white'}" on:click={() => viewChange('top')}>Top View</button>
      <button class="px-2 py-1 rounded border {view === 'front' ? 'bg-blue-500 text-white' : 'bg-white'}" on:click={() => viewChange('front')}>Front View</button>
      <button class="px-2 py-1 rounded border {view === 'side' ? 'bg-blue-500 text-white' : 'bg-white'}" on:click={() => viewChange('side')}>Side View</button>
    </div>

    <div class="layout-container relative" style="width: {layoutWidth}px; height: {layoutHeight}px;">
      <div id="layout" bind:this={layout} style="width: {layoutWidth}px; height: {layoutHeight}px;">
        {#each $cabinets as cabinet, index}
          <div
            class="cabinet {view !== 'top' && !isAligned(cabinet) ? 'inactive' : ''}"
            role="button"
            tabindex="{index}"
            style="left: {getCabinetLeft(cabinet)}px; top: {cabinet[axes.top] ?? 0}px; width: {getCabinetWidth(cabinet)}px; height: {getCabinetHeight(cabinet)}px; border-color: {view === 'top' && depthMismatch.has(cabinet.id) ? 'red' : undefined};"
            on:mousedown={(e) => isAligned(cabinet) && startDrag(e, cabinet.id)}
          >
            <div class="controls">
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
            <div class="tick" style="top: {(cab[axes.top] ?? 0) + (getCabinetHeight(cab) / 2)}px;">
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
    {#if showMaterialForm}
      <MaterialForm on:close={() => showMaterialForm = false} />
    {/if}
  {/if}
  {#if showBackup}
    <BackupModal on:close={() => showBackup = false} />
  {/if}
</div>
