import { Application } from "../main";
import { SVGSurface } from "./SVGSurface";

export class Intro {
    private surface: SVGSurface;
    private slide: number = 1;

    constructor(surface: SVGSurface) {
        this.surface = surface;

        setTimeout(() => {
            this.surface.query('#skip').click(() => {
                this.tearDown();
                Application.onContinueGame();
            });
            this.surface.query('#skip-text').click(() => {
                this.tearDown();
                Application.onContinueGame();
            });
        }, 1000);

        this.surface.appendFragment(`assets/images/intro_1.svg`, 'slide');
        this.update();
    }

    public tearDown() {
        delete this.surface;
        this.slide = -1;
        document.querySelector('svg#scene').innerHTML = '';
    }

    public update() {
        setTimeout(() => {
            if (this.slide > -1) {
                this.slide++;
            
                if (this.slide <= 6) {
                    this.surface.remove('#slide');
                    this.surface.appendFragment(`assets/images/intro_${this.slide}.svg`, 'slide');
                    this.update();
                } else {
                    this.tearDown();
                    Application.onContinueGame();
                }
            }
        }, 12000);
    }
}