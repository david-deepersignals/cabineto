import { Corpus, type CorpusOptions, type Panel } from "./Corpus";
import { get } from 'svelte/store';
import { materials } from '../stores/materials';

export class OvenCabinet extends Corpus {
    drawerHeight: number;
    clearance?: number;

    constructor(
        id: string,
        w: number,
        h: number,
        d: number,
        clearance: number = 0,
        options?: CorpusOptions
    ) {
        super(id, w, h, d, 'oven', options);
        this.drawerHeight = h - 600;
        this.clearance = clearance;
    }

    validate(): boolean {
        return this.w === 600 && this.d >= 560 && this.drawerHeight >= 140;
    }

    public panels(): Panel[] {
        const data = super.panels();
        const { corpus, back, front } = get(materials);
        const t = corpus.thickness;
        const drawerWidth = this.w - 2 * t;
        const drawerDepth = this.d - back.thickness;
        const innerW = drawerWidth - 2 * (this.clearance || 0);
        const innerD = drawerDepth;
        const internalHeight = this.drawerHeight - 4;

        data.push({
            length: this.drawerHeight,
            width: drawerWidth,
            quantity: 1,
            edgeBandingLengthRight: 1,
            edgeBandingLengthLeft: 1,
            edgeBandingWidthBottom: 1,
            edgeBandingWidthTop: 1,
            label: `${this.id}-> Drawer Face`,
            hingeLocation: "",
            material: front.name,
            materialThickness: front.thickness,
        });
        data.push({
            length: internalHeight,
            width: innerD,
            quantity: 2,
            edgeBandingLengthRight: 1,
            edgeBandingLengthLeft: 0,
            edgeBandingWidthBottom: 0,
            edgeBandingWidthTop: 1,
            label: `${this.id}-> Drawer Side`,
            hingeLocation: "",
            material: corpus.name,
            materialThickness: corpus.thickness,
        });
        data.push({
            length: internalHeight,
            width: innerW,
            quantity: 1,
            edgeBandingLengthRight: 0,
            edgeBandingLengthLeft: 0,
            edgeBandingWidthBottom: 0,
            edgeBandingWidthTop: 1,
            label: `${this.id}-> Drawer Back`,
            hingeLocation: "",
            material: corpus.name,
            materialThickness: corpus.thickness,
        });
        data.push({
            length: innerW,
            width: innerD,
            quantity: 1,
            edgeBandingLengthRight: 0,
            edgeBandingLengthLeft: 0,
            edgeBandingWidthBottom: 0,
            edgeBandingWidthTop: 0,
            label: `${this.id}-> Drawer Bottom`,
            hingeLocation: "",
            material: back.name,
            materialThickness: back.thickness,
        });

        data.push({
            length: drawerWidth,
            width: this.d,
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
