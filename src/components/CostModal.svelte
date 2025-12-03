<script lang="ts">
import { createEventDispatcher } from 'svelte';
import { cabinets } from '../stores/cabinets';
import { materials } from '../stores/materials';
import { summarizeCosts } from '../utils/cost';

const dispatch = createEventDispatcher();

$: summary = summarizeCosts($cabinets, $materials);
</script>

<div class="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50">
  <div class="bg-white p-6 rounded shadow-md w-full max-w-md">
    <h3 class="text-lg font-semibold mb-4">Cost Summary</h3>
    <div class="space-y-2">
      {#each summary.materials as m}
        <div>{m.material}: {m.boards} boards - ${m.cost.toFixed(2)}</div>
      {/each}
      <div>Edge Banding: ${summary.edgeBandCost.toFixed(2)}</div>
      <div>Cutting: ${summary.cutCost.toFixed(2)}</div>
      <div class="font-bold border-t pt-2">Total: ${summary.total.toFixed(2)}</div>
      <h4 class="text-md font-semibold mt-2">Hardware BOM</h4>
      <table class="w-full text-sm">
        <tbody>
          <tr><td>Screws</td><td class="text-right">{summary.bom.screws}</td></tr>
          <tr><td>Wood dowels</td><td class="text-right">{summary.bom.dowels}</td></tr>
          <tr><td>Hinges</td><td class="text-right">{summary.bom.hinges}</td></tr>
          <tr><td>Drawer slides</td><td class="text-right">{summary.bom.slides}</td></tr>
        </tbody>
      </table>
    </div>
    <div class="flex justify-end mt-4">
      <button class="px-3 py-1 bg-gray-400 text-white rounded" on:click={() => dispatch('close')}>Close</button>
    </div>
  </div>
</div>

<style>
  /* minimal styling handled by parent classes */
</style>
