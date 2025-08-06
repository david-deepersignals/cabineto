<script>
    import { createEventDispatcher } from 'svelte';
    import { materials } from '../stores/materials';

    const dispatch = createEventDispatcher();

    let corpus = $materials.corpus.thickness.toString();
    let front = $materials.front.thickness.toString();
    let back = $materials.back.thickness.toString();

    const save = () => {
        materials.set({
            corpus: { thickness: parseFloat(corpus) || 18 },
            front: { thickness: parseFloat(front) || 19 },
            back: { thickness: parseFloat(back) || 3 }
        });
        dispatch('close');
    };
</script>

<div class="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50">
    <div class="bg-white p-6 rounded shadow-md w-full max-w-sm">
        <h3 class="text-lg font-semibold mb-4">Materials Setup</h3>
        <div class="space-y-2">
            <label class="block">Corpus Thickness (mm):
                <input type="number" bind:value={corpus} class="border p-1 w-full" />
            </label>
            <label class="block">Front Thickness (mm):
                <input type="number" bind:value={front} class="border p-1 w-full" />
            </label>
            <label class="block">Back Thickness (mm):
                <input type="number" bind:value={back} class="border p-1 w-full" />
            </label>
            <div class="flex justify-end gap-2 pt-2">
                <button class="px-3 py-1 bg-gray-400 text-white rounded" on:click={() => dispatch('close')}>Cancel</button>
                <button class="px-3 py-1 bg-blue-600 text-white rounded" on:click={save}>Save</button>
            </div>
        </div>
    </div>
</div>
