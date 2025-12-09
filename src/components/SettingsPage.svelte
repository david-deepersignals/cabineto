<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { materials } from '../stores/materials';
  import { room } from '../stores/room';
  import { advancedSettings } from '../stores/advancedSettings';
  import { t } from '../i18n';

  const dispatch = createEventDispatcher();

  const numberOr = (value: string, fallback: number) => {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const numberList = (value: string) => value.split(',').map(v => parseFloat(v.trim())).filter(v => Number.isFinite(v));

  let roomWidth = ($room.width / 10).toString();
  let roomDepth = ($room.depth / 10).toString();
  let roomHeight = ($room.height / 10).toString();

  let corpusName = $materials.corpus.name;
  let corpusThickness = $materials.corpus.thickness.toString();
  let corpusCost = ($materials.corpus.cost ?? 0).toString();

  let frontName = $materials.front.name;
  let frontThickness = $materials.front.thickness.toString();
  let frontCost = ($materials.front.cost ?? 0).toString();

  let backName = $materials.back.name;
  let backThickness = $materials.back.thickness.toString();
  let backCost = ($materials.back.cost ?? 0).toString();

  let drawerName = $materials.drawer.name;
  let drawerThickness = $materials.drawer.thickness.toString();
  let drawerCost = ($materials.drawer.cost ?? 0).toString();

  let edgeBandCost = ($materials.edgeBandingCostPerMeter ?? 0).toString();
  let cutCost = ($materials.cutCostPerMeter ?? 0).toString();

  let sideGap = $advancedSettings.reveals.sideGap.toString();
  let verticalGap = $advancedSettings.reveals.verticalGap.toString();
  let centerGap = ($advancedSettings.reveals.centerGap ?? '').toString();
  let hiddenHandleReveal = $advancedSettings.reveals.hiddenHandleReveal.toString();
  let upperHandlelessOverhangExtra = $advancedSettings.reveals.upperHandlelessOverhangExtra.toString();
  let golaProfileHeight = $advancedSettings.reveals.golaProfileHeight.toString();

  let insetOffset = $advancedSettings.backs.insetOffset.toString();
  let insetDadoDepth = $advancedSettings.backs.insetDadoDepth.toString();
  let insetDadoClearance = $advancedSettings.backs.insetDadoClearance.toString();
  let insetOversizeFull = $advancedSettings.backs.insetOversizeFull.toString();
  let insetOversizePartial = $advancedSettings.backs.insetOversizePartial.toString();
  let rabbetWidth = $advancedSettings.backs.rabbetWidth.toString();
  let rabbetDepth = $advancedSettings.backs.rabbetDepth.toString();
  let rabbetClearance = $advancedSettings.backs.rabbetClearance.toString();

  let splitTopRailDepth = $advancedSettings.construction.splitTopRailDepth.toString();
  let shelfDepthSetback = $advancedSettings.shelves.depthSetback.toString();

  let sliderLengths = $advancedSettings.drawers.sliderLengths.join(', ');
  let railHeights = $advancedSettings.drawers.railHeights.map(r => r.rail).join(', ');
  let railBackHeights = $advancedSettings.drawers.railHeights.map(r => r.backHeight).join(', ');
  let defaultSliderLength = $advancedSettings.drawers.defaults.sliderLength.toString();
  let defaultRailHeight = $advancedSettings.drawers.defaults.railHeight.toString();

  let standardSideClearance = $advancedSettings.drawers.standard.sideClearanceTotal.toString();
  let standardBottomClearance = $advancedSettings.drawers.standard.bottomDepthClearance.toString();
  let standardSideHeightReduction = $advancedSettings.drawers.standard.sideHeightReduction.toString();

  let metaboxWidthClearance = $advancedSettings.drawers.metabox.widthClearance.toString();
  let metaboxDepthClearance = $advancedSettings.drawers.metabox.depthClearance.toString();
  let metaboxFrontSetback = $advancedSettings.drawers.metabox.defaultFrontSetback.toString();

  let vertexWidthClearance = $advancedSettings.drawers.vertex.widthClearance.toString();
  let vertexBackWidthClearance = $advancedSettings.drawers.vertex.backWidthClearance.toString();
  let vertexDepthShorten = $advancedSettings.drawers.vertex.depthShorten.toString();

  let ovenCavityHeight = $advancedSettings.oven.cavityHeight.toString();
  let ovenRequiredWidth = $advancedSettings.oven.requiredWidth.toString();
  let ovenMinDepth = $advancedSettings.oven.minDepth.toString();
  let ovenMinDrawerHeight = $advancedSettings.oven.minDrawerHeight.toString();
  let ovenFaceHeightClearance = $advancedSettings.oven.faceHeightClearance.toString();

  const save = () => {
    materials.set({
      corpus: {
        name: corpusName,
        thickness: numberOr(corpusThickness, 18),
        cost: numberOr(corpusCost, 0)
      },
      front: {
        name: frontName,
        thickness: numberOr(frontThickness, 19),
        cost: numberOr(frontCost, 0)
      },
      back: {
        name: backName,
        thickness: numberOr(backThickness, 3),
        cost: numberOr(backCost, 0)
      },
      drawer: {
        name: drawerName,
        thickness: numberOr(drawerThickness, 16),
        cost: numberOr(drawerCost, 0)
      },
      edgeBandingCostPerMeter: numberOr(edgeBandCost, 0),
      cutCostPerMeter: numberOr(cutCost, 0)
    });

    room.set({
      width: numberOr(roomWidth, 0) * 10,
      depth: numberOr(roomDepth, 0) * 10,
      height: numberOr(roomHeight, 0) * 10
    });

    const sliderList = numberList(sliderLengths);
    const railHeightsList = numberList(railHeights);
    const railBackHeightsList = numberList(railBackHeights);
    const pairCount = Math.min(railHeightsList.length, railBackHeightsList.length);
    const pairedRails =
      pairCount > 0
        ? railHeightsList.slice(0, pairCount).map((rail, idx) => ({ rail, backHeight: railBackHeightsList[idx] }))
        : $advancedSettings.drawers.railHeights;

    advancedSettings.set({
      ...$advancedSettings,
      reveals: {
        sideGap: numberOr(sideGap, $advancedSettings.reveals.sideGap),
        verticalGap: numberOr(verticalGap, $advancedSettings.reveals.verticalGap),
        centerGap: centerGap === '' ? undefined : numberOr(centerGap, $advancedSettings.reveals.centerGap ?? $advancedSettings.reveals.verticalGap * 2),
        hiddenHandleReveal: numberOr(hiddenHandleReveal, $advancedSettings.reveals.hiddenHandleReveal),
        upperHandlelessOverhangExtra: numberOr(upperHandlelessOverhangExtra, $advancedSettings.reveals.upperHandlelessOverhangExtra),
        golaProfileHeight: numberOr(golaProfileHeight, $advancedSettings.reveals.golaProfileHeight)
      },
      backs: {
        insetOffset: numberOr(insetOffset, $advancedSettings.backs.insetOffset),
        insetDadoDepth: numberOr(insetDadoDepth, $advancedSettings.backs.insetDadoDepth),
        insetDadoClearance: numberOr(insetDadoClearance, $advancedSettings.backs.insetDadoClearance),
        insetOversizeFull: numberOr(insetOversizeFull, $advancedSettings.backs.insetOversizeFull),
        insetOversizePartial: numberOr(insetOversizePartial, $advancedSettings.backs.insetOversizePartial),
        rabbetWidth: numberOr(rabbetWidth, $advancedSettings.backs.rabbetWidth),
        rabbetDepth: numberOr(rabbetDepth, $advancedSettings.backs.rabbetDepth),
        rabbetClearance: numberOr(rabbetClearance, $advancedSettings.backs.rabbetClearance)
      },
      construction: {
        splitTopRailDepth: numberOr(splitTopRailDepth, $advancedSettings.construction.splitTopRailDepth)
      },
      shelves: {
        depthSetback: numberOr(shelfDepthSetback, $advancedSettings.shelves.depthSetback)
      },
      drawers: {
        ...$advancedSettings.drawers,
        sliderLengths: sliderList.length ? sliderList : $advancedSettings.drawers.sliderLengths,
        railHeights: pairedRails,
        defaults: {
          sliderLength: numberOr(defaultSliderLength, $advancedSettings.drawers.defaults.sliderLength),
          railHeight: numberOr(defaultRailHeight, $advancedSettings.drawers.defaults.railHeight)
        },
        standard: {
          sideClearanceTotal: numberOr(standardSideClearance, $advancedSettings.drawers.standard.sideClearanceTotal),
          bottomDepthClearance: numberOr(standardBottomClearance, $advancedSettings.drawers.standard.bottomDepthClearance),
          sideHeightReduction: numberOr(standardSideHeightReduction, $advancedSettings.drawers.standard.sideHeightReduction)
        },
        metabox: {
          widthClearance: numberOr(metaboxWidthClearance, $advancedSettings.drawers.metabox.widthClearance),
          depthClearance: numberOr(metaboxDepthClearance, $advancedSettings.drawers.metabox.depthClearance),
          defaultFrontSetback: numberOr(metaboxFrontSetback, $advancedSettings.drawers.metabox.defaultFrontSetback)
        },
        vertex: {
          widthClearance: numberOr(vertexWidthClearance, $advancedSettings.drawers.vertex.widthClearance),
          backWidthClearance: numberOr(vertexBackWidthClearance, $advancedSettings.drawers.vertex.backWidthClearance),
          depthShorten: numberOr(vertexDepthShorten, $advancedSettings.drawers.vertex.depthShorten)
        }
      },
      oven: {
        cavityHeight: numberOr(ovenCavityHeight, $advancedSettings.oven.cavityHeight),
        requiredWidth: numberOr(ovenRequiredWidth, $advancedSettings.oven.requiredWidth),
        minDepth: numberOr(ovenMinDepth, $advancedSettings.oven.minDepth),
        minDrawerHeight: numberOr(ovenMinDrawerHeight, $advancedSettings.oven.minDrawerHeight),
        faceHeightClearance: numberOr(ovenFaceHeightClearance, $advancedSettings.oven.faceHeightClearance)
      }
    });

    dispatch('close');
  };
</script>

<div class="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-10">
  <div class="mx-auto flex max-w-6xl flex-col gap-6">
    <div class="flex flex-col gap-2">
      <h3 class="text-2xl font-semibold">{$t('Project Settings')}</h3>
      <p class="text-sm text-gray-600">
        {$t('Tune the room envelope and the materials you are pricing against. Grouped sections keep the difference between cabinet box, fronts, backs, and drawers clear.')}
      </p>
    </div>

    <section class="rounded-lg border bg-white p-5 shadow">
      <div class="mb-4 flex items-start justify-between gap-4">
        <div>
          <h4 class="text-lg font-semibold">{$t('Room envelope')}</h4>
          <p class="text-sm text-gray-600">
            {$t('Define the overall footprint you are designing for. Values are stored in centimeters for quick edits and converted back to millimeters for calculations.')}
          </p>
        </div>
        <span class="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">cm</span>
      </div>
      <div class="grid gap-4 md:grid-cols-3">
        <label class="space-y-1 text-sm font-medium text-gray-700">
          {$t('Width')}
          <input
            class="w-full rounded border px-3 py-2 text-sm"
            type="number"
            min="0"
            step="1"
            bind:value={roomWidth}
            placeholder={$t('e.g. 400')}
          />
        </label>
        <label class="space-y-1 text-sm font-medium text-gray-700">
          {$t('Depth')}
          <input
            class="w-full rounded border px-3 py-2 text-sm"
            type="number"
            min="0"
            step="1"
            bind:value={roomDepth}
            placeholder={$t('e.g. 300')}
          />
        </label>
        <label class="space-y-1 text-sm font-medium text-gray-700">
          {$t('Height')}
          <input
            class="w-full rounded border px-3 py-2 text-sm"
            type="number"
            min="0"
            step="1"
            bind:value={roomHeight}
            placeholder={$t('e.g. 250')}
          />
        </label>
      </div>
    </section>

    <section class="rounded-lg border bg-white p-5 shadow space-y-4">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h4 class="text-lg font-semibold">{$t('Panel materials')}</h4>
          <p class="text-sm text-gray-600">
            {$t('Name and size the components that make up your cabinets. Keep the display name friendly while the thickness drives cut lists and clearances.')}
          </p>
        </div>
        <span class="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">mm</span>
      </div>
      <div class="grid gap-4 md:grid-cols-2">
        <div class="rounded border bg-slate-50 p-4 shadow-inner">
          <div class="mb-2">
            <h5 class="font-semibold">{$t('Cabinet box (corpus)')}</h5>
            <p class="text-sm text-gray-600">{$t('Side panels, bottoms, and tops for the carcass.')}</p>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="space-y-1 text-sm font-medium text-gray-700">
              {$t('Display name')}
              <input class="w-full rounded border px-3 py-2 text-sm" type="text" bind:value={corpusName} />
            </label>
            <label class="space-y-1 text-sm font-medium text-gray-700">
              {$t('Panel thickness')}
              <input
                class="w-full rounded border px-3 py-2 text-sm"
                type="number"
                min="0"
                step="0.1"
                bind:value={corpusThickness}
              />
            </label>
            <label class="space-y-1 text-sm font-medium text-gray-700 sm:col-span-2">
              {$t('Material cost (per m²)')}
              <input
                class="w-full rounded border px-3 py-2 text-sm"
                type="number"
                min="0"
                step="0.01"
                bind:value={corpusCost}
              />
            </label>
          </div>
        </div>

        <div class="rounded border bg-slate-50 p-4 shadow-inner">
          <div class="mb-2">
            <h5 class="font-semibold">{$t('Fronts')}</h5>
            <p class="text-sm text-gray-600">{$t('Doors or drawer fronts visible to the user.')}</p>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="space-y-1 text-sm font-medium text-gray-700">
              {$t('Display name')}
              <input class="w-full rounded border px-3 py-2 text-sm" type="text" bind:value={frontName} />
            </label>
            <label class="space-y-1 text-sm font-medium text-gray-700">
              {$t('Panel thickness')}
              <input
                class="w-full rounded border px-3 py-2 text-sm"
                type="number"
                min="0"
                step="0.1"
                bind:value={frontThickness}
              />
            </label>
            <label class="space-y-1 text-sm font-medium text-gray-700 sm:col-span-2">
              {$t('Material cost (per m²)')}
              <input
                class="w-full rounded border px-3 py-2 text-sm"
                type="number"
                min="0"
                step="0.01"
                bind:value={frontCost}
              />
            </label>
          </div>
        </div>

        <div class="rounded border bg-slate-50 p-4 shadow-inner">
          <div class="mb-2">
            <h5 class="font-semibold">{$t('Backs')}</h5>
            <p class="text-sm text-gray-600">{$t('Thin panels for cabinet backs or drawer bottoms.')}</p>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="space-y-1 text-sm font-medium text-gray-700">
              {$t('Display name')}
              <input class="w-full rounded border px-3 py-2 text-sm" type="text" bind:value={backName} />
            </label>
            <label class="space-y-1 text-sm font-medium text-gray-700">
              {$t('Panel thickness')}
              <input
                class="w-full rounded border px-3 py-2 text-sm"
                type="number"
                min="0"
                step="0.1"
                bind:value={backThickness}
              />
            </label>
            <label class="space-y-1 text-sm font-medium text-gray-700 sm:col-span-2">
              {$t('Material cost (per m²)')}
              <input
                class="w-full rounded border px-3 py-2 text-sm"
                type="number"
                min="0"
                step="0.01"
                bind:value={backCost}
              />
            </label>
          </div>
        </div>

        <div class="rounded border bg-slate-50 p-4 shadow-inner">
          <div class="mb-2">
            <h5 class="font-semibold">{$t('Drawer boxes')}</h5>
            <p class="text-sm text-gray-600">{$t('Sides and fronts that make up drawer internals.')}</p>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="space-y-1 text-sm font-medium text-gray-700">
              {$t('Display name')}
              <input class="w-full rounded border px-3 py-2 text-sm" type="text" bind:value={drawerName} />
            </label>
            <label class="space-y-1 text-sm font-medium text-gray-700">
              {$t('Panel thickness')}
              <input
                class="w-full rounded border px-3 py-2 text-sm"
                type="number"
                min="0"
                step="0.1"
                bind:value={drawerThickness}
              />
            </label>
            <label class="space-y-1 text-sm font-medium text-gray-700 sm:col-span-2">
              {$t('Material cost (per m²)')}
              <input
                class="w-full rounded border px-3 py-2 text-sm"
                type="number"
                min="0"
                step="0.01"
                bind:value={drawerCost}
              />
            </label>
          </div>
        </div>
      </div>
    </section>

    <section class="rounded-lg border bg-white p-5 shadow">
      <div class="mb-3">
        <h4 class="text-lg font-semibold">{$t('Edge & fabrication costs')}</h4>
        <p class="text-sm text-gray-600">
          {$t('Capture per-meter operations so pricing reflects edge banding and cutting labor.')}
        </p>
      </div>
      <div class="grid gap-4 md:grid-cols-2">
        <label class="space-y-1 text-sm font-medium text-gray-700">
          {$t('Edge banding (per m)')}
          <input
            class="w-full rounded border px-3 py-2 text-sm"
            type="number"
            min="0"
            step="0.01"
            bind:value={edgeBandCost}
          />
        </label>
        <label class="space-y-1 text-sm font-medium text-gray-700">
          {$t('Cutting (per m)')}
          <input
            class="w-full rounded border px-3 py-2 text-sm"
            type="number"
            min="0"
            step="0.01"
            bind:value={cutCost}
          />
        </label>
      </div>
    </section>

    <section class="rounded-lg border bg-white p-5 shadow space-y-5">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h4 class="text-lg font-semibold">{$t('Advanced construction settings')}</h4>
          <p class="text-sm text-gray-600">
            {$t('Expose every clearance, reveal, and hardware assumption so you can match shop standards without code edits. Defaults mirror the current behavior.')}
          </p>
        </div>
        <span class="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">mm</span>
      </div>

      <div class="grid gap-4 xl:grid-cols-2">
        <div class="rounded border bg-slate-50 p-4 shadow-inner space-y-3">
          <div>
            <h5 class="font-semibold">{$t('Reveals & fronts')}</h5>
            <p class="text-sm text-gray-600">{$t('Control how much air sits around doors and drawers, including handleless reveals.')}</p>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="space-y-1 text-sm font-medium text-gray-700">
              {$t('Side gap per face')}
              <input class="w-full rounded border px-3 py-2 text-sm" type="number" step="0.1" bind:value={sideGap} />
              <p class="text-xs text-gray-500">{$t('Applied to both sides of doors and drawer faces.')}</p>
            </label>
            <label class="space-y-1 text-sm font-medium text-gray-700">
              {$t('Vertical gap per joint')}
              <input class="w-full rounded border px-3 py-2 text-sm" type="number" step="0.1" bind:value={verticalGap} />
              <p class="text-xs text-gray-500">{$t('Top/bottom reveal for doors and between stacked drawers.')}</p>
            </label>
            <label class="space-y-1 text-sm font-medium text-gray-700">
              {$t('Center gap between paired doors')}
              <input class="w-full rounded border px-3 py-2 text-sm" type="number" step="0.1" bind:value={centerGap} placeholder={$t('Defaults to 2 × vertical gap')} />
              <p class="text-xs text-gray-500">{$t('Leave blank to use 2 × vertical gap automatically.')}</p>
            </label>
            <label class="space-y-1 text-sm font-medium text-gray-700">
              {$t('Handleless reveal (base)')}
              <input class="w-full rounded border px-3 py-2 text-sm" type="number" step="0.1" bind:value={hiddenHandleReveal} />
              <p class="text-xs text-gray-500">{$t('Total vertical reduction for gola or J-pull bases.')}</p>
            </label>
            <label class="space-y-1 text-sm font-medium text-gray-700">
              {$t('Upper handleless overhang bonus')}
              <input class="w-full rounded border px-3 py-2 text-sm" type="number" step="0.1" bind:value={upperHandlelessOverhangExtra} />
              <p class="text-xs text-gray-500">{$t('Added on top of corpus thickness for handleless uppers.')}</p>
            </label>
            <label class="space-y-1 text-sm font-medium text-gray-700">
              {$t('Gola/profile height')}
              <input class="w-full rounded border px-3 py-2 text-sm" type="number" step="0.1" bind:value={golaProfileHeight} />
            </label>
          </div>
        </div>

        <div class="rounded border bg-slate-50 p-4 shadow-inner space-y-3">
          <div>
            <h5 class="font-semibold">{$t('Backs & carcass layout')}</h5>
            <p class="text-sm text-gray-600">{$t('Tune inset/rabbet backs and split top rail dimensions.')}</p>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="space-y-1 text-sm font-medium text-gray-700">
              {$t('Inset back offset')}
              <input class="w-full rounded border px-3 py-2 text-sm" type="number" step="0.1" bind:value={insetOffset} />
            </label>
            <label class="space-y-1 text-sm font-medium text-gray-700">
              {$t('Inset dado depth')}
              <input class="w-full rounded border px-3 py-2 text-sm" type="number" step="0.1" bind:value={insetDadoDepth} />
            </label>
            <label class="space-y-1 text-sm font-medium text-gray-700">
              {$t('Inset dado clearance')}
              <input class="w-full rounded border px-3 py-2 text-sm" type="number" step="0.1" bind:value={insetDadoClearance} />
            </label>
            <label class="space-y-1 text-sm font-medium text-gray-700">
              {$t('Inset oversize (full box)')}
              <input class="w-full rounded border px-3 py-2 text-sm" type="number" step="0.1" bind:value={insetOversizeFull} />
            </label>
            <label class="space-y-1 text-sm font-medium text-gray-700">
              {$t('Inset oversize (split top)')}
              <input class="w-full rounded border px-3 py-2 text-sm" type="number" step="0.1" bind:value={insetOversizePartial} />
            </label>
            <label class="space-y-1 text-sm font-medium text-gray-700">
              {$t('Rabbet width')}
              <input class="w-full rounded border px-3 py-2 text-sm" type="number" step="0.1" bind:value={rabbetWidth} />
            </label>
            <label class="space-y-1 text-sm font-medium text-gray-700">
              {$t('Rabbet depth')}
              <input class="w-full rounded border px-3 py-2 text-sm" type="number" step="0.1" bind:value={rabbetDepth} />
            </label>
            <label class="space-y-1 text-sm font-medium text-gray-700">
              {$t('Rabbet clearance')}
              <input class="w-full rounded border px-3 py-2 text-sm" type="number" step="0.1" bind:value={rabbetClearance} />
            </label>
            <label class="space-y-1 text-sm font-medium text-gray-700">
              {$t('Split top rail depth')}
              <input class="w-full rounded border px-3 py-2 text-sm" type="number" step="0.1" bind:value={splitTopRailDepth} />
            </label>
            <label class="space-y-1 text-sm font-medium text-gray-700">
              {$t('Shelf depth setback')}
              <input class="w-full rounded border px-3 py-2 text-sm" type="number" step="0.1" bind:value={shelfDepthSetback} />
            </label>
          </div>
        </div>
      </div>

      <div class="grid gap-4 xl:grid-cols-2">
        <div class="rounded border bg-slate-50 p-4 shadow-inner space-y-3">
          <div>
            <h5 class="font-semibold">{$t('Drawer hardware defaults')}</h5>
            <p class="text-sm text-gray-600">{$t('Available slide lengths and rail height/back height pairs for metal drawers.')}</p>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="space-y-1 text-sm font-medium text-gray-700">
              {$t('Slide lengths (comma list)')}
              <input class="w-full rounded border px-3 py-2 text-sm" type="text" bind:value={sliderLengths} />
            </label>
            <label class="space-y-1 text-sm font-medium text-gray-700">
              {$t('Rail heights (comma list)')}
              <input class="w-full rounded border px-3 py-2 text-sm" type="text" bind:value={railHeights} />
            </label>
            <label class="space-y-1 text-sm font-medium text-gray-700">
              {$t('Back heights (matching order)')}
              <input class="w-full rounded border px-3 py-2 text-sm" type="text" bind:value={railBackHeights} />
            </label>
            <label class="space-y-1 text-sm font-medium text-gray-700">
              {$t('Default slide length')}
              <input class="w-full rounded border px-3 py-2 text-sm" type="number" step="1" bind:value={defaultSliderLength} />
            </label>
            <label class="space-y-1 text-sm font-medium text-gray-700">
              {$t('Default rail height')}
              <input class="w-full rounded border px-3 py-2 text-sm" type="number" step="1" bind:value={defaultRailHeight} />
            </label>
          </div>
        </div>

        <div class="rounded border bg-slate-50 p-4 shadow-inner space-y-4">
          <div>
            <h5 class="font-semibold">{$t('Drawer system allowances')}</h5>
            <p class="text-sm text-gray-600">{$t('Clearances for wooden boxes and metal systems.')}</p>
          </div>
          <div class="space-y-3">
            <div class="rounded border bg-white p-3 shadow-sm">
              <p class="text-sm font-semibold text-gray-800 mb-2">{$t('Wood drawer box')}</p>
              <div class="grid gap-3 sm:grid-cols-3">
                <label class="space-y-1 text-sm font-medium text-gray-700">
                  {$t('Side clearance total')}
                  <input class="w-full rounded border px-3 py-2 text-sm" type="number" step="0.1" bind:value={standardSideClearance} />
                </label>
                <label class="space-y-1 text-sm font-medium text-gray-700">
                  {$t('Depth setback')}
                  <input class="w-full rounded border px-3 py-2 text-sm" type="number" step="0.1" bind:value={standardBottomClearance} />
                </label>
                <label class="space-y-1 text-sm font-medium text-gray-700">
                  {$t('Side/back height reduction')}
                  <input class="w-full rounded border px-3 py-2 text-sm" type="number" step="0.1" bind:value={standardSideHeightReduction} />
                </label>
              </div>
            </div>

            <div class="rounded border bg-white p-3 shadow-sm">
              <p class="text-sm font-semibold text-gray-800 mb-2">{$t('Metabox')}</p>
              <div class="grid gap-3 sm:grid-cols-3">
                <label class="space-y-1 text-sm font-medium text-gray-700">
                  {$t('Width clearance')}
                  <input class="w-full rounded border px-3 py-2 text-sm" type="number" step="0.1" bind:value={metaboxWidthClearance} />
                </label>
                <label class="space-y-1 text-sm font-medium text-gray-700">
                  {$t('Depth clearance')}
                  <input class="w-full rounded border px-3 py-2 text-sm" type="number" step="0.1" bind:value={metaboxDepthClearance} />
                </label>
                <label class="space-y-1 text-sm font-medium text-gray-700">
                  {$t('Front setback when inferring slide')}
                  <input class="w-full rounded border px-3 py-2 text-sm" type="number" step="0.1" bind:value={metaboxFrontSetback} />
                </label>
              </div>
            </div>

            <div class="rounded border bg-white p-3 shadow-sm">
              <p class="text-sm font-semibold text-gray-800 mb-2">{$t('Vertex')}</p>
              <div class="grid gap-3 sm:grid-cols-3">
                <label class="space-y-1 text-sm font-medium text-gray-700">
                  {$t('Width clearance')}
                  <input class="w-full rounded border px-3 py-2 text-sm" type="number" step="0.1" bind:value={vertexWidthClearance} />
                </label>
                <label class="space-y-1 text-sm font-medium text-gray-700">
                  {$t('Back width clearance')}
                  <input class="w-full rounded border px-3 py-2 text-sm" type="number" step="0.1" bind:value={vertexBackWidthClearance} />
                </label>
                <label class="space-y-1 text-sm font-medium text-gray-700">
                  {$t('Slide shortening')}
                  <input class="w-full rounded border px-3 py-2 text-sm" type="number" step="0.1" bind:value={vertexDepthShorten} />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded border bg-slate-50 p-4 shadow-inner space-y-3">
        <div>
          <h5 class="font-semibold">{$t('Oven cutout')}</h5>
          <p class="text-sm text-gray-600">{$t('Dimensions that drive the oven cabinet cavity and lower drawer face.')}</p>
        </div>
        <div class="grid gap-3 sm:grid-cols-3">
          <label class="space-y-1 text-sm font-medium text-gray-700">
            {$t('Cavity height')}
            <input class="w-full rounded border px-3 py-2 text-sm" type="number" step="1" bind:value={ovenCavityHeight} />
          </label>
          <label class="space-y-1 text-sm font-medium text-gray-700">
            {$t('Required cabinet width')}
            <input class="w-full rounded border px-3 py-2 text-sm" type="number" step="1" bind:value={ovenRequiredWidth} />
          </label>
          <label class="space-y-1 text-sm font-medium text-gray-700">
            {$t('Minimum cabinet depth')}
            <input class="w-full rounded border px-3 py-2 text-sm" type="number" step="1" bind:value={ovenMinDepth} />
          </label>
          <label class="space-y-1 text-sm font-medium text-gray-700">
            {$t('Minimum drawer height')}
            <input class="w-full rounded border px-3 py-2 text-sm" type="number" step="1" bind:value={ovenMinDrawerHeight} />
          </label>
          <label class="space-y-1 text-sm font-medium text-gray-700">
            {$t('Drawer face clearance under oven')}
            <input class="w-full rounded border px-3 py-2 text-sm" type="number" step="0.1" bind:value={ovenFaceHeightClearance} />
          </label>
        </div>
      </div>
    </section>

    <div class="rounded-lg border bg-white p-4 shadow flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p class="text-sm text-gray-600">
        {$t('Save to immediately apply dimensions and rates to cabinet calculations.')}
      </p>
      <button class="px-4 py-2 rounded bg-blue-600 text-white shadow-sm" on:click={save}>{$t('Save changes')}</button>
    </div>
  </div>
</div>
