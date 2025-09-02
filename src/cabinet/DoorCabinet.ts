import {Corpus, type CorpusOptions, type Panel} from "./Corpus";
import { get } from 'svelte/store';
import { materials } from '../stores/materials';
import {HIDDEN_HANDEL_REVEAL} from "./config";

export class DoorCabinet extends Corpus{
    doors?: number;

    constructor(
        id: string,
        w: number,
        h: number,
        d: number,
        doors: number,
        options?: CorpusOptions,
        isUpper: boolean = false

    ) {
        super(id, w, h, d, 'door', options, isUpper);
        this.doors = doors;
    }

    validate(): boolean {
        return this.doors !== undefined && this.doors > 0;
    }

    public panels(): Panel[] {
        const data = super.panels();
        if(this.doors === undefined) {
            return data;
        }
        const { front, corpus } = get(materials);
        const totalReveal = (this.doors === 1) ? 4 : 6;
        const dw = (this.w - totalReveal) / this.doors;
        let dh = this.h - 2;
        if (this.options?.hiddenHandles) {
            if (this.isUpper) {
                dh += corpus.thickness;
            } else {
                dh -= HIDDEN_HANDEL_REVEAL;
            }
        }
        const hinge = dh > dw ? "2xDUZ" : "2xSIR";
        for (let i = 0; i < this.doors; i++) {
            data.push({
                length: dh,
                width: dw,
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