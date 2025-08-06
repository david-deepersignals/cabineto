import { Corpus, type CorpusOptions } from "./Corpus";
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

    public panels(): any[] {
        const data = super.panels();
        const { corpus, back } = get(materials);
        const t = corpus.thickness;
        const drawerWidth = this.w - 2 * t;
        const drawerDepth = this.d - back.thickness;
        const innerW = drawerWidth - 2 * (this.clearance || 0);
        const innerD = drawerDepth;
        const internalHeight = this.drawerHeight - 4;

        data.push([this.drawerHeight, drawerWidth, 1, 1, 1, 1, 1, `${this.id}- Drawer Face`, ""]);
        data.push([internalHeight, innerD, 2, 1, 0, 0, 1, `${this.id}- Drawer Side`, ""]);
        data.push([internalHeight, innerD, 1, 0, 0, 0, 0, `${this.id}- Drawer Back`, ""]);
        data.push([innerW, innerD, 1, 0, 0, 0, 0, `${this.id}- Drawer Bottom`, ""]);

        data.push([drawerWidth, this.d, 1, 1, 0, 0, 0, `${this.id}- Oven Shelf`, ""]);

        return data;
    }
}
