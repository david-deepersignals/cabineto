<script>
    import { createEventDispatcher } from 'svelte';
    import {DoorCabinet} from "../cabinet/DoorCabinet";
    import {DrawerCabinet} from "../cabinet/DrawerCabinet";
    import {CornerCabinet} from "../cabinet/CornerCabinet";
    import {OvenCabinet} from "../cabinet/OvenCabinet";
    import { cabinets } from '../stores/cabinets';

    const dispatch = createEventDispatcher();


    let width = '10';
    let height = '10';
    let depth = '10';
    let type = 'door';
    let doors = 2;
    let drawers = 3;
    let drawerHeights = '30,30,40';
    let drawerClearance = 12;
    let fixedSide = '0';
    let fullCorpus = false;
    let insetBack = false;

    $: isDrawer = type === 'drawer';
    $: isDoor = type === 'door';
    $: isCorner = type === 'corner';
    $: isOven = type === 'oven';

    const addCabinet = () => {
        const w = parseFloat(width);
        const h = parseFloat(height);
        const d = parseFloat(depth);
        if (!w || !h || !d) {
            alert('All dimensions (width, height, depth) must be filled.');
            return;
        }

        const id = `CAB-${$cabinets.length + 1}`;


        let newCabinet;
        if (type === "door") {
            newCabinet = new DoorCabinet(
                id,
                w * 10,
                h * 10,
                d * 10,
                doors ?? 0,
                {full:fullCorpus,
                insetBack:insetBack})
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
                drawerClearance || 0,
                {full:fullCorpus,
                    insetBack:insetBack})

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
                {full:fullCorpus, insetBack:insetBack}
            );
        } else if (type === "oven") {
            newCabinet = new OvenCabinet(
                id,
                w * 10,
                h * 10,
                d * 10,
                0,
                {full:fullCorpus, insetBack:insetBack}
            );
        } else {
            return;
        }

        newCabinet.validate()
        cabinets.update(prev => [...prev, newCabinet]);
        dispatch('close');
    };
</script>

<div class="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50">
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
                <label class="block">Slider Clearance (mm per side):
                    <input type="number" bind:value={drawerClearance} class="border p-1 w-full" />
                </label>
            {/if}
            <div class="flex justify-end gap-2 pt-2">
                <button class="px-3 py-1 bg-gray-400 text-white rounded" on:click={() => dispatch('close')}>Cancel</button>
                <button class="px-3 py-1 bg-blue-600 text-white rounded" on:click={addCabinet}>Add</button>
            </div>
        </div>
    </div>
</div>
