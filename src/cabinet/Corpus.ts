import { get } from 'svelte/store';
import { materials } from '../stores/materials';

export interface CorpusOptions {
    full?: boolean;
    insetBack?: boolean;
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

    public panels() {
        const { corpus } = get(materials);
        const t = corpus.thickness;
        const data: any[] = [];
        data.push([this.h, this.d, 2, 1, 0, 0, 1, `${this.id}- Side panel`, ""]);

        if (this.options?.full) {
            data.push([this.w - 2 * t, this.d, 2, 1, 1, 0, 0, `${this.id}- Top/Bottom panel`, ""]);
        } else {
            data.push([this.w - 2 * t, this.d, 1, 1, 0, 0, 0, `${this.id}- Bottom panel`, ""]);
            data.push([this.w - 2 * t, 10, 1, 1, 0, 0, 0, `${this.id}- Top panel plank rear`, ""]);
            data.push([this.w - 2 * t, 10, 1, 1, 1, 0, 0, `${this.id}- Top panel plank front`, ""]);
        }

        if (this.options?.insetBack) {
            data.push([this.w - 2 * t, this.h - 2 * t, 1, 0, 0, 0, 0, `${this.id}- Back panel`, ""]);
        } else {
            data.push([this.w - t, this.h - t, 1, 0, 0, 0, 0, `${this.id}- Back panel`, ""]);
        }

        return data;
    }
}