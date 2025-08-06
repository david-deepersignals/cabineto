import { Corpus, type CorpusOptions } from "./Corpus";

export class CornerCabinet extends Corpus {
    fixedSide: number;

    constructor(
        id: string,
        w: number,
        h: number,
        d: number,
        fixedSide: number,
        options?: CorpusOptions
    ) {
        super(id, w, h, d, 'corner', options);
        this.fixedSide = fixedSide;
    }

    validate(): boolean {
        return this.fixedSide > 0 && this.fixedSide < this.w;
    }

    public panels(): any[] {
        const data = super.panels();
        const doorWidth = this.w - this.fixedSide - 4;
        const doorHeight = this.h - 4;
        if (doorWidth > 0) {
            const hinge = doorHeight > doorWidth ? "duza strana" : "kraca strana";
            data.push([doorHeight, doorWidth, 1, 1, 1, 1, 1, `${this.id}- Door`, hinge]);
        }
        return data;
    }
}
