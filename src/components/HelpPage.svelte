<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { t } from '../i18n';

  const dispatch = createEventDispatcher();

  interface HelpStep {
    key: string;
    varKey?: string;
  }

  const plannerSteps: HelpStep[] = [
    { key: 'Start in Settings to enter your room size, materials, and pricing so costs are accurate.' },
    { key: 'Switch between Top, North Wall, and West Wall views and choose a plane for uppers to place cabinets on the correct wall.' },
    { key: 'Drag cabinets to move them, rotate from the Top view, and use the zoom buttons on the right to work at a comfortable scale.' },
    { key: 'Use the Projects panel to save, rename, or back up layouts in this browser.' }
  ];

  const addCabinetSteps: HelpStep[] = [
    { key: 'Click Add Cabinet in the toolbar.' },
    { key: 'Choose the cabinet type (Door, Drawer, Corner, or Oven) and enter width, height, and depth in centimeters.' },
    { key: 'Set doors, drawers, shelves, and back style; enable handleless or gola options if needed.' },
    { key: 'Pick the drawer system and add notes when relevant, then review the live spec card.' },
    { key: 'Save changes to place the cabinet, then drag, rotate, or duplicate it to position it.' }
  ];

  const exportSteps: HelpStep[] = [
    { key: 'Open {page} from the planner toolbar when you are ready to export.', varKey: 'Layout Summary' },
    { key: 'Pick the CSV format: General for a universal cut list, Max Moris for the shop-specific template, or Iverpan for their order sheet.' },
    { key: 'Click Download CSV to export the cut list (millimeter dimensions with edge banding flags).' },
    { key: 'Use Download Dado Drawings or Download Rabbet Drawings to export SVGs for panels that include those cuts.' },
    { key: 'Use Print for a PDF-friendly drawing set, then Back to return to the planner.' }
  ];

  const close = () => dispatch('close');
</script>

<div class="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-10">
  <div class="mx-auto flex max-w-5xl flex-col gap-6">
    <div class="flex items-start justify-between gap-4">
      <div class="space-y-1">
        <h3 class="text-2xl font-semibold">{$t('Help & Instructions')}</h3>
        <p class="text-sm text-gray-600">
          {$t('Learn how to set up a project, add cabinets, and export layout files and cut lists.')}
        </p>
      </div>
      <button
        class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
        on:click={close}
      >
        {$t('Back to planner')}
      </button>
    </div>

    <section class="rounded-lg border bg-white p-5 shadow">
      <div class="flex items-center gap-3">
        <div class="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">1</div>
        <div>
          <h4 class="text-lg font-semibold text-gray-900">{$t('Using the planner')}</h4>
        </div>
      </div>
      <ul class="mt-4 list-disc space-y-2 pl-6 text-sm text-gray-700">
        {#each plannerSteps as step}
          <li>{$t(step.key)}</li>
        {/each}
      </ul>
    </section>

    <section class="rounded-lg border bg-white p-5 shadow">
      <div class="flex items-center gap-3">
        <div class="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">2</div>
        <div>
          <h4 class="text-lg font-semibold text-gray-900">{$t('Add cabinets')}</h4>
        </div>
      </div>
      <ol class="mt-4 list-decimal space-y-2 pl-6 text-sm text-gray-700">
        {#each addCabinetSteps as step}
          <li>{$t(step.key)}</li>
        {/each}
      </ol>
    </section>

    <section class="rounded-lg border bg-white p-5 shadow">
      <div class="flex items-center gap-3">
        <div class="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">3</div>
        <div>
          <h4 class="text-lg font-semibold text-gray-900">{$t('Export layouts & cut lists')}</h4>
        </div>
      </div>
      <ol class="mt-4 list-decimal space-y-2 pl-6 text-sm text-gray-700">
        {#each exportSteps as step}
          <li>{$t(step.key, step.varKey ? { page: $t(step.varKey) } : undefined)}</li>
        {/each}
      </ol>
    </section>
  </div>
</div>
