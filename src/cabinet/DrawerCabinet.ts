import { Corpus, type CorpusOptions, type Panel } from "./Corpus";
import { get } from 'svelte/store';
import { materials } from '../stores/materials';

export class DrawerCabinet extends Corpus{
    drawers?: number;
    heights?: number[];
    clearance?: number;

    constructor(
        id: string,
        w: number,
        h: number,
        d: number,
        drawers: number,
        heights: number[],
        clearance: number,
        options?: CorpusOptions,
        isUpper: boolean = false,
    ) {
        super(id, w, h, d, 'drawer', options, isUpper);
        this.drawers = drawers;
        this.heights = heights;
        this.clearance = clearance;
    }

    validate(){
        const total = this.heights?.reduce((a, b) => a + b, 0) ?? 0;
        if (this.heights?.length !== this.drawers || total !== 100) {

            return false;
        }

        return true;
    }

    public panels(): Panel[] {
        const data = super.panels();
        if(this.drawers === undefined || this.heights === undefined) {
            return data;
        }
        const { corpus, back, front } = get(materials);
        const t = corpus.thickness;
        const usableHeight = this.h - ((this.drawers + 1) * 2);
        const drawerWidth = this.w - 2 * t;
        const drawerDepth = this.d - back.thickness - 20;
        const clr = this.clearance || 0;
        let cumulativeY = 2;
        for (let i = 0; i < this.drawers; i++) {
            const pct = this.heights[i] / 100;
            let faceHeight = Math.round(pct * usableHeight);
            if (this.options?.hiddenHandles) {
                faceHeight -= 40;
            }
            const internalHeight = faceHeight - 20;
            const innerW = drawerWidth - 2 * clr;
            const innerD = drawerDepth;

            data.push({
                length: faceHeight,
                width: this.w - 4,
                quantity: 1,
                edgeBandingLengthRight: 1,
                edgeBandingLengthLeft: 1,
                edgeBandingWidthBottom: 1,
                edgeBandingWidthTop: 1,
                label: `${this.id}-> Drawer ${i + 1} Face`,
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
                label: `${this.id}-> Drawer ${i + 1} Side`,
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
                label: `${this.id}-> Drawer ${i + 1} Back`,
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
                label: `${this.id}-> Drawer ${i + 1} Bottom`,
                hingeLocation: "",
                material: back.name,
                materialThickness: back.thickness,
            });

            cumulativeY += faceHeight + 2;
        }
        return data;
    }
}