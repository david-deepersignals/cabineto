import { Corpus, type CorpusOptions, type Panel } from "./Corpus";
import { get } from 'svelte/store';
import { materials } from '../stores/materials';
import { createDrawerPanels } from './drawerHelper';
import { advancedSettings } from '../stores/advancedSettings';

export class DrawerCabinet extends Corpus{
    drawers?: number;
    heights?: number[];
    drawerSystem: 'standard' | 'metabox' | 'vertex';
    metaboxType: number;
    drawerSideHeight: number;

    constructor(
        id: string,
        w: number,
        h: number,
        d: number,
        drawers: number,
        heights: number[],
        drawerSystem: 'standard' | 'metabox' | 'vertex',
        metaboxType?: number,
        drawerSideHeight?: number,
        options?: CorpusOptions,
        isUpper: boolean = false,
    ) {
        super(id, w, h, d, 'drawer', options, isUpper);
        this.drawers = drawers;
        this.heights = heights;
        this.drawerSystem = drawerSystem;
        const drawerDefaults = get(advancedSettings).drawers.defaults;
        this.metaboxType = metaboxType ?? drawerDefaults.sliderLength;
        this.drawerSideHeight = drawerSideHeight ?? drawerDefaults.railHeight;
    }

    validate(){
        const total = this.heights?.reduce((a, b) => a + b, 0) ?? 0;
        if (this.heights?.length !== this.drawers || total !== 100) {

            return false;
        }

        return true;
    }

    public panels(): Panel[] {
        const data = super.panels();
        if(this.drawers === undefined || this.heights === undefined) {
            return data;
        }
        const adv = get(advancedSettings);
        const { corpus, back } = get(materials);
        const reveals = adv.reveals;
        const t = corpus.thickness;
        const usableHeight = this.h - (this.drawers + 1) * reveals.verticalGap;
        const corpusInnerWidth = this.w - 2 * t;
        const backReduction = this.options?.insetBack
            ? adv.backs.insetOffset + back.thickness
            : this.options?.rabbetBack
            ? adv.backs.rabbetDepth
            : back.thickness;
        const corpusInnerDepth = this.d - backReduction;
        for (let i = 0; i < this.drawers; i++) {
            const pct = this.heights[i] / 100;
            let faceHeight = Math.round(pct * usableHeight);
            if (this.options?.hiddenHandles) {
                faceHeight -= reveals.hiddenHandleReveal;
            }

            data.push(
                ...createDrawerPanels({
                    id: this.id,
                    index: i + 1,
                    faceHeight,
                    faceWidth: this.w - reveals.sideGap * 2,
                    drawerSystem: this.drawerSystem,
                    internalCorpusWidth: corpusInnerWidth,
                    internalCorpusDepth: corpusInnerDepth,
                    sliderLenght: this.metaboxType,
                    railHeight: this.drawerSideHeight,
                })
            );
        }
        return data;
    }
}
