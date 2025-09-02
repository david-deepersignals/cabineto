import { Corpus, type CorpusOptions, type Panel } from "./Corpus";
import { get } from 'svelte/store';
import { materials } from '../stores/materials';
import {HIDDEN_HANDEL_REVEAL} from "./config";

export class CornerCabinet extends Corpus {
    fixedSide: number;

    constructor(
        id: string,
        w: number,
        h: number,
        d: number,
        fixedSide: number,
        options?: CorpusOptions,
        isUpper: boolean = false
    ) {
        super(id, w, h, d, 'corner', options, isUpper);
        this.fixedSide = fixedSide;
    }

    validate(): boolean {
        return this.fixedSide > 0 && this.fixedSide < this.w;
    }

    public panels(): Panel[] {
        const data = super.panels();
        const { front, corpus } = get(materials);
        const doorWidth = this.w - this.fixedSide - 4;
        let doorHeight = this.h - 2;
        if (this.options?.hiddenHandles) {
            if (this.isUpper) {
                doorHeight += corpus.thickness;
            } else {
                doorHeight -= HIDDEN_HANDEL_REVEAL;
            }
        }
        if (doorWidth > 0) {
            const { front } = get(materials);
            const hinge = doorHeight > doorWidth ? "2xDUZ" : "2xSIR";
            data.push({
                length: doorHeight,
                width: doorWidth,
                quantity: 1,
                edgeBandingLengthRight: 1,
                edgeBandingLengthLeft: 1,
                edgeBandingWidthBottom: 1,
                edgeBandingWidthTop: 1,
                label: `${this.id}-> Door`,
                hingeLocation: hinge,
                material: front.name,
                materialThickness: front.thickness,
            });
        }
        return data;
    }
}
