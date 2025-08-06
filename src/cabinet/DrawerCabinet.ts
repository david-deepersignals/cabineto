import { Corpus, type CorpusOptions } from "./Corpus";
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
    ) {
        super(id, w, h, d, 'drawer', options);
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

    public panels(): any[] {
        const data = super.panels();
        if(this.drawers === undefined || this.heights === undefined) {
            return data;
        }
        const { corpus, back } = get(materials);
        const t = corpus.thickness;
        const usableHeight = this.h - ((this.drawers + 1) * 2);
        const drawerWidth = this.w - 2 * t;
        const drawerDepth = this.d - back.thickness - 20;
        const clr = this.clearance || 0;
        let cumulativeY = 2;
        for (let i = 0; i < this.drawers; i++) {
            const pct = this.heights[i] / 100;
            const faceHeight = Math.round(pct * usableHeight);
            const internalHeight = faceHeight - 20;
            const innerW = drawerWidth - 2 * clr;
            const innerD = drawerDepth;

            data.push([faceHeight, drawerWidth, 1, 1, 1, 1, 1, `${this.id}- Drawer ${i + 1} Face`, ""]);
            data.push([internalHeight, innerD, 2, 1, 0, 0, 1, `${this.id}- Drawer ${i + 1} Side`, ""]);
            data.push([internalHeight, innerD, 1, 0, 0, 0, 0, `${this.id}- Drawer ${i + 1} Back`, ""]);
            data.push([innerW, innerD, 1, 0, 0, 0, 0, `${this.id}- Drawer ${i + 1} Bottom`, ""]);

            cumulativeY += faceHeight + 2;
        }
        return data;
    }
}