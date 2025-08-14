import { Corpus, type CorpusOptions, type Panel } from "./Corpus";
import { get } from 'svelte/store';
import { materials } from '../stores/materials';

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
        const doorWidth = this.w - this.fixedSide - 4;
        let doorHeight = this.h - 4;
        if (this.options?.hiddenHandles) {
            if (this.isUpper) {
                doorHeight += 30;
            } else {
                doorHeight -= 40;
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
