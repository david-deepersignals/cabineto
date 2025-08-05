import {Corpus, type CorpusOptions} from "./Corpus";

export class DoorCabinet extends Corpus{
    doors?: number;

    constructor(
        id: string,
        w: number,
        h: number,
        d: number,
        t: number,
        doors: number,
        options?:CorpusOptions

    ) {
        super(id, w, h, d, t,'door',options);
        this.doors = doors;
    }

    validate(): boolean {
        return this.doors !== undefined && this.doors > 0;
    }

    public panels(): any[] {
        const data = super.panels();
        if(this.doors === undefined) {
            return data;
        }
        const totalReveal = (this.doors === 1) ? 4 : 6;
        const dw = (this.w - totalReveal) / this.doors;
        const dh = this.h - 4;
        const hinge = dh > dw ? "duza strana" : "kraca strana";
        for (let i = 0; i < this.doors; i++) {
            data.push([dh, dw, 1, 1, 1, 1, 1, `${this.id}- Door`, hinge]);
        }

        return data;

    }
}