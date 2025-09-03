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
    let drawers = 3;
    let drawerHeights = '30,30,40';
    let drawerSystem: 'standard' | 'metabox' | 'vertex' = 'standard';
    let metaboxType = '400';
    let drawerSideHeight = '131';
    let fixedSide = '0';
    let fullCorpus = false;
    let insetBack = false;
    let hiddenHandles = false;
    let isUpperCabinet = false;
    let x = 0
    let y = 0
    let z = 0
    let rotation = '0';

    onMount(() => {
        if (cabinet) {
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
            hiddenHandles = cabinet.options?.hiddenHandles ?? false;
            isUpperCabinet = (cabinet as any)?.isUpper ?? false;
            if (type === 'door') {
                doors = (cabinet as DoorCabinet).doors ?? doors;
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
    });

    $: isDrawer = type === 'drawer';
    $: isDoor = type === 'door';
    $: isCorner = type === 'corner';
    $: isOven = type === 'oven';
    $: isUpperAllowed = isDoor || isCorner;
    $: if (!isUpperAllowed) isUpperCabinet = false;

    const saveCabinet = () => {
        const w = parseFloat(width);
        const h = parseFloat(height);
        const d = parseFloat(depth);
        if (!w || !h || !d) {
            alert('All dimensions (width, height, depth) must be filled.');
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
                {full:fullCorpus,
                insetBack:insetBack,
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
                {full:fullCorpus, insetBack:insetBack, hiddenHandles:hiddenHandles},
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
                {full:fullCorpus, insetBack:insetBack, hiddenHandles:hiddenHandles},
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

<div class="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50">
    <div class="bg-white p-6 rounded shadow-md w-full max-w-sm">
        <h3 class="text-lg font-semibold mb-4">{cabinet ? 'Edit Cabinet' : 'Add Cabinet'}</h3>
        <div class="space-y-2">
            {#if cabinet}
            <label class="block">Duplicate:
                <input type="checkbox" bind:checked={createDuplicate} class="border p-1 w-full" />
            </label>
                {/if}
            <label class="block">Width (cm):
                <input type="number" bind:value={width} class="border p-1 w-full" required />
            </label>
            <label class="block">Height (cm):
                <input type="number" bind:value={height} class="border p-1 w-full" required />
            </label>
            <label class="block">Depth (cm):
                <input type="number" bind:value={depth} class="border p-1 w-full" required />
            </label>
            <label class="block">Rotation (deg):
                <select bind:value={rotation} class="border p-1 w-full">
                    <option value="0">0°</option>
                    <option value="90">90°</option>
                    <option value="180">180°</option>
                    <option value="270">270°</option>
                </select>
            </label>
            <label class="block">Full Corpus:
            <input type="checkbox" bind:checked={fullCorpus} class="border p-1 w-full" />
            </label>
            <label class="block">Inset Back:
            <input type="checkbox" bind:checked={insetBack} class="border p-1 w-full" />
            </label>
            <label class="block">Hidden Handles:
            <input type="checkbox" bind:checked={hiddenHandles} class="border p-1 w-full" />
            </label>
            {#if isUpperAllowed}
            <label class="block">Upper Cabinet:
            <input type="checkbox" bind:checked={isUpperCabinet} class="border p-1 w-full" />
            </label>
            {/if}
            <label class="block">Type:
                <select bind:value={type} class="border p-1 w-full">
                    <option value="door">Door</option>
                    <option value="drawer">Drawer</option>
                    <option value="corner">Corner</option>
                    <option value="oven">Oven</option>
                </select>
            </label>
            {#if isDoor}
                <label class="block">Doors:
                    <input type="number" bind:value={doors} class="border p-1 w-full" />
                </label>
            {/if}
            {#if isCorner}
                <label class="block">Fixed Side (cm):
                    <input type="number" bind:value={fixedSide} class="border p-1 w-full" />
                </label>
            {/if}
            {#if isDrawer}
                <label class="block">Drawers:
                    <input type="number" bind:value={drawers} class="border p-1 w-full" />
                </label>
                <label class="block">Heights (comma-separated %):
                    <input type="text" bind:value={drawerHeights} class="border p-1 w-full" />
                </label>
                <label class="block">Drawer System:
                    <select bind:value={drawerSystem} class="border p-1 w-full">
                        <option value="standard">Wooden</option>
                        <option value="metabox">Metabox</option>
                        <option value="vertex">Vertex</option>
                    </select>
                </label>
                {#if drawerSystem === 'metabox' || drawerSystem === 'vertex'}
                <label class="block">Slide Length:
                    <select bind:value={metaboxType} class="border p-1 w-full">
                        {#each SLIDER_LENGHTS as t}
                            <option value={t}>{t} mm</option>
                        {/each}
                    </select>
                </label>
                <label class="block">Railing Height:
                    <select bind:value={drawerSideHeight} class="border p-1 w-full">
                        {#each RAIL_HEIGHTS as h}
                            <option value={h}>{h} mm</option>
                        {/each}
                    </select>
                </label>
                {/if}
            {/if}
            {#if isOven}
                <label class="block">Drawer System:
                    <select bind:value={drawerSystem} class="border p-1 w-full">
                        <option value="standard">Wooden</option>
                        <option value="metabox">Metabox</option>
                        <option value="vertex">Vertex</option>
                    </select>
                </label>
                {#if drawerSystem === 'metabox' || drawerSystem === 'vertex'}
                <label class="block">Slide Length:
                    <select bind:value={metaboxType} class="border p-1 w-full">
                        {#each SLIDER_LENGHTS as t}
                            <option value={t}>{t} mm</option>
                        {/each}
                    </select>
                </label>
                <label class="block">Railing Height:
                    <select bind:value={drawerSideHeight} class="border p-1 w-full">
                        {#each RAIL_HEIGHTS as h}
                            <option value={h}>{h} mm</option>
                        {/each}
                    </select>
                </label>
                {/if}
            {/if}
            <div class="flex justify-end gap-2 pt-2">
                <button class="px-3 py-1 bg-gray-400 text-white rounded" on:click={() => dispatch('close')}>Cancel</button>
                <button class="px-3 py-1 bg-blue-600 text-white rounded" on:click={saveCabinet}>{cabinet ? 'Save' : 'Add'}</button>
            </div>
        </div>
    </div>
</div>
