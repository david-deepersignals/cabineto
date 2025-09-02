import { Corpus, type CorpusOptions, type Panel } from "./Corpus";
import { get } from 'svelte/store';
import { materials } from '../stores/materials';
import { createDrawerPanels } from './drawerHelper';

export class OvenCabinet extends Corpus {
    drawerHeight: number;
    drawerSystem: "standard" | "metabox" | "vertex";
    metaboxType: number;

    constructor(
        id: string,
        w: number,
        h: number,
        d: number,
        drawerSystem: "standard" | "metabox" | "vertex",
        metaboxType: number = 400,
        options?: CorpusOptions,
        isUpper: boolean = false
    ) {
        if (options?.insetBack == true) {
            throw new Error("Oven cabinet cannot be inset back");
        }

        if (options?.hiddenHandles) {}
        super(id, w, h, d, 'oven', options, isUpper);
        this.drawerHeight = h - (options?.hiddenHandles ? 60 : 0) - 600;
        this.drawerSystem = drawerSystem;
        this.metaboxType = metaboxType;
    }

    validate(): boolean {
        return this.w === 600 && this.d >= 560 && this.drawerHeight >= 140;
    }

    public panels(): Panel[] {
        const data = super.panels();
        const { corpus, back } = get(materials);
        const t = corpus.thickness;
        const corpusInnerWidth = this.w - 2 * t;
        const corpusInnerDepth = this.d; // there is no back so no need to deduct anything

        data.push(
            ...createDrawerPanels({
                id: this.id,
                index: 1,
                faceHeight: this.drawerHeight - 2,
                faceWidth: this.w - 4,
                drawerSystem: this.drawerSystem,
                internalCorpusWidth: corpusInnerWidth,
                internalCorpusDepth: corpusInnerDepth,
                sliderLenght: this.metaboxType,
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
