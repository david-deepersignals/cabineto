<script lang="ts">
  import Form from "./components/Form.svelte";
  import MaterialForm from "./components/MaterialForm.svelte";
  import { cabinets } from './stores/cabinets';

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


  const toggleForm = () => {
    showForm = !showForm;
  };

  const toggleMaterialForm = () => {
    showMaterialForm = !showMaterialForm;
  };

  let dragInfo: { isDragging: boolean; offsetX: number; offsetY: number; targetId: string | null } = {
    isDragging: false,
    offsetX: 0,
    offsetY: 0,
    targetId: null
  };


  function startDrag(event: MouseEvent, cabinetId: string) {
    // Find the cabinet being dragged
    const target = event.target as HTMLElement;
    const rect = target.getBoundingClientRect();

    console.log(rect);
    console.log(event);
    dragInfo.isDragging = true;
    dragInfo.targetId = cabinetId;
    dragInfo.offsetX =  event.clientX - (event.x - rect.width);
    dragInfo.offsetY = event.clientY - (rect.y - rect.height);
  }

  function handleDrag(event: MouseEvent) {
    if (!dragInfo.isDragging || dragInfo.targetId === null) return;

    // Calculate current position based on cursor and offset
    const x = event.clientX - dragInfo.offsetX;
    const y = event.clientY - dragInfo.offsetY;

    console.log(x, y);
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
      let finalLeft = Math.round(((draggedCabinet.x ?? 0) / 10)) * 10;
      let finalTop = Math.round(((draggedCabinet.y ?? 0) / 10)) * 10;

      const rect1 = {
        x: finalLeft,
        y: finalTop,
        w: draggedCabinet.w || 100, // Default width/height if not provided
        h: draggedCabinet.h || 100
      };

      let collision = false;
      let bestSnap = null;

      // Check for collisions
      current.forEach((otherCabinet, i) => {
        if (i === index) return;

        const rect2 = {
          x: otherCabinet.x ?? 0,
          y: otherCabinet.y ?? 0,
          w: otherCabinet.w || 100,
          h: otherCabinet.h || 100
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
            snapX = Math.round(snapX / 10) * 10;
            snapY = Math.round(snapY / 10) * 10;

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





</script>

<style>
  #layout {
    width: 100%;
    border: 2px dashed #ccc;
    position: relative;
    margin-bottom: 20px;
    background-color: #f8fafc;
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
</style>

<div class="h-full">
  <h2 class="text-xl font-bold mb-4">Visual Cabinet Planner</h2>

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
  </div>

  <div id="layout">
    {#each $cabinets as cabinet,index}
      <div
              class="cabinet"
              role="button"
              tabindex="{index}"
              style="left: {cabinet.x}px; top: {cabinet.y}px; width: {cabinet.w}px; height: {cabinet.h}px;"
              on:mousedown={(e) => startDrag(e, cabinet.id)}
      >
        {`Cabinet ${cabinet.id}`}
        {#if cabinet.type === 'door'}
          <div style="width: {cabinet.w}px; height: {cabinet.h}px;">
            🚪 {(cabinet as any).doors} door(s)
          </div>
          {/if}
        {#if cabinet.type === 'drawer'}
          🗄️ {(cabinet as any).drawers} drawer(s)<br>{(cabinet as any).heights.join("% / ")}
          {/if}
      </div>
    {/each}


  </div>

  {#if showForm}
    <Form on:close={() => showForm = false} />
  {/if}
  {#if showMaterialForm}
    <MaterialForm on:close={() => showMaterialForm = false} />
  {/if}
</div>
