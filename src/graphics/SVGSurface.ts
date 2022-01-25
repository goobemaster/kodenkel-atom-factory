
import Snap, { Fragment, Paper } from "snapsvg";
import { Application } from "../main";

export class SVGSurface {
    private paper: Paper;
    private defs: string[] = [];
    private defsId: number = 1;

    constructor(id: string, backgroundImageUrl: string, width: number, height: number) {
        this.paper = Snap('#' + id);
        this.paper.attr({ width: '100%', height: '100%', viewBox: `0 0 ${width.toString()} ${height.toString()}` });
        Snap.load(backgroundImageUrl, (fragment: Fragment) => {
            this.paper.append(fragment.select('g'));
            this.paper.append(fragment.select('svg defs'));
        });
    }

    public cleanDefs() {
        this.defs = [];
        this.defsId = 1;
    }

    public setTextBackground(nodeQuery: string, newText: string): void {
        this.paper.select(nodeQuery).node.textContent = newText;
    }

    public appendFragment(imageUrl: string, id: string = null, fragmentParentSelector: string = 'g', transform: string = null, hidden: boolean = false, callback: (element: Snap.Element) => void = null) { 
        Snap.load(imageUrl, (fragment: Fragment) => {
            let element = fragment.select(fragmentParentSelector);
            if (id !== null && id.length > 0) element.attr({id: id});
            if (transform !== null && transform.length > 0) element.transform(transform);
            if (hidden) element.addClass('hidden');
            if (callback !== null) callback(element);

            if (!this.defs.includes(imageUrl)) {
                let defs = fragment.select('svg defs');
                this.defsId++;
                defs.attr({id: defs.attr('id') + this.defsId.toString() });
                this.defs.push(imageUrl);
                this.paper.append(defs);
            }
            this.paper.append(element);
        });
    }

    public prependFragment(imageUrl: string, id: string = null, fragmentParentSelector: string = 'g', transform: string = null, callback: (element: Snap.Element) => void = null) { 
        Snap.load(imageUrl, (fragment: Fragment) => {
            let element = fragment.select(fragmentParentSelector);
            if (id !== null && id.length > 0) element.attr({id: id});
            if (transform !== null && transform.length > 0) element.transform(transform);
            if (callback !== null) callback(element);
            
            if (!this.defs.includes(imageUrl)) {
                let defs = fragment.select('svg defs');
                this.defsId++;
                defs.attr({id: defs.attr('id') + this.defsId.toString() });
                this.defs.push(imageUrl);
                this.paper.append(defs);
            }
            this.paper.prepend(element);
        });
    }

    public transformXY(nodeQuery: string, pos: {x: number, y: number}, scale: number): void {
        let element = this.query(nodeQuery);
        if (element === null) return;

        element.attr({transform: `scale(${scale},${scale}) translate(${pos.x},${pos.y})`});
    }

    public remove(nodeQuery: string): void {
        let element = this.paper.select(nodeQuery);
        if (element !== null) element.node.remove();
    }

    public removeAll(nodeQuery: string): void {
        let element = this.paper.selectAll(nodeQuery);
        if (element !== null) element.forEach(function (node) { node.remove(); });
    }

    public query(nodeQuery: string): Snap.Element|null {
        let element = this.paper.select(nodeQuery);
        return element !== null ? element : null;
    }

    public show(nodeQuery: string): void {
        let element = this.paper.select(nodeQuery);
        if (element !== null) element.removeClass('hidden');
    }

    public hide(nodeQuery: string): void {
        let element = this.paper.select(nodeQuery);
        if (element !== null) element.addClass('hidden');
    }

    public onClickAnywhere(handler: (event: MouseEvent) => void): void {
        this.paper.mousedown((event: MouseEvent) => {
            handler(event);
        });
    }

    public changeAttribute(nodeQuery: string, attribute: string, value: string) {
        let element = this.paper.select(nodeQuery);
        if (element === null) return;

        let attrObject: {[index: string]: string} = {};
        attrObject[attribute] = value;
        element.attr(attrObject);
    }

    public cutAndAppend(nodeQuery: string) {
        let element = this.paper.select(nodeQuery);
        if (element === null) return;

        this.paper.append(element);
    }

    public isReady(): boolean {
        return this.paper !== undefined && this.paper !== null;
    }

    public onClickOrTouch(nodeQuery: string, callback: (element: Snap.Element, event: MouseEvent) => void): void {
        let element = this.query(nodeQuery);
        if (element === null) return;

        if (Application.isMobile) {
            element.touchstart((event: MouseEvent) => {
                callback(element, event);
            });
        } else {
            element.click((event: MouseEvent) => {
                callback(element, event);
            });
        }

        element.mousedown(() => { return false; });
    }

    public static onClickOrTouchElement(element: Snap.Element, callback: (element: Snap.Element, event: MouseEvent) => void): void {
        if (element === undefined || element === null) return;

        if (Application.isMobile) {
            element.touchstart((event: MouseEvent) => {
                callback(element, event);
            });
        } else {
            element.click((event: MouseEvent) => {
                callback(element, event);
            });
        }

        element.mousedown(() => { return false; });
    }
}    

