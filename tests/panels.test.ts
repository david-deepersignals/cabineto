import { beforeEach, describe, expect, it } from 'vitest';
import { Corpus } from '../src/cabinet/Corpus';
import { DrawerCabinet } from '../src/cabinet/DrawerCabinet';
import { DoorCabinet } from '../src/cabinet/DoorCabinet';
import { UpperCabinet } from '../src/cabinet/UpperCabinet';
import { CornerCabinet } from '../src/cabinet/CornerCabinet';
import { OvenCabinet } from '../src/cabinet/OvenCabinet';
import { createDrawerPanels } from '../src/cabinet/drawerHelper';
import { defaultAdvancedSettings } from '../src/stores/advancedSettings';
import { findPanel, normalizePanels, resetMaterials } from './panelTestUtils';

const ADV = defaultAdvancedSettings;
const BACK_INSET_OFFSET = ADV.backs.insetOffset;
const RABBET_WIDTH = ADV.backs.rabbetWidth;
const RABBET_DEPTH = ADV.backs.rabbetDepth;
const METABOX_WIDTH_CLEARANCE = ADV.drawers.metabox.widthClearance;
const METABOX_DEPTH_CLEARANCE = ADV.drawers.metabox.depthClearance;
const HIDDEN_HANDEL_REVEAL = ADV.reveals.hiddenHandleReveal;

class TestCorpus extends Corpus {
  validate(): boolean {
    return true;
  }
}

beforeEach(() => {
  resetMaterials();
});

describe('Corpus panel calculations', () => {
  it('builds flush-back panel set with correct banding', () => {
    const corpus = new TestCorpus('C1', 800, 720, 560);
    const panels = normalizePanels(corpus.panels());

    expect(panels).toEqual([
      {
        label: 'C1-> Side panel',
        length: 720,
        width: 560,
        quantity: 2,
        edgeBandingLengthRight: 1,
        edgeBandingLengthLeft: 0,
        edgeBandingWidthBottom: 1,
        edgeBandingWidthTop: 1,
        hingeLocation: '',
        material: 'Corpus',
        materialThickness: 18,
      },
      {
        label: 'C1-> Bottom panel',
        length: 764,
        width: 560,
        quantity: 1,
        edgeBandingLengthRight: 1,
        edgeBandingLengthLeft: 0,
        edgeBandingWidthBottom: 0,
        edgeBandingWidthTop: 0,
        hingeLocation: '',
        material: 'Corpus',
        materialThickness: 18,
      },
      {
        label: 'C1-> Top panel plank rear',
        length: 764,
        width: 100,
        quantity: 1,
        edgeBandingLengthRight: 1,
        edgeBandingLengthLeft: 0,
        edgeBandingWidthBottom: 0,
        edgeBandingWidthTop: 0,
        hingeLocation: '',
        material: 'Corpus',
        materialThickness: 18,
      },
      {
        label: 'C1-> Top panel plank front',
        length: 764,
        width: 100,
        quantity: 1,
        edgeBandingLengthRight: 1,
        edgeBandingLengthLeft: 1,
        edgeBandingWidthBottom: 0,
        edgeBandingWidthTop: 0,
        hingeLocation: '',
        material: 'Corpus',
        materialThickness: 18,
      },
      {
        label: 'C1-> Back panel',
        length: 764,
        width: 684,
        quantity: 1,
        edgeBandingLengthRight: 0,
        edgeBandingLengthLeft: 0,
        edgeBandingWidthBottom: 0,
        edgeBandingWidthTop: 0,
        hingeLocation: '',
        material: 'Back',
        materialThickness: 3,
      },
    ]);
  });

  it('adds dados and oversize back when inset', () => {
    const corpus = new TestCorpus('C2', 800, 720, 560, 'corpus', { insetBack: true });
    const panels = normalizePanels(corpus.panels());
    const dado = { offset: BACK_INSET_OFFSET, depth: 7, width: 4 };

    expect(panels).toEqual([
      {
        label: 'C2-> Side panel',
        length: 720,
        width: 560,
        quantity: 2,
        edgeBandingLengthRight: 1,
        edgeBandingLengthLeft: 0,
        edgeBandingWidthBottom: 1,
        edgeBandingWidthTop: 1,
        hingeLocation: '',
        material: 'Corpus',
        materialThickness: 18,
        dados: [dado],
      },
      {
        label: 'C2-> Bottom panel',
        length: 764,
        width: 560,
        quantity: 1,
        edgeBandingLengthRight: 1,
        edgeBandingLengthLeft: 0,
        edgeBandingWidthBottom: 0,
        edgeBandingWidthTop: 0,
        hingeLocation: '',
        material: 'Corpus',
        materialThickness: 18,
        dados: [dado],
      },
      {
        label: 'C2-> Top panel plank rear',
        length: 764,
        width: 100,
        quantity: 1,
        edgeBandingLengthRight: 1,
        edgeBandingLengthLeft: 0,
        edgeBandingWidthBottom: 0,
        edgeBandingWidthTop: 0,
        hingeLocation: '',
        material: 'Corpus',
        materialThickness: 18,
      },
      {
        label: 'C2-> Top panel plank front',
        length: 764,
        width: 100,
        quantity: 1,
        edgeBandingLengthRight: 1,
        edgeBandingLengthLeft: 1,
        edgeBandingWidthBottom: 0,
        edgeBandingWidthTop: 0,
        hingeLocation: '',
        material: 'Corpus',
        materialThickness: 18,
      },
      {
        label: 'C2-> Back panel',
        length: 776,
        width: 707,
        quantity: 1,
        edgeBandingLengthRight: 0,
        edgeBandingLengthLeft: 0,
        edgeBandingWidthBottom: 0,
        edgeBandingWidthTop: 0,
        hingeLocation: '',
        material: 'Back',
        materialThickness: 3,
      },
    ]);
  });

  it('adds rabbets and extended back panel when rabbeted', () => {
    const corpus = new TestCorpus('C3', 800, 720, 560, 'corpus', { rabbetBack: true });
    const panels = normalizePanels(corpus.panels());
    const rabbet = { edge: 'back', depth: RABBET_DEPTH, width: RABBET_WIDTH };

    expect(panels).toEqual([
      {
        label: 'C3-> Side panel',
        length: 720,
        width: 560,
        quantity: 2,
        edgeBandingLengthRight: 1,
        edgeBandingLengthLeft: 0,
        edgeBandingWidthBottom: 1,
        edgeBandingWidthTop: 1,
        hingeLocation: '',
        material: 'Corpus',
        materialThickness: 18,
        rabbets: [rabbet],
      },
      {
        label: 'C3-> Bottom panel',
        length: 764,
        width: 560,
        quantity: 1,
        edgeBandingLengthRight: 1,
        edgeBandingLengthLeft: 0,
        edgeBandingWidthBottom: 0,
        edgeBandingWidthTop: 0,
        hingeLocation: '',
        material: 'Corpus',
        materialThickness: 18,
        rabbets: [rabbet],
      },
      {
        label: 'C3-> Top panel plank rear',
        length: 764,
        width: 100,
        quantity: 1,
        edgeBandingLengthRight: 1,
        edgeBandingLengthLeft: 0,
        edgeBandingWidthBottom: 0,
        edgeBandingWidthTop: 0,
        hingeLocation: '',
        material: 'Corpus',
        materialThickness: 18,
        rabbets: [rabbet],
      },
      {
        label: 'C3-> Top panel plank front',
        length: 764,
        width: 100,
        quantity: 1,
        edgeBandingLengthRight: 1,
        edgeBandingLengthLeft: 1,
        edgeBandingWidthBottom: 0,
        edgeBandingWidthTop: 0,
        hingeLocation: '',
        material: 'Corpus',
        materialThickness: 18,
      },
      {
        label: 'C3-> Back panel',
        length: 780,
        width: 700,
        quantity: 1,
        edgeBandingLengthRight: 0,
        edgeBandingLengthLeft: 0,
        edgeBandingWidthBottom: 0,
        edgeBandingWidthTop: 0,
        hingeLocation: '',
        material: 'Back',
        materialThickness: 3,
      },
    ]);
  });

  it('handles full-height build with inset back and dados', () => {
    const corpus = new TestCorpus('C4', 900, 700, 560, 'corpus', { full: true, insetBack: true });
    const panels = normalizePanels(corpus.panels());
    const dado = { offset: BACK_INSET_OFFSET, depth: 7, width: 4 };

    expect(panels).toEqual([
      {
        label: 'C4-> Side panel',
        length: 700,
        width: 560,
        quantity: 2,
        edgeBandingLengthRight: 1,
        edgeBandingLengthLeft: 0,
        edgeBandingWidthBottom: 1,
        edgeBandingWidthTop: 1,
        hingeLocation: '',
        material: 'Corpus',
        materialThickness: 18,
        dados: [dado],
      },
      {
        label: 'C4-> Top/Bottom panel',
        length: 864,
        width: 560,
        quantity: 2,
        edgeBandingLengthRight: 1,
        edgeBandingLengthLeft: 0,
        edgeBandingWidthBottom: 0,
        edgeBandingWidthTop: 0,
        hingeLocation: '',
        material: 'Corpus',
        materialThickness: 18,
        dados: [dado],
      },
      {
        label: 'C4-> Back panel',
        length: 876,
        width: 676,
        quantity: 1,
        edgeBandingLengthRight: 0,
        edgeBandingLengthLeft: 0,
        edgeBandingWidthBottom: 0,
        edgeBandingWidthTop: 0,
        hingeLocation: '',
        material: 'Back',
        materialThickness: 3,
      },
    ]);
  });
});

describe('DrawerCabinet panels', () => {
  it('uses inset back clearances for standard drawers and dados on corpus panels', () => {
    const cab = new DrawerCabinet('D1', 600, 720, 560, 2, [60, 40], 'standard', 400, 131, { insetBack: true });
    const panels = cab.panels();
    const dado = { offset: BACK_INSET_OFFSET, depth: 7, width: 4 };

    expect(findPanel(panels, 'D1-> Side panel').dados).toEqual([dado]);
    expect(findPanel(panels, 'D1-> Bottom panel').dados).toEqual([dado]);
    expect(findPanel(panels, 'D1-> Back panel')).toMatchObject({ length: 576, width: 707 });

    const drawer1Face = findPanel(panels, 'D1-> Drawer 1 Face');
    expect(drawer1Face).toMatchObject({
      length: 428,
      width: 596,
      edgeBandingLengthRight: 1,
      edgeBandingLengthLeft: 1,
      edgeBandingWidthBottom: 1,
      edgeBandingWidthTop: 1,
      material: 'Front',
      materialThickness: 18,
    });

    const drawer1Bottom = findPanel(panels, 'D1-> Drawer 1 Bottom');
    expect(drawer1Bottom).toMatchObject({
      length: 540,
      width: 522,
      edgeBandingLengthRight: 0,
      edgeBandingLengthLeft: 0,
      edgeBandingWidthBottom: 0,
      edgeBandingWidthTop: 0,
      material: 'Drawer',
      materialThickness: 16,
    });

    const drawer1Back = findPanel(panels, 'D1-> Drawer 1 Back');
    expect(drawer1Back).toMatchObject({
      length: 508,
      width: 398,
      edgeBandingWidthTop: 1,
    });

    const drawer2Face = findPanel(panels, 'D1-> Drawer 2 Face');
    expect(drawer2Face).toMatchObject({ length: 286, width: 596 });
    expect(findPanel(panels, 'D1-> Drawer 2 Back')).toMatchObject({ length: 508, width: 256 });
  });

  it('uses rabbet depth clearance for drawer depths and propagates rabbets', () => {
    const cab = new DrawerCabinet('D2', 600, 720, 560, 1, [100], 'standard', 400, 131, { rabbetBack: true });
    const panels = cab.panels();
    const rabbet = { edge: 'back', depth: RABBET_DEPTH, width: RABBET_WIDTH };

    expect(findPanel(panels, 'D2-> Side panel').rabbets).toEqual([rabbet]);
    expect(findPanel(panels, 'D2-> Bottom panel').rabbets).toEqual([rabbet]);
    expect(findPanel(panels, 'D2-> Back panel')).toMatchObject({ length: 580, width: 700 });

    const face = findPanel(panels, 'D2-> Drawer 1 Face');
    expect(face.length).toBe(716);
    expect(face.width).toBe(596);

    const bottom = findPanel(panels, 'D2-> Drawer 1 Bottom');
    expect(bottom.length).toBe(540);
    expect(bottom.width).toBe(536);
  });
});

describe('drawerHelper variants', () => {
  it('calculates metabox drawer parts with fallback depth when no slider length provided', () => {
    const panels = createDrawerPanels({
      id: 'M1',
      index: 1,
      faceHeight: 300,
      faceWidth: 500,
      drawerSystem: 'metabox',
      internalCorpusWidth: 600,
      internalCorpusDepth: 550,
      railHeight: 178,
    });

    expect(findPanel(panels, 'M1-> Drawer 1 Bottom')).toMatchObject({
      length: 600 - METABOX_WIDTH_CLEARANCE,
      width: 550 - 30 - METABOX_DEPTH_CLEARANCE,
      material: 'Drawer',
      materialThickness: 16,
    });

    expect(findPanel(panels, 'M1-> Drawer 1 Back')).toMatchObject({
      length: 600 - METABOX_WIDTH_CLEARANCE,
      width: 148,
      edgeBandingWidthTop: 1,
    });
  });

  it('calculates vertex drawer geometry including slider allowance', () => {
    const panels = createDrawerPanels({
      id: 'V1',
      index: 1,
      faceHeight: 300,
      faceWidth: 500,
      drawerSystem: 'vertex',
      internalCorpusWidth: 564,
      internalCorpusDepth: 540,
      sliderLenght: 500,
      railHeight: 131,
    });

    expect(findPanel(panels, 'V1-> Drawer 1 Bottom')).toMatchObject({
      length: 545,
      width: 490,
    });

    expect(findPanel(panels, 'V1-> Drawer 1 Back')).toMatchObject({
      length: 522,
      width: 101,
      edgeBandingWidthTop: 1,
    });
  });
});

describe('DoorCabinet panels', () => {
  it('builds door and shelf panels with reveals', () => {
    const cab = new DoorCabinet('DC1', 900, 800, 560, 2, 1);
    const panels = cab.panels();
    const doors = panels.filter((p) => p.label === 'DC1-> Door');

    expect(doors).toHaveLength(2);
    doors.forEach((door) => {
      expect(door).toMatchObject({
        length: 796,
        width: 446,
        edgeBandingLengthRight: 1,
        edgeBandingLengthLeft: 1,
        edgeBandingWidthBottom: 1,
        edgeBandingWidthTop: 1,
        hingeLocation: '2xDUZ',
        material: 'Front',
        materialThickness: 18,
      });
    });

    expect(findPanel(panels, 'DC1-> Shelf')).toMatchObject({
      length: 864,
      width: 540,
      quantity: 1,
      edgeBandingLengthRight: 1,
      edgeBandingLengthLeft: 0,
      edgeBandingWidthBottom: 0,
      edgeBandingWidthTop: 0,
      material: 'Corpus',
      materialThickness: 18,
    });
  });

  it('reduces face height for base cabinets with hidden handles', () => {
    const cab = new DoorCabinet('DC2', 600, 720, 560, 1, 0, { hiddenHandles: true });
    const panels = cab.panels();
    const door = findPanel(panels, 'DC2-> Door');

    expect(door.length).toBe(716 - (HIDDEN_HANDEL_REVEAL - 4));
    expect(door.width).toBe(596);
  });
});

describe('UpperCabinet panels', () => {
  it('builds upper doors with tighter reveals', () => {
    const cab = new UpperCabinet('U1', 700, 360, 320, 2);
    const panels = cab.panels();
    const doors = panels.filter((p) => p.label === 'U1-> Door');

    expect(doors).toHaveLength(2);
    doors.forEach((door) => {
      expect(door).toMatchObject({
        length: 356,
        width: 346,
        hingeLocation: '2xDUZ',
        edgeBandingLengthRight: 1,
        edgeBandingLengthLeft: 1,
        edgeBandingWidthBottom: 1,
        edgeBandingWidthTop: 1,
      });
    });
  });
});

describe('CornerCabinet panels', () => {
  it('respects fixed side widths and hidden-handle height adjustments', () => {
    const cab = new CornerCabinet('CC1', 1000, 720, 560, 300, { hiddenHandles: true }, true);
    const panels = cab.panels();
    const door = findPanel(panels, 'CC1-> Door');
    const fixed = findPanel(panels, 'CC1-> Fixed side');

    expect(door).toMatchObject({
      length: 736,
      width: 696,
      hingeLocation: '2xDUZ',
      edgeBandingLengthRight: 1,
      edgeBandingLengthLeft: 1,
      edgeBandingWidthBottom: 1,
      edgeBandingWidthTop: 1,
    });

    expect(fixed).toMatchObject({
      length: 736,
      width: 300,
      edgeBandingLengthRight: 1,
      edgeBandingLengthLeft: 1,
      edgeBandingWidthBottom: 1,
      edgeBandingWidthTop: 1,
    });
  });
});

describe('OvenCabinet panels', () => {
  it('refuses inset or rabbet back configurations', () => {
    expect(() => new OvenCabinet('OVX', 600, 760, 580, 'metabox', 450, 131, { insetBack: true })).toThrow(
      'Oven cabinet cannot be inset or rabbet back'
    );
    expect(() => new OvenCabinet('OVX', 600, 760, 580, 'metabox', 450, 131, { rabbetBack: true })).toThrow(
      'Oven cabinet cannot be inset or rabbet back'
    );
  });

  it('adds drawer parts and shelf with correct clearances', () => {
    const cab = new OvenCabinet('OV1', 600, 760, 580, 'metabox', 450, 131);
    const panels = cab.panels();

    const drawerFace = findPanel(panels, 'OV1-> Drawer 1 Face');
    expect(drawerFace).toMatchObject({ length: 158, width: 596 });

    const drawerBottom = findPanel(panels, 'OV1-> Drawer 1 Bottom');
    expect(drawerBottom).toMatchObject({ length: 533, width: 408 });

    expect(findPanel(panels, 'OV1-> Drawer 1 Back')).toMatchObject({ length: 533, width: 101, edgeBandingWidthTop: 1 });

    expect(findPanel(panels, 'OV1-> Oven Shelf')).toMatchObject({
      length: 564,
      width: 580,
      edgeBandingLengthRight: 1,
      edgeBandingLengthLeft: 0,
      edgeBandingWidthBottom: 0,
      edgeBandingWidthTop: 0,
      material: 'Corpus',
      materialThickness: 18,
    });
  });
});
