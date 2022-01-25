
import { CachedJSONData } from './data/CachedJSONData';
import { Model } from './data/Model';
import { Intro } from './graphics/Intro';
import { ArrowDirection, Presentation } from './graphics/Presentation';
import { SVGSurface } from './graphics/SVGSurface';
import { Title } from './graphics/Title';
import { Sound, SoundFX } from './Sound';
import { UserAgent } from './UserAgent';

export class Application {
  private static CHEAT_MODE = false;
  private static SVG_WIDTH: number = 1280;
  private static SVG_HEIGHT: number = 720;
  public static isMobile: boolean = UserAgent.hasTouchScreen();
  private static data: CachedJSONData;
  private static title: Title;
  private static intro: Intro;
  private static presentation: Presentation;
  private static model: Model;
  private static passed: boolean;

  constructor() {
    Application.data = new CachedJSONData('atom-factory-data.json', (data: CachedJSONData) => {
      Application.model = new Model(data);

      if (Application.isMobile) {
        window.addEventListener('deviceorientation', () => {
          this.onDeviceOrientation();
        }, true);
        this.onDeviceOrientation();
      }

      this.loadTitle(data);
    });

    if (Application.CHEAT_MODE) {
      document.querySelector('body').onkeyup = (event: KeyboardEvent) => {
        if (event.key === 'q') {
          Application.passed = true;
          Application.onLevelPassed();
        }
      };
    }
  }

  private static update() {
    setTimeout(() => {
      Application.presentation.update();

      if (!Application.passed) {
        Application.model.decTimeLeft();
        Application.update();

        if (Application.model.getTimeLeft() === 0) {
          if (Application.isSoundOn()) Sound.playFX(SoundFX.ALARM);
          Application.passed = true;
          Application.onLevelFailed();
        }
      }
    }, 1000);
  }

  private static loadLevel(level: number) {
    if (Application.presentation === undefined) {
      Application.presentation = new Presentation(
        new SVGSurface('scene', 'assets/images/scene.svg', Application.SVG_WIDTH, Application.SVG_HEIGHT),
        Application.model
      );
    } else {
      Application.presentation.tearDown();
    }

    Application.model.loadLevel(level);

    Application.passed = false;

    if (Application.isSoundOn()) {
      let musicFiles: string[] = Application.data.getArrayByKey('music') as [];
      Sound.loopMusic(musicFiles[(level % 7) - 1]);
    }

    Application.update();
  }

  private loadTitle(data: CachedJSONData) {
    Application.title = new Title(new SVGSurface('scene', 'assets/images/title.svg', Application.SVG_WIDTH, Application.SVG_HEIGHT), data);
  }

  public static onNewGame() {
    Application.title.tearDown();
    Application.data.getObjectByKey('user')['level'] = '1';
    Application.data.getObjectByKey('user')['score'] = '0';
    Application.data.save();
    Application.intro = new Intro(new SVGSurface('scene', 'assets/images/intro_bg.svg', Application.SVG_WIDTH, Application.SVG_HEIGHT));
  }

  public static onContinueGame() {
    Application.title.tearDown();
    delete Application.intro;

    let userData = Application.data.getObjectByKey('user');
    Application.model.setScore(parseInt(userData['score'] as string));
    Application.loadLevel(parseInt(userData['level'] as string));
  }

  public static onStartLevelTimer() {
    Application.passed = false;
  }

  private onDeviceOrientation() {
    let portrait: boolean = window.innerHeight > window.innerWidth;

    let headerElement: HTMLElement = document.querySelector('header');
    headerElement.style.display = portrait ? 'block' : 'none';
  }

  public static onClickAtom(blockX: number, blockY: number) {
    if (Application.passed) return;

    if (Application.isSoundOn()) Sound.playFX(SoundFX.BUTTON);

    Application.presentation.arrows.hide();

    Application.presentation.arrows.showAtBlock(blockX, blockY,
      Application.model.levelModel.isBlockEmpty(blockX, blockY - 1),
      Application.model.levelModel.isBlockEmpty(blockX + 1, blockY),
      Application.model.levelModel.isBlockEmpty(blockX, blockY + 1),
      Application.model.levelModel.isBlockEmpty(blockX - 1, blockY)
    );

    Application.model.selectedBlockX = blockX;
    Application.model.selectedBlockY = blockY;
  }

  public static onClickArrow(direction: ArrowDirection) {
    if (Application.passed) return;

    let target: {x: number, y: number} = Application.model.moveAtom(Application.model.selectedBlockX, Application.model.selectedBlockY, direction);
    if (target === null || target.x === null || target.y === null) return;

    if (Application.isSoundOn()) Sound.playFX(SoundFX.MOVE);
    Application.presentation.moveAtom(Application.model.selectedBlockX, Application.model.selectedBlockY, target);

    Application.presentation.arrows.hide();

    if (Application.model.levelModel.isMoleculeAssembled(Application.model.getMolecule())) {
      Application.onLevelPassed();
    }
  }

  public static onClickAnywhere() {
    Application.presentation.arrows.hide();
  }

  private static onLevelPassed() {
    if (Application.isSoundOn()) Sound.playFX(SoundFX.APPLAUSE);

    Application.passed = true;
    Application.presentation.showLevelPassedMessage();

    let userData = Application.data.getObjectByKey('user');
    userData['level'] = (parseInt(userData['level'] as string) + 1).toString();
    userData['score'] = (parseInt(userData['score'] as string) + Application.model.getTimeLeft()).toString();
    Application.data.save();
    Application.model.setScore(parseInt(userData['score']));
  }

  public static onNextLevel() {
    let level = Application.data.getObjectByKey('user')['level'] as string;
    if (level === '15') {
      Application.presentation.tearDown();
      Application.presentation.showGameWonMessage(parseInt(Application.data.getObjectByKey('user')['score'] as string));
      let userData = Application.data.getObjectByKey('user');
      userData['level'] = '14';
      Application.data.save();
    } else {
      Application.presentation.tearDown();
      Application.loadLevel(parseInt(level));
    }
  }

  private static onLevelFailed() {
    Application.presentation.showLevelFailedMessage();
  }

  public static isSoundOn(): boolean {
    return Application.data.getObjectByKey('user')['sound'] === '1';
  }
}

export enum GameState {
  LOAD,
  PLAY
}
