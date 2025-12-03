<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { cabinets } from '../stores/cabinets';
  import { materials } from '../stores/materials';
  import { summarizeCosts } from '../utils/cost';

  const dispatch = createEventDispatcher();

  export let inline = false;

  $: summary = summarizeCosts($cabinets, $materials);
</script>

{#if inline}
  <div class="w-full max-w-xl rounded-xl border bg-white shadow-xl">
    <div class="flex items-center justify-between border-b px-5 py-4">
      <div>
        <p class="text-xs uppercase tracking-wide text-gray-500">Cost breakdown</p>
        <h3 class="text-xl font-semibold text-gray-900">${summary.total.toFixed(2)}</h3>
      </div>
      <button
        class="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        on:click={() => dispatch('close')}
      >
        Close
      </button>
    </div>
    <div class="divide-y overflow-y-auto max-h-[70vh]">
      <section class="px-5 py-4 space-y-2">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-semibold text-gray-800">Panels</h4>
          <span class="text-sm text-gray-600">Boards × cost</span>
        </div>
        <div class="space-y-2">
          {#each summary.materials as m}
            <div class="flex items-center justify-between rounded border border-gray-100 px-3 py-2">
              <div class="text-sm font-medium text-gray-800">{m.material}</div>
              <div class="text-sm text-gray-700 flex items-center gap-2">
                <span class="rounded bg-blue-50 px-2 py-0.5 text-blue-800 text-xs font-semibold">{m.boards} boards</span>
                <span class="font-semibold">${m.cost.toFixed(2)}</span>
              </div>
            </div>
          {/each}
        </div>
      </section>

      <section class="px-5 py-4 space-y-2">
        <h4 class="text-sm font-semibold text-gray-800">Operations</h4>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div class="rounded border border-gray-100 bg-gray-50 px-3 py-2">
            <div class="text-gray-600">Edge banding</div>
            <div class="text-lg font-semibold text-gray-900">${summary.edgeBandCost.toFixed(2)}</div>
          </div>
          <div class="rounded border border-gray-100 bg-gray-50 px-3 py-2">
            <div class="text-gray-600">Cutting</div>
            <div class="text-lg font-semibold text-gray-900">${summary.cutCost.toFixed(2)}</div>
          </div>
        </div>
      </section>

      <section class="px-5 py-4 space-y-2">
        <h4 class="text-sm font-semibold text-gray-800">Hardware</h4>
        <div class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700">
          <div class="flex justify-between"><span>Screws</span><span>{summary.bom.screws}</span></div>
          <div class="flex justify-between"><span>Wood dowels</span><span>{summary.bom.dowels}</span></div>
          <div class="flex justify-between"><span>Hinges</span><span>{summary.bom.hinges}</span></div>
          <div class="flex justify-between"><span>Drawer slides</span><span>{summary.bom.slides}</span></div>
        </div>
      </section>

      <section class="px-5 py-4">
        <div class="flex items-center justify-between">
          <div class="text-sm font-semibold text-gray-800">Grand total</div>
          <div class="text-2xl font-bold text-blue-700">${summary.total.toFixed(2)}</div>
        </div>
      </section>
    </div>
  </div>
{:else}
  <div class="fixed inset-0 z-20 flex justify-end bg-black/30" on:click={() => dispatch('close')}>
    <div class="h-full w-full max-w-xl bg-white shadow-2xl animate-[slideIn_200ms_ease-out]" on:click|stopPropagation>
      <div class="flex items-center justify-between border-b px-5 py-4">
        <div>
          <p class="text-xs uppercase tracking-wide text-gray-500">Cost breakdown</p>
          <h3 class="text-xl font-semibold text-gray-900">${summary.total.toFixed(2)}</h3>
        </div>
        <button
          class="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          on:click={() => dispatch('close')}
        >
          Close
        </button>
      </div>

      <div class="divide-y overflow-y-auto h-[calc(100%-72px)]">
        <section class="px-5 py-4 space-y-2">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-semibold text-gray-800">Panels</h4>
            <span class="text-sm text-gray-600">Boards × cost</span>
          </div>
          <div class="space-y-2">
            {#each summary.materials as m}
              <div class="flex items-center justify-between rounded border border-gray-100 px-3 py-2">
                <div class="text-sm font-medium text-gray-800">{m.material}</div>
                <div class="text-sm text-gray-700 flex items-center gap-2">
                  <span class="rounded bg-blue-50 px-2 py-0.5 text-blue-800 text-xs font-semibold">{m.boards} boards</span>
                  <span class="font-semibold">${m.cost.toFixed(2)}</span>
                </div>
              </div>
            {/each}
          </div>
        </section>

        <section class="px-5 py-4 space-y-2">
          <h4 class="text-sm font-semibold text-gray-800">Operations</h4>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="rounded border border-gray-100 bg-gray-50 px-3 py-2">
              <div class="text-gray-600">Edge banding</div>
              <div class="text-lg font-semibold text-gray-900">${summary.edgeBandCost.toFixed(2)}</div>
            </div>
            <div class="rounded border border-gray-100 bg-gray-50 px-3 py-2">
              <div class="text-gray-600">Cutting</div>
              <div class="text-lg font-semibold text-gray-900">${summary.cutCost.toFixed(2)}</div>
            </div>
          </div>
        </section>

        <section class="px-5 py-4 space-y-2">
          <h4 class="text-sm font-semibold text-gray-800">Hardware</h4>
          <div class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700">
            <div class="flex justify-between"><span>Screws</span><span>{summary.bom.screws}</span></div>
            <div class="flex justify-between"><span>Wood dowels</span><span>{summary.bom.dowels}</span></div>
            <div class="flex justify-between"><span>Hinges</span><span>{summary.bom.hinges}</span></div>
            <div class="flex justify-between"><span>Drawer slides</span><span>{summary.bom.slides}</span></div>
          </div>
        </section>

        <section class="px-5 py-4">
          <div class="flex items-center justify-between">
            <div class="text-sm font-semibold text-gray-800">Grand total</div>
            <div class="text-2xl font-bold text-blue-700">${summary.total.toFixed(2)}</div>
          </div>
        </section>
      </div>
    </div>
  </div>
{/if}

<style>
@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
</style>
