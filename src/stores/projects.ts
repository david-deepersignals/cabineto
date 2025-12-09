import { get, writable } from 'svelte/store';
import { cabinets } from './cabinets';
import { materials, type MaterialsState } from './materials';
import { room, type Room } from './room';
import { scale } from './scale';
import { reviveCabinets, serializeCabinets } from '../utils/persistence';
import { translateInstant } from '../i18n';

type SerializedCabinet = ReturnType<typeof serializeCabinets>[number];

export interface ProjectData {
  cabinets: SerializedCabinet[];
  materials: MaterialsState;
  room: Room;
  scale: number;
}

export interface ProjectRecord {
  id: string;
  name: string;
  updatedAt: number;
  data: ProjectData;
}

export interface ProjectsState {
  activeId: string;
  projects: ProjectRecord[];
}

const STORAGE_KEY = 'cabinet.projects';
const hasStorage = typeof localStorage !== 'undefined';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `proj-${Math.random().toString(36).slice(2, 10)}`;

const captureSnapshot = (): ProjectData => ({
  cabinets: serializeCabinets(get(cabinets)),
  materials: clone(get(materials)),
  room: clone(get(room)),
  scale: get(scale)
});

const normalizeProject = (raw: any): ProjectRecord => {
  const data = raw?.data ?? {};
  return {
    id: raw?.id ?? createId(),
    name: typeof raw?.name === 'string' && raw.name.trim() ? raw.name.trim() : translateInstant('Untitled project'),
    updatedAt: typeof raw?.updatedAt === 'number' ? raw.updatedAt : Date.now(),
    data: {
      cabinets: Array.isArray(data.cabinets) ? data.cabinets : [],
      materials: data.materials ?? clone(get(materials)),
      room: data.room ?? clone(get(room)),
      scale: typeof data.scale === 'number' ? data.scale : get(scale)
    }
  };
};

const buildInitialState = (): ProjectsState => {
  const fallback: ProjectRecord = {
    id: createId(),
    name: translateInstant('My project'),
    updatedAt: Date.now(),
    data: captureSnapshot()
  };

  if (!hasStorage) return { activeId: fallback.id, projects: [fallback] };

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { activeId: fallback.id, projects: [fallback] };

  try {
    const parsed = JSON.parse(raw);
    const projects: ProjectRecord[] =
      Array.isArray(parsed?.projects) && parsed.projects.length
        ? parsed.projects.map(normalizeProject)
        : [fallback];
    const activeId = projects.find(p => p.id === parsed?.activeId)?.id ?? projects[0].id;
    return { activeId, projects };
  } catch {
    return { activeId: fallback.id, projects: [fallback] };
  }
};

const persistState = (state: ProjectsState) => {
  if (!hasStorage) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Unable to persist projects', err);
  }
};

const normalizeData = (data: any): ProjectData => {
  const fallback: ProjectData = {
    cabinets: serializeCabinets(get(cabinets)),
    materials: clone(get(materials)),
    room: clone(get(room)),
    scale: get(scale)
  };
  if (!data) return fallback;
  const cabinetPayload = Array.isArray(data.cabinets)
    ? data.cabinets
    : Array.isArray(data)
      ? data
      : fallback.cabinets;

  return {
    cabinets: cabinetPayload,
    materials: data.materials ?? fallback.materials,
    room: data.room ?? fallback.room,
    scale: typeof data.scale === 'number' ? data.scale : fallback.scale
  };
};

function createProjectsStore() {
  const initialState = buildInitialState();
  const { subscribe, update, set } = writable<ProjectsState>(initialState);
  let currentState = initialState;
  let paused = true;
  let saveTimer: ReturnType<typeof setTimeout> | null = null;

  subscribe(state => {
    currentState = state;
  });

  const applyProject = (project?: ProjectRecord) => {
    if (!project) return;
    paused = true;
    scale.replace(project.data.scale ?? get(scale));
    room.set(project.data.room ?? get(room));
    materials.set(project.data.materials ?? get(materials));
    cabinets.set(reviveCabinets(project.data.cabinets ?? []));
    paused = false;
  };

  const performSave = () => {
    update(state => {
      const idx = state.projects.findIndex(p => p.id === state.activeId);
      if (idx === -1) return state;
      const snapshot = captureSnapshot();
      const projects = state.projects.slice();
      projects[idx] = { ...projects[idx], data: snapshot, updatedAt: Date.now() };
      const next = { ...state, projects };
      persistState(next);
      return next;
    });
  };

  const scheduleSave = () => {
    if (paused) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveTimer = null;
      performSave();
    }, 200);
  };

  const flushSave = () => {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    if (!paused) performSave();
  };

  applyProject(initialState.projects.find(p => p.id === initialState.activeId));
  paused = false;

  cabinets.subscribe(scheduleSave);
  materials.subscribe(scheduleSave);
  room.subscribe(scheduleSave);
  scale.subscribe(scheduleSave);

  return {
    subscribe,
    set,
    createProject: (name: string, copyLayout = true) => {
      flushSave();
      const base = captureSnapshot();
      const snapshot = copyLayout ? base : { ...base, cabinets: [] };
      const project: ProjectRecord = {
        id: createId(),
        name: name?.trim() || translateInstant('Untitled project'),
        updatedAt: Date.now(),
        data: snapshot
      };
      update(state => {
        const projects = [...state.projects, project];
        const next = { activeId: project.id, projects };
        persistState(next);
        return next;
      });
      applyProject(project);
    },
    renameProject: (id: string, name: string) => {
      update(state => {
        const idx = state.projects.findIndex(p => p.id === id);
        if (idx === -1) return state;
        const projects = state.projects.slice();
        projects[idx] = {
          ...projects[idx],
          name: name?.trim() || projects[idx].name,
          updatedAt: Date.now()
        };
        const next = { ...state, projects };
        persistState(next);
        return next;
      });
    },
    deleteProject: (id: string) => {
      flushSave();
      update(state => {
        if (state.projects.length <= 1) return state;
        const projects = state.projects.filter(p => p.id !== id);
        const activeId = state.activeId === id ? projects[0].id : state.activeId;
        const next = { activeId, projects };
        persistState(next);
        applyProject(projects.find(p => p.id === activeId));
        return next;
      });
    },
    setActive: (id: string) => {
      flushSave();
      let target: ProjectRecord | undefined;
      update(state => {
        target = state.projects.find(p => p.id === id);
        if (!target) return state;
        const next = { ...state, activeId: id };
        persistState(next);
        return next;
      });
      applyProject(target);
    },
    exportProjectData: (id: string): ProjectData | null => {
      flushSave();
      const target = currentState.projects.find(p => p.id === id);
      return target ? clone(target.data) : null;
    },
    importIntoActive: (data: any) => {
      flushSave();
      const normalized = normalizeData(data);
      let activeProject: ProjectRecord | undefined;
      update(state => {
        const idx = state.projects.findIndex(p => p.id === state.activeId);
        if (idx === -1) return state;
        const projects = state.projects.slice();
        projects[idx] = { ...projects[idx], data: normalized, updatedAt: Date.now() };
        activeProject = projects[idx];
        const next = { ...state, projects };
        persistState(next);
        return next;
      });
      applyProject(activeProject);
    }
  };
}

export const projects = createProjectsStore();
