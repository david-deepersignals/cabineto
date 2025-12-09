import { writable } from 'svelte/store';

export interface RailHeightSetting {
  rail: number;
  backHeight: number;
}

export interface AdvancedSettingsState {
  reveals: {
    /** Gap on each side of doors and drawer faces */
    sideGap: number;
    /** Gap above and below faces (also between stacked drawers) */
    verticalGap: number;
    /** Gap between doors that meet in the center; if unset, defaults to 2x verticalGap */
    centerGap?: number;
    /** Handleless pull reveal for base cabinets */
    hiddenHandleReveal: number;
    /** Extra overhang above corpus thickness for handleless uppers */
    upperHandlelessOverhangExtra: number;
    /** Profile height used when a gola/handleless rail sits above a drawer */
    golaProfileHeight: number;
  };
  backs: {
    insetOffset: number;
    insetDadoDepth: number;
    insetDadoClearance: number;
    insetOversizeFull: number;
    insetOversizePartial: number;
    rabbetWidth: number;
    rabbetDepth: number;
    rabbetClearance: number;
  };
  construction: {
    splitTopRailDepth: number;
  };
  shelves: {
    depthSetback: number;
  };
  drawers: {
    sliderLengths: number[];
    railHeights: RailHeightSetting[];
    defaults: {
      sliderLength: number;
      railHeight: number;
    };
    standard: {
      sideClearanceTotal: number;
      bottomDepthClearance: number;
      sideHeightReduction: number;
    };
    metabox: {
      widthClearance: number;
      depthClearance: number;
      defaultFrontSetback: number;
    };
    vertex: {
      widthClearance: number;
      backWidthClearance: number;
      depthShorten: number;
    };
  };
  oven: {
    cavityHeight: number;
    requiredWidth: number;
    minDepth: number;
    minDrawerHeight: number;
    faceHeightClearance: number;
  };
}

export const defaultAdvancedSettings: AdvancedSettingsState = {
  reveals: {
    sideGap: 2,
    verticalGap: 2,
    centerGap: 4,
    hiddenHandleReveal: 30,
    upperHandlelessOverhangExtra: 2,
    golaProfileHeight: 48.2
  },
  backs: {
    insetOffset: 15,
    insetDadoDepth: 7,
    insetDadoClearance: 1,
    insetOversizeFull: 12,
    insetOversizePartial: 5,
    rabbetWidth: 9,
    rabbetDepth: 4,
    rabbetClearance: 1
  },
  construction: {
    splitTopRailDepth: 100
  },
  shelves: {
    depthSetback: 20
  },
  drawers: {
    sliderLengths: [270, 320, 350, 400, 450, 500, 550],
    railHeights: [
      { rail: 93, backHeight: 63 },
      { rail: 131, backHeight: 101 },
      { rail: 178, backHeight: 148 }
    ],
    defaults: {
      sliderLength: 400,
      railHeight: 131
    },
    standard: {
      sideClearanceTotal: 24,
      bottomDepthClearance: 20,
      sideHeightReduction: 30
    },
    metabox: {
      widthClearance: 31,
      depthClearance: 42,
      defaultFrontSetback: 30
    },
    vertex: {
      widthClearance: 19,
      backWidthClearance: 42,
      depthShorten: 10
    }
  },
  oven: {
    cavityHeight: 600,
    requiredWidth: 600,
    minDepth: 560,
    minDrawerHeight: 140,
    faceHeightClearance: 2
  }
};

export const advancedSettings = writable<AdvancedSettingsState>(defaultAdvancedSettings);

export const buildRailHeightMap = (railHeights: RailHeightSetting[]): Record<number, number> =>
  railHeights.reduce<Record<number, number>>((acc, entry) => {
    acc[entry.rail] = entry.backHeight;
    return acc;
  }, {});

export const getCenterGap = (reveals: AdvancedSettingsState['reveals']) =>
  reveals.centerGap ?? reveals.verticalGap * 2;
