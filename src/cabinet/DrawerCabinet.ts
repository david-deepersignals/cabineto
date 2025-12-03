import { BACK_INSET_OFFSET, Corpus, type CorpusOptions, type Panel, RABBET_DEPTH } from "./Corpus";
import { get } from 'svelte/store';
import { materials } from '../stores/materials';
import { createDrawerPanels } from './drawerHelper';
import {HIDDEN_HANDEL_REVEAL} from "./config";

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
        metaboxType: number = 400,
        drawerSideHeight: number = 131,
        options?: CorpusOptions,
        isUpper: boolean = false,
    ) {
        super(id, w, h, d, 'drawer', options, isUpper);
        this.drawers = drawers;
        this.heights = heights;
        this.drawerSystem = drawerSystem;
        this.metaboxType = metaboxType;
        this.drawerSideHeight = drawerSideHeight;
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
        const { corpus, back } = get(materials);
        const t = corpus.thickness;
        const usableHeight = this.h - (this.options?.hiddenHandles ? 0 : ((this.drawers + 1) * 2));
        const corpusInnerWidth = this.w - 2 * t;
        const backReduction = this.options?.insetBack
            ? BACK_INSET_OFFSET + back.thickness
            : this.options?.rabbetBack
            ? RABBET_DEPTH
            : back.thickness;
        const corpusInnerDepth = this.d - backReduction;
        for (let i = 0; i < this.drawers; i++) {
            const pct = this.heights[i] / 100;
            let faceHeight = Math.round(pct * usableHeight);
            if (this.options?.hiddenHandles) {
                faceHeight -= HIDDEN_HANDEL_REVEAL;
            }

            data.push(
                ...createDrawerPanels({
                    id: this.id,
                    index: i + 1,
                    faceHeight,
                    faceWidth: this.w - 4,
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
