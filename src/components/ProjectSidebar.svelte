<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { projects, type ProjectRecord } from '../stores/projects';

  export let open = false;

  const dispatch = createEventDispatcher();

  let name = '';
  let copyLayout = true;
  let editingId: string | null = null;
  let editingName = '';
  let importError = '';
  let fileInputEl: HTMLInputElement | null = null;

  $: activeProject = $projects.projects.find(p => p.id === $projects.activeId);
  $: sortedProjects = $projects.projects
    .filter(p => p.id !== $projects.activeId)
    .sort((a, b) => b.updatedAt - a.updatedAt);
  $: totalProjects = $projects.projects.length;
  const formatDate = (ts: number) =>
    new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(ts);
  const safeName = (name: string) =>
    (name || 'project')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'project';

  const close = () => dispatch('close');
  const handleOverlayKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      close();
    }
  };

  const create = () => {
    projects.createProject(name || 'Untitled project', copyLayout);
    name = '';
    editingId = null;
    editingName = '';
  };

  const startRename = (project: ProjectRecord) => {
    editingId = project.id;
    editingName = project.name;
  };

  const saveRename = () => {
    if (!editingId) return;
    projects.renameProject(editingId, editingName);
    editingId = null;
    editingName = '';
  };

  const cancelRename = () => {
    editingId = null;
    editingName = '';
  };

  const openProject = (id: string) => {
    projects.setActive(id);
  };

  const removeProject = (id: string) => {
    projects.deleteProject(id);
    if (editingId === id) cancelRename();
  };

  const downloadProject = (project: ProjectRecord | undefined) => {
    if (!project) return;
    const data = projects.exportProjectData(project.id);
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName(project.name)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importActive = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        projects.importIntoActive(data);
        importError = '';
        if (fileInputEl) fileInputEl.value = '';
      } catch (err) {
        console.error(err);
        importError = 'Invalid backup file.';
      }
    };
    reader.readAsText(file);
  };
</script>

{#if open}
  <div class="fixed inset-0 z-20 flex">
    <div
      class="flex-1 bg-black/30 backdrop-blur-sm"
      role="button"
      tabindex="0"
      aria-label="Close project panel"
      on:click={close}
      on:keydown={handleOverlayKeydown}
    ></div>
    <aside class="relative h-full w-full max-w-md overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
      <div class="flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-700 px-6 py-4 text-white">
        <div>
          <p class="text-xs uppercase tracking-wide text-slate-200">Projects</p>
          <h3 class="text-xl font-semibold leading-tight">{activeProject?.name ?? 'My project'}</h3>
          <p class="text-xs text-slate-200">Autosaved to this browser</p>
        </div>
        <button
          class="rounded-full bg-white/20 p-2 text-white transition hover:bg-white/30"
          on:click={close}
          aria-label="Close project panel"
        >
          ✕
        </button>
      </div>

      <div class="space-y-6 px-6 py-5">
        <div class="rounded-xl border border-slate-100 bg-slate-50 p-4 shadow-inner">
          <div class="mb-3 flex items-start justify-between gap-3">
            <div>
              <p class="text-sm font-semibold text-gray-900">Create a project</p>
              <p class="text-xs text-gray-600">
                Name your work and choose if you want to start from the current layout or a blank canvas.
              </p>
            </div>
            <span class="rounded bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 shadow">Autosave</span>
          </div>
          <div class="space-y-3">
            <label class="block text-sm font-medium text-gray-700">
              Project name
              <input
                class="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
                placeholder="Kitchen refresh"
                bind:value={name}
              />
            </label>
            <label class="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input type="checkbox" class="rounded border-gray-300" bind:checked={copyLayout} />
              <span>Start from current layout</span>
            </label>
            <div class="flex gap-2">
              <button
                class="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
                on:click={create}
              >
                Create and switch
              </button>
              <button
                class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                on:click={() => {
                  name = '';
                  copyLayout = true;
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-blue-100 bg-blue-50/60 p-4 shadow-inner">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="text-sm font-semibold text-gray-900">{activeProject?.name ?? 'Active project'}</p>
              {#if activeProject}
                <p class="text-xs text-gray-700">Updated {formatDate(activeProject.updatedAt)}</p>
              {/if}
            </div>
            <span class="rounded bg-white px-2 py-1 text-[11px] font-semibold text-blue-700 shadow-inner">Active</span>
          </div>

          {#if activeProject && editingId === activeProject.id}
            <div class="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
                bind:value={editingName}
              />
              <div class="flex gap-2">
                <button
                  class="rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-blue-800"
                  on:click={saveRename}
                >
                  Save
                </button>
                <button
                  class="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  on:click={cancelRename}
                >
                  Cancel
                </button>
              </div>
            </div>
          {:else}
            <div class="mt-2 flex flex-wrap gap-2">
              <button
                class="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                on:click={() => {
                  if (activeProject) {
                    editingId = activeProject.id;
                    editingName = activeProject.name;
                  }
                }}
                disabled={!activeProject}
              >
                Rename
              </button>
              <button
                class="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40"
                on:click={() => activeProject && removeProject(activeProject.id)}
                disabled={!activeProject || $projects.projects.length <= 1}
              >
                Delete
              </button>
            </div>
          {/if}

          <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              class="flex-1 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-800 disabled:opacity-50"
              on:click={() => downloadProject(activeProject)}
              disabled={!activeProject}
            >
              Download backup
            </button>
            <label class="flex flex-1 cursor-pointer items-center justify-between gap-3 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-800 shadow-sm hover:border-blue-300">
              <span>Load backup into active</span>
              <input
                bind:this={fileInputEl}
                type="file"
                accept="application/json"
                class="hidden"
                on:change={importActive}
              />
            </label>
          </div>
          {#if importError}
            <p class="mt-2 text-xs text-red-600">{importError}</p>
          {/if}
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-semibold text-gray-800">Saved projects</h4>
            <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{sortedProjects.length} saved</span>
          </div>
          {#if !sortedProjects.length}
            <p class="text-sm text-gray-600">No projects yet.</p>
          {:else}
            <div class="space-y-3">
              {#each sortedProjects as project}
                <div class="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div class="flex items-start justify-between gap-3">
                    <div class="space-y-1">
                      <p class="text-sm font-semibold text-gray-900">{project.name}</p>
                      <p class="text-xs text-gray-500">Updated {formatDate(project.updatedAt)}</p>
                    </div>
                    {#if project.id === $projects.activeId}
                      <span class="rounded-full bg-green-50 px-3 py-1 text-[11px] font-semibold text-green-700 shadow-inner">Active</span>
                    {/if}
                  </div>

                  {#if editingId === project.id}
                    <div class="mt-3 flex flex-col gap-2 sm:flex-row">
                      <input
                        class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
                        bind:value={editingName}
                      />
                      <div class="flex gap-2">
                        <button
                          class="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
                          on:click={saveRename}
                        >
                          Save
                        </button>
                        <button
                          class="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                          on:click={cancelRename}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  {:else}
                    <div class="mt-4 flex flex-wrap gap-2">
                      <button
                        class="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
                        on:click={() => openProject(project.id)}
                      >
                        Open project
                      </button>
                      <button
                        class="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        on:click={() => startRename(project)}
                      >
                        Rename
                      </button>
                      <button
                        class="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        on:click={() => downloadProject(project)}
                      >
                        Download
                      </button>
                      <button
                        class="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40"
                        on:click={() => removeProject(project.id)}
                        disabled={$projects.projects.length <= 1}
                      >
                        Delete
                      </button>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </aside>
  </div>
{/if}
