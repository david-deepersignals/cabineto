<script lang="ts">
  import Form from "./components/Form.svelte";
  import MaterialForm from "./components/MaterialForm.svelte";
  import LayoutSummary from "./components/LayoutSummary.svelte";
  import { cabinets } from './stores/cabinets';
  import { onMount } from 'svelte';
  import interact from 'interactjs';

  const downloadCSV = () => {
    let csv = "1. dimension (mm),2. dimension (mm),quantity,edge banding right,edge banding left,edge banding bottom,edge banding top,label,hinge location\n";

    $cabinets.forEach(cab => {
      console.log(cab);
      cab.panels().forEach(p => {
        csv += p.join(",") + "\n";
      })
    });


    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cabinet_panels.csv";
    a.click();
  };
  let showForm = false;
  let showMaterialForm = false;
  let showSummary = false;

  const toggleForm = () => {
    showForm = !showForm;
  };

  const toggleMaterialForm = () => {
    showMaterialForm = !showMaterialForm;
  };

  // Recalculate dimension marks whenever cabinet positions change
  let marksX: number[] = [];
  let marksY: number[] = [];
  $: marksX = Array.from(new Set($cabinets.flatMap(c => [c.x ?? 0, (c.x ?? 0) + (c.w/3 || 0)]))).sort((a, b) => a - b);
  $: marksY = Array.from(new Set($cabinets.flatMap(c => [c.y ?? 0, (c.y ?? 0) + (c.h/3 || 0)]))).sort((a, b) => a - b);

  onMount(() => {
    interact('.cabinet').draggable({
      modifiers: [
        interact.modifiers.restrictRect({ restriction: '#layout', endOnly: false }),
        interact.modifiers.snap({
          targets: [interact.snappers.grid({ x: 10, y: 10 })],
          range: Infinity,
        })
      ],
      listeners: {
        move (event) {
          const target = event.target as HTMLElement;
          const id = target.dataset.id as string;

          let x = parseFloat(target.style.left || '0') + event.dx;
          let y = parseFloat(target.style.top || '0') + event.dy;

          // Clamp to container bounds
          const layout = document.getElementById('layout');
          if (layout) {
            const rect = layout.getBoundingClientRect();
            const maxX = rect.width - target.offsetWidth;
            const maxY = rect.height - target.offsetHeight;
            x = Math.max(0, Math.min(x, maxX));
            y = Math.max(0, Math.min(y, maxY));
          }

          // Snap to grid
          x = Math.round(x / 10) * 10;
          y = Math.round(y / 10) * 10;

          target.style.left = `${x}px`;
          target.style.top = `${y}px`;

          cabinets.update(current => {
            const idx = current.findIndex(c => c.id === id);
            if (idx !== -1) {
              current[idx].x = x;
              current[idx].y = y;
            }
            return [...current];
          });
        }
      }
    });
  });





</script>

<style>
  #layout {
    width: 100%;
    border: 2px dashed #ccc;
    position: relative;
    margin-bottom: 20px;
    background-color: #f8fafc;
    background-image: linear-gradient(to right, #e2e8f0 1px, transparent 1px),
      linear-gradient(to bottom, #e2e8f0 1px, transparent 1px);
    background-size: 10px 10px;
  }
  .cabinet {
    position: absolute;
    border: 2px solid #444;
    background-color: rgba(100, 150, 240, 0.3);
    padding: 4px;
    text-align: center;
    font-size: 10px;
    cursor: move;
  }

  .ruler {
    position: absolute;
    pointer-events: none;
    font-size: 10px;
  }

  .ruler.bottom {
    left: 0;
    bottom: 0;
    height: 20px;
    width: 100%;
    border-top: 1px solid #aaa;
  }

  .ruler.bottom .tick {
    position: absolute;
    bottom: 0;
    width: 1px;
    height: 10px;
    background: #555;
  }

  .ruler.right {
    top: 0;
    right: 0;
    width: 20px;
    height: 100%;
    border-left: 1px solid #aaa;
  }

  .ruler.right .tick {
    position: absolute;
    right: 0;
    width: 10px;
    height: 1px;
    background: #555;
  }
</style>

<div class="h-full">
  <h2 class="text-xl font-bold mb-4">Visual Cabinet Planner</h2>

  {#if showSummary}
    <LayoutSummary on:close={() => showSummary = false} />
  {:else}
    <div class="flex gap-4 mb-4">
      <button on:click={toggleForm} class="px-4 py-2 bg-blue-600 text-white rounded">
        {showForm ? 'Close Form' : 'Add Cabinet'}
      </button>
      <button on:click={toggleMaterialForm} class="px-4 py-2 bg-purple-600 text-white rounded">
        {showMaterialForm ? 'Close Materials' : 'Materials'}
      </button>
      <button class="px-4 py-2 bg-green-600 text-white rounded" on:click={() => downloadCSV()}>
        Download CSV
      </button>
      <button class="px-4 py-2 bg-gray-600 text-white rounded" on:click={() => showSummary = true}>
        Layout Summary
      </button>
    </div>

    <div id="layout">
      {#each $cabinets as cabinet, index}
        <div
          class="cabinet"
          role="button"
          tabindex="{index}"
          data-id={cabinet.id}
          style="left: {cabinet.x}px; top: {cabinet.y}px; width: {cabinet.w/3}px; height: {cabinet.h/3}px;"
        >
          {`Cabinet ${cabinet.id}`}
          {#if cabinet.type === 'door'}
            🚪 {(cabinet as any).doors} door(s)
          {/if}
          {#if cabinet.type === 'drawer'}
            🗄️ {(cabinet as any).drawers} drawer(s)<br>{(cabinet as any).heights.join("% / ")}
          {/if}
        </div>
      {/each}

      <div class="ruler bottom">
        {#each marksX as mark}
          <div class="tick" style="left: {mark}px"></div>
        {/each}
      </div>
      <div class="ruler right">
        {#each marksY as mark}
          <div class="tick" style="top: {mark}px"></div>
        {/each}
      </div>
    </div>

    {#if showForm}
      <Form on:close={() => showForm = false} />
    {/if}
    {#if showMaterialForm}
      <MaterialForm on:close={() => showMaterialForm = false} />
    {/if}
  {/if}
</div>
