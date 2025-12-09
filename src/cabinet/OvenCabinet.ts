import { Corpus, type CorpusOptions, type Panel } from "./Corpus";
import { get } from 'svelte/store';
import { materials } from '../stores/materials';
import { createDrawerPanels } from './drawerHelper';
import { advancedSettings } from '../stores/advancedSettings';

export class OvenCabinet extends Corpus {
    drawerHeight: number;
    drawerSystem: "standard" | "metabox" | "vertex";
    metaboxType: number;
    drawerSideHeight: number;

    constructor(
        id: string,
        w: number,
        h: number,
        d: number,
        drawerSystem: "standard" | "metabox" | "vertex",
        metaboxType?: number,
        drawerSideHeight?: number,
        options?: CorpusOptions,
        isUpper: boolean = false
    ) {
        if (options?.insetBack == true || options?.rabbetBack == true) {
            throw new Error("Oven cabinet cannot be inset or rabbet back");
        }

        super(id, w, h, d, 'oven', options, isUpper);
        const adv = get(advancedSettings);
        const reveals = adv.reveals;
        const defaults = adv.drawers.defaults;
        this.drawerHeight = h - (options?.hiddenHandles ? reveals.golaProfileHeight : 0) - adv.oven.cavityHeight;
        this.drawerSystem = drawerSystem;
        this.metaboxType = metaboxType ?? defaults.sliderLength;
        this.drawerSideHeight = drawerSideHeight ?? defaults.railHeight;
    }

    validate(): boolean {
        const oven = get(advancedSettings).oven;
        return this.w === oven.requiredWidth && this.d >= oven.minDepth && this.drawerHeight >= oven.minDrawerHeight;
    }

    public panels(): Panel[] {
        const data = super.panels();
        const adv = get(advancedSettings);
        const { corpus, back } = get(materials);
        const t = corpus.thickness;
        const corpusInnerWidth = this.w - 2 * t;
        const corpusInnerDepth = this.d; // there is no back so no need to deduct anything

        data.push(
            ...createDrawerPanels({
                id: this.id,
                index: 1,
                faceHeight: this.drawerHeight - adv.oven.faceHeightClearance,
                faceWidth: this.w - adv.reveals.sideGap * 2,
                drawerSystem: this.drawerSystem,
                internalCorpusWidth: corpusInnerWidth,
                internalCorpusDepth: corpusInnerDepth,
                sliderLenght: this.metaboxType,
                railHeight: this.drawerSideHeight,
            })
        );

        data.push({
            length: corpusInnerWidth,
            width: corpusInnerDepth,
            quantity: 1,
            edgeBandingLengthRight: 1,
            edgeBandingLengthLeft: 0,
            edgeBandingWidthBottom: 0,
            edgeBandingWidthTop: 0,
            label: `${this.id}-> Oven Shelf`,
            hingeLocation: "",
            material: corpus.name,
            materialThickness: corpus.thickness,
        });

        return data;
    }
}
