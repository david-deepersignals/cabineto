<script>
    import { createEventDispatcher } from 'svelte';
    import { materials } from '../stores/materials';
    import { room } from '../stores/room';

    const dispatch = createEventDispatcher();

    let corpus = $materials.corpus.thickness.toString();
    let front = $materials.front.thickness.toString();
    let back = $materials.back.thickness.toString();
    let corpusName = $materials.corpus.name;
    let frontName = $materials.front.name;
    let backName = $materials.back.name;

    let width = ($room.width / 10).toString();
    let depth = ($room.depth / 10).toString();
    let height = ($room.height / 10).toString();

    const save = () => {
        materials.set({
            corpus: { name: corpusName, thickness: parseFloat(corpus) || 18 },
            front: { name: frontName, thickness: parseFloat(front) || 19 },
            back: { name: backName, thickness: parseFloat(back) || 3 }
        });
        room.set({
            width: (parseFloat(width) || 0) * 10,
            depth: (parseFloat(depth) || 0) * 10,
            height: (parseFloat(height) || 0) * 10
        });
        dispatch('close');
    };
</script>

<div class="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50">
    <div class="bg-white p-6 rounded shadow-md w-full max-w-sm">
        <h3 class="text-lg font-semibold mb-4">Settings</h3>
        <div class="space-y-4">
            <div class="space-y-2">
                <h4 class="font-semibold">Room Size</h4>
                <label class="block">Width (cm):
                    <input type="number" bind:value={width} class="border p-1 w-full" />
                </label>
                <label class="block">Depth (cm):
                    <input type="number" bind:value={depth} class="border p-1 w-full" />
                </label>
                <label class="block">Height (cm):
                    <input type="number" bind:value={height} class="border p-1 w-full" />
                </label>
            </div>
            <div class="space-y-2">
                <h4 class="font-semibold">Materials</h4>
                <label class="block">Corpus Name:
                    <input type="text" bind:value={corpusName} class="border p-1 w-full" />
                </label>
                <label class="block">Corpus Thickness (mm):
                    <input type="number" bind:value={corpus} class="border p-1 w-full" />
                </label>
                <label class="block">Front Name:
                    <input type="text" bind:value={frontName} class="border p-1 w-full" />
                </label>
                <label class="block">Front Thickness (mm):
                    <input type="number" bind:value={front} class="border p-1 w-full" />
                </label>
                <label class="block">Back Name:
                    <input type="text" bind:value={backName} class="border p-1 w-full" />
                </label>
                <label class="block">Back Thickness (mm):
                    <input type="number" bind:value={back} class="border p-1 w-full" />
                </label>
            </div>
            <div class="flex justify-end gap-2 pt-2">
                <button class="px-3 py-1 bg-gray-400 text-white rounded" on:click={() => dispatch('close')}>Cancel</button>
                <button class="px-3 py-1 bg-blue-600 text-white rounded" on:click={save}>Save</button>
            </div>
        </div>
    </div>
</div>
