import {Corpus, type Panel} from "./Corpus";

export class UpperCabinet extends Corpus{
    doors?: number;

    constructor(
        id: string,
        w: number,
        h: number,
        d: number,
        doors: number,
    ) {
        super(id, w, h, d, 'door');
        this.doors = doors;
    }

    validate(): boolean {
        return this.doors !== undefined && this.doors > 0;
    }

    public panels(): Panel[] {
        const data = super.panels();
        if(this.doors === undefined) {
            return data;
        }
        const totalReveal = (this.doors === 1) ? 4 : 6;
        const dw = (this.w - totalReveal) / this.doors;
        const dh = this.h - 4;
        const hinge = dh > dw ? "duza strana" : "kraca strana";
        for (let i = 0; i < this.doors; i++) {
            data.push({
                length: dh,
                width: dw,
                quantity: 1,
                edgeBandingLengthRight: 1,
                edgeBandingLengthLeft: 1,
                edgeBandingWidthBottom: 1,
                edgeBandingWidthTop: 1,
                label: `${this.id}- Door`,
                hingeLocation: hinge,
            });
        }

        return data;

    }
}