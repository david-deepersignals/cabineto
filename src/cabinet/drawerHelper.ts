import type { Panel } from "./Corpus";
import { get } from "svelte/store";
import { materials } from "../stores/materials";
import { advancedSettings, buildRailHeightMap } from "../stores/advancedSettings";

interface DrawerParams {
    id: string;
    index: number;
    faceHeight: number;
    faceWidth: number;
    drawerSystem: "standard" | "metabox" | "vertex";
    internalCorpusWidth: number;
    internalCorpusDepth: number;
    sliderLenght?: number;
    railHeight?: number;
}

export function createDrawerPanels(p: DrawerParams): Panel[] {
    const { corpus, back, front, drawer } = get(materials);
    const drawerSettings = get(advancedSettings).drawers;
    const panels: Panel[] = [];
    const railHeightMapping = buildRailHeightMap(drawerSettings.railHeights);
    const fallbackRailHeight = drawerSettings.defaults.railHeight ?? drawerSettings.railHeights[0]?.rail ?? 0;
    const selectedRailHeight = p.railHeight ?? fallbackRailHeight;
    const backHeight =
        railHeightMapping[selectedRailHeight] ??
        railHeightMapping[fallbackRailHeight] ??
        selectedRailHeight;
    const fallbackSliderLength = p.internalCorpusDepth - drawerSettings.metabox.defaultFrontSetback;
    const sliderLength = p.sliderLenght ?? fallbackSliderLength;

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
            length: p.internalCorpusWidth - drawerSettings.vertex.widthClearance,
            width: sliderLength - drawerSettings.vertex.depthShorten,
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
            length: p.internalCorpusWidth - drawerSettings.vertex.backWidthClearance,
            width: backHeight,
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
            length: p.internalCorpusWidth - drawerSettings.metabox.widthClearance,
            width: sliderLength - drawerSettings.metabox.depthClearance,
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
            length: p.internalCorpusWidth - drawerSettings.metabox.widthClearance,
            width: backHeight,
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

        const sliderClearance = drawerSettings.standard.sideClearanceTotal;
        const bottomDepthClearance = drawerSettings.standard.bottomDepthClearance;
        const sideHeightReduction = drawerSettings.standard.sideHeightReduction;
        //BOTTOM
        panels.push({
            length: p.internalCorpusWidth - sliderClearance, // 24 is the slider clearance for both sides needs to be a param
            width: p.internalCorpusDepth - bottomDepthClearance,
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
            length: p.faceHeight - sideHeightReduction,
            width: p.internalCorpusDepth - bottomDepthClearance,
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
            width: p.faceHeight - sideHeightReduction,
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
