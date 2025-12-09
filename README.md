# Visual Cabinet Planner

An interactive Svelte + TypeScript app for laying out cabinets, generating cut lists, and pricing projects. The planner lets you design base and upper runs in multiple views, tune construction parameters, manage projects in the browser, and export CSV/drawing packages for fabrication.

## Quick start

1) Prereqs: Node.js 18+ and npm.  
2) Install: `npm install`  
3) Run dev server: `npm run dev` (open the printed localhost URL).  
4) Build: `npm run build`; preview: `npm run preview`.  
5) Tests: `npm test` (Vitest), type checks: `npm run check`.

All data is saved to `localStorage`; no backend is required.

## Daily workflow

1) Set room envelope and materials in **Settings**.  
2) Use **Add Cabinet** to place base/upper units, drag to position, and rotate as needed.  
3) Switch **Top / North / West** views to verify alignment; use plane selector for uppers.  
4) Open **Total** for cost/BOM or **Layout Summary** to export CSV and drawings.  
5) Manage layouts via **Projects** (create, switch, backup/restore).

## Layout workspace

- **Views:** Top (plan), North (front), West (side). Select a plane in Top view when multiple cabinet elevations (z) exist. Plane lines are shown in elevation views.  
- **Units & scale:** Inputs are entered in centimeters for convenience; internal calculations use millimeters. The zoom buttons adjust pixels-per-mm without changing real dimensions.  
- **Dragging & snapping:** Drag cabinets in Top view; snapping to the nearest wall sets `wall` (north/south/east/west) and auto-aligns. Nearby cabinets snap edges; depth mismatches are highlighted with a red border.  
- **Rotation:** In Top view, rotate in 90° steps; the footprint respects rotated width/depth.  
- **Activation:** In Top view, only cabinets on the active plane are interactive; elevation views show only cabinets on the wall they face.

## Adding and editing cabinets

Open **Add Cabinet** or edit an existing unit. Common fields:
- `Width / Height / Depth (cm)`: Converted to mm internally.  
- `Rotation`: 0/90/180/270.  
- `Full corpus`: Use a full top panel; otherwise split top rails.  
- `Inset back` vs `Rabbet back`: Mutually exclusive back treatments.  
- `Hidden handles`: Apply handleless reveals; for doors you can flag “upper cabinet” to extend the overhang on uppers.

Type-specific parameters:
- **Door cabinet**: `Doors` (count), `Shelves` (optional).  
- **Drawer cabinet**: `Drawers` and `Heights (%)` (comma-separated; must sum to 100). `Drawer system` = `standard` (wood box), `metabox`, or `vertex`; choose `Slide length` and `Railing height` for metal systems.  
- **Corner cabinet**: `Fixed side (cm)` sets the blind return; remaining width becomes the door.  
- **Oven cabinet**: Uses global oven cutout settings; includes one drawer below the cavity. Choose drawer system/slide/rail.

Placement options:
- `Duplicate on save` (when editing) offsets a copy on save.  
- `x / y / z` positions and `wall` are updated automatically when dragging/switching views.

Validation highlights:
- Drawer heights must total 100%; oven cabinets must match required width/depth from Advanced Settings; inset and rabbet backs cannot be combined.

## Projects and backups

- The **Projects** panel (top buttons) stores layouts in `localStorage`.  
- Actions: create (optionally copy current layout), rename, switch active, delete (at least one project must remain), download JSON backup of any project, and import JSON into the active project.  
- Each project snapshot contains cabinets, materials, room envelope, and scale.

## Settings reference

Open **Settings** from the header to configure:

- **Room envelope (cm):** `Width`, `Depth`, `Height` define the workspace limits and view extents.  
- **Materials (mm + cost/m²):** Names/thickness/cost for `Corpus`, `Front`, `Back`, `Drawer` panels.  
- **Edge & fabrication costs (per meter):** `Edge banding` and `Cutting` rates used in pricing.  
- **Advanced construction:**  
  - *Reveals & fronts:* `Side gap`, `Vertical gap`, optional `Center gap` (defaults to 2× vertical), `Handleless reveal (base)`, `Upper handleless overhang bonus`, `Gola/profile height`.  
  - *Backs & carcass:* `Inset offset`, `Inset dado depth/clearance`, `Inset oversize` (full/split top), `Rabbet width/depth/clearance`, `Split top rail depth`, `Shelf depth setback`.  
  - *Drawer hardware defaults:* `Slide lengths`, `Rail heights` paired with `Back heights`, `Default slide length`, `Default rail height`.  
  - *Drawer system allowances:*  
    - Standard (wood): `Side clearance total`, `Depth setback`, `Side/back height reduction`.  
    - Metabox: `Width clearance`, `Depth clearance`, `Front setback` (used when inferring slide length).  
    - Vertex: `Width clearance`, `Back width clearance`, `Slide shortening`.  
  - *Oven cutout:* `Cavity height`, `Required cabinet width`, `Minimum depth`, `Minimum drawer height`, `Drawer face clearance under oven`.

Changes apply immediately on save and update all calculations.

## Costs and bill of materials

- Open **Total** to see a live cost breakdown: boards per material, edge banding, cutting, and hardware counts.  
- Board packing assumes 2800 × 2070 mm sheets. Edge/cut lengths are derived from per-panel banding flags.  
- Hardware counts: basic connections per cabinet, hinges from panel hinge declarations, drawer slides from drawer count, plus screws/dowels.

## Layout summary and exports

- Click **Layout Summary** for printable views (Top/North/West + 3D isometric).  
- Exports:  
  - `Download CSV` (General or Max Moris formats) listing every panel with banding/joinery info.  
  - `Download Dado Drawings` / `Download Rabbet Drawings` zips SVGs for panels that include those cuts.  
  - `Print` generates a print-friendly layout package.

## Localization

Use the language selector in the header (`en` or `hr`). The choice is stored in `localStorage`.

## Tips and conventions

- Enter dimensions in centimeters; review the mm spec shown in the form.  
- Use plane selector for uppers; elevation views show plane lines for reference.  
- Watch for red highlights indicating depth mismatches between adjacent cabinets.  
- For drawer stacks, ensure percentages total 100; adjust vertical gaps or handleless reveals in Advanced Settings if clearances look off.  
- Oven cabinets must meet the global oven width/depth constraints or validation will fail.  
- Backups are browser-local; download JSON backups before clearing storage or switching devices.
