<script lang="ts">
import Form from "./components/Form.svelte";
import SettingsPage from "./components/SettingsPage.svelte";
import HelpPage from "./components/HelpPage.svelte";
import LayoutSummary from "./components/LayoutSummary.svelte";
import CostPanel from "./components/CostPanel.svelte";
import ProjectSidebar from "./components/ProjectSidebar.svelte";
import { cabinets } from './stores/cabinets';
import { scale } from './stores/scale';
import { room } from './stores/room';
import { materials } from './stores/materials';
import { projects } from './stores/projects';
import { summarizeCosts } from './utils/cost';
import type { Corpus } from './cabinet/Corpus';
import { t, locale, locales } from './i18n';

const GRID_SIZE = 1;
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
      return { left: 'y', top: 'z', width: 'w', height: 'h' } as const;
    default:
      return { left: 'x', top: 'y', width: 'w', height: 'd' } as const;
  }
}

function viewChange(v: View){
  view = v
  cabinets.update(cabs => [...cabs]);
}

$: axes = getAxes(view);

function getCabinetWidthRaw(cab: any) {
  if(view === 'top' || view === 'front'){
    if(cab.rotation === 90 || cab.rotation === 270){
      return cab.d;
    }else {
      return cab.w;
    }
  }
  if (view === 'side'){
      if(cab.rotation === 90 || cab.rotation === 270){
        return cab.w;
      }else {
        return cab.d;
      }
  }
}

function getCabinetHeightRaw(cab: any) {
  if(view === 'top'){
    if(cab.rotation === 90 || cab.rotation === 270){
      return cab.w;
    }else {
      return cab.d;
    }
  }
  return cab.h;
}

function getCabinetDisplayWidth(cab: any) {
  // Width used for rendering the cabinet element itself. Unlike
  // `getCabinetWidth` this ignores the rotation so that the element's
  // dimensions stay constant and the CSS rotation visually rotates it.
  //return (axes.width === 'w' ? cab.w : cab.d) / $scale;

  return getCabinetWidthRaw(cab) / $scale;
}

function getCabinetDisplayHeight(cab: any) {
  // Height used for rendering the cabinet element itself. This keeps
  // the raw dimension so that rotation is handled purely via CSS.

  return getCabinetHeightRaw(cab) / $scale;
}

function getCabinetLeft(cab: any) {
  if (view === 'side') {
    const w = getCabinetDisplayWidth(cab);
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
  const h = getCabinetDisplayHeight(cab);
  return layoutHeight - bottom - h;
}

function setCabinetTop(cab: any, top: number, h: number) {
  if (view === 'top') {
    cab[axes.top] = top;
  } else {
    cab.z = layoutHeightMm - (top + h) * $scale;
  }
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
let showHelp = false;
let showSummary = false;
let showCostPanel = false;
let showProjects = false;
let editingCabinet: Corpus | null = null;
$: costSummary = summarizeCosts($cabinets, $materials);
$: activeProject = $projects.projects.find(p => p.id === $projects.activeId);

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

  const openSettings = () => {
    showHelp = false;
    showSummary = false;
    showForm = false;
    showSettings = true;
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
        const w = getCabinetDisplayWidth(cab);
        const h = getCabinetDisplayHeight(cab);
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
    const w = getCabinetDisplayWidth(currentCab);
    const h = getCabinetDisplayHeight(currentCab);
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

      const w = getCabinetDisplayWidth(draggedCabinet) || 100;
      const h = getCabinetDisplayHeight(draggedCabinet) || 100;




      if (view === 'top') {
        let leftPos = getCabinetLeft(draggedCabinet);
        let topPos = getCabinetTop(draggedCabinet);
        const snapRange = 20;
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



        // Snap to other cabinets
        $cabinets.forEach((otherCab) => {
          if (otherCab.id !== draggedCabinet.id && otherCab.z === draggedCabinet.z) {
            const otherLeft = getCabinetLeft(otherCab);
            const otherTop =getCabinetTop(otherCab);
            const otherWidth = getCabinetDisplayWidth(otherCab);
            const otherHeight = getCabinetDisplayHeight(otherCab);

            // Snap horizontally
            if (Math.abs(leftPos - (otherLeft + otherWidth)) <= snapRange) {
              leftPos = otherLeft + otherWidth;
            } else if (!(leftPos + w <= otherLeft || otherLeft + otherWidth <= leftPos) && topPos === otherTop) {
              leftPos = otherLeft + otherWidth;
              console.log(otherCab.id,leftPos, otherLeft, otherWidth)
            }

            // Snap vertically
            if (Math.abs(topPos - (otherTop + otherHeight)) <= snapRange) {
              topPos = otherTop + otherHeight;
            } else if ((!(topPos + h <= otherTop || otherTop + otherHeight <= topPos)) && leftPos === otherLeft) {
              topPos = otherTop + otherHeight;
            }
          }
        });

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
        const aw = getCabinetDisplayWidth(a);
        const ah = getCabinetDisplayHeight(a);
        const adepth = (a.rotation === 90 || a.rotation === 270) ? a.w : a.d;
        const ax = a.x ?? 0;
        const ay = a.y ?? 0;
        for (let j = i + 1; j < list.length; j++) {
          const b: any = list[j];
          const bw = getCabinetDisplayWidth(b);
          const bh = getCabinetDisplayHeight(b);
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

function getCabinetFrontBorder(cabinet: Corpus) {
    if (cabinet.rotation === 90){
      return 'border-l-4 border-double border-black'
    }else if(cabinet.rotation === 180){
      return 'border-t-4 border-double border-black'
  }else if (cabinet.rotation === 270){
      return 'border-r-4 border-double border-black'
    }

  return 'border-b-4 border-double border-black'
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
.controls button {
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

<div class="min-h-screen bg-gray-50">
  <div class="px-4 py-4 sm:px-6 lg:px-8">
    <header class="mb-6 flex items-center justify-between rounded-xl border bg-white px-4 py-3 shadow no-print">
      <div class="flex items-center gap-3">
        <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-500 text-white shadow-inner">
          <svg viewBox="0 0 32 32" class="h-7 w-7" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="4" y="4" width="12" height="12" rx="2" />
            <rect x="18" y="4" width="10" height="8" rx="2" />
            <rect x="4" y="18" width="24" height="10" rx="2" />
            <path d="M10 18v10M22 4v8" />
          </svg>
        </div>
        <div>
          <p class="text-xs uppercase tracking-wide text-gray-500">{$t('Visual Cabinet')}</p>
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-semibold text-gray-900">{$t('Planner')}</h1>
            <button
              class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-200"
              on:click={() => showProjects = true}
            >
              <svg class="h-3.5 w-3.5 text-slate-700" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6">
                <path d="M3 5.5a1.5 1.5 0 0 1 1.5-1.5h3l1 1H15A1.5 1.5 0 0 1 16.5 6v8.5A1.5 1.5 0 0 1 15 16H4.5A1.5 1.5 0 0 1 3 14.5v-9Z" />
              </svg>
              <span class="truncate max-w-[140px]">{activeProject?.name ?? $t('My project')}</span>
            </button>
          </div>
        </div>
      </div>
      <div class="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        <div class="flex items-center gap-2">
          <label class="sr-only" for="locale-select">{$t('Language')}</label>
          <select
            id="locale-select"
            bind:value={$locale}
            class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm hover:border-slate-300"
          >
            {#each locales as opt}
              <option value={opt.code}>{opt.label}</option>
            {/each}
          </select>
          <button
            class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-blue-50"
            on:click={() => {
              showHelp = true;
              showSettings = false;
              showSummary = false;
              showForm = false;
              showCostPanel = false;
            }}
          >
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6">
              <circle cx="10" cy="10" r="7" />
              <path d="M10 6.5c-1.1 0-2 .7-2 1.8 0 1 1.1 1.3 1.8 1.6.8.3 1.2.7 1.2 1.4 0 .9-.7 1.4-1.5 1.4-.8 0-1.5-.5-1.5-1.4m1.5 3.3v.3" />
            </svg>
            {$t('Help')}
          </button>
          <button
            class="inline-flex items-center gap-2 rounded-lg border border-blue-100 px-3 py-2 text-sm text-gray-800 bg-white hover:bg-blue-50 shadow-sm"
            on:click={openSettings}
          >
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6">
              <path d="M9.5 2.5h1l.6 2.1a5.8 5.8 0 0 1 1.6.9l2-.7.7 1.2-1.3 1.6c.1.3.1.6.1.9s0 .6-.1.9l1.3 1.6-.7 1.2-2-.7a5.8 5.8 0 0 1-1.6.9l-.6 2.1h-1l-.6-2.1a5.8 5.8 0 0 1-1.6-.9l-2 .7-.7-1.2 1.3-1.6a4 4 0 0 1-.1-.9c0-.3 0-.6.1-.9l-1.3-1.6.7-1.2 2 .7c.5-.4 1-.7 1.6-.9l.6-2.1Z" />
              <circle cx="10" cy="10" r="2.5" />
            </svg>
            {$t('Settings')}
          </button>
        </div>
        <button
          class="inline-flex items-center gap-3 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
          on:click={() => showProjects = true}
        >
          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6">
              <path d="M3 5.5A1.5 1.5 0 0 1 4.5 4h3l1 1H15A1.5 1.5 0 0 1 16.5 6v8.5A1.5 1.5 0 0 1 15 16H4.5A1.5 1.5 0 0 1 3 14.5v-9Z" />
            </svg>
          </div>
          <div class="text-left leading-tight">
            <p class="text-[10px] uppercase tracking-wide text-slate-200">{$t('Project')}</p>
            <p class="text-sm font-semibold">{activeProject?.name ?? $t('My project')}</p>
          </div>
        </button>
      </div>
    </header>
    {#if showSettings || showHelp}
      <div class="flex gap-4 mb-4">
        <button
          class="px-4 py-2 rounded border text-gray-700 bg-white shadow-sm inline-flex items-center gap-2"
          on:click={() => {
            showSettings = false;
            showHelp = false;
          }}
        >
          ← {$t('Back to planner')}
        </button>
      </div>
    {:else}
      <div class="mb-4"></div>
    {/if}

    {#if !showSettings && !showSummary && !showHelp}
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3 no-print">
        <div class="flex gap-3">
          <button on:click={openAddForm} class="px-4 py-2 bg-blue-600 text-white rounded">
            {$t('Add Cabinet')}
          </button>
          <button class="px-4 py-2 bg-gray-600 text-white rounded" on:click={() => showSummary = true}>
            {$t('Layout Summary')}
          </button>
        </div>
        <button
          class="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800 shadow-sm hover:bg-blue-100"
          on:click={() => showCostPanel = !showCostPanel}
        >
          {$t('Total')}: ${costSummary.total.toFixed(2)}
        </button>
      </div>
    {/if}

  {#if showSummary}
    <LayoutSummary on:close={() => showSummary = false} />
  {:else if showSettings}
    <SettingsPage on:close={() => showSettings = false} />
  {:else if showHelp}
    <HelpPage on:close={() => showHelp = false} />
  {:else}
    <div class="flex gap-2 mb-2">
      <button class="px-2 py-1 rounded border {view === 'top' ? 'bg-blue-500 text-white' : 'bg-white'}" on:click={() => viewChange('top')}>{$t('Top View')}</button>
      <button class="px-2 py-1 rounded border {view === 'front' ? 'bg-blue-500 text-white' : 'bg-white'}" on:click={() => viewChange('front')}>{$t('North Wall')}</button>
      <button class="px-2 py-1 rounded border {view === 'side' ? 'bg-blue-500 text-white' : 'bg-white'}" on:click={() => viewChange('side')}>{$t('West Wall')}</button>
    </div>
    {#if view === 'top' && planeOptions.length > 1}
      <div class="mb-4">
        <label>{$t('Plane')}:
          <select bind:value={plane} on:change={() => viewChange('top')}  class="border p-1">
            {#each planeOptions as p}
              <option value={p}>{p === 0 ? $t('Base cabinets') : $t('Upper cabinets ({height} mm)', { height: p })}</option>
            {/each}
          </select>
        </label>
      </div>
    {/if}

    <div class="layout-container relative" style="width: {layoutWidth}px; height: {layoutHeight}px;">
      <div id="layout" bind:this={layout} style="width: {layoutWidth}px; height: {layoutHeight}px;">
        {#if view === 'top'}
          <div class="wall-label north">{$t('North')}</div>
          <div class="wall-label west">{$t('West')}</div>
        {:else if view === 'front'}
          <div class="wall-label center">{$t('North Wall')}</div>
        {:else}
          <div class="wall-label center">{$t('West Wall')}</div>
        {/if}
        {#each $cabinets as cabinet, index}
          <div
            class="cabinet {isActive(cabinet) ? '' : 'inactive'} {getCabinetFrontBorder(cabinet)}"
            role="button"
            tabindex="{index}"
            style="left: {getCabinetLeft(cabinet)}px; {view === 'top' ? `top: ${getCabinetTop(cabinet)}px; transform-origin: top left;` : `bottom: ${(cabinet.z ?? 0) / $scale}px;`} width: {getCabinetDisplayWidth(cabinet)}px; height: {getCabinetDisplayHeight(cabinet)}px; border-color: {view === 'top' && depthMismatch.has(cabinet.id) ? 'red' : undefined};"
            on:mousedown={(e) => isActive(cabinet) && startDrag(e, cabinet.id)}
          >
            <div class="controls">
              {#if view === 'top'}
                <button on:click|stopPropagation={() => rotateCabinet(cabinet.id)}>↺</button>
              {/if}
              <button on:click|stopPropagation={() => openEditForm(cabinet)}>✎</button>
              <button on:click|stopPropagation={() => deleteCabinet(cabinet.id)}>✕</button>
            </div>
            {$t('Cabinet {id}', { id: cabinet.id })}<br/>
            {$t('W')}:{cabinet.w} {$t('H')}:{cabinet.h} {$t('D')}:{cabinet.d}
            {#if cabinet.type === 'door'}
              <br/>🚪 {$t('{count} door(s)', { count: (cabinet as any).doors })}
              {#if (cabinet as any).shelves && (cabinet as any).shelves > 0}
                <br/>🗂️ {$t('{count} shelf/shelves', { count: (cabinet as any).shelves })}
              {/if}
            {/if}
            {#if cabinet.type === 'drawer'}
              <br/>🗄️ {$t('{count} drawer(s)', { count: (cabinet as any).drawers })}<br>{(cabinet as any).heights.join("% / ")}
            {/if}
            {#if cabinet.type === 'corner'}
              <br/>🔻 {$t('corner {fixed}mm fixed', { fixed: (cabinet as any).fixedSide })}
            {/if}
            {#if cabinet.type === 'oven'}
              <br/>🔥 {$t('oven with drawer')}
            {/if}
          </div>
        {/each}
        {#if view !== 'top'}
          {#each planeOptions as p}
            <div class="plane-line {p === plane ? 'active' : ''}" style="bottom: {p / $scale}px;">
              <span>{p === 0 ? $t('Base') : `${p} mm`}</span>
            </div>
          {/each}
        {/if}
      </div>
      <div class="dim-x">
          {#each $cabinets as cab}
            <div class="tick" style="left: {getCabinetLeft(cab) + (getCabinetDisplayWidth(cab) / 2)}px;">
              <span>{Math.round(getCabinetWidthRaw(cab))}</span>
            </div>
          {/each}
      </div>
      <div class="dim-y">
          {#each $cabinets as cab}
            <div class="tick" style="top: {getCabinetTop(cab) + (getCabinetDisplayHeight(cab) / 2)}px;">
              <span>{Math.round(getCabinetHeightRaw(cab))}</span>
            </div>
          {/each}
      </div>
    </div>
    <div class="fixed right-4 top-1/2 z-20 flex -translate-y-1/2 transform flex-col gap-2">
      <button class="px-3 py-2 bg-gray-700 text-white rounded shadow hover:bg-gray-800" on:click={zoomIn}>+</button>
      <button class="px-3 py-2 bg-gray-700 text-white rounded shadow hover:bg-gray-800" on:click={zoomOut}>-</button>
    </div>

    {#if showForm}
      <Form cabinet={editingCabinet} on:close={closeForm} />
    {/if}
  {/if}
  {#if showCostPanel}
    <CostPanel on:close={() => showCostPanel = false} />
  {/if}
  <ProjectSidebar open={showProjects} on:close={() => showProjects = false} />
</div>
</div>
