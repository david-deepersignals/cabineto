<script>
    import { createEventDispatcher } from 'svelte';
    import {DoorCabinet} from "../models/DoorCabinet.ts";
    import {DrawerCabinet} from "../models/DrawerCabinet.js";

    const dispatch = createEventDispatcher();

    export let counter;


    let width = '10';
    let height = '10';
    let depth = '10';
    let thickness = '19';
    let type = 'door';
    let doors = 2;
    let drawers = 3;
    let drawerHeights = '30,30,40';
    let drawerClearance = 12;
    let fullCorpus = false;
    let insetBack = false;

    $: isDrawer = type === 'drawer';
    $: isDoor = type === 'door';

    const addCabinet = () => {
        const w = parseFloat(width);
        const h = parseFloat(height);
        const d = parseFloat(depth);
        const t = parseFloat(thickness);

        if (!w || !h || !d || !t) {
            alert('All dimensions (width, height, depth, thickness) must be filled.');
            return;
        }

        const id = `CAB-${counter}`;


        let newCabinet;
        if (type === "door") {
            newCabinet = new DoorCabinet(
                id,
                w * 10,
                h * 10,
                d * 10,
                t,
                doors ?? 0,
                {full:fullCorpus,
                insetBack:insetBack})
        } else if (type === "drawer") {

            newCabinet = new DrawerCabinet(
                id,
                w * 10,
                h * 10,
                d * 10,
                t,
                drawers,
                drawerHeights.split(',')
                    .map(s => parseFloat(s.trim()))
                    .filter(v => !isNaN(v)),
                drawerClearance || 0,
                {full:fullCorpus,
                    insetBack:insetBack})

        }else {
            return;
        }

        newCabinet.validate()
        dispatch('addCabinet', newCabinet);
    };
</script>

<div class="inset-0 flex items-center justify-center bg-black bg-opacity-50">
    <div class="bg-white p-6 rounded shadow-md w-full max-w-sm">
        <h3 class="text-lg font-semibold mb-4">Add Cabinet</h3>
        <div class="space-y-2">
            <label class="block">Width (cm):
                <input type="number" bind:value={width} class="border p-1 w-full" required />
            </label>
            <label class="block">Height (cm):
                <input type="number" bind:value={height} class="border p-1 w-full" required />
            </label>
            <label class="block">Depth (cm):
                <input type="number" bind:value={depth} class="border p-1 w-full" required />
            </label>
            <label class="block">Thickness (mm):
                <input type="number" bind:value={thickness} class="border p-1 w-full" required />
            </label>
            <label class="block">Full Corpus:
            <input type="checkbox" bind:checked={fullCorpus} class="border p-1 w-full" />
            </label>
            <label class="block">Inset Back:
            <input type="checkbox" bind:checked={insetBack} class="border p-1 w-full" />
            </label>
            <label class="block">Type:
                <select bind:value={type} class="border p-1 w-full">
                    <option value="door">Door</option>
                    <option value="drawer">Drawer</option>
                </select>
            </label>
            {#if isDoor}
                <label class="block">Doors:
                    <input type="number" bind:value={doors} class="border p-1 w-full" />
                </label>
            {/if}
            {#if isDrawer}
                <label class="block">Drawers:
                    <input type="number" bind:value={drawers} class="border p-1 w-full" />
                </label>
                <label class="block">Heights (comma-separated %):
                    <input type="text" bind:value={drawerHeights} class="border p-1 w-full" />
                </label>
                <label class="block">Slider Clearance (mm per side):
                    <input type="number" bind:value={drawerClearance} class="border p-1 w-full" />
                </label>
            {/if}
            <div class="flex justify-end gap-2 pt-2">
                <button class="px-3 py-1 bg-gray-400 text-white rounded" on:click={() => dispatch('cancel')}>Cancel</button>
                <button class="px-3 py-1 bg-blue-600 text-white rounded" on:click={addCabinet}>Add</button>
            </div>
        </div>
    </div>
</div>