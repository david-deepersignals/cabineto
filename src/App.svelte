<script lang="ts">
import Form from "./components/Form.svelte";
import MaterialForm from "./components/MaterialForm.svelte";
import LayoutSummary from "./components/LayoutSummary.svelte";
import { cabinets } from './stores/cabinets';
import { scale } from './stores/scale';
import type { Corpus, Panel } from './cabinet/Corpus';

const GRID_SIZE = 10;
const layoutWidthMm = 1000;
const layoutHeightMm = 500;
let layout: HTMLDivElement;

$: layoutWidth = layoutWidthMm;
$: layoutHeight = layoutHeightMm;

const downloadJSON = () => {
  const json = JSON.stringify($cabinets, null, 2);
  const blob = new Blob([json], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "cabinets.json";  // Specify the file name
  a.click();
};
  const downloadCSV = () => {



    
    let csv = csvMaxMoris();


    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cabinet_panels.csv";
    a.click();
  };


  function csvGeneral() {
    let csv = "length (mm),width (mm),quantity,edge banding length right,edge banding length left,edge banding width bottom,edge banding width top,label,hinge location,material name,material thickness\n";

    $cabinets.forEach(cab => {
      cab.panels().forEach((p: Panel) => {
        csv += [
          p.length,
          p.width,
          p.quantity,
          p.edgeBandingLengthRight,
          p.edgeBandingLengthLeft,
          p.edgeBandingWidthBottom,
          p.edgeBandingWidthTop,
          p.label,
          p.hingeLocation,
          p.material,
          p.materialThickness
        ].join(",") + "\n";
      })
    });

    return csv

  }

function csvMaxMoris() {
  let csv = "BR.,ŠIFRA MATERIJALA,DEB. mm,NAZIV ELEMENTA U KORPUSU,NAZIV KORPUSA,DUŽINA (Smjer goda) mm,ŠIRINA mm,KOM.,DUPLA PLOČA,ABS 2mm - DUŽINA (Prednji rub),ABS 2mm - DUŽINA (Stražnji rub),ABS 2mm - ŠIRINA (Lijevi rub),ABS 2mm - ŠIRINA (Desni rub),ABS 1mm - DUŽINA (Prednji rub),ABS 1mm - DUŽINA (Stražnji rub),ABS 1mm - ŠIRINA (Lijevi rub),ABS 1mm - ŠIRINA (Desni rub),ABS 0.5mm - DUŽINA (Prednji rub),ABS 0.5mm - DUŽINA (Stražnji rub),ABS 0.5mm - ŠIRINA (Lijevi rub),ABS 0.5mm - ŠIRINA (Desni rub),UTOR/LIMBEL,UKOP ZA BRITVELE,NAPOMENA\n"

  let index = 1;
  $cabinets.forEach(cab => {
    cab.panels().forEach((p: Panel) => {
      csv += [
             index,
             p.material,
             p.materialThickness,
             p.label.split("->")[1],
             p.label.split("->")[0],
             p.length,
             p.width,
              p.quantity,
             'NE',
             '', //ABS 2mm
             '', //ABS 2mm
             '', //ABS 2mm
             '', //ABS 2mm
            p.edgeBandingLengthRight,
            p.edgeBandingLengthLeft,
            p.edgeBandingWidthBottom,
            p.edgeBandingWidthTop,
            '', //ABS 0.5mm
            '', //ABS 0.5mm
            '', //ABS 0.5mm
            '', //ABS 0.5mm,
            '', //limbel TBD,
            p.hingeLocation,
              ''
      ].join(",") + "\n";

      index++;
    })
  });

  return csv

}

  let showForm = false;
  let showMaterialForm = false;
  let showSummary = false;
  let editingCabinet: Corpus | null = null;

  const openAddForm = () => {
    editingCabinet = null;
    showForm = true;
  };

  const openEditForm = (cab: Corpus) => {
    editingCabinet = cab;
    showForm = true;
  };

  const closeForm = () => {
    showForm = false;
    editingCabinet = null;
  };

  const toggleMaterialForm = () => {
    showMaterialForm = !showMaterialForm;
  };

  const deleteCabinet = (id: string) => {
    cabinets.update(cabs => cabs.filter(c => c.id !== id));
  };

  const zoomIn = () => scale.update(s => Math.max(0.5, s - 0.5));
  const zoomOut = () => scale.update(s => s + 0.5);

  let dragInfo: {
    isDragging: boolean;
    offsetX: number;
    offsetY: number;
    targetId: string | null;
    layoutLeft: number;
    layoutTop: number;
  } = {
    isDragging: false,
    offsetX: 0,
    offsetY: 0,
    targetId: null,
    layoutLeft: 0,
    layoutTop: 0
  };


  function startDrag(event: MouseEvent, cabinetId: string) {
    // Find the cabinet being dragged
    const target = event.target as HTMLElement;
    const rect = target.getBoundingClientRect();
    const layoutRect = layout.getBoundingClientRect();

    dragInfo.isDragging = true;
    dragInfo.targetId = cabinetId;
    dragInfo.offsetX = event.clientX - rect.left;
    dragInfo.offsetY = event.clientY - rect.top;
    dragInfo.layoutLeft = layoutRect.left;
    dragInfo.layoutTop = layoutRect.top;
  }

  function handleDrag(event: MouseEvent) {
    if (!dragInfo.isDragging || dragInfo.targetId === null) return;

    // Calculate current position based on cursor and offset, relative to the layout
    let x = event.clientX - dragInfo.layoutLeft - dragInfo.offsetX;
    let y = event.clientY - dragInfo.layoutTop - dragInfo.offsetY;

    const index = $cabinets.findIndex((cab) => cab.id === dragInfo.targetId);
    const currentCab = $cabinets[index];
    const w = currentCab?.w ? currentCab.w / $scale : 0;
    const h = currentCab?.h ? currentCab.h / $scale : 0;
    x = Math.max(0, Math.min(layoutWidth - w, x));
    y = Math.max(0, Math.min(layoutHeight - h, y));

    // Update cabinet position in store
    cabinets.update((current) => {
      const index = current.findIndex((cab) => cab.id === dragInfo.targetId);
      if (index !== -1) {
        const currentCab = current[index];
        currentCab.x = x;
        currentCab.y = y;
        current[index] = currentCab;
      }
      return [...current];
    });
  }

  function stopDrag() {
    if (!dragInfo.isDragging) return;

    cabinets.update((current) => {
      const index = current.findIndex((cab) => cab.id === dragInfo.targetId);
      if (index === -1) return current;

      const draggedCabinet = current[index];
      let finalLeft = Math.round(((draggedCabinet.x ?? 0) / GRID_SIZE)) * GRID_SIZE;
      let finalTop = Math.round(((draggedCabinet.y ?? 0) / GRID_SIZE)) * GRID_SIZE;

      const w = draggedCabinet.w / $scale || 100;
      const h = draggedCabinet.h / $scale || 100;

      finalLeft = Math.max(0, Math.min(layoutWidth - w, finalLeft));
      finalTop = Math.max(0, Math.min(layoutHeight - h, finalTop));

      const rect1 = {
        x: finalLeft,
        y: finalTop,
        w,
        h
      };

      let collision = false;
      let bestSnap = null;

      // Check for collisions
      current.forEach((otherCabinet, i) => {
        if (i === index) return;

        const rect2 = {
          x: otherCabinet.x ?? 0,
          y: otherCabinet.y ?? 0,
          w: otherCabinet.w / $scale || 100,
          h: otherCabinet.h / $scale || 100
        };

        if (
                rect1.x < rect2.x + rect2.w &&
                rect1.x + rect1.w > rect2.x &&
                rect1.y < rect2.y + rect2.h &&
                rect1.y + rect1.h > rect2.y
        ) {
          collision = true;

          const snapOptions: [number, number][] = [
            [rect2.x - rect1.w, rect2.y],         // Snap to left of other
            [rect2.x + rect2.w, rect2.y],         // Snap to right of other
            [rect2.x, rect2.y - rect1.h],         // Snap above other
            [rect2.x, rect2.y + rect2.h],         // Snap below other
            [rect2.x, rect2.y]                   // Snap to overlap other
          ];

          for (let [snapX, snapY] of snapOptions) {
            snapX = Math.round(snapX / GRID_SIZE) * GRID_SIZE;
            snapY = Math.round(snapY / GRID_SIZE) * GRID_SIZE;

            snapX = Math.max(0, Math.min(layoutWidth - rect1.w, snapX));
            snapY = Math.max(0, Math.min(layoutHeight - rect1.h, snapY));

            const testRect = { x: snapX, y: snapY, w: rect1.w, h: rect1.h };

            // Check if the new position overlaps with other cabinets
            const overlap = current.some((other2, j) => {
              if (j === index || j === i) return false;

            const rect3 = {
                x: other2.x ?? 0,
                y: other2.y ?? 0,
                w: other2.w || 100,
                h: other2.h || 100
              };

              return (
                      testRect.x < rect3.x + rect3.w &&
                      testRect.x + testRect.w > rect3.x &&
                      testRect.y < rect3.y + rect3.h &&
                      testRect.y + testRect.h > rect3.y
              );
            });

            if (!overlap) {
              bestSnap = [snapX, snapY];
              break;
            }
          }
        }
      });

      // Update cabinet position based on collision resolution
      if (!collision || bestSnap === null) {
        draggedCabinet.x = finalLeft;
        draggedCabinet.y = finalTop;
        current[index] = draggedCabinet;
      } else {
        draggedCabinet.x = bestSnap[0];
        draggedCabinet.y = bestSnap[1];
        current[index] = draggedCabinet;
      }

      return [...current];
    });

    dragInfo.isDragging = false;
    dragInfo.targetId = null;
  }


  // Attach event listeners to handle global mouse move and mouse up
  window.addEventListener("mousemove", handleDrag);
  window.addEventListener("mouseup", stopDrag);





  $: depthMismatch = new Set<string>();
  $: {
    depthMismatch.clear();
    const list = $cabinets;
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      const aw = a.w / $scale;
      const ah = a.h / $scale;
      const ax = a.x ?? 0;
      const ay = a.y ?? 0;
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j];
        const bw = b.w / $scale;
        const bh = b.h / $scale;
        const bx = b.x ?? 0;
        const by = b.y ?? 0;
        const verticalOverlap = ay < by + bh && by < ay + ah;
        const touching = Math.abs(ax + aw - bx) < 1 || Math.abs(bx + bw - ax) < 1;
        if (verticalOverlap && touching && a.d !== b.d) {
          depthMismatch.add(a.id);
          depthMismatch.add(b.id);
        }
      }
    }
  }

</script>

<style>
  .layout-container {
    position: relative;
    margin-bottom: 40px;
    margin-right: 40px;
  }
  #layout {
    border: 2px dashed #ccc;
    position: relative;
    background-color: #f8fafc;
    background-image: linear-gradient(#e5e7eb 1px, transparent 1px),
      linear-gradient(90deg, #e5e7eb 1px, transparent 1px);
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
  .cabinet .controls {
    position: absolute;
    top: 2px;
    right: 2px;
    display: flex;
    gap: 2px;
  }
  .cabinet .controls button {
    background: #fff;
    border: 1px solid #ccc;
    padding: 0 2px;
    font-size: 10px;
    cursor: pointer;
  }
  .dim-x {
    position: absolute;
    bottom: -20px;
    left: 0;
    width: 100%;
    height: 20px;
    border-top: 1px solid #999;
  }
  .dim-y {
    position: absolute;
    top: 0;
    right: -20px;
    width: 20px;
    height: 100%;
    border-left: 1px solid #999;
  }
  .dim-x .tick {
    position: absolute;
    bottom: 0;
    border-left: 1px solid #999;
    height: 10px;
  }
  .dim-x .tick span {
    position: absolute;
    top: 10px;
    transform: translateX(-50%);
    font-size: 10px;
  }
  .dim-y .tick {
    position: absolute;
    right: 0;
    border-top: 1px solid #999;
    width: 10px;
  }
  .dim-y .tick span {
    position: absolute;
    left: 10px;
    transform: translateY(-50%);
    font-size: 10px;
  }
</style>

<div class="h-full">
  <h2 class="text-xl font-bold mb-4">Visual Cabinet Planner</h2>

  {#if showSummary}
    <LayoutSummary on:close={() => showSummary = false} />
  {:else}
    <div class="flex gap-4 mb-4">
      <button on:click={openAddForm} class="px-4 py-2 bg-blue-600 text-white rounded">
        Add Cabinet
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
      <button class="px-4 py-2 bg-gray-600 text-white rounded" on:click={zoomIn}>+</button>
      <button class="px-4 py-2 bg-gray-600 text-white rounded" on:click={zoomOut}>-</button>
    </div>

    <div class="layout-container" style="width: {layoutWidth}px; height: {layoutHeight}px;">
      <div id="layout" bind:this={layout} style="width: {layoutWidth}px; height: {layoutHeight}px;">
        {#each $cabinets as cabinet, index}
          <div
            class="cabinet"
            role="button"
            tabindex="{index}"
            style="left: {cabinet.x}px; top: {cabinet.y}px; width: {cabinet.w/$scale}px; height: {cabinet.h/$scale}px; border-color: {depthMismatch.has(cabinet.id) ? 'red' : '#444'};"
            on:mousedown={(e) => startDrag(e, cabinet.id)}
          >
            <div class="controls">
              <button on:click|stopPropagation={() => openEditForm(cabinet)}>✎</button>
              <button on:click|stopPropagation={() => deleteCabinet(cabinet.id)}>✕</button>
            </div>
            {`Cabinet ${cabinet.id}`}<br/>
            W:{cabinet.w} H:{cabinet.h} D:{cabinet.d}
            {#if cabinet.type === 'door'}
              <br/>🚪 {(cabinet as any).doors} door(s)
            {/if}
            {#if cabinet.type === 'drawer'}
              <br/>🗄️ {(cabinet as any).drawers} drawer(s)<br>{(cabinet as any).heights.join("% / ")}
            {/if}
            {#if cabinet.type === 'corner'}
              <br/>🔻 corner {(cabinet as any).fixedSide}mm fixed
            {/if}
            {#if cabinet.type === 'oven'}
              <br/>🔥 oven with drawer
            {/if}
          </div>
        {/each}
      </div>
      <div class="dim-x">
          {#each $cabinets as cab}
            <div class="tick" style="left: {(cab.x ?? 0) + ((cab.w ?? 0) / ($scale * 2))}px;">
              <span>{Math.round(cab.w ?? 0)}</span>
            </div>
          {/each}
      </div>
      <div class="dim-y">
          {#each $cabinets as cab}
            <div class="tick" style="top: {(cab.y ?? 0) + ((cab.h ?? 0) / ($scale * 2))}px;">
              <span>{Math.round(cab.h ?? 0)}</span>
            </div>
          {/each}
      </div>
    </div>

    {#if showForm}
      <Form cabinet={editingCabinet} on:close={closeForm} />
    {/if}
    {#if showMaterialForm}
      <MaterialForm on:close={() => showMaterialForm = false} />
    {/if}
  {/if}
</div>
