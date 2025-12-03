<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import type { Corpus } from "../cabinet/Corpus";
    import {DoorCabinet} from "../cabinet/DoorCabinet";
    import {DrawerCabinet} from "../cabinet/DrawerCabinet";
    import {CornerCabinet} from "../cabinet/CornerCabinet";
    import {OvenCabinet} from "../cabinet/OvenCabinet";
    import { cabinets } from '../stores/cabinets';
    import { SLIDER_LENGHTS, RAIL_HEIGHTS } from "../cabinet/drawerHelper";

    const dispatch = createEventDispatcher();

    export let cabinet: Corpus | null = null;

    let createDuplicate = false;
    let width = '60';
    let height = '80';
    let depth = '56';
    let type = 'door';
    let doors = 2;
    let shelves = 0;
    let drawers = 3;
    let drawerHeights = '30,30,40';
    let drawerSystem: 'standard' | 'metabox' | 'vertex' = 'standard';
    let metaboxType = '400';
    let drawerSideHeight = '131';
    let fixedSide = '0';
    let fullCorpus = false;
    let insetBack = false;
    let rabbetBack = false;
    let hiddenHandles = false;
    let isUpperCabinet = false;
    let x = 0
    let y = 0
    let z = 0
    let rotation = '0';

    onMount(() => {
        if (cabinet) initFromCabinet();
    });

    $: if (cabinet) {
        // Keep fields in sync when opening editor with an existing cabinet
        initFromCabinet();
    }

    function initFromCabinet(){
        if (!cabinet) return;
        width = (cabinet.w / 10).toString();
        height = (cabinet.h / 10).toString();
        depth = (cabinet.d / 10).toString();
        x = cabinet.x ?? 0;
        y = cabinet.y ?? 0;
        z = cabinet.z ?? 0;
        rotation = (cabinet.rotation ?? 0).toString();
        type = cabinet.type ?? 'door';
        fullCorpus = cabinet.options?.full ?? false;
        insetBack = cabinet.options?.insetBack ?? false;
        rabbetBack = cabinet.options?.rabbetBack ?? false;
        hiddenHandles = cabinet.options?.hiddenHandles ?? false;
        if (insetBack && rabbetBack) {
            rabbetBack = false;
        }
        isUpperCabinet = (cabinet as any)?.isUpper ?? false;
        if (type === 'door') {
            doors = (cabinet as DoorCabinet).doors ?? doors;
            shelves = (cabinet as DoorCabinet).shelves ?? 0;
        }
        if (type === 'drawer') {
            drawers = (cabinet as DrawerCabinet).drawers ?? drawers;
            drawerHeights = (cabinet as DrawerCabinet).heights?.join(',') ?? drawerHeights;
            drawerSystem = (cabinet as DrawerCabinet).drawerSystem ?? 'standard';
            metaboxType = ((cabinet as DrawerCabinet).metaboxType ?? 400).toString();
            drawerSideHeight = ((cabinet as DrawerCabinet).drawerSideHeight ?? 131).toString();
        }
        if (type === 'corner') {
            fixedSide = ((cabinet as CornerCabinet).fixedSide / 10).toString();
        }
        if (type === 'oven') {
            drawerSystem = (cabinet as OvenCabinet).drawerSystem ?? 'standard';
            metaboxType = ((cabinet as OvenCabinet).metaboxType ?? 400).toString();
            drawerSideHeight = ((cabinet as OvenCabinet).drawerSideHeight ?? 131).toString();
        }
    }

    $: isDrawer = type === 'drawer';
    $: isDoor = type === 'door';
    $: isCorner = type === 'corner';
    $: isOven = type === 'oven';
    $: isUpperAllowed = isDoor || isCorner;
    $: if (!isUpperAllowed || !hiddenHandles) isUpperCabinet = false;
    const toMm = (value: string) => {
        const n = parseFloat(value);
        return Number.isFinite(n) ? n * 10 : 0;
    };
    $: widthMm = toMm(width);
    $: heightMm = toMm(height);
    $: depthMm = toMm(depth);
    $: volumeLiters = ((widthMm * heightMm * depthMm) / 1_000_000).toFixed(1);
    $: footprint = ((widthMm * depthMm) / 1_000_000).toFixed(2);
    const isoProject = (x: number, y: number, z: number) => ({ x: x - y, y: (x + y) / 2 - z });
    const svgW = 220;
    const svgH = 140;
    const toPoints = (pts: { x: number; y: number }[]) => pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    $: preview = (() => {
        const w = widthMm || 1;
        const d = depthMm || 1;
        const h = heightMm || 1;
        const maxDim = Math.max(w, d, h);
        const scale = 70 / maxDim;
        const sw = w * scale;
        const sd = d * scale;
        const sh = h * scale;
        const corners = [
            isoProject(0, 0, 0), isoProject(sw, 0, 0), isoProject(sw, sd, 0), isoProject(0, sd, 0),
            isoProject(0, 0, sh), isoProject(sw, 0, sh), isoProject(sw, sd, sh), isoProject(0, sd, sh)
        ];
        const minX = Math.min(...corners.map(p => p.x));
        const maxX = Math.max(...corners.map(p => p.x));
        const minY = Math.min(...corners.map(p => p.y));
        const maxY = Math.max(...corners.map(p => p.y));
        const offsetX = (svgW - (maxX - minX)) / 2 - minX;
        const offsetY = (svgH - (maxY - minY)) / 2 - minY;
        const adjust = (pts: { x: number; y: number }[]) => pts.map(p => ({ x: p.x + offsetX, y: p.y + offsetY }));
        const top = adjust([isoProject(0, 0, sh), isoProject(sw, 0, sh), isoProject(sw, sd, sh), isoProject(0, sd, sh)]);
        const left = adjust([isoProject(0, 0, sh), isoProject(0, sd, sh), isoProject(0, sd, 0), isoProject(0, 0, 0)]);
        const right = adjust([isoProject(sw, 0, sh), isoProject(sw, sd, sh), isoProject(sw, sd, 0), isoProject(sw, 0, 0)]);
        const frontEdge = adjust([isoProject(0, sd, 0), isoProject(sw, sd, 0)]);
        return { top: toPoints(top), left: toPoints(left), right: toPoints(right), frontEdge, dims: { w, d, h } };
    })();

    function handleInsetBackChange(event: Event) {
        const target = event.target as HTMLInputElement;
        insetBack = target.checked;
        if (insetBack) rabbetBack = false;
    }

    function handleRabbetBackChange(event: Event) {
        const target = event.target as HTMLInputElement;
        rabbetBack = target.checked;
        if (rabbetBack) insetBack = false;
    }

    const saveCabinet = () => {
        const w = parseFloat(width);
        const h = parseFloat(height);
        const d = parseFloat(depth);
        if (!w || !h || !d) {
            alert('All dimensions (width, height, depth) must be filled.');
            return;
        }

        if (insetBack && rabbetBack) {
            alert('Please choose either inset back or rabbet back, not both.');
            return;
        }

        const existingCabinet = cabinet;
        if(createDuplicate){
            cabinet = null;
            x = x + w + 20;
        }
        const id = existingCabinet ? existingCabinet.id : `CAB-${$cabinets.length + 1}`;


        let newCabinet;
        if (type === "door") {
            newCabinet = new DoorCabinet(
                id,
                w * 10,
                h * 10,
                d * 10,
                doors ?? 0,
                shelves ?? 0,
                {full:fullCorpus,
                insetBack:insetBack,
                rabbetBack:rabbetBack,
                hiddenHandles:hiddenHandles},
                isUpperCabinet)
        } else if (type === "drawer") {

            newCabinet = new DrawerCabinet(
                id,
                w * 10,
                h * 10,
                d * 10,
                drawers,
                drawerHeights.split(',')
                    .map(s => parseFloat(s.trim()))
                    .filter(v => !isNaN(v)),
                drawerSystem,
                parseInt(metaboxType),
                parseInt(drawerSideHeight),
                {full:fullCorpus,
                    insetBack:insetBack,
                    rabbetBack:rabbetBack,
                    hiddenHandles:hiddenHandles},
                false)

        } else if (type === "corner") {
            const fs = parseFloat(fixedSide);
            if (!fs) {
                alert('Fixed side dimension must be provided.');
                return;
            }
            newCabinet = new CornerCabinet(
                id,
                w * 10,
                h * 10,
                d * 10,
                fs * 10,
                {full:fullCorpus, insetBack:insetBack, rabbetBack:rabbetBack, hiddenHandles:hiddenHandles},
                isUpperCabinet
            );
        } else if (type === "oven") {
            newCabinet = new OvenCabinet(
                id,
                w * 10,
                h * 10,
                d * 10,
                drawerSystem,
                parseInt(metaboxType),
                parseInt(drawerSideHeight),
                {full:fullCorpus, insetBack:insetBack, rabbetBack:rabbetBack, hiddenHandles:hiddenHandles},
                false,
            );
        } else {
            return;
        }

        newCabinet.y = y;
        newCabinet.x = x;
        newCabinet.z = z;
        newCabinet.wall = (cabinet as any)?.wall ?? 'north';
        newCabinet.rotation = parseInt(rotation);
        newCabinet.validate();
        if (existingCabinet) {
            cabinets.update(prev => prev.map(c => c.id === existingCabinet.id ? newCabinet : c));
        } else {
            cabinets.update(prev => [...prev, newCabinet]);
        }
        dispatch('close');
    };
</script>

<div class="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50 px-4">
  <div class="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p class="text-xs uppercase tracking-wide text-gray-500">{cabinet ? 'Edit' : 'Add'} cabinet</p>
        <h3 class="text-2xl font-semibold text-gray-900">Cabinet details</h3>
        <p class="text-sm text-gray-600">Size, configure, and preview your cabinet before placing it in the layout.</p>
      </div>
      <div class="flex gap-2">
        <button class="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" on:click={() => dispatch('close')}>Cancel</button>
        <button class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700" on:click={saveCabinet}>{cabinet ? 'Save changes' : 'Add cabinet'}</button>
      </div>
    </div>

    <div class="mt-4 grid gap-4 lg:grid-cols-3">
      <div class="rounded-xl border border-slate-100 bg-slate-50 p-4 shadow-inner lg:col-span-2">
        <div class="mb-3 flex items-center justify-between">
          <h4 class="text-sm font-semibold text-gray-800">Sizing & placement</h4>
          {#if cabinet}
            <label class="flex items-center gap-2 text-xs font-semibold text-gray-700">
              <input type="checkbox" bind:checked={createDuplicate} class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              Duplicate on save
            </label>
          {/if}
        </div>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label class="space-y-1 text-sm font-medium text-gray-700">
            Width (cm)
            <input type="number" bind:value={width} class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none" required />
          </label>
          <label class="space-y-1 text-sm font-medium text-gray-700">
            Height (cm)
            <input type="number" bind:value={height} class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none" required />
          </label>
          <label class="space-y-1 text-sm font-medium text-gray-700">
            Depth (cm)
            <input type="number" bind:value={depth} class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none" required />
          </label>
          <label class="space-y-1 text-sm font-medium text-gray-700">
            Rotation
            <select bind:value={rotation} class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none">
              <option value="0">0°</option>
              <option value="90">90°</option>
              <option value="180">180°</option>
              <option value="270">270°</option>
            </select>
          </label>
        </div>
        <div class="mt-4 rounded-xl border border-dashed border-slate-200 bg-white/70 p-4 shadow-inner">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs uppercase tracking-wide text-gray-500">Live spec</p>
              <p class="text-lg font-semibold text-gray-900">{Math.round(widthMm)} × {Math.round(heightMm)} × {Math.round(depthMm)} mm</p>
              <p class="text-xs text-gray-600">Volume {volumeLiters} L • Footprint {footprint} m²</p>
            </div>
            <div class="flex flex-col gap-1 text-xs text-gray-700 min-w-[140px]">
              <div class="flex items-center gap-2">
                <span class="w-8 text-right text-gray-500">W</span>
                <div class="h-2 w-28 rounded-full bg-slate-100">
                  <div class="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" style={`width:${Math.min(100, (widthMm / 3000) * 100)}%`}></div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-8 text-right text-gray-500">H</span>
                <div class="h-2 w-28 rounded-full bg-slate-100">
                  <div class="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" style={`width:${Math.min(100, (heightMm / 3000) * 100)}%`}></div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-8 text-right text-gray-500">D</span>
                <div class="h-2 w-28 rounded-full bg-slate-100">
                  <div class="h-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" style={`width:${Math.min(100, (depthMm / 2000) * 100)}%`}></div>
                </div>
              </div>
            </div>
          </div>
          <div class="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">Mini preview</p>
            <svg viewBox={`0 0 ${svgW} ${svgH}`} class="h-40 w-full" aria-label="Isometric preview">
              <defs>
                <linearGradient id="cab-top" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#c7d2fe" />
                  <stop offset="100%" stop-color="#a5b4fc" />
                </linearGradient>
                <linearGradient id="cab-side" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#bfdbfe" />
                  <stop offset="100%" stop-color="#93c5fd" />
                </linearGradient>
                <linearGradient id="cab-front" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#c084fc" />
                  <stop offset="100%" stop-color="#a855f7" />
                </linearGradient>
              </defs>
              <polygon points={preview.top} fill="url(#cab-top)" stroke="#475569" stroke-width="1" stroke-linejoin="round" />
              <polygon points={preview.left} fill="url(#cab-side)" stroke="#475569" stroke-width="1" stroke-linejoin="round" />
              <polygon points={preview.right} fill="url(#cab-front)" stroke="#475569" stroke-width="1" stroke-linejoin="round" />
              <line x1={preview.frontEdge[0].x} y1={preview.frontEdge[0].y} x2={preview.frontEdge[1].x} y2={preview.frontEdge[1].y} stroke="#1e293b" stroke-dasharray="3 3" />
              <text x="8" y="18" class="fill-gray-600 text-[10px] font-semibold">Top / Isometric</text>
            </svg>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <h4 class="text-sm font-semibold text-gray-800 mb-3">Construction options</h4>
        <div class="space-y-3">
          <label class="flex items-start gap-3 rounded-lg border border-gray-200 bg-slate-50 px-3 py-2 shadow-inner">
            <input type="checkbox" bind:checked={fullCorpus} class="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <div>
              <p class="text-sm font-semibold text-gray-800">Full corpus</p>
              <p class="text-xs text-gray-600">Add a full top panel instead of split planks.</p>
            </div>
          </label>
          <label class="flex items-start gap-3 rounded-lg border border-gray-200 bg-slate-50 px-3 py-2 shadow-inner">
            <input type="checkbox" bind:checked={insetBack} on:change={handleInsetBackChange} class="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <div>
              <p class="text-sm font-semibold text-gray-800">Inset back</p>
              <p class="text-xs text-gray-600">Cuts dados to drop the back inside the sides. Cannot combine with rabbet back.</p>
            </div>
          </label>
          <label class="flex items-start gap-3 rounded-lg border border-gray-200 bg-slate-50 px-3 py-2 shadow-inner">
            <input type="checkbox" bind:checked={rabbetBack} on:change={handleRabbetBackChange} class="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <div>
              <p class="text-sm font-semibold text-gray-800">Rabbet back</p>
              <p class="text-xs text-gray-600">Rabbets the rear edge for the back panel. Mutually exclusive with inset back.</p>
            </div>
          </label>
          <label class="flex items-start gap-3 rounded-lg border border-gray-200 bg-slate-50 px-3 py-2 shadow-inner">
            <input type="checkbox" bind:checked={hiddenHandles} class="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <div>
              <p class="text-sm font-semibold text-gray-800">Hidden handles</p>
              <p class="text-xs text-gray-600">Use handleless fronts for a clean look.</p>
              {#if isUpperAllowed}
                <label class="mt-2 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-700 shadow-sm">
                  <input
                    type="checkbox"
                    bind:checked={isUpperCabinet}
                    disabled={!hiddenHandles}
                    class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <span class="text-[12px]">Create door overhang for upper cabinets</span>
                </label>
              {/if}
            </div>
          </label>
        </div>
      </div>
    </div>

    <div class="mt-4 grid gap-4 lg:grid-cols-3">
      <div class="rounded-xl border border-slate-100 bg-white p-4 shadow-sm lg:col-span-2">
        <h4 class="text-sm font-semibold text-gray-800 mb-3">Cabinet type</h4>
        <div class="grid gap-3 md:grid-cols-2">
          <label class="space-y-1 text-sm font-medium text-gray-700">
            Type
            <select bind:value={type} class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none">
              <option value="door">Door</option>
              <option value="drawer">Drawer</option>
              <option value="corner">Corner</option>
              <option value="oven">Oven</option>
            </select>
          </label>
          {#if isDoor}
            <label class="space-y-1 text-sm font-medium text-gray-700">
              Doors
              <input type="number" bind:value={doors} class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none" />
            </label>
          {/if}
          {#if isDoor}
            <label class="space-y-1 text-sm font-medium text-gray-700">
              Shelves
              <input type="number" bind:value={shelves} min="0" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none" />
            </label>
          {/if}
          {#if isCorner}
            <label class="space-y-1 text-sm font-medium text-gray-700">
              Fixed side (cm)
              <input type="number" bind:value={fixedSide} class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none" />
            </label>
          {/if}
          {#if isDrawer}
            <label class="space-y-1 text-sm font-medium text-gray-700">
              Drawers
              <input type="number" bind:value={drawers} class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none" />
            </label>
            <label class="space-y-1 text-sm font-medium text-gray-700">
              Heights (comma-separated %)
              <input type="text" bind:value={drawerHeights} class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none" />
            </label>
          {/if}
          {#if isDrawer || isOven}
            <label class="space-y-1 text-sm font-medium text-gray-700">
              Drawer system
              <select bind:value={drawerSystem} class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none">
                <option value="standard">Wooden</option>
                <option value="metabox">Metabox</option>
                <option value="vertex">Vertex</option>
              </select>
            </label>
          {/if}
          {#if (isDrawer || isOven) && (drawerSystem === 'metabox' || drawerSystem === 'vertex')}
            <label class="space-y-1 text-sm font-medium text-gray-700">
              Slide length
              <select bind:value={metaboxType} class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none">
                {#each SLIDER_LENGHTS as t}
                  <option value={String(t)}>{t} mm</option>
                {/each}
              </select>
            </label>
            <label class="space-y-1 text-sm font-medium text-gray-700">
              Railing height
              <select bind:value={drawerSideHeight} class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none">
                {#each RAIL_HEIGHTS as h}
                  <option value={String(h)}>{h} mm</option>
                {/each}
              </select>
            </label>
          {/if}
        </div>
      </div>

      <div class="rounded-xl border border-slate-100 bg-slate-50 p-4 shadow-inner">
        <h4 class="text-sm font-semibold text-gray-800 mb-3">Notes</h4>
        <ul class="space-y-2 text-sm text-gray-700">
          <li>• Inset back and rabbet back are mutually exclusive; choosing one will disable the other.</li>
          <li>• If no back option is selected, the back will be cut from the corpus material.</li>
          <li>• Dimensions are entered in centimeters for convenience.</li>
          <li>• Duplicate lets you save and place a copy offset to the side.</li>
        </ul>
      </div>
    </div>
  </div>
</div>
