<script lang="ts">
import { cabinets } from '../stores/cabinets';
import { createEventDispatcher, onMount } from 'svelte';
import { scale } from '../stores/scale';
import { projects } from '../stores/projects';
import type { Panel } from '../cabinet/Corpus';
import JSZip from 'jszip';

const dispatch = createEventDispatcher();

type View = 'top' | 'north' | 'west' | 'iso';
interface ViewConfig { id: View; label: string; }
const viewConfigs: ViewConfig[] = [
  { id: 'top', label: 'Top View' },
  { id: 'north', label: 'North View' },
  { id: 'west', label: 'West View' }
];

const DIM_OFFSET = 20;
const MARGIN = 40;
const CABINET_MARGIN = 20;
const CABINET_DIM = 20;
const MAX_DISPLAY_WIDTH = 900;
const VIEW_HEIGHT_PADDING = 220;
const MIN_DISPLAY_WIDTH = 600;

const fitToWidth = (width: number, height: number, maxWidth: number = MAX_DISPLAY_WIDTH) => {
  if (width <= maxWidth) return { width, height };
  const ratio = maxWidth / width;
  return { width: maxWidth, height: height * ratio };
};
const fitToBox = (width: number, height: number, maxWidth: number, maxHeight: number) => {
  const widthRatio = maxWidth / width;
  const heightRatio = maxHeight / height;
  const ratio = Math.min(widthRatio, heightRatio, 1);
  return { width: width * ratio, height: height * ratio };
};

interface Bounds { minX: number; minY: number; width: number; height: number; }
interface HeightSegment { start: number; end: number; mid: number; size: number; }

let csvType: 'general' | 'max' = 'general';

let iso: { cabs: any[]; bounds: Bounds } = { cabs: [], bounds: { minX: 0, minY: 0, width: 0, height: 0 } };
let isoBaseW = 0;
let isoBaseH = 0;
let isoDisplay = { width: 0, height: 0 };
let viewportHeight = 900;
let viewportWidth = 1200;
let isoRotate = false;
let activeProjectName = 'Project';

$: iso = prepareIso();
$: {
  isoBaseW = iso.bounds.width + MARGIN * 2;
  isoBaseH = iso.bounds.height + MARGIN * 2;
  const maxWidth = Math.max(MIN_DISPLAY_WIDTH, viewportWidth - 80);
  const maxHeight = Math.max(320, viewportHeight - VIEW_HEIGHT_PADDING);
  isoDisplay = fitToBox(isoBaseW, isoBaseH, maxWidth, maxHeight);
  isoRotate = isoBaseW > isoBaseH;
}

onMount(() => {
  const updateSize = () => {
    viewportHeight = window.innerHeight;
    viewportWidth = window.innerWidth;
  };
  updateSize();
  const unsubscribe = projects.subscribe(p => {
    const found = p.projects.find(pr => pr.id === p.activeId);
    activeProjectName = found?.name || 'Project';
  });
  window.addEventListener('resize', updateSize);
  return () => {
    window.removeEventListener('resize', updateSize);
    unsubscribe();
  };
});

function getAxes(view: View) {
  switch (view) {
    case 'north':
      return { left: 'x', width: 'w', top: 'z', height: 'h', filter: (c: any) => c.wall === 'north' } as const;
    case 'west':
      return { left: 'y', width: 'd', top: 'z', height: 'h', filter: (c: any) => c.wall === 'west' } as const;
    default:
      return { left: 'x', width: 'w', top: 'y', height: 'd', filter: (_: any) => true } as const;
  }
}

function getOrientedDims(cab: any) {
  return cab.rotation === 90 || cab.rotation === 270
    ? { w: cab.d, d: cab.w }
    : { w: cab.w, d: cab.d };
}

function getWidthPx(cab: any, axes: { width: 'w' | 'd' }) {
  const dims = getOrientedDims(cab);
  const w = axes.width === 'w' ? dims.w : dims.d;
  return w / $scale;
}

function getHeightPx(cab: any, axes: { height: 'h' | 'd' }) {
  if (axes.height === 'h') return cab.h / $scale;
  const dims = getOrientedDims(cab);
  return dims.d / $scale;
}

function prepare(view: View) {
  const axes = getAxes(view);
  const cabs = $cabinets.filter(axes.filter);
  if (!cabs.length)
    return {
      cabs,
      bounds: { minX: 0, minY: 0, width: 0, height: 0 },
      sorted: [],
      rows: [],
      heightTicks: [],
      heightSegments: [] as HeightSegment[]
    };

  const minX = Math.min(...cabs.map(c => c[axes.left] ?? 0));
  const maxX = Math.max(
    ...cabs.map(c => (c[axes.left] ?? 0) + getWidthPx(c, axes))
  );
  let minY: number;
  let maxY: number;
  if (view === 'top') {
    minY = Math.min(...cabs.map(c => c[axes.top] ?? 0));
    maxY = Math.max(
      ...cabs.map(c => (c[axes.top] ?? 0) + getHeightPx(c, axes))
    );
  } else {
    minY = 0;
    maxY = Math.max(
      ...cabs.map(c => (c[axes.top] ?? 0) / $scale + getHeightPx(c, axes))
    );
  }
  const bounds: Bounds = { minX, minY, width: maxX - minX, height: maxY - minY };

  const sorted = cabs
    .slice()
    .sort((a, b) =>
      view === 'west'
        ? (b[axes.left] ?? 0) - (a[axes.left] ?? 0)
        : (a[axes.left] ?? 0) - (b[axes.left] ?? 0)
    );

  let rows;
  if (view === 'top') {
    const map = new Map<number, any[]>();
    cabs.forEach(cab => {
      const y = Math.round(cab[axes.top] ?? 0);
      const arr = map.get(y) ?? [];
      arr.push(cab);
      map.set(y, arr);
    });
    rows = Array.from(map.entries())
      .map(([y, cabs]) => ({ y, cabinets: cabs.sort((a, b) => (a[axes.left] ?? 0) - (b[axes.left] ?? 0)) }))
      .sort((a, b) => a.y - b.y);
  } else {
    rows = [{ y: 0, cabinets: sorted }];
  }

  const edges = new Set<number>();
  cabs.forEach(cab => {
    if (view === 'top') {
      const top = (cab[axes.top] ?? 0) - minY;
      const bottom = top + getHeightPx(cab, axes);
      edges.add(top);
      edges.add(bottom);
    } else {
      const top =
        bounds.height - ((cab[axes.top] ?? 0) / $scale + getHeightPx(cab, axes));
      const bottom = bounds.height - (cab[axes.top] ?? 0) / $scale;
      edges.add(top);
      edges.add(bottom);
    }
  });
  edges.add(0);
  edges.add(bounds.height);
  const heightTicks = Array.from(edges).sort((a, b) => a - b);
  const heightSegments = heightTicks.slice(0, -1).map((start, i) => ({
    start,
    end: heightTicks[i + 1],
    mid: (start + heightTicks[i + 1]) / 2,
    size: Math.round((heightTicks[i + 1] - start) * $scale)
  }));

  return { cabs, bounds, sorted, rows, heightTicks, heightSegments };
}

function prepareIso() {
  const cabs = $cabinets;
  if (!cabs.length) return { cabs, bounds: { minX: 0, minY: 0, width: 0, height: 0 } };
  const points: { x: number; y: number }[] = [];
  cabs.forEach(cab => {
    const x = cab.x ?? 0;
    const y = cab.y ?? 0;
    const z = (cab.z ?? 0) / $scale;
    const dims = getOrientedDims(cab);
    const w = dims.w / $scale;
    const d = dims.d / $scale;
    const h = cab.h / $scale;
    const corners = [
      isoProject(x, y, z + h),
      isoProject(x + w, y, z + h),
      isoProject(x + w, y + d, z + h),
      isoProject(x, y + d, z + h),
      isoProject(x, y, z),
      isoProject(x + w, y, z),
      isoProject(x + w, y + d, z),
      isoProject(x, y + d, z)
    ];
    points.push(...corners);
  });
  const minX = Math.min(...points.map(p => p.x));
  const maxX = Math.max(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y));
  const maxY = Math.max(...points.map(p => p.y));
  const bounds: Bounds = { minX, minY, width: maxX - minX, height: maxY - minY };
  return { cabs, bounds };
}

function isoProject(x: number, y: number, z: number) {
  return {
    x: x - y,
    y: (x + y) / 2 - z
  };
}

const totalWidthMm = (b: Bounds) => Math.round(b.width * $scale);
const totalHeightMm = (b: Bounds) => Math.round(b.height * $scale);
const svgWidth = (b: Bounds) => b.width + MARGIN + DIM_OFFSET * 5;
const svgHeight = (b: Bounds) => b.height + MARGIN + DIM_OFFSET * 5;

function downloadCSV() {
  const csv = csvType === 'general' ? csvGeneral() : csvMaxMoris();
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cabinet_panels.csv';
  a.click();
}

function panelDadoSvg(p: Panel,index: number): string {
  const margin = 150;
  const width = p.length;
  const height = p.width;
  const dadoWidth = p.dados?.[0]?.width || 0;
  const dadoDepth = p.dados?.[0]?.depth || 0;
  const dadoOffset = p.dados?.[0]?.offset || 0;
  const panelThickness = p.materialThickness || 18;
  
  // Adjust canvas size
  const totalW = width + dadoDepth + margin * 3; // Add space for cross-section to the right
  const totalH = Math.max(height, dadoWidth + panelThickness) + margin * 2;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}">`;


  // Add a title to the SVG
  svg += `<text x="${margin}" y="${margin - 70}" font-size="20" text-anchor="start" dominant-baseline="auto">#${index} ${p.label}</text>`;

  
  
  
  // -------------------------------
  // Top View (Main Panel with Dados)
  // -------------------------------
  svg += `<rect x="${margin}" y="${margin}" width="${width}" height="${height}" fill="none" stroke="black"/>`;

  p.dados?.forEach((d) => {
    // Dado rectangle in red
    svg += `<rect x="${margin}" y="${margin + d.offset}" width="${width}" height="${d.width}" fill="none" stroke="red"/>`;

    // Vertical offset dimension
    const dimOffsetX = margin - 10;
    svg += `<line x1="${dimOffsetX}" y1="${margin}" x2="${dimOffsetX}" y2="${margin + d.offset}" stroke="black"/>`;
    svg += `<line x1="${dimOffsetX - 2}" y1="${margin}" x2="${dimOffsetX + 2}" y2="${margin}" stroke="black"/>`;
    svg += `<line x1="${dimOffsetX - 2}" y1="${margin + d.offset}" x2="${dimOffsetX + 2}" y2="${margin + d.offset}" stroke="black"/>`;
    
    
    svg += `<text x="${dimOffsetX - 2}" y="${margin - 2 + d.offset / 2}" font-size="12" text-anchor="end" dominant-baseline="middle">${d.offset} mm</text>`;

    // Width dimension line (next to dado)
    const dimWidthX = margin - 10;
    svg += `<line x1="${dimWidthX}" y1="${margin + d.offset}" x2="${dimWidthX}" y2="${margin + d.offset + d.width}" stroke="black"/>`;
    svg += `<line x1="${dimWidthX - 2}" y1="${margin + d.offset}" x2="${dimWidthX + 2}" y2="${margin + d.offset}" stroke="black"/>`;
    svg += `<line x1="${dimWidthX - 2}" y1="${margin + d.offset + d.width}" x2="${dimWidthX + 2}" y2="${margin + d.offset + d.width}" stroke="black"/>`;
    
    
    svg += `<text x="${dimWidthX - 2}" y="${margin + 2+ d.offset + d.width / 2}" font-size="12" text-anchor="end" dominant-baseline="middle">${d.width} mm</text>`;


    // Top width dimension
    svg += `<line x1="${margin}" y1="${margin - 20}" x2="${margin + width}" y2="${margin - 20}" stroke="black"/>`;
    svg += `<line x1="${margin}" y1="${margin - 22}" x2="${margin}" y2="${margin - 18}" stroke="black"/>`;
    svg += `<line x1="${margin + width}" y1="${margin - 22}" x2="${margin + width}" y2="${margin - 18}" stroke="black"/>`;
    svg += `<text x="${margin + width / 2}" y="${margin - 25}" font-size="12" text-anchor="middle">${width} mm</text>`;
  });


// Height dimension line (right of the panel)
  const dimHeightX = margin + width + 10;
  svg += `<line x1="${dimHeightX}" y1="${margin}" x2="${dimHeightX}" y2="${margin + height}" stroke="black"/>`;
  svg += `<line x1="${dimHeightX - 2}" y1="${margin}" x2="${dimHeightX + 2}" y2="${margin}" stroke="black"/>`;
  svg += `<line x1="${dimHeightX - 2}" y1="${margin + height}" x2="${dimHeightX + 2}" y2="${margin + height}" stroke="black"/>`;
  svg += `<text x="${dimHeightX + 5}" y="${margin + height / 2}" font-size="12" text-anchor="start" dominant-baseline="middle">${height} mm</text>`;


  if (p.dados && p.dados.length > 0) {
    const crossSectionStartX = margin + width + margin; // Positioned to the right of the top view
    const crossSectionMarginY = margin + 80; // Aligned vertically with the top view

    const crossectionScale = 3;
    const crossSectionWidth = 100;
    const thicknessScaled = panelThickness * crossectionScale;
    const dadoDepthScaled = dadoDepth * crossectionScale;
    const dadoWidthScaled = dadoWidth * crossectionScale;

    const titleX = crossSectionStartX + crossSectionWidth / 2;
    const titleY = crossSectionMarginY - 50; // Position the title above the cross-section
    svg += `<text x="${titleX}" y="${titleY}" font-size="16" text-anchor="middle" dominant-baseline="bottom">Presjek</text>`;

    // Draw the panel outline (black rectangle)
    svg += `<line x1="${crossSectionStartX}" y1="${crossSectionMarginY}" x2="${crossSectionStartX + crossSectionWidth}" y2="${crossSectionMarginY}" stroke="black"/>`;
    svg += `<line x1="${crossSectionStartX}" y1="${crossSectionMarginY + thicknessScaled}" x2="${crossSectionStartX + crossSectionWidth}" y2="${crossSectionMarginY + thicknessScaled}" stroke="black"/>`;
    svg += `<line x1="${crossSectionStartX}" y1="${crossSectionMarginY}" x2="${crossSectionStartX}" y2="${crossSectionMarginY + thicknessScaled}" stroke="black"/>`;


    // Perpendicular line (right side of the rectangle) with text in the middle
    const lineStartX = crossSectionStartX + crossSectionWidth + 10; // Right edge of the rectangle
    const lineMiddleY = crossSectionMarginY + thicknessScaled / 2;
    svg += `<line x1="${lineStartX}" y1="${crossSectionMarginY}" x2="${lineStartX}" y2="${crossSectionMarginY + thicknessScaled}" stroke="black"/>`;
    svg += `<line x1="${lineStartX - 2}" y1="${crossSectionMarginY}" x2="${lineStartX + 2}" y2="${crossSectionMarginY}" stroke="black"/>`;
    svg += `<line x1="${lineStartX - 2}" y1="${crossSectionMarginY + thicknessScaled}" x2="${lineStartX + 2}" y2="${crossSectionMarginY + thicknessScaled}" stroke="black"/>`;
    svg += `<text x="${lineStartX + 5}" y="${lineMiddleY}" font-size="12" text-anchor="start" dominant-baseline="middle">${panelThickness} mm</text>`;

    const dimWidthX = crossSectionStartX + ((dadoOffset * crossectionScale) - dadoWidth);
    // Draw the dado cutout (red rectangle inside the panel)
    svg += `<rect x="${dimWidthX}" y="${crossSectionMarginY}" width="${dadoWidthScaled}" height="${dadoDepthScaled}" fill="none" stroke="red"/>`;

    // Depth dimension (horizontal, below dado cutout)
    svg += `<line x1="${crossSectionStartX - 10}" y1="${crossSectionMarginY}" x2="${crossSectionStartX - 10}" y2="${crossSectionMarginY + dadoDepthScaled}" stroke="black"/>`;
    svg += `<line x1="${crossSectionStartX - 12}" y1="${crossSectionMarginY}" x2="${crossSectionStartX - 8}" y2="${crossSectionMarginY}" stroke="black"/>`;
    svg += `<line x1="${crossSectionStartX - 12}" y1="${crossSectionMarginY + dadoDepthScaled}" x2="${crossSectionStartX - 8}" y2="${crossSectionMarginY + dadoDepthScaled}" stroke="black"/>`;
    svg += `<text x="${crossSectionStartX- 30}" y="${crossSectionMarginY + (dadoDepth )}" font-size="12" text-anchor="middle">${dadoDepth} mm</text>`;

    // Width dimension (vertical, right of the dado cutout)


    svg += `<line x1="${dimWidthX}" y1="${crossSectionMarginY - 10}" x2="${dimWidthX + dadoWidthScaled}" y2="${crossSectionMarginY - 10}" stroke="black"/>`;
    svg += `<line x1="${dimWidthX}" y1="${crossSectionMarginY - 12}" x2="${dimWidthX}" y2="${crossSectionMarginY - 8}" stroke="black"/>`;
    svg += `<line x1="${dimWidthX + dadoWidthScaled}" y1="${crossSectionMarginY - 12}" x2="${dimWidthX + dadoWidthScaled}" y2="${crossSectionMarginY - 8}" stroke="black"/>`;


    svg += `<text x="${dimWidthX}" y="${crossSectionMarginY - 20}" font-size="12" text-anchor="start" dominant-baseline="middle">${dadoWidth} mm</text>`;



    svg += `<line x1="${crossSectionStartX}" y1="${crossSectionMarginY - 10}" x2="${crossSectionStartX + (dadoOffset * crossectionScale)}" y2="${crossSectionMarginY - 10}" stroke="black"/>`;
    svg += `<line x1="${crossSectionStartX}" y1="${crossSectionMarginY - 12}" x2="${crossSectionStartX}" y2="${crossSectionMarginY - 8}" stroke="black"/>`;


    svg += `<text x="${crossSectionStartX}" y="${crossSectionMarginY - 20}" font-size="12" text-anchor="start" dominant-baseline="middle">${dadoOffset} mm</text>`;
    
    
  }

  svg += `</svg>`;
  return svg;

}

function panelRabbetSvg(p: Panel, index: number): string {
  const rabbet = p.rabbets?.[0];
  if (!rabbet) return '';
  const margin = 150;
  const width = p.length;
  const height = p.width;
  const rabbetWidth = rabbet.width;
  const rabbetDepth = rabbet.depth;
  // For the drawing, setback is 4 mm (into edge) and cut depth is 7 mm (into face)
  const displaySetback = rabbetDepth; // 4 mm
  const displayDepth = rabbetWidth;   // 7 mm
  const panelThickness = p.materialThickness || 18;

  const crossSectionScale = 3;
  const rabbetWidthPx = displaySetback * crossSectionScale;
  const rabbetDepthPx = displayDepth * crossSectionScale;
  const panelThicknessPx = panelThickness * crossSectionScale;
  const crossSectionWidth = rabbetWidthPx + 120;
  const crossSectionStartX = margin + width + margin;
  const crossSectionMarginY = margin + 80;
  const crossSectionBottom = crossSectionMarginY + panelThicknessPx;
  const totalW = width + crossSectionWidth + margin * 3;
  const totalH = Math.max(height + margin * 2, crossSectionBottom + margin);

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}">`;
  svg += `<text x="${margin}" y="${margin - 70}" font-size="20" text-anchor="start" dominant-baseline="auto">#${index} ${p.label}</text>`;

  // Top view with rabbet highlighted on the back edge
  svg += `<rect x="${margin}" y="${margin}" width="${width}" height="${height}" fill="none" stroke="black"/>`;
  svg += `<rect x="${margin}" y="${margin}" width="${width}" height="${displaySetback}" fill="rgba(255,0,0,0.12)" stroke="red"/>`;

  // Rabbet width dimension (back edge)
  const rabbetDimX = margin - 10;
  svg += `<line x1="${rabbetDimX}" y1="${margin}" x2="${rabbetDimX}" y2="${margin + displaySetback}" stroke="black"/>`;
  svg += `<line x1="${rabbetDimX - 2}" y1="${margin}" x2="${rabbetDimX + 2}" y2="${margin}" stroke="black"/>`;
  svg += `<line x1="${rabbetDimX - 2}" y1="${margin + displaySetback}" x2="${rabbetDimX + 2}" y2="${margin + displaySetback}" stroke="black"/>`;
  svg += `<text x="${rabbetDimX - 4}" y="${margin + displaySetback / 2}" font-size="12" text-anchor="end" dominant-baseline="middle">${displaySetback} mm</text>`;

  // Panel width dimension (top)
  svg += `<line x1="${margin}" y1="${margin - 20}" x2="${margin + width}" y2="${margin - 20}" stroke="black"/>`;
  svg += `<line x1="${margin}" y1="${margin - 22}" x2="${margin}" y2="${margin - 18}" stroke="black"/>`;
  svg += `<line x1="${margin + width}" y1="${margin - 22}" x2="${margin + width}" y2="${margin - 18}" stroke="black"/>`;
  svg += `<text x="${margin + width / 2}" y="${margin - 25}" font-size="12" text-anchor="middle">${width} mm</text>`;

  // Panel height dimension (right)
  const rabbetHeightDimX = margin + width + 10;
  svg += `<line x1="${rabbetHeightDimX}" y1="${margin}" x2="${rabbetHeightDimX}" y2="${margin + height}" stroke="black"/>`;
  svg += `<line x1="${rabbetHeightDimX - 2}" y1="${margin}" x2="${rabbetHeightDimX + 2}" y2="${margin}" stroke="black"/>`;
  svg += `<line x1="${rabbetHeightDimX - 2}" y1="${margin + height}" x2="${rabbetHeightDimX + 2}" y2="${margin + height}" stroke="black"/>`;
  svg += `<text x="${rabbetHeightDimX + 5}" y="${margin + height / 2}" font-size="12" text-anchor="start" dominant-baseline="middle">${height} mm</text>`;

  // Cross-section
  const titleX = crossSectionStartX + crossSectionWidth / 2;
  const titleY = crossSectionMarginY - 50;
  const rabbetY = crossSectionMarginY; // rabbet cut starts at the inside face
  const shoulderY = rabbetY + rabbetDepthPx; // depth into the panel
  svg += `<text x="${titleX}" y="${titleY}" font-size="16" text-anchor="middle" dominant-baseline="bottom">Presjek</text>`;
  svg += `<rect x="${crossSectionStartX}" y="${crossSectionMarginY}" width="${crossSectionWidth}" height="${panelThicknessPx}" fill="none" stroke="black"/>`;
  svg += `<rect x="${crossSectionStartX}" y="${rabbetY}" width="${rabbetWidthPx}" height="${rabbetDepthPx}" fill="rgba(255,0,0,0.12)" stroke="red"/>`;

  // Thickness dimension
  const thicknessDimX = crossSectionStartX + crossSectionWidth + 10;
  const thicknessMidY = crossSectionMarginY + panelThicknessPx / 2;
  svg += `<line x1="${thicknessDimX}" y1="${crossSectionMarginY}" x2="${thicknessDimX}" y2="${crossSectionBottom}" stroke="black"/>`;
  svg += `<line x1="${thicknessDimX - 2}" y1="${crossSectionMarginY}" x2="${thicknessDimX + 2}" y2="${crossSectionMarginY}" stroke="black"/>`;
  svg += `<line x1="${thicknessDimX - 2}" y1="${crossSectionBottom}" x2="${thicknessDimX + 2}" y2="${crossSectionBottom}" stroke="black"/>`;
  svg += `<text x="${thicknessDimX + 5}" y="${thicknessMidY}" font-size="12" text-anchor="start" dominant-baseline="middle">Debljina ${panelThickness} mm</text>`;

  // Rabbet depth dimension
  const depthDimX = crossSectionStartX - 10;
  svg += `<line x1="${depthDimX}" y1="${rabbetY}" x2="${depthDimX}" y2="${shoulderY}" stroke="black"/>`;
  svg += `<line x1="${depthDimX - 2}" y1="${rabbetY}" x2="${depthDimX + 2}" y2="${rabbetY}" stroke="black"/>`;
  svg += `<line x1="${depthDimX - 2}" y1="${shoulderY}" x2="${depthDimX + 2}" y2="${shoulderY}" stroke="black"/>`;
  svg += `<text x="${depthDimX - 4}" y="${rabbetY + rabbetDepthPx / 2}" font-size="12" text-anchor="end" dominant-baseline="middle">${displayDepth} mm</text>`;

  // Rabbet width dimension
  svg += `<line x1="${crossSectionStartX}" y1="${crossSectionMarginY - 10}" x2="${crossSectionStartX + rabbetWidthPx}" y2="${crossSectionMarginY - 10}" stroke="black"/>`;
  svg += `<line x1="${crossSectionStartX}" y1="${crossSectionMarginY - 12}" x2="${crossSectionStartX}" y2="${crossSectionMarginY - 8}" stroke="black"/>`;
  svg += `<line x1="${crossSectionStartX + rabbetWidthPx}" y1="${crossSectionMarginY - 12}" x2="${crossSectionStartX + rabbetWidthPx}" y2="${crossSectionMarginY - 8}" stroke="black"/>`;
  svg += `<text x="${crossSectionStartX + rabbetWidthPx / 2}" y="${crossSectionMarginY - 20}" font-size="12" text-anchor="middle" dominant-baseline="middle">${displaySetback} mm</text>`;

  svg += `</svg>`;
  return svg;
}

const svgToDataUri = (svg: string) =>
  svg ? `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` : '';

const displayLabel = (label: string) => {
  const parts = label.split('->').map(p => p.trim()).filter(Boolean);
  return parts[1] ?? parts[0] ?? label;
};

async function downloadDadoDrawings() {
  const zip = new JSZip();
  let index = 1;
  $cabinets.forEach(cab => {
    cab.panels().forEach((p: Panel) => {
      if (p.dados && p.dados.length) {
        const svg = panelDadoSvg(p,index);
        const safeLabel = p.label.replace(/[^a-z0-9]/gi, '_');
        zip.file(`${index}_${safeLabel}.svg`, svg);
        index++;
      }
    });
  });
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dado_drawings.zip';
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadRabbetDrawings() {
  const zip = new JSZip();
  let index = 1;
  $cabinets.forEach(cab => {
    cab.panels().forEach((p: Panel) => {
      if (p.rabbets && p.rabbets.length) {
        const svg = panelRabbetSvg(p, index);
        const safeLabel = p.label.replace(/[^a-z0-9]/gi, '_');
        zip.file(`${index}_${safeLabel}.svg`, svg);
        index++;
      }
    });
  });
  if (index === 1) {
    alert('No rabbet panels found.');
    return;
  }
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'rabbet_drawings.zip';
  a.click();
  URL.revokeObjectURL(url);
}

function csvGeneral() {
  let csv = "length (mm),width (mm),quantity,edge banding length right,edge banding length left,edge banding width bottom,edge banding width top,label,hinge location,dado/rabbet,material name,material thickness\n";

  $cabinets.forEach(cab => {
    cab.panels().forEach((p: Panel) => {
      const dadoStr = p.dados?.map(d => `${d.offset}/${d.depth}/${d.width}`).join('|') ?? '';
      const rabbetStr = p.rabbets?.map(r => `${r.width}/${r.depth}`).join('|') ?? '';
      const joinery = [dadoStr, rabbetStr ? `Rabbet:${rabbetStr}` : ''].filter(Boolean).join(';');
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
        joinery,
        p.material,
        p.materialThickness
      ].join(",") + "\n";
    });
  });

  return csv;
}

function csvMaxMoris() {
  let csv = "BR.,ŠIFRA MATERIJALA,DEB. mm,NAZIV ELEMENTA U KORPUSU,NAZIV KORPUSA,DUŽINA (Smjer goda) mm,ŠIRINA mm,KOM.,DUPLA PLOČA,ABS 2mm - DUŽINA (Prednji rub),ABS 2mm - DUŽINA (Stražnji rub),ABS 2mm - ŠIRINA (Lijevi rub),ABS 2mm - ŠIRINA (Desni rub),ABS 1mm - DUŽINA (Prednji rub),ABS 1mm - DUŽINA (Stražnji rub),ABS 1mm - ŠIRINA (Lijevi rub),ABS 1mm - ŠIRINA (Desni rub),ABS 0.5mm - DUŽINA (Prednji rub),ABS 0.5mm - DUŽINA (Stražnji rub),ABS 0.5mm - ŠIRINA (Lijevi rub),ABS 0.5mm - ŠIRINA (Desni rub),UTOR/LIMBEL,UKOP ZA BRITVELE,NAPOMENA\n";

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
        '',
        '',
        '',
        '',
        p.edgeBandingLengthRight,
        p.edgeBandingLengthLeft,
        p.edgeBandingWidthBottom,
        p.edgeBandingWidthTop,
        '',
        '',
        '',
        '',
          [p.dados?.map(d => `${d.offset}/${d.depth}/${d.width}`).join('|') ?? '', p.rabbets?.map(r => `${r.width}/${r.depth}`).join('|') ?? ''].filter(Boolean).join(';'),
          p.hingeLocation,
          ''
        ].join(",") + "\n";

      index++;
    });
  });

  return csv;
}
</script>

<div class="mb-4 flex gap-2 items-center no-print">
  <select bind:value={csvType} class="border p-2">
    <option value="general">General</option>
    <option value="max">Max Moris</option>
  </select>
  <button class="px-4 py-2 bg-green-600 text-white rounded" on:click={downloadCSV}>Download CSV</button>
  <button class="px-4 py-2 bg-green-600 text-white rounded" on:click={downloadDadoDrawings}>Download Dado Drawings</button>
  <button class="px-4 py-2 bg-green-600 text-white rounded" on:click={downloadRabbetDrawings}>Download Rabbet Drawings</button>
  <button class="px-4 py-2 bg-gray-600 text-white rounded" on:click={() => window.print()}>Print</button>
  <button class="px-4 py-2 bg-blue-600 text-white rounded" on:click={() => dispatch('close')}>Back</button>
</div>

<div class="summary-section print-page project-header">
  <div class="project-title">{activeProjectName}</div>
  <div class="project-subtitle">Cabinet layout summary</div>
</div>

<div class="summary-section print-page">
<div class="summary-header flex items-center justify-between">
  <h3 class={`font-semibold mb-2 ${isoRotate ? 'rotate-heading' : ''}`}>3D View</h3>
  <p class={`text-sm text-gray-700 ${isoRotate ? 'rotate-label' : ''}`}>
    Total width: {totalWidthMm(iso.bounds)} mm · Total height: {totalHeightMm(iso.bounds)} mm
    {#if isoRotate}
      <span class="ml-2 text-xs text-gray-500">(Rotated for print)</span>
    {/if}
  </p>
</div>
<svg
  class={`summary-svg ${isoRotate ? 'rotate-print' : ''}`}
  width={isoDisplay.width}
  height={isoDisplay.height}
  viewBox={`0 0 ${isoBaseW} ${isoBaseH}`}
  style="border:1px solid #000"
>
  <defs>
    <pattern id="hatch-iso" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="4" stroke="black" stroke-width="0.5" />
    </pattern>
  </defs>
  <g transform={`translate(${MARGIN - iso.bounds.minX},${MARGIN - iso.bounds.minY})`}>
    {#each iso.cabs as cab}
      {@const x = cab.x ?? 0}
      {@const y = cab.y ?? 0}
      {@const z = (cab.z ?? 0) / $scale}
      {@const dims = cab.rotation === 90 || cab.rotation === 270 ? { w: cab.d, d: cab.w } : { w: cab.w, d: cab.d }}
      {@const w = dims.w / $scale}
      {@const d = dims.d / $scale}
      {@const h = cab.h / $scale}
      {@const p1 = isoProject(x, y, z)}
      {@const p2 = isoProject(x + w, y, z)}
      {@const p3 = isoProject(x + w, y + d, z)}
      {@const p4 = isoProject(x, y + d, z)}
      {@const p5 = isoProject(x, y, z + h)}
      {@const p6 = isoProject(x + w, y, z + h)}
      {@const p7 = isoProject(x + w, y + d, z + h)}
      {@const p8 = isoProject(x, y + d, z + h)}
      <polygon points={`${p5.x},${p5.y} ${p6.x},${p6.y} ${p7.x},${p7.y} ${p8.x},${p8.y}`} fill="none" stroke="black" />
      <polyline points={`${p1.x},${p1.y} ${p5.x},${p5.y}`} stroke="black" />
      <polyline points={`${p2.x},${p2.y} ${p6.x},${p6.y}`} stroke="black" />
      <polyline points={`${p3.x},${p3.y} ${p7.x},${p7.y}`} stroke="black" />
      <polyline points={`${p4.x},${p4.y} ${p8.x},${p8.y}`} stroke="black" />
      <polyline points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y} ${p1.x},${p1.y}`} stroke="black" fill="none" />

      {#if cab.type === 'corner' && (cab as any).fixedSide}
        {@const fixed = (cab as any).fixedSide / $scale}
        {@const c1 = isoProject(x, y, z + h)}
        {@const c2 = isoProject(x + fixed, y, z + h)}
        {@const c3 = isoProject(x + fixed, y + d, z + h)}
        {@const c4 = isoProject(x, y + d, z + h)}
        <polygon points={`${c1.x},${c1.y} ${c2.x},${c2.y} ${c3.x},${c3.y} ${c4.x},${c4.y}`} fill="url(#hatch-iso)" />
        {@const l1 = isoProject(x + fixed, y, z + h)}
        {@const l2 = isoProject(x + fixed, y + d, z + h)}
        <line x1={l1.x} y1={l1.y} x2={l2.x} y2={l2.y} stroke="black" stroke-dasharray="4 2" />
      {/if}

      {#if cab.wall === 'north'}
        {#if cab.type === 'door' && (cab as any).doors}
          {#each Array((cab as any).doors - 1) as _, i}
            {@const xPos = x + w * (i + 1) / (cab as any).doors}
            {@const pBottom = isoProject(xPos, y + d, z)}
            {@const pTop = isoProject(xPos, y + d, z + h)}
            <line x1={pBottom.x} y1={pBottom.y} x2={pTop.x} y2={pTop.y} stroke="black" stroke-dasharray="4 2" />
          {/each}
          {#each Array((cab as any).doors) as _, i}
            {@const doorWidth = w / (cab as any).doors}
            {@const doorX = x + i * doorWidth}
            {@const handleX = (cab as any).doors === 1 ? doorX + doorWidth - 5 : i === 0 ? doorX + doorWidth - 5 : doorX + 5}
            {@const pHandleBottom = isoProject(handleX, y + d, z + h / 2 - 5)}
            {@const pHandleTop = isoProject(handleX, y + d, z + h / 2 + 5)}
            <line x1={pHandleBottom.x} y1={pHandleBottom.y} x2={pHandleTop.x} y2={pHandleTop.y} stroke="black" />
          {/each}
        {/if}

        {#if cab.type === 'drawer' && (cab as any).heights}
          {@const heights = (cab as any).heights}
          {#each heights.slice(0, -1) as _, i}
            {@const pos = heights.slice(0, i + 1).reduce((a: number, b: number) => a + b, 0)}
            {@const pLeft = isoProject(x, y + d, z + h * pos / 100)}
            {@const pRight = isoProject(x + w, y + d, z + h * pos / 100)}
            <line x1={pLeft.x} y1={pLeft.y} x2={pRight.x} y2={pRight.y} stroke="black" stroke-dasharray="4 2" />
          {/each}
          {#each heights as height, i}
            {@const top = heights.slice(0, i).reduce((a: number, b: number) => a + b, 0)}
            {@const mid = top + height / 2}
            {@const pLeft = isoProject(x + w / 2 - 5, y + d, z + h * mid / 100)}
            {@const pRight = isoProject(x + w / 2 + 5, y + d, z + h * mid / 100)}
            <line x1={pLeft.x} y1={pLeft.y} x2={pRight.x} y2={pRight.y} stroke="black" />
          {/each}
        {/if}

        {#if cab.type === 'oven' && (cab as any).drawerHeight}
          {@const drawerH = (cab as any).drawerHeight / $scale}
          {@const pLeft = isoProject(x, y + d, z + drawerH)}
          {@const pRight = isoProject(x + w, y + d, z + drawerH)}
          <line x1={pLeft.x} y1={pLeft.y} x2={pRight.x} y2={pRight.y} stroke="black" stroke-dasharray="4 2" />
          {@const pHandleLeft = isoProject(x + w / 2 - 5, y + d, z + drawerH / 2)}
          {@const pHandleRight = isoProject(x + w / 2 + 5, y + d, z + drawerH / 2)}
          <line x1={pHandleLeft.x} y1={pHandleLeft.y} x2={pHandleRight.x} y2={pHandleRight.y} stroke="black" />
          {@const ovenHeight = h - drawerH}
          {@const o1 = isoProject(x + w * 0.1, y + d, z + drawerH + ovenHeight * 0.1)}
          {@const o2 = isoProject(x + w * 0.9, y + d, z + drawerH + ovenHeight * 0.1)}
          {@const o3 = isoProject(x + w * 0.9, y + d, z + drawerH + ovenHeight * 0.9)}
          {@const o4 = isoProject(x + w * 0.1, y + d, z + drawerH + ovenHeight * 0.9)}
          <polygon points={`${o1.x},${o1.y} ${o2.x},${o2.y} ${o3.x},${o3.y} ${o4.x},${o4.y}`} fill="none" stroke="black" />
          {@const i1 = isoProject(x + w * 0.25, y + d, z + drawerH + ovenHeight * 0.25)}
          {@const i2 = isoProject(x + w * 0.75, y + d, z + drawerH + ovenHeight * 0.25)}
          {@const i3 = isoProject(x + w * 0.75, y + d, z + drawerH + ovenHeight * 0.75)}
          {@const i4 = isoProject(x + w * 0.25, y + d, z + drawerH + ovenHeight * 0.75)}
          <polygon points={`${i1.x},${i1.y} ${i2.x},${i2.y} ${i3.x},${i3.y} ${i4.x},${i4.y}`} fill="none" stroke="black" />
        {/if}
      {:else if cab.wall === 'west'}
        {#if cab.type === 'door' && (cab as any).doors}
          {#each Array((cab as any).doors - 1) as _, i}
            {@const yPos = y + d * (i + 1) / (cab as any).doors}
            {@const pBottom = isoProject(x + w, yPos, z)}
            {@const pTop = isoProject(x + w, yPos, z + h)}
            <line x1={pBottom.x} y1={pBottom.y} x2={pTop.x} y2={pTop.y} stroke="black" stroke-dasharray="4 2" />
          {/each}
          {#each Array((cab as any).doors) as _, i}
            {@const doorWidth = d / (cab as any).doors}
            {@const doorY = y + i * doorWidth}
            {@const handleY = (cab as any).doors === 1 ? doorY + doorWidth - 5 : i === 0 ? doorY + doorWidth - 5 : doorY + 5}
            {@const pHandleBottom = isoProject(x + w, handleY, z + h / 2 - 5)}
            {@const pHandleTop = isoProject(x + w, handleY, z + h / 2 + 5)}
            <line x1={pHandleBottom.x} y1={pHandleBottom.y} x2={pHandleTop.x} y2={pHandleTop.y} stroke="black" />
          {/each}
        {/if}

        {#if cab.type === 'drawer' && (cab as any).heights}
          {@const heights = (cab as any).heights}
          {#each heights.slice(0, -1) as _, i}
            {@const pos = heights.slice(0, i + 1).reduce((a: number, b: number) => a + b, 0)}
            {@const pTopLeft = isoProject(x + w, y, z + h * pos / 100)}
            {@const pTopRight = isoProject(x + w, y + d, z + h * pos / 100)}
            <line x1={pTopLeft.x} y1={pTopLeft.y} x2={pTopRight.x} y2={pTopRight.y} stroke="black" stroke-dasharray="4 2" />
          {/each}
          {#each heights as height, i}
            {@const top = heights.slice(0, i).reduce((a: number, b: number) => a + b, 0)}
            {@const mid = top + height / 2}
            {@const pHandleLeft = isoProject(x + w, y + d / 2 - 5, z + h * mid / 100)}
            {@const pHandleRight = isoProject(x + w, y + d / 2 + 5, z + h * mid / 100)}
            <line x1={pHandleLeft.x} y1={pHandleLeft.y} x2={pHandleRight.x} y2={pHandleRight.y} stroke="black" />
          {/each}
        {/if}

        {#if cab.type === 'oven' && (cab as any).drawerHeight}
          {@const drawerH = (cab as any).drawerHeight / $scale}
          {@const pTopLeft = isoProject(x + w, y, z + drawerH)}
          {@const pTopRight = isoProject(x + w, y + d, z + drawerH)}
          <line x1={pTopLeft.x} y1={pTopLeft.y} x2={pTopRight.x} y2={pTopRight.y} stroke="black" stroke-dasharray="4 2" />
          {@const pHandleLeft = isoProject(x + w, y + d / 2 - 5, z + drawerH / 2)}
          {@const pHandleRight = isoProject(x + w, y + d / 2 + 5, z + drawerH / 2)}
          <line x1={pHandleLeft.x} y1={pHandleLeft.y} x2={pHandleRight.x} y2={pHandleRight.y} stroke="black" />
          {@const ovenHeight = h - drawerH}
          {@const o1 = isoProject(x + w, y + d * 0.1, z + drawerH + ovenHeight * 0.1)}
          {@const o2 = isoProject(x + w, y + d * 0.9, z + drawerH + ovenHeight * 0.1)}
          {@const o3 = isoProject(x + w, y + d * 0.9, z + drawerH + ovenHeight * 0.9)}
          {@const o4 = isoProject(x + w, y + d * 0.1, z + drawerH + ovenHeight * 0.9)}
          <polygon points={`${o1.x},${o1.y} ${o2.x},${o2.y} ${o3.x},${o3.y} ${o4.x},${o4.y}`} fill="none" stroke="black" />
          {@const i1 = isoProject(x + w, y + d * 0.25, z + drawerH + ovenHeight * 0.25)}
          {@const i2 = isoProject(x + w, y + d * 0.75, z + drawerH + ovenHeight * 0.25)}
          {@const i3 = isoProject(x + w, y + d * 0.75, z + drawerH + ovenHeight * 0.75)}
          {@const i4 = isoProject(x + w, y + d * 0.25, z + drawerH + ovenHeight * 0.75)}
          <polygon points={`${i1.x},${i1.y} ${i2.x},${i2.y} ${i3.x},${i3.y} ${i4.x},${i4.y}`} fill="none" stroke="black" />
        {/if}
      {/if}
    {/each}
  </g>
</svg>
</div>

{#each viewConfigs as v}
  {@const data = prepare(v.id)}
  {@const axes = getAxes(v.id)}
  {@const baseW = svgWidth(data.bounds)}
  {@const baseH = svgHeight(data.bounds)}
  {@const maxWidth = Math.max(MIN_DISPLAY_WIDTH, viewportWidth - 80)}
  {@const display = fitToWidth(baseW, baseH, maxWidth)}
  {@const rotateWide = v.id === 'north' ? true : baseW > baseH}
  <div class="summary-section print-page">
    <div class="summary-header flex items-center justify-between">
      <h3 class={`font-semibold mb-2 ${rotateWide ? 'rotate-heading' : ''}`}>{v.label}</h3>
      <p class={`text-sm text-gray-700 ${rotateWide ? 'rotate-label' : ''}`}>
        Total width: {totalWidthMm(data.bounds)} mm · Total height: {totalHeightMm(data.bounds)} mm
        {#if rotateWide}
          <span class="ml-2 text-xs text-gray-500">(Rotated for print)</span>
        {/if}
      </p>
    </div>
    <svg
      class={`summary-svg ${rotateWide ? 'rotate-print' : ''}`}
      width={display.width}
      height={display.height}
      viewBox={`0 0 ${baseW} ${baseH}`}
      style="border:1px solid #000"
    >
    <defs>
      <pattern id={`hatch-${v.id}`} patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="4" stroke="black" stroke-width="0.5" />
      </pattern>
    </defs>
    {#each data.sorted as cab}
      {@const baseX = (cab[axes.left] ?? 0) - data.bounds.minX}
      {@const w = getWidthPx(cab, axes)}
      {@const h = getHeightPx(cab, axes)}
      {@const x = v.id === 'west'
        ? data.bounds.width - (baseX + w) + MARGIN
        : baseX + MARGIN}
      {@const y = v.id === 'top'
        ? (cab[axes.top] ?? 0) - data.bounds.minY + MARGIN
        : data.bounds.height - ((cab[axes.top] ?? 0) / $scale + h) + MARGIN}
      {#if cab.type === 'corner' && (cab as any).fixedSide}
        {@const fixed = (cab as any).fixedSide / $scale}
        <rect x={x} y={y} width={fixed} height={h} fill={`url(#hatch-${v.id})`} />
      {/if}
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="black" />

      {#if cab.type === 'corner' && (cab as any).fixedSide}
        <line x1={x + (cab as any).fixedSide / $scale} y1={y} x2={x + (cab as any).fixedSide / $scale} y2={y + h} stroke="black" stroke-dasharray="4 2" />
      {/if}

      {#if v.id !== 'top'}
        {#if cab.type === 'door' && (cab as any).doors}
          {#each Array((cab as any).doors - 1) as _, i}
            <line x1={x + w * (i + 1) / (cab as any).doors} y1={y} x2={x + w * (i + 1) / (cab as any).doors} y2={y + h} stroke="black" stroke-dasharray="4 2" />
          {/each}
          {#each Array((cab as any).doors) as _, i}
            {@const doorWidth = w / (cab as any).doors}
            {@const doorX = x + i * doorWidth}
            {@const handleX = (cab as any).doors === 1 ? doorX + doorWidth - 5 : i === 0 ? doorX + doorWidth - 5 : doorX + 5}
            <line x1={handleX} y1={y + h / 2 - 5} x2={handleX} y2={y + h / 2 + 5} stroke="black" />
          {/each}
        {/if}

        {#if cab.type === 'drawer' && (cab as any).heights}
          {@const heights = (cab as any).heights}
          {#each heights.slice(0, -1) as _, i}
            {@const pos = heights.slice(0, i + 1).reduce((a: number, b: number) => a + b, 0)}
            <line x1={x} x2={x + w} y1={y + h * pos / 100} y2={y + h * pos / 100} stroke="black" stroke-dasharray="4 2" />
          {/each}
          {#each heights as height, i}
            {@const top = heights.slice(0, i).reduce((a: number, b: number) => a + b, 0)}
            {@const mid = top + height / 2}
            <line x1={x + w / 2 - 5} x2={x + w / 2 + 5} y1={y + h * mid / 100} y2={y + h * mid / 100} stroke="black" />
          {/each}
        {/if}

        {#if cab.type === 'oven' && (cab as any).drawerHeight}
          {@const drawerH = (cab as any).drawerHeight / $scale}
          <line x1={x} x2={x + w} y1={y + h - drawerH} y2={y + h - drawerH} stroke="black" stroke-dasharray="4 2" />
          <line x1={x + w / 2 - 5} x2={x + w / 2 + 5} y1={y + h - drawerH / 2} y2={y + h - drawerH / 2} stroke="black" />
          {@const ovenHeight = h - drawerH}
          <rect x={x + w * 0.1} y={y + ovenHeight * 0.1} width={w * 0.8} height={ovenHeight * 0.8} fill="none" stroke="black" />
          <rect x={x + w * 0.25} y={y + ovenHeight * 0.25} width={w * 0.5} height={ovenHeight * 0.5} fill="none" stroke="black" />
        {/if}
      {/if}

      <text x={x + w / 2} y={y + h / 2} text-anchor="middle" dominant-baseline="middle" font-size="12">{cab.id}</text>
    {/each}

    <!-- horizontal dimension line -->
    <line x1={MARGIN} y1={data.bounds.height + MARGIN + DIM_OFFSET} x2={data.bounds.width + MARGIN} y2={data.bounds.height + MARGIN + DIM_OFFSET} stroke="black" />
    {#each data.sorted as cab}
      {@const baseX = (cab[axes.left] ?? 0) - data.bounds.minX}
      {@const w = getWidthPx(cab, axes)}
      {@const x = v.id === 'west'
        ? data.bounds.width - (baseX + w) + MARGIN
        : baseX + MARGIN}
      {@const widthMm = axes.width === 'w'
        ? getOrientedDims(cab).w
        : getOrientedDims(cab).d}
      <line x1={x} y1={data.bounds.height + MARGIN + DIM_OFFSET - 5} x2={x} y2={data.bounds.height + MARGIN + DIM_OFFSET + 5} stroke="black" />
      <line x1={x + w} y1={data.bounds.height + MARGIN + DIM_OFFSET - 5} x2={x + w} y2={data.bounds.height + MARGIN + DIM_OFFSET + 5} stroke="black" />
      <text x={x + w / 2} y={data.bounds.height + MARGIN + DIM_OFFSET + 15} text-anchor="middle" font-size="12">{Math.round(widthMm)} mm</text>
    {/each}
    <text x={data.bounds.width / 2 + MARGIN} y={data.bounds.height + MARGIN + DIM_OFFSET + 35} text-anchor="middle" font-size="12">Total {totalWidthMm(data.bounds)} mm</text>

    <!-- total height dimension line -->
    <line x1={data.bounds.width + MARGIN + DIM_OFFSET} y1={MARGIN} x2={data.bounds.width + MARGIN + DIM_OFFSET} y2={data.bounds.height + MARGIN} stroke="black" />
    {#each data.heightTicks as pos}
      <line x1={data.bounds.width + MARGIN + DIM_OFFSET - 5} y1={MARGIN + pos} x2={data.bounds.width + MARGIN + DIM_OFFSET + 5} y2={MARGIN + pos} stroke="black" />
    {/each}
    {#each data.heightSegments as seg}
      <text x={data.bounds.width + MARGIN + DIM_OFFSET + 5} y={MARGIN + seg.mid} font-size="12" dominant-baseline="middle">{seg.size} mm</text>
    {/each}
  </svg>
  </div>
{/each}

<h3 class="font-semibold mb-2">Cabinet Drawings</h3>
<div class="summary-section summary-grid print-page">
  {#each $cabinets as cab}
    {@const dims = getOrientedDims(cab)}
    {@const w = cab.w / $scale}
    {@const h = cab.h / $scale}
    {@const wIso = dims.w / $scale}
    {@const dIso = dims.d / $scale}
    {@const hIso = cab.h / $scale}
    {@const panels = cab.panels()}
    {@const joineryPanels = panels.filter((p: Panel) => (p.dados?.length || p.rabbets?.length))}
    {@const isoPoints = [
      isoProject(0, 0, 0),
      isoProject(wIso, 0, 0),
      isoProject(wIso, dIso, 0),
      isoProject(0, dIso, 0),
      isoProject(0, 0, hIso),
      isoProject(wIso, 0, hIso),
      isoProject(wIso, dIso, hIso),
      isoProject(0, dIso, hIso)
    ]}
    {@const isoMinX = Math.min(...isoPoints.map(p => p.x))}
    {@const isoMaxX = Math.max(...isoPoints.map(p => p.x))}
    {@const isoMinY = Math.min(...isoPoints.map(p => p.y))}
    {@const isoMaxY = Math.max(...isoPoints.map(p => p.y))}
    {@const isoSvgW = isoMaxX - isoMinX + CABINET_MARGIN * 2 + CABINET_DIM * 3}
    {@const isoSvgH = isoMaxY - isoMinY + CABINET_MARGIN * 2 + CABINET_DIM * 3}
    {@const maxWidth = Math.max(MIN_DISPLAY_WIDTH, viewportWidth - 80)}
    {@const isoDisplay = fitToWidth(isoSvgW, isoSvgH, maxWidth)}
    {@const rotateWide = isoSvgW > isoSvgH}
    {@const isoTx = CABINET_MARGIN + CABINET_DIM - isoMinX}
    {@const isoTy = CABINET_MARGIN + CABINET_DIM - isoMinY}
    {@const p1 = isoPoints[0]}
    {@const p2 = isoPoints[1]}
    {@const p3 = isoPoints[2]}
    {@const p4 = isoPoints[3]}
    {@const p5 = isoPoints[4]}
    {@const p6 = isoPoints[5]}
    {@const p7 = isoPoints[6]}
    {@const p8 = isoPoints[7]}
    {@const widthY = p1.y + CABINET_DIM}
    {@const heightX = p1.x - CABINET_DIM}
    {@const dx = p4.x - p1.x}
    {@const dy = p4.y - p1.y}
    {@const len = Math.sqrt(dx * dx + dy * dy)}
    {@const offX = -dy / len * CABINET_DIM}
    {@const offY = dx / len * CABINET_DIM}
    {@const offNX = offX / CABINET_DIM}
    {@const offNY = offY / CABINET_DIM}
    {@const startX = p1.x + offX}
    {@const startY = p1.y + offY}
    {@const endX = p4.x + offX}
    {@const endY = p4.y + offY}
    {@const midX = (startX + endX) / 2 + offNX * 10}
    {@const midY = (startY + endY) / 2 + offNY * 10}
    <div class="border p-3 flex flex-col gap-3 summary-card">
      <div class="flex items-center justify-between w-full">
        <div class="text-base font-semibold text-gray-900">{cab.id}</div>
        <div class="text-sm text-gray-700 capitalize">{cab.type}</div>
      </div>
      <div class="summary-body">
        <div class="summary-iso">
          <svg
            class={`summary-svg ${rotateWide ? 'rotate-print' : ''}`}
            width={isoDisplay.width}
            height={isoDisplay.height}
            viewBox={`0 0 ${isoSvgW} ${isoSvgH}`}
            style="border:1px solid #000; margin-top:4px"
          >
            <g transform={`translate(${isoTx},${isoTy})`}>
              <polygon points={`${p5.x},${p5.y} ${p6.x},${p6.y} ${p7.x},${p7.y} ${p8.x},${p8.y}`} fill="none" stroke="black" />
              <polygon points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`} fill="none" stroke="black" />
              <line x1={p1.x} y1={p1.y} x2={p5.x} y2={p5.y} stroke="black" />
              <line x1={p2.x} y1={p2.y} x2={p6.x} y2={p6.y} stroke="black" />
              <line x1={p3.x} y1={p3.y} x2={p7.x} y2={p7.y} stroke="black" />
              <line x1={p4.x} y1={p4.y} x2={p8.x} y2={p8.y} stroke="black" />

              <line x1={p1.x + offX} y1={p1.y + offY} x2={p2.x + offX} y2={p2.y + offY} stroke="black"/>
              <line x1={p1.x + offX} y1={p1.y + offY - 5} x2={p1.x + offX} y2={p1.y + offY + 5} stroke="black"/>
              <line x1={p2.x + offX} y1={p2.y + offY - 5} x2={p2.x + offX} y2={p2.y + offY + 5} stroke="black"/>
              <text x={(p1.x + p2.x) / 2 + offX} y={widthY + offY + 15} text-anchor="middle"
                    font-size="10">{Math.round(dims.w)} mm
              </text>

              <line x1={heightX} y1={p1.y} x2={heightX} y2={p5.y} stroke="black" />
              <line x1={heightX - 5} y1={p1.y} x2={heightX + 5} y2={p1.y} stroke="black" />
              <line x1={heightX - 5} y1={p5.y} x2={heightX + 5} y2={p5.y} stroke="black" />
              <text x={heightX - 5} y={(p1.y + p5.y) / 2} text-anchor="end" dominant-baseline="middle" font-size="10">{Math.round(cab.h)} mm</text>

              <line x1={startX} y1={startY} x2={endX} y2={endY} stroke="black" />
              <line x1={startX - offNX * 5} y1={startY - offNY * 5} x2={startX + offNX * 5} y2={startY + offNY * 5} stroke="black" />
              <line x1={endX - offNX * 5} y1={endY - offNY * 5} x2={endX + offNX * 5} y2={endY + offNY * 5} stroke="black" />
              <text x={midX} y={midY} text-anchor="middle" font-size="10">{Math.round(dims.d)} mm</text>

              {#if cab.type === 'door' && (cab as any).doors}
                {@const doorCount = (cab as any).doors}
                <text x={midX} y={p5.y - 40} text-anchor="middle" font-size="10">Doors: {doorCount}</text>
              {/if}

              {#if cab.type === 'drawer' && (cab as any).drawers}
                {@const drawerCount = (cab as any).drawers}
                <text x={midX} y={p5.y - 20} text-anchor="middle" font-size="10">Drawers: {drawerCount}</text>
              {/if}

              {#if cab.type === 'drawer' && (cab as any).clearance}
                {@const clearance = (cab as any).clearance}
                <text x={midX} y={p5.y + 20} text-anchor="middle" font-size="10">Clearance: {clearance} mm</text>
              {/if}

              {#if cab.type === 'oven' && (cab as any).drawerHeight}
                {@const drawerHeight = (cab as any).drawerHeight}
                <text x={midX} y={p5.y + 40} text-anchor="middle" font-size="10">Drawer Height: {drawerHeight} mm</text>
              {/if}

              {#if cab.type === 'corner' && (cab as any).fixedSide}
                {@const fixedSide = (cab as any).fixedSide}
                <text x={midX} y={p5.y + 60} text-anchor="middle" font-size="10">Fixed Side: {fixedSide} mm</text>
              {/if}
              
              
              
            </g>
          </svg>
        </div>
        <div class="text-sm mt-2 w-full summary-meta">
          <div class="grid grid-cols-2 gap-2 text-gray-800">
            <span class="font-semibold">Width</span><span class="font-semibold">{Math.round(cab.w)} mm</span>
            <span class="font-semibold">Height</span><span class="font-semibold">{Math.round(cab.h)} mm</span>
            <span class="font-semibold">Depth</span><span class="font-semibold">{Math.round(cab.d)} mm</span>
            {#if cab.type === 'door'}
              <span class="font-semibold text-gray-800">Doors</span><span>{(cab as any).doors}</span>
            {/if}
            {#if cab.type === 'drawer'}
              <span class="font-semibold text-gray-800">Drawers</span><span>{(cab as any).drawers}</span>
              {#if (cab as any).clearance}
                <span class="font-semibold text-gray-800">Clearance</span><span>{(cab as any).clearance} mm</span>
              {/if}
            {/if}
            {#if cab.type === 'oven'}
              <span class="font-semibold text-gray-800">Drawer Height</span><span>{(cab as any).drawerHeight} mm</span>
            {/if}
            {#if cab.type === 'corner' && (cab as any).fixedSide}
              <span class="font-semibold text-gray-800">Fixed Side</span><span>{(cab as any).fixedSide} mm</span>
            {/if}
          </div>
        </div>
      </div>
      {#if joineryPanels.length}
        <div class="joinery-section">
          <div class="joinery-title">Dados & Rabbets</div>
          <div class="joinery-grid">
            {#each joineryPanels as panel, i}
              {@const dadoUri = panel.dados?.length ? svgToDataUri(panelDadoSvg(panel, i + 1)) : ''}
              {@const rabbetUri = panel.rabbets?.length ? svgToDataUri(panelRabbetSvg(panel, i + 1)) : ''}
              <div class="joinery-card">
                <div class="joinery-meta">
                  <span>{displayLabel(panel.label)}</span>
                  <span class="text-xs text-gray-500">Qty {panel.quantity}</span>
                </div>
                {#if dadoUri}
                  <img src={dadoUri} alt="Dado drawing" class="joinery-img" />
                {/if}
                {#if rabbetUri}
                  <img src={rabbetUri} alt="Rabbet drawing" class="joinery-img" />
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .summary-svg {
    max-width: 100%;
    height: auto;
    max-height: 250mm;
  }
  .summary-svg text {
    font-size: 16px !important;
  }
  .summary-section {
    break-inside: avoid;
    page-break-inside: avoid;
    margin-bottom: 16px;
  }
  .project-header {
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 12px 16px;
    background: #f9fafb;
  }
  .project-title {
    font-size: 22px;
    font-weight: 700;
    color: #111827;
  }
  .project-subtitle {
    font-size: 14px;
    color: #4b5563;
    margin-top: 4px;
  }
  .summary-card {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .summary-body {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: flex-start;
  }
  .summary-iso {
    flex: 1 1 55%;
    min-width: 260px;
  }
  .summary-meta {
    flex: 1 1 40%;
    min-width: 220px;
    margin-top: 0;
  }
  .summary-grid {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .joinery-section {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .joinery-title {
    font-weight: 600;
    color: #111827;
    font-size: 15px;
  }
  .joinery-grid {
    display: grid;
    gap: 10px;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }
  .joinery-card {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    break-inside: avoid;
  }
  .joinery-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 600;
    color: #374151;
  }
  .joinery-img {
    width: 100%;
    height: auto;
    max-height: 260px;
    object-fit: contain;
    background: #fff;
    border: 1px solid #d1d5db;
    border-radius: 4px;
  }
  .summary-header {
    position: relative;
    min-height: 28px;
  }
  @media print {
    .no-print {
      display: none;
    }
    .summary-section,
    .summary-card,
    .summary-svg {
      break-inside: avoid;
      page-break-inside: avoid;
      max-height: 250mm;
    }
    .project-header {
      page-break-after: avoid;
    }
    .summary-body {
      flex-wrap: nowrap;
    }
    .summary-section h3 {
      font-size: 20px !important;
    }
    .summary-section p,
    .summary-card span {
      font-size: 14px !important;
    }
    .summary-svg text {
      font-size: 18px !important;
    }
    .summary-section + .summary-section {
      page-break-before: auto;
    }
    .summary-grid {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .print-page {
      page-break-after: auto;
    }
    .joinery-section,
    .joinery-card {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .joinery-img {
      max-height: 180mm;
    }
    .rotate-print {
      transform: rotate(90deg) translate(0, -100%);
      transform-origin: top left;
      width: 260mm;
      max-width: 260mm;
      height: auto;
      max-height: 260mm;
      margin: 0 auto;
    }
  }
</style>
