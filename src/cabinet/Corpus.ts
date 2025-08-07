import { get } from 'svelte/store';
import { materials } from '../stores/materials';

export interface CorpusOptions {
    full?: boolean;
    insetBack?: boolean;
}

export interface Panel {
    length: number;
    width: number;
    quantity: number;
    edgeBandingLengthRight: number;
    edgeBandingLengthLeft: number;
    edgeBandingWidthBottom: number;
    edgeBandingWidthTop: number;
    label: string;
    hingeLocation: string;
}

export abstract class Corpus {
    id: string;
    w: number;
    h: number;
    d: number;
    x?: number;
    y?: number;
    type?: string;
    options?: CorpusOptions;

    constructor(id: string, w: number, h: number, d: number, type: string = "corpus", options?: CorpusOptions) {
        this.id = id;
        this.w = w;
        this.h = h;
        this.d = d;
        this.type = type;
        this.options = options;
    }

    abstract validate(): boolean;

    public panels(): Panel[] {
        const { corpus } = get(materials);
        const t = corpus.thickness;
        const data: Panel[] = [];
        data.push({
            length: this.h,
            width: this.d,
            quantity: 2,
            edgeBandingLengthRight: 1,
            edgeBandingLengthLeft: 0,
            edgeBandingWidthBottom: 0,
            edgeBandingWidthTop: 1,
            label: `${this.id}- Side panel`,
            hingeLocation: ""
        });

        if (this.options?.full) {
            data.push({
                length: this.w - 2 * t,
                width: this.d,
                quantity: 2,
                edgeBandingLengthRight: 1,
                edgeBandingLengthLeft: 1,
                edgeBandingWidthBottom: 0,
                edgeBandingWidthTop: 0,
                label: `${this.id}- Top/Bottom panel`,
                hingeLocation: ""
            });
        } else {
            data.push({
                length: this.w - 2 * t,
                width: this.d,
                quantity: 1,
                edgeBandingLengthRight: 1,
                edgeBandingLengthLeft: 0,
                edgeBandingWidthBottom: 0,
                edgeBandingWidthTop: 0,
                label: `${this.id}- Bottom panel`,
                hingeLocation: ""
            });
            data.push({
                length: this.w - 2 * t,
                width: 10,
                quantity: 1,
                edgeBandingLengthRight: 1,
                edgeBandingLengthLeft: 0,
                edgeBandingWidthBottom: 0,
                edgeBandingWidthTop: 0,
                label: `${this.id}- Top panel plank rear`,
                hingeLocation: ""
            });
            data.push({
                length: this.w - 2 * t,
                width: 10,
                quantity: 1,
                edgeBandingLengthRight: 1,
                edgeBandingLengthLeft: 1,
                edgeBandingWidthBottom: 0,
                edgeBandingWidthTop: 0,
                label: `${this.id}- Top panel plank front`,
                hingeLocation: ""
            });
        }

        if (this.options?.insetBack) {
            data.push({
                length: this.w - 2 * t,
                width: this.h - 2 * t,
                quantity: 1,
                edgeBandingLengthRight: 0,
                edgeBandingLengthLeft: 0,
                edgeBandingWidthBottom: 0,
                edgeBandingWidthTop: 0,
                label: `${this.id}- Back panel`,
                hingeLocation: ""
            });
        } else {
            data.push({
                length: this.w - t,
                width: this.h - t,
                quantity: 1,
                edgeBandingLengthRight: 0,
                edgeBandingLengthLeft: 0,
                edgeBandingWidthBottom: 0,
                edgeBandingWidthTop: 0,
                label: `${this.id}- Back panel`,
                hingeLocation: ""
            });
        }

        return data;
    }
}