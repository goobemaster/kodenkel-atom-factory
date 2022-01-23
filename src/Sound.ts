import { Application } from "./main";

export class Sound {
    private static instance: Sound;
    private musicAudio: HTMLAudioElement;
    private effectAudio: {[index: string]: HTMLAudioElement} = {};

    constructor() {
        this.effectAudio[SoundFX.APPLAUSE] = new Audio('assets/sound/' + SoundFX.APPLAUSE);
        this.effectAudio[SoundFX.SWOOSH] = new Audio('assets/sound/' + SoundFX.SWOOSH);
        this.effectAudio[SoundFX.BUTTON] = new Audio('assets/sound/' + SoundFX.BUTTON);
        this.effectAudio[SoundFX.MOVE] = new Audio('assets/sound/' + SoundFX.MOVE);
        this.effectAudio[SoundFX.ALARM] = new Audio('assets/sound/' + SoundFX.ALARM);
    }

    private static getInstance(): Sound {
        if (Sound.instance === undefined) Sound.instance = new Sound();
        return Sound.instance;
    }

    public static loopMusic(url: string): void {
        let sound = Sound.getInstance();
        
        if (sound.musicAudio !== undefined && sound.musicAudio instanceof HTMLAudioElement) {
            sound.musicAudio.pause();
            delete sound.musicAudio;
        }
        sound.musicAudio = new Audio('assets/music/' + url);
        sound.musicAudio.play();
        sound.musicAudio.onended = () => {
            setTimeout(() => {
                sound.musicAudio.play();
            }, 5000);
        };
    }

    public static playFX(effect: SoundFX): void {
        let sound = Sound.getInstance();
        if (!sound.effectAudio.hasOwnProperty(effect)) return;

        sound.effectAudio[effect].play();
    }
}

export enum SoundFX {
    APPLAUSE = 'applause-light-1-sound-effect-94406128.mp3',
    SWOOSH = 'energy-swoosh-11-sound-effect-58462525.mp3',
    BUTTON = 'japanese-button-4-sound-effect-81045533.mp3',
    MOVE = 'menu-button-2-sound-effect-33505250.mp3',
    ALARM = 'sci-fi-alarmbeep-32-sound-effect-13195801.mp3'
}