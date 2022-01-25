import { TIMEOUT } from "dns";
import { Block, Level, Bonds, BondType, Atom } from "../data/Level";
import { Model } from "../data/Model";
import { Application, GameState } from "../main";
import { SVGSurface } from "./SVGSurface";

export class Presentation {
    private surface: SVGSurface;
    public arrows: ArrowControl;
    private model: Model;

    private atomClickX: number = null;
    private atomClickY: number = null;

    constructor(surface: SVGSurface, model: Model) {
        this.surface = surface;
        this.model = model;

        this.surface.onClickAnywhere((event) => {
            if (this.atomClickX === null || this.atomClickY === null ||
                (event.x > this.atomClickX - 32 && event.x < this.atomClickX + 32 && event.y > this.atomClickY - 32 && event.y < this.atomClickY + 32)) return;
            Application.onClickAnywhere();
        });
    }

    public update() {
        if (!this.surface.isReady()) return;

        // Molecule
        this.surface.setTextBackground(SVGSelector.MOLECULE_TEXT, this.model.getTitle());

        // Level
        this.surface.setTextBackground(SVGSelector.LEVEL_TEXT, this.model.getLevel().toString());

        // Time Left
        let timeLeft = this.model.getTimeLeft();
        let minutesLeft = Math.floor(timeLeft / 60);
        let secondsLeft = timeLeft - minutesLeft * 60;
        this.surface.setTextBackground(SVGSelector.TIME_TEXT, (minutesLeft < 10 ? '0' : '') + minutesLeft.toString() + ':' + (secondsLeft < 10 ? '0' : '') + secondsLeft.toString());

        // Score
        this.surface.setTextBackground(SVGSelector.SCORE_TEXT, this.model.getScore().toString());

        // Special
        if (!this.model.getSpecialEraser()) {
            this.surface.hide(SVGSelector.ERASER_ICON);
            this.surface.hide(SVGSelector.ERASER_TEXT);
        } else {
            this.surface.show(SVGSelector.ERASER_ICON);
            this.surface.show(SVGSelector.ERASER_TEXT);
        }
        if (!this.model.getSpecialTunnel()) {
            this.surface.hide(SVGSelector.TUNNEL_ICON);
            this.surface.hide(SVGSelector.TUNNEL_TEXT);
        } else {
            this.surface.show(SVGSelector.TUNNEL_ICON);
            this.surface.show(SVGSelector.TUNNEL_TEXT);
        }

        if (this.model.isGameState(GameState.LOAD)) this.buildMap();
    }

    public buildMap() {
        let level: Level = this.model.getLevelModel();
        let id: string;
        let translation: string;
        let atomQueue: {id: string, translation: string, bonds: Bonds, atom: Atom}[] = [];

        level.forEachBlockRow((row, y) => {
            for (let x = 0; x < Level.WIDTH; x++) {
                id = `b${x.toString()}-${y.toString()}`;
                translation = Presentation.getBlockTranslation(x, y);

                switch (row[x].type) {
                    case Block.VOID:
                        // Nothing to do.
                        break;
                    case Block.BORDER:
                        this.surface.prependFragment(`assets/images/block_border_${this.model.getLevel() % 7}.svg`, id, 'g', translation);
                        break;
                    case Block.WALL:
                        if (this.model.getSpecialEraser()) {
                            const blockTranslation = Presentation.getBlockTranslation(x, y);
                            this.surface.prependFragment('assets/images/block_wall.svg', id, 'g', translation, (element) => {
                                SVGSurface.onClickOrTouchElement(element, () => {
                                    if (this.model.isPlacingSpecialEraser()) {
                                        level.eraseWall(x, y);
                                        this.model.eraserSpecialPlaced();
                                        this.surface.remove(SVGSelector.ERASER_ICON);
                                        this.surface.remove(SVGSelector.ERASER_TEXT);
                                        element.remove();
                                        this.surface.prependFragment('assets/images/block_empty.svg', id, 'g', blockTranslation);
                                    }
                                });
                            });
                        } else {
                            this.surface.prependFragment('assets/images/block_wall.svg', id, 'g', translation);
                        }
                        break;
                    case Block.EMPTY:
                        if (this.model.getSpecialTunnel()) {
                            const blockTranslation = Presentation.getBlockTranslation(x, y);
                            this.surface.prependFragment('assets/images/block_empty.svg', id, 'g', translation, (element) => {
                                SVGSurface.onClickOrTouchElement(element, () => {
                                    if (this.model.isPlacingSpecialTunnel()) {
                                        level.placeTunnel(x, y);
                                        this.model.tunnelSpecialPlaced();
                                        this.surface.remove(SVGSelector.TUNNEL_ICON);
                                        this.surface.remove(SVGSelector.TUNNEL_TEXT);
                                        element.remove();
                                        this.surface.prependFragment('assets/images/block_tunnel.svg', 'btunnel', 'g', blockTranslation);
                                    }                                    
                                });
                            });
                        } else {
                            this.surface.prependFragment('assets/images/block_empty.svg', id, 'g', translation);
                        }
                        break;
                    case Block.ATOM:
                        atomQueue.push({
                            id: id,
                            translation: translation,
                            bonds: row[x].bonds,
                            atom: row[x].atom
                        });
                        break;
                    case Block.PORTAL:
                        this.surface.prependFragment('assets/images/block_portal.svg', id, 'g', translation);
                        break;
                    default:
                        console.error(`Unknown block type '${row[x].type}' at ${x.toString()},${y.toString()}. Skipping.`);
                }
            }
        });

        for (let i = 0; i < atomQueue.length; i++) {
            let atomData = atomQueue[i];
            this.surface.prependFragment('assets/images/block_empty.svg', atomData.id, 'g', atomData.translation);
            this.surface.appendFragment('assets/images/atom_' + atomData.atom + '.svg', atomData.id.replace('b', 'a'), 'g', atomData.translation, false, (element) => {
                element.mousedown((event: MouseEvent) => {
                    this.atomClickX = event.x;
                    this.atomClickY = event.y;
                    let idCoords: string[] = element.attr('id').replace('a', '').split('-');
                    Application.onClickAtom(parseInt(idCoords[0]), parseInt(idCoords[1]));
                });
                element.attr({class: 'pointer'});
            });
            this.buildBonds(atomData.bonds, atomData.translation, atomData.id);
        }
        this.arrows = new ArrowControl(this.surface);
        this.surface.appendFragment(`assets/images/molecule_box_${this.model.getLevel().toString()}.svg`, SVGSelector.MOLECULE_BOX, 'g');

        // Special messages
        if (this.model.getLevel() === 4) {
            this.showEraserSpecialMessage();
        } else if (this.model.getLevel() === 8) {
            this.showPortalSpecialMessage();
        }

        // Specials
        if (this.model.getSpecialEraser()) {
            this.surface.onClickOrTouch(SVGSelector.ERASER_ICON, () => {
                this.model.startPlacingEraserSpecial();
            });
        }
        if (this.model.getSpecialTunnel()) {
            this.surface.onClickOrTouch(SVGSelector.TUNNEL_ICON, () => {
                this.model.startPlacingTunnelSpecial();
            });
        }

        this.model.setLoadFinishedState();
    }

    private buildBonds(bonds: Bonds, translation: string, id: string) {
        this.buildBond(bonds.top, 't', translation, id);
        this.buildBond(bonds.topRight, 'tr', translation, id);
        this.buildBond(bonds.right, 'r', translation, id);
        this.buildBond(bonds.bottomRight, 'br', translation, id);
        this.buildBond(bonds.bottom, 'b', translation, id);
        this.buildBond(bonds.bottomLeft, 'bl', translation, id);
        this.buildBond(bonds.left, 'l', translation, id);
        this.buildBond(bonds.topLeft, 'tl', translation, id);
    }

    private buildBond(type: BondType, site: string, translation: string, id: string) {
        if (type === BondType.NONE) return;

        this.surface.appendFragment(`assets/images/bond_${type as string}_${site}.svg`, id.replace('b', 'ab' + site), 'g', translation);
    }

    public tearDown() {
        let level: Level = this.model.getLevelModel();
        if (level === undefined) return;
        let id: string;

        level.forEachBlockRow((row, y) => {
            for (let x = 0; x < Level.WIDTH; x++) {
                id = `#b${x.toString()}-${y.toString()}`;

                switch (row[x].type) {
                    case Block.VOID:
                        // Nothing to do.
                        break;
                    case Block.BORDER:
                        this.surface.remove(id);
                        break;
                    case Block.WALL:
                        this.surface.remove(id);
                        break;
                    case Block.EMPTY:
                        this.surface.remove(id);
                        break;
                    case Block.ATOM:
                        this.surface.remove(id);
                        this.surface.remove(id.replace('b', 'a'));
                        this.surface.remove(id.replace('b', 'abt'));
                        this.surface.remove(id.replace('b', 'abtr'));
                        this.surface.remove(id.replace('b', 'abr'));
                        this.surface.remove(id.replace('b', 'abbr'));
                        this.surface.remove(id.replace('b', 'abb'));
                        this.surface.remove(id.replace('b', 'abbl'));
                        this.surface.remove(id.replace('b', 'abl'));
                        this.surface.remove(id.replace('b', 'abtl'));
                        break;
                    case Block.TUNNEL:
                        this.surface.remove('#btunnel');
                        break;
                    case Block.PORTAL:
                        this.surface.remove(id);
                        break;
                    default:
                        console.error(`Unknown block type '${row[x].type}' at ${x.toString()},${y.toString()}. Skipping.`);
                }
            }
        });

        this.surface.removeAll('#defs4899');
        this.surface.removeAll('#defs2');
        this.surface.removeAll('defs');
        this.surface.remove('#' + SVGSelector.MOLECULE_BOX);
        this.surface.remove('#passed');
        this.surface.remove('#failed');
        let portalX = this.model.levelModel.getPortalX();
        let portalY = this.model.levelModel.getPortalY();
        if (portalX !== undefined) this.surface.remove(`#b${portalX}-${portalY}`);
        this.surface.remove(`#btunnel`);
        this.arrows.tearDown();
        this.surface.cleanDefs();
    }

    public static getBlockTranslation(x: number, y: number) {
        let pos = Presentation.getBlockTranslationXY(x, y);
        return `s6,6t${pos.x.toString()},${pos.y.toString()}`;
    }

    public static getBlockTranslationXY(x: number, y: number): {x: number, y: number} {
        return {
            x: x * 5.22 + 40,
            y: y * 5.22 - 285
        };
    }

    public moveAtom(originX: number, originY: number, target: {x: number, y: number}): void {
        let targetTranslation: {x: number, y: number} = Presentation.getBlockTranslationXY(target.x, target.y);

        ['a', 'abt', 'abtr', 'abr', 'abbr', 'abb', 'abbl', 'abl', 'abtl'].forEach((idSignature: string) => {
            let originId: string = `#${idSignature}${originX.toString()}-${originY.toString()}`;
            let targetId: string = `${idSignature}${target.x.toString()}-${target.y.toString()}`;
            this.surface.transformXY(originId, targetTranslation, 6);
            this.surface.changeAttribute(originId, 'id', targetId);
            this.surface.cutAndAppend('#' + targetId);
        });
    }

    public showLevelPassedMessage(): void {
        this.surface.appendFragment('assets/images/passed.svg', 'passed', 'g', null, false, (element) => {
            SVGSurface.onClickOrTouchElement(element, () => {
                Application.onNextLevel();
            });
        });
    }

    public showLevelFailedMessage(): void {
        this.surface.appendFragment('assets/images/failed.svg', 'failed', 'g', null, false, (element) => {
            SVGSurface.onClickOrTouchElement(element, () => {
                Application.onNextLevel();
            });
        });
    }

    public showEraserSpecialMessage(): void {
        this.surface.appendFragment('assets/images/special_1.svg', 'eraser-message', 'g', null, false, (element) => {
            SVGSurface.onClickOrTouchElement(element, () => {
                Application.onStartLevelTimer();
                this.surface.remove(SVGSelector.ERASER_MESSAGE);
            });
        });
    }

    public showPortalSpecialMessage(): void {
        this.surface.appendFragment('assets/images/special_2.svg', 'portal-message', 'g', null, false, (element) => {
            SVGSurface.onClickOrTouchElement(element, () => {
                Application.onStartLevelTimer();
                this.surface.remove(SVGSelector.PORTAL_MESSAGE);
            });
        });
    }

    public showGameWonMessage(finalScore: number): void {
        this.surface.removeAll('g');
        this.surface.appendFragment('assets/images/won.svg', 'won', 'g', null, false, (element) => {
            SVGSurface.onClickOrTouchElement(element.select(SVGSelector.SKIP), () => {
                document.location.reload();
            });
            SVGSurface.onClickOrTouchElement(element.select(SVGSelector.SKIP_TEXT), () => {
                document.location.reload();
            });
            element.select(SVGSelector.FINAL_SCORE).node.textContent = finalScore.toString();
        });
    }
}

enum SVGSelector {
    MOLECULE_TEXT = 'text#molecule-name tspan',
    MOLECULE_BOX = 'molecule-box',
    LEVEL_TEXT = 'text#level tspan',
    TIME_TEXT = 'text#time tspan',
    SCORE_TEXT = 'text#score tspan',
    ERASER_ICON = '#eraser',
    ERASER_TEXT = '#eraser-text',
    TUNNEL_ICON = '#tunnel',
    TUNNEL_TEXT = '#tunnel-text',
    FINAL_SCORE = '#final-score tspan',
    SKIP_TEXT = '#skip-text',
    SKIP = '#skip',
    ERASER_MESSAGE = '#eraser-message',
    PORTAL_MESSAGE = '#portal-message',

    ARROW_UP = '#arrow-u',
    ARROW_RIGHT = '#arrow-r',
    ARROW_DOWN = '#arrow-d',
    ARROW_LEFT = '#arrow-l',
}

class ArrowControl {
    private surface: SVGSurface;
    private blockX: number;
    private blockY: number;

    constructor(surface: SVGSurface) {
        this.surface = surface;
        this.blockX = 6;
        this.blockY = 4;

        this.surface.appendFragment('assets/images/arrow_u.svg', 'arrow-u', 'g', 's6,6', true, (element) => {
            element.mousedown(() => {
                Application.onClickArrow(ArrowDirection.UP);
            });
        });
        this.surface.appendFragment('assets/images/arrow_r.svg', 'arrow-r', 'g', 's6,6', true, (element) => {
            element.mousedown(() => {
                Application.onClickArrow(ArrowDirection.RIGHT);
            });
        });
        this.surface.appendFragment('assets/images/arrow_d.svg', 'arrow-d', 'g', 's6,6', true, (element) => {
            element.mousedown(() => {
                Application.onClickArrow(ArrowDirection.DOWN);
            });
        });
        this.surface.appendFragment('assets/images/arrow_l.svg', 'arrow-l', 'g', 's6,6', true, (element) => {
            element.mousedown(() => {
                Application.onClickArrow(ArrowDirection.LEFT);
            });
        });
    }

    public showAtBlock(x: number, y: number, up: boolean, right: boolean, down: boolean, left: boolean) {
        this.blockX = x;
        this.blockY = y;

        if (up) this.surface.show(SVGSelector.ARROW_UP);
        if (right) this.surface.show(SVGSelector.ARROW_RIGHT);
        if (down) this.surface.show(SVGSelector.ARROW_DOWN);
        if (left) this.surface.show(SVGSelector.ARROW_LEFT);

        this.surface.transformXY(SVGSelector.ARROW_UP, Presentation.getBlockTranslationXY(this.blockX, this.blockY - 1), 6);
        this.surface.transformXY(SVGSelector.ARROW_RIGHT, Presentation.getBlockTranslationXY(this.blockX + 1, this.blockY), 6);
        this.surface.transformXY(SVGSelector.ARROW_DOWN, Presentation.getBlockTranslationXY(this.blockX, this.blockY + 1), 6);
        this.surface.transformXY(SVGSelector.ARROW_LEFT, Presentation.getBlockTranslationXY(this.blockX - 1, this.blockY), 6);
    }

    public hide() {
        this.surface.hide(SVGSelector.ARROW_UP);
        this.surface.hide(SVGSelector.ARROW_RIGHT);
        this.surface.hide(SVGSelector.ARROW_DOWN);
        this.surface.hide(SVGSelector.ARROW_LEFT);
    }

    public tearDown() {
        this.surface.remove(SVGSelector.ARROW_UP);
        this.surface.remove(SVGSelector.ARROW_RIGHT);
        this.surface.remove(SVGSelector.ARROW_DOWN);
        this.surface.remove(SVGSelector.ARROW_LEFT);
    }
}

export enum ArrowDirection {
    UP, RIGHT, DOWN, LEFT
}