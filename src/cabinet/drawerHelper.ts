import type { Panel } from "./Corpus";
import { get } from "svelte/store";
import { materials } from "../stores/materials";

export const METABOX_WIDTH_CLEARANCE = 31; // total clearance in mm
export const METABOX_DEPTH_CLEARANCE = 42; // depth reduction in mm
export const SLIDER_LENGHTS = [270, 320, 350, 400, 450, 500, 550];



interface DrawerParams {
    id: string;
    index: number;
    faceHeight: number;
    faceWidth: number;
    drawerSystem: "standard" | "metabox" | "vertex";
    internalCorpusWidth: number;
    internalCorpusDepth: number;
    sliderLenght?: number;
}

export function createDrawerPanels(p: DrawerParams): Panel[] {
    const { corpus, back, front, drawer } = get(materials);
    const panels: Panel[] = [];

    panels.push({
        length: p.faceHeight,
        width: p.faceWidth,
        quantity: 1,
        edgeBandingLengthRight: 1,
        edgeBandingLengthLeft: 1,
        edgeBandingWidthBottom: 1,
        edgeBandingWidthTop: 1,
        label: `${p.id}-> Drawer ${p.index} Face`,
        hingeLocation: "",
        material: front.name,
        materialThickness: front.thickness,
    });


    if (p.drawerSystem === "vertex") {
        //BOTTOM
        panels.push({
            length: p.internalCorpusWidth - 19,
            width: p.sliderLenght ?? (p.internalCorpusDepth - 30) - 19,
            quantity: 1,
            edgeBandingLengthRight: 0,
            edgeBandingLengthLeft: 0,
            edgeBandingWidthBottom: 0,
            edgeBandingWidthTop: 0,
            label: `${p.id}-> Drawer ${p.index} Bottom`,
            hingeLocation: "",
            material: drawer.name,
            materialThickness: drawer.thickness,
        });


        //BACK
        panels.push({
            length: p.internalCorpusWidth - 42,
            width: 131, //TODO: needs to be a variable slider height
            quantity: 1,
            edgeBandingLengthRight: 0,
            edgeBandingLengthLeft: 0,
            edgeBandingWidthBottom: 0,
            edgeBandingWidthTop: 1,
            label: `${p.id}-> Drawer ${p.index} Back`,
            hingeLocation: "",
            material:  drawer.name,
            materialThickness: drawer.thickness,
        });

    }else if (p.drawerSystem === "metabox") {
    //BOTTOM
        panels.push({
            length: p.internalCorpusWidth - METABOX_WIDTH_CLEARANCE,
            width: p.sliderLenght ?? (p.internalCorpusDepth - 30) - METABOX_DEPTH_CLEARANCE,
            quantity: 1,
            edgeBandingLengthRight: 0,
            edgeBandingLengthLeft: 0,
            edgeBandingWidthBottom: 0,
            edgeBandingWidthTop: 0,
            label: `${p.id}-> Drawer ${p.index} Bottom`,
            hingeLocation: "",
            material: drawer.name,
            materialThickness: drawer.thickness,
        });


        //BACK
        panels.push({
            length: p.internalCorpusWidth - METABOX_WIDTH_CLEARANCE,
            width: 131, //TODO: needs to be a variable slider height
            quantity: 1,
            edgeBandingLengthRight: 0,
            edgeBandingLengthLeft: 0,
            edgeBandingWidthBottom: 0,
            edgeBandingWidthTop: 1,
            label: `${p.id}-> Drawer ${p.index} Back`,
            hingeLocation: "",
            material:  drawer.name,
            materialThickness: drawer.thickness,
        });
    }else {

        const sliderClearance = 24
        //BOTTOM
        panels.push({
            length: p.internalCorpusWidth - sliderClearance, // 24 is the slider clearance for both sides needs to be a param
            width: p.internalCorpusDepth - 20,
            quantity: 1,
            edgeBandingLengthRight: 0,
            edgeBandingLengthLeft: 0,
            edgeBandingWidthBottom: 0,
            edgeBandingWidthTop: 0,
            label: `${p.id}-> Drawer ${p.index} Bottom`,
            hingeLocation: "",
            material: drawer.name,
            materialThickness: drawer.thickness,
        });

        //SIDES
        panels.push({
            length: p.faceHeight - 30,
            width: p.internalCorpusDepth -20,
            quantity: 2,
            edgeBandingLengthRight: 1,
            edgeBandingLengthLeft: 0,
            edgeBandingWidthBottom: 0,
            edgeBandingWidthTop: 1,
            label: `${p.id}-> Drawer ${p.index} Side`,
            hingeLocation: "",
            material: corpus.name,
            materialThickness: drawer.thickness,
        });

        //BACK
        panels.push({
            length: p.internalCorpusWidth - sliderClearance - (2*drawer.thickness),
            width: p.faceHeight - 30,
            quantity: 1,
            edgeBandingLengthRight: 0,
            edgeBandingLengthLeft: 0,
            edgeBandingWidthBottom: 0,
            edgeBandingWidthTop: 1,
            label: `${p.id}-> Drawer ${p.index} Back`,
            hingeLocation: "",
            material:  drawer.name,
            materialThickness: drawer.thickness,
        });


    }


    return panels;
}
