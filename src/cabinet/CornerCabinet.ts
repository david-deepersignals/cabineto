import { Corpus, type CorpusOptions, type Panel } from "./Corpus";
import { get } from 'svelte/store';
import { materials } from '../stores/materials';
import { advancedSettings } from '../stores/advancedSettings';

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
        const reveals = get(advancedSettings).reveals;
        const doorWidth = this.w - this.fixedSide - reveals.sideGap * 2;
        let doorHeight = this.h - reveals.verticalGap * 2;
        if (this.options?.hiddenHandles) {
            if (this.isUpper) {
                doorHeight += corpus.thickness + reveals.upperHandlelessOverhangExtra;
            } else {
                doorHeight = this.h - reveals.hiddenHandleReveal;
            }
        }

        if (doorWidth > 0) {
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

        data.push({
            length: doorHeight,
            width: this.fixedSide,
            quantity: 1,
            edgeBandingLengthRight: 1,
            edgeBandingLengthLeft: 1,
            edgeBandingWidthBottom: 1,
            edgeBandingWidthTop: 1,
            label: `${this.id}-> Fixed side`,
            hingeLocation: "",
            material: front.name,
            materialThickness: front.thickness,
        });
        return data;
    }
}
