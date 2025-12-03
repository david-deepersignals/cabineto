<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { materials } from '../stores/materials';
  import { room } from '../stores/room';

  const dispatch = createEventDispatcher();

  const numberOr = (value: string, fallback: number) => {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  let roomWidth = ($room.width / 10).toString();
  let roomDepth = ($room.depth / 10).toString();
  let roomHeight = ($room.height / 10).toString();

  let corpusName = $materials.corpus.name;
  let corpusThickness = $materials.corpus.thickness.toString();
  let corpusCost = ($materials.corpus.cost ?? 0).toString();

  let frontName = $materials.front.name;
  let frontThickness = $materials.front.thickness.toString();
  let frontCost = ($materials.front.cost ?? 0).toString();

  let backName = $materials.back.name;
  let backThickness = $materials.back.thickness.toString();
  let backCost = ($materials.back.cost ?? 0).toString();

  let drawerName = $materials.drawer.name;
  let drawerThickness = $materials.drawer.thickness.toString();
  let drawerCost = ($materials.drawer.cost ?? 0).toString();

  let edgeBandCost = ($materials.edgeBandingCostPerMeter ?? 0).toString();
  let cutCost = ($materials.cutCostPerMeter ?? 0).toString();

  const save = () => {
    materials.set({
      corpus: {
        name: corpusName,
        thickness: numberOr(corpusThickness, 18),
        cost: numberOr(corpusCost, 0)
      },
      front: {
        name: frontName,
        thickness: numberOr(frontThickness, 19),
        cost: numberOr(frontCost, 0)
      },
      back: {
        name: backName,
        thickness: numberOr(backThickness, 3),
        cost: numberOr(backCost, 0)
      },
      drawer: {
        name: drawerName,
        thickness: numberOr(drawerThickness, 16),
        cost: numberOr(drawerCost, 0)
      },
      edgeBandingCostPerMeter: numberOr(edgeBandCost, 0),
      cutCostPerMeter: numberOr(cutCost, 0)
    });

    room.set({
      width: numberOr(roomWidth, 0) * 10,
      depth: numberOr(roomDepth, 0) * 10,
      height: numberOr(roomHeight, 0) * 10
    });

    dispatch('close');
  };
</script>

<div class="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-10">
  <div class="mx-auto flex max-w-6xl flex-col gap-6">
    <div class="flex flex-col gap-2">
      <h3 class="text-2xl font-semibold">Project Settings</h3>
      <p class="text-sm text-gray-600">
        Tune the room envelope and the materials you are pricing against. Grouped sections keep the difference
        between cabinet box, fronts, backs, and drawers clear.
      </p>
    </div>

    <section class="rounded-lg border bg-white p-5 shadow">
      <div class="mb-4 flex items-start justify-between gap-4">
        <div>
          <h4 class="text-lg font-semibold">Room envelope</h4>
          <p class="text-sm text-gray-600">
            Define the overall footprint you are designing for. Values are stored in centimeters for quick edits
            and converted back to millimeters for calculations.
          </p>
        </div>
        <span class="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">cm</span>
      </div>
      <div class="grid gap-4 md:grid-cols-3">
        <label class="space-y-1 text-sm font-medium text-gray-700">
          Width
          <input
            class="w-full rounded border px-3 py-2 text-sm"
            type="number"
            min="0"
            step="1"
            bind:value={roomWidth}
            placeholder="e.g. 400"
          />
        </label>
        <label class="space-y-1 text-sm font-medium text-gray-700">
          Depth
          <input
            class="w-full rounded border px-3 py-2 text-sm"
            type="number"
            min="0"
            step="1"
            bind:value={roomDepth}
            placeholder="e.g. 300"
          />
        </label>
        <label class="space-y-1 text-sm font-medium text-gray-700">
          Height
          <input
            class="w-full rounded border px-3 py-2 text-sm"
            type="number"
            min="0"
            step="1"
            bind:value={roomHeight}
            placeholder="e.g. 250"
          />
        </label>
      </div>
    </section>

    <section class="rounded-lg border bg-white p-5 shadow space-y-4">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h4 class="text-lg font-semibold">Panel materials</h4>
          <p class="text-sm text-gray-600">
            Name and size the components that make up your cabinets. Keep the display name friendly while the
            thickness drives cut lists and clearances.
          </p>
        </div>
        <span class="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">mm</span>
      </div>
      <div class="grid gap-4 md:grid-cols-2">
        <div class="rounded border bg-slate-50 p-4 shadow-inner">
          <div class="mb-2">
            <h5 class="font-semibold">Cabinet box (corpus)</h5>
            <p class="text-sm text-gray-600">Side panels, bottoms, and tops for the carcass.</p>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="space-y-1 text-sm font-medium text-gray-700">
              Display name
              <input class="w-full rounded border px-3 py-2 text-sm" type="text" bind:value={corpusName} />
            </label>
            <label class="space-y-1 text-sm font-medium text-gray-700">
              Panel thickness
              <input
                class="w-full rounded border px-3 py-2 text-sm"
                type="number"
                min="0"
                step="0.1"
                bind:value={corpusThickness}
              />
            </label>
            <label class="space-y-1 text-sm font-medium text-gray-700 sm:col-span-2">
              Material cost (per m²)
              <input
                class="w-full rounded border px-3 py-2 text-sm"
                type="number"
                min="0"
                step="0.01"
                bind:value={corpusCost}
              />
            </label>
          </div>
        </div>

        <div class="rounded border bg-slate-50 p-4 shadow-inner">
          <div class="mb-2">
            <h5 class="font-semibold">Fronts</h5>
            <p class="text-sm text-gray-600">Doors or drawer fronts visible to the user.</p>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="space-y-1 text-sm font-medium text-gray-700">
              Display name
              <input class="w-full rounded border px-3 py-2 text-sm" type="text" bind:value={frontName} />
            </label>
            <label class="space-y-1 text-sm font-medium text-gray-700">
              Panel thickness
              <input
                class="w-full rounded border px-3 py-2 text-sm"
                type="number"
                min="0"
                step="0.1"
                bind:value={frontThickness}
              />
            </label>
            <label class="space-y-1 text-sm font-medium text-gray-700 sm:col-span-2">
              Material cost (per m²)
              <input
                class="w-full rounded border px-3 py-2 text-sm"
                type="number"
                min="0"
                step="0.01"
                bind:value={frontCost}
              />
            </label>
          </div>
        </div>

        <div class="rounded border bg-slate-50 p-4 shadow-inner">
          <div class="mb-2">
            <h5 class="font-semibold">Backs</h5>
            <p class="text-sm text-gray-600">Thin panels for cabinet backs or drawer bottoms.</p>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="space-y-1 text-sm font-medium text-gray-700">
              Display name
              <input class="w-full rounded border px-3 py-2 text-sm" type="text" bind:value={backName} />
            </label>
            <label class="space-y-1 text-sm font-medium text-gray-700">
              Panel thickness
              <input
                class="w-full rounded border px-3 py-2 text-sm"
                type="number"
                min="0"
                step="0.1"
                bind:value={backThickness}
              />
            </label>
            <label class="space-y-1 text-sm font-medium text-gray-700 sm:col-span-2">
              Material cost (per m²)
              <input
                class="w-full rounded border px-3 py-2 text-sm"
                type="number"
                min="0"
                step="0.01"
                bind:value={backCost}
              />
            </label>
          </div>
        </div>

        <div class="rounded border bg-slate-50 p-4 shadow-inner">
          <div class="mb-2">
            <h5 class="font-semibold">Drawer boxes</h5>
            <p class="text-sm text-gray-600">Sides and fronts that make up drawer internals.</p>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="space-y-1 text-sm font-medium text-gray-700">
              Display name
              <input class="w-full rounded border px-3 py-2 text-sm" type="text" bind:value={drawerName} />
            </label>
            <label class="space-y-1 text-sm font-medium text-gray-700">
              Panel thickness
              <input
                class="w-full rounded border px-3 py-2 text-sm"
                type="number"
                min="0"
                step="0.1"
                bind:value={drawerThickness}
              />
            </label>
            <label class="space-y-1 text-sm font-medium text-gray-700 sm:col-span-2">
              Material cost (per m²)
              <input
                class="w-full rounded border px-3 py-2 text-sm"
                type="number"
                min="0"
                step="0.01"
                bind:value={drawerCost}
              />
            </label>
          </div>
        </div>
      </div>
    </section>

    <section class="rounded-lg border bg-white p-5 shadow">
      <div class="mb-3">
        <h4 class="text-lg font-semibold">Edge & fabrication costs</h4>
        <p class="text-sm text-gray-600">
          Capture per-meter operations so pricing reflects edge banding and cutting labor.
        </p>
      </div>
      <div class="grid gap-4 md:grid-cols-2">
        <label class="space-y-1 text-sm font-medium text-gray-700">
          Edge banding (per m)
          <input
            class="w-full rounded border px-3 py-2 text-sm"
            type="number"
            min="0"
            step="0.01"
            bind:value={edgeBandCost}
          />
        </label>
        <label class="space-y-1 text-sm font-medium text-gray-700">
          Cutting (per m)
          <input
            class="w-full rounded border px-3 py-2 text-sm"
            type="number"
            min="0"
            step="0.01"
            bind:value={cutCost}
          />
        </label>
      </div>
    </section>

    <div class="rounded-lg border bg-white p-4 shadow flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p class="text-sm text-gray-600">
        Save to immediately apply dimensions and rates to cabinet calculations.
      </p>
      <button class="px-4 py-2 rounded bg-blue-600 text-white shadow-sm" on:click={save}>Save changes</button>
    </div>
  </div>
</div>
