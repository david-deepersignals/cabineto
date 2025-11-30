import {Corpus, type CorpusOptions, type Panel} from "./Corpus";
import { get } from 'svelte/store';
import { materials } from '../stores/materials';
import {HIDDEN_HANDEL_REVEAL} from "./config";

export class DoorCabinet extends Corpus{
    doors?: number;
    shelves?: number;

    constructor(
        id: string,
        w: number,
        h: number,
        d: number,
        doors: number,
        shelves: number = 0,
        options?: CorpusOptions,
        isUpper: boolean = false

    ) {
        super(id, w, h, d, 'door', options, isUpper);
        this.doors = doors;
        this.shelves = shelves;
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
        const totalReveal = (this.doors === 1) ? 4 : 8;
        const dw = (this.w - totalReveal) / this.doors;
        let dh = this.h - 4;
        if (this.options?.hiddenHandles) {
            if (this.isUpper) {
                dh += corpus.thickness + 2;
            } else {
                dh -= (HIDDEN_HANDEL_REVEAL - 4) ;
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

        // Add shelves for door cabinets
        const shelfCount = Math.max(0, this.shelves ?? 0);
        if (shelfCount > 0) {
            const t = corpus.thickness;
            const shelfLength = this.w - 2 * t; // between sides
            const shelfWidth = this.d; // full depth like bottom panel
                data.push({
                    length: shelfLength,
                    width: shelfWidth - 20,
                    quantity: shelfCount,
                    // Front edge banding on one long edge (same as bottom panel convention)
                    edgeBandingLengthRight: 1,
                    edgeBandingLengthLeft: 0,
                    edgeBandingWidthBottom: 0,
                    edgeBandingWidthTop: 0,
                    label: `${this.id}-> Shelf`,
                    hingeLocation: "",
                    material: corpus.name,
                    materialThickness: corpus.thickness,
                });

        }

        return data;

    }
}
