import { get } from 'svelte/store';
import { materials } from '../stores/materials';
import { advancedSettings } from '../stores/advancedSettings';

export interface CorpusOptions {
    full?: boolean;
    insetBack?: boolean;
    rabbetBack?: boolean;
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
    rabbets?: Rabbet[];
}

export interface Dado {
    offset: number;
    depth: number;
    width: number;
}

export interface Rabbet {
    edge?: 'back';
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
    isUpper: boolean;

    constructor(id: string, w: number, h: number, d: number, type: string = "corpus", options?: CorpusOptions, isUpper: boolean = false) {
        this.id = id;
        this.w = w;
        this.h = h;
        this.d = d;
        this.rotation = 0;
        this.type = type;
        this.options = options;
        this.isUpper = isUpper;
    }

    abstract validate(): boolean;

    public panels(): Panel[] {
        const { corpus, back } = get(materials);
        const adv = get(advancedSettings);
        const backs = adv.backs;
        const t = corpus.thickness;
        const data: Panel[] = [];
        const dadoSpec: Dado = { offset: backs.insetOffset, depth: backs.insetDadoDepth, width: back.thickness + backs.insetDadoClearance };
        const rabbetSpec: Rabbet = { edge: 'back', depth: backs.rabbetDepth, width: backs.rabbetWidth };

        const sidePanel: Panel = {
            length: this.h,
            width: this.d,
            quantity: 2,
            edgeBandingLengthRight: 1,
            edgeBandingLengthLeft: 0,
            edgeBandingWidthBottom: 1,
            edgeBandingWidthTop: 1,
            label: `${this.id}-> Side panel`,
            hingeLocation: "",
            material: corpus.name,
            materialThickness: corpus.thickness,
        };

        if (this.options?.insetBack) {
            sidePanel.dados = [dadoSpec];
        } else if (this.options?.rabbetBack) {
            sidePanel.rabbets = [rabbetSpec];
        }

        data.push(sidePanel);

        if (this.options?.full) {
            const tb: Panel = {
                length: this.w - 2 * t,
                width: this.d,
                quantity: 2,
                edgeBandingLengthRight: 1,
                edgeBandingLengthLeft: 0,
                edgeBandingWidthBottom: 0,
                edgeBandingWidthTop: 0,
                label: `${this.id}-> Top/Bottom panel`,
                hingeLocation: "",
                material: corpus.name,
                materialThickness: corpus.thickness,
            };

            if (this.options?.insetBack) {
                tb.dados = [dadoSpec];
            } else if (this.options?.rabbetBack) {
                tb.rabbets = [rabbetSpec];
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
            } else if (this.options?.rabbetBack) {
                bottom.rabbets = [rabbetSpec];
            }
            data.push(bottom);

            const topRear: Panel = {
                length: this.w - 2 * t,
                width: adv.construction.splitTopRailDepth,
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

            data.push(topRear);

            data.push({
                length: this.w - 2 * t,
                width: adv.construction.splitTopRailDepth,
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

            if (this.options?.rabbetBack) {
                topRear.rabbets = [rabbetSpec];
            }
        }

        if (this.options?.insetBack) {
            //If it is a full cabinet than make it 6 mm oversize as dado is 7mm deep
            //If not make it 1 thickness + 5 mm oversize
            const height = this.options?.full ? this.h - (2 * t) + backs.insetOversizeFull : (this.h - t) + backs.insetOversizePartial;
            data.push({
                length: this.w - (2 * t) + backs.insetOversizeFull,
                width: height,
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
        } else if (this.options?.rabbetBack) {
            const engage = backs.rabbetWidth - backs.rabbetClearance; // back extends 6 mm into a 7 mm rabbet (1 mm play)
            data.push({
                length: this.w - (t * 2) + (engage * 2),
                width: this.h - (t * 2) + (engage * 2),
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
                length: this.w - (t * 2),
                width: this.h - (t * 2),
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
