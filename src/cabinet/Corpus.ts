import { get } from 'svelte/store';
import { materials } from '../stores/materials';

export interface CorpusOptions {
    full?: boolean;
    insetBack?: boolean;
    hiddenHandles?: boolean;
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
    material: string;
    materialThickness: number;
    dados?: Dado[];
}

export interface Dado {
    offset: number;
    depth: number;
    width: number;
}

export abstract class Corpus {
    id: string;
    w: number;
    h: number;
    d: number;
    x?: number;
    y?: number;
    z?: number;
    rotation?: number;
    type?: string;
    options?: CorpusOptions;
    wall?: 'north' | 'south' | 'east' | 'west';

    constructor(id: string, w: number, h: number, d: number, type: string = "corpus", options?: CorpusOptions) {
        this.id = id;
        this.w = w;
        this.h = h;
        this.d = d;
        this.rotation = 0;
        this.type = type;
        this.options = options;
    }

    abstract validate(): boolean;

    public panels(): Panel[] {
        const { corpus, back } = get(materials);
        const t = corpus.thickness;
        const data: Panel[] = [];
        const dadoSpec: Dado = { offset: 15, depth: 7, width: back.thickness };

        const sidePanel: Panel = {
            length: this.h,
            width: this.d,
            quantity: 2,
            edgeBandingLengthRight: 1,
            edgeBandingLengthLeft: 0,
            edgeBandingWidthBottom: 0,
            edgeBandingWidthTop: 1,
            label: `${this.id}-> Side panel`,
            hingeLocation: "",
            material: corpus.name,
            materialThickness: corpus.thickness,
        };

        if (this.options?.insetBack) {
            sidePanel.dados = [dadoSpec];
        }

        data.push(sidePanel);

        if (this.options?.full) {
            const tb: Panel = {
                length: this.w - 2 * t,
                width: this.d,
                quantity: 2,
                edgeBandingLengthRight: 1,
                edgeBandingLengthLeft: 1,
                edgeBandingWidthBottom: 0,
                edgeBandingWidthTop: 0,
                label: `${this.id}-> Top/Bottom panel`,
                hingeLocation: "",
                material: corpus.name,
                materialThickness: corpus.thickness,
            };

            if (this.options?.insetBack) {
                tb.dados = [dadoSpec];
            }

            data.push(tb);
        } else {
            const bottom: Panel = {
                length: this.w - 2 * t,
                width: this.d,
                quantity: 1,
                edgeBandingLengthRight: 1,
                edgeBandingLengthLeft: 0,
                edgeBandingWidthBottom: 0,
                edgeBandingWidthTop: 0,
                label: `${this.id}-> Bottom panel`,
                hingeLocation: "",
                material: corpus.name,
                materialThickness: corpus.thickness,
            };
            if (this.options?.insetBack) {
                bottom.dados = [dadoSpec];
            }
            data.push(bottom);

            const topRear: Panel = {
                length: this.w - 2 * t,
                width: 100,
                quantity: 1,
                edgeBandingLengthRight: 1,
                edgeBandingLengthLeft: 0,
                edgeBandingWidthBottom: 0,
                edgeBandingWidthTop: 0,
                label: `${this.id}-> Top panel plank rear`,
                hingeLocation: "",
                material: corpus.name,
                materialThickness: corpus.thickness,
            };
            if (this.options?.insetBack) {
                topRear.dados = [dadoSpec];
            }
            data.push(topRear);

            data.push({
                length: this.w - 2 * t,
                width: 100,
                quantity: 1,
                edgeBandingLengthRight: 1,
                edgeBandingLengthLeft: 1,
                edgeBandingWidthBottom: 0,
                edgeBandingWidthTop: 0,
                label: `${this.id}-> Top panel plank front`,
                hingeLocation: "",
                material: corpus.name,
                materialThickness: corpus.thickness,
            });
        }

        if (this.options?.insetBack) {
            data.push({
                length: this.w - 2 * t + 12,
                width: this.h - 2 * t + 12,
                quantity: 1,
                edgeBandingLengthRight: 0,
                edgeBandingLengthLeft: 0,
                edgeBandingWidthBottom: 0,
                edgeBandingWidthTop: 0,
                label: `${this.id}-> Back panel`,
                hingeLocation: "",
                material: back.name,
                materialThickness: back.thickness,
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
                label: `${this.id}-> Back panel`,
                hingeLocation: "",
                material: back.name,
                materialThickness: back.thickness,
            });
        }

        return data;
    }
}