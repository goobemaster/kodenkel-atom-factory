import { CachedJSONData } from "../data/CachedJSONData";
import { Application } from "../main";
import { SVGSurface } from "./SVGSurface";

export class Title {
    private surface: SVGSurface;

    constructor(surface: SVGSurface, data: CachedJSONData) {
        this.surface = surface;

        document.querySelector('section#display').classList.add('title-bg');

        setTimeout(() => {
            this.surface.query('#start').click(() => {
                this.onStart(data);
            });
            this.surface.query('#start-text').click(() => {
                this.onStart(data);
            });        
            
            this.surface.query('#sound-box').click(() => {
                this.onToggleSound(data);
            });  
            this.surface.query('#sound-text').click(() => {
                this.onToggleSound(data);
            });    
            
            let userData = data.getObjectByKey('user');
            if (userData === undefined || userData === null) {
                data.addObject('user', {sound: '1'});
                data.save();
                this.updateSoundBox(true);
            } else {
                this.updateSoundBox(userData['sound'] === '1');
            }
        }, 1000);
    }

    public tearDown() {
        delete this.surface;
        document.querySelector('svg#scene').innerHTML = '';
        document.querySelector('section#display').classList.remove('title-bg');
    }

    private onStart(data: CachedJSONData) {
        let userData: {[index: string]: string|object} = data.getObjectByKey('user');
        if (userData === undefined || !Object.keys(userData).includes('level')) {
            Application.onNewGame();
        } else {
            Application.onContinueGame();
        }
    }

    private onToggleSound(data: CachedJSONData) {
        let userData = data.getObjectByKey('user');
        let soundOn: string = userData['sound'] as string;
        userData['sound'] = soundOn === '1' ? '0' : '1';
        data.save();
        this.updateSoundBox(soundOn === '0');
    }

    private updateSoundBox(on: boolean) {
        this.surface.setTextBackground('#sound-text tspan', on ? '✓' : '');
    }
}