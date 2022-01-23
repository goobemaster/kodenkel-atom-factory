import { ArrowDirection } from "../graphics/Presentation";
import { GameState } from "../main";
import { CachedJSONData } from "./CachedJSONData";
import { Level } from "./Level";
import { Molecule } from "./Molecule";

export class Model {
    private readonly data: CachedJSONData;
    private state: GameState;

    private title: string;
    private level: number;
    private timeLeft: number;
    private score: number;

    public levelModel: Level;
    private moleculeModel: Molecule;

    public selectedBlockX: number;
    public selectedBlockY: number;

    private specialEraser: boolean;
    private specialTunnel: boolean;
    private specialPlacementEraser: boolean;
    private specialPlacementTunnel: boolean;

    constructor(data: CachedJSONData) {
        this.data = data;

        this.state = GameState.LOAD;
        this.title = '';
        this.level = 1;
        this.timeLeft = 900;
        this.score = 0;
        this.selectedBlockX = 0;
        this.selectedBlockY = 0;
        this.specialEraser = false;
        this.specialTunnel = false;
        this.specialPlacementEraser = false;
        this.specialPlacementTunnel = false;
    }

    public loadLevel(level: number) {
        this.state = GameState.LOAD;
        this.title = this.data.getObjectByKey(level.toString())['title'] as string;
        this.level = level;
        this.timeLeft = 900;
        this.selectedBlockX = 0;
        this.selectedBlockY = 0;
        let special: string = this.data.getObjectByKey(level.toString())['special'] as string;
        this.specialEraser = special.includes('e');
        this.specialTunnel = special.includes('t');
        this.specialPlacementEraser = false;
        this.specialPlacementTunnel = false;

        this.levelModel = new Level(this.data, this.level);
        this.moleculeModel = new Molecule(this.data, this.level);
    }

    public getTitle(): string {
        return this.title;
    }

    public getLevel(): number {
        return this.level;
    }

    public getTimeLeft(): number {
        return this.timeLeft;
    }

    public decTimeLeft(): void {
        if (this.timeLeft > 0) this.timeLeft--;
    }

    public getScore(): number {
        return this.score;
    }

    public setScore(score: number): void {
        this.score = score;
    }

    public getSpecialEraser(): boolean {
        return this.specialEraser;
    }

    public getSpecialTunnel(): boolean {
        return this.specialTunnel;
    }

    public isPlacingSpecialEraser(): boolean {
        return this.specialPlacementEraser;
    }

    public isPlacingSpecialTunnel(): boolean {
        return this.specialPlacementTunnel;
    }

    public startPlacingEraserSpecial(): void {
        this.specialPlacementEraser = true;
    }

    public startPlacingTunnelSpecial(): void {
        this.specialPlacementTunnel = true;
    }

    public eraserSpecialPlaced(): void {
        this.specialPlacementEraser = false;
        this.specialEraser = false;
    }

    public tunnelSpecialPlaced(): void {
        this.specialPlacementTunnel = false;
        this.specialTunnel = false;
    }

    public isGameState(checkState: GameState): boolean {
        return this.state === checkState;
    }

    public setLoadFinishedState(): void {
        this.state = GameState.PLAY;
    }

    public getLevelModel(): Level {
        return this.levelModel;
    }

    public moveAtom(originX: number, originY: number, direction: ArrowDirection): {x: number, y: number} {
        if (!this.levelModel.isBlockAtom(originX, originY)) return null;

        let target: {x: number, y: number} = {x: null, y: null};
        switch (direction) {
            case ArrowDirection.UP:
                for (let y = originY - 1; y >= 0; y--) {
                    if (this.levelModel.isBlockTunnel(originX, y)) {
                        target.x = this.levelModel.getPortalX();
                        target.y = this.levelModel.getPortalY();
                        break;
                    }
                    if (!this.levelModel.isBlockEmpty(originX, y)) {
                        target.x = originX;
                        target.y = y + 1;
                        break;
                    }
                }
                break;
            case ArrowDirection.RIGHT:
                for (let x = originX + 1; x <= Level.WIDTH; x++) {
                    if (this.levelModel.isBlockTunnel(x, originY)) {
                        target.x = this.levelModel.getPortalX();
                        target.y = this.levelModel.getPortalY();
                        break;
                    }
                    if (!this.levelModel.isBlockEmpty(x, originY)) {
                        target.x = x - 1;
                        target.y = originY;
                        break;
                    }
                }
                break;
            case ArrowDirection.DOWN:
                for (let y = originY + 1; y <= Level.HEIGHT; y++) {
                    if (this.levelModel.isBlockTunnel(originX, y)) {
                        target.x = this.levelModel.getPortalX();
                        target.y = this.levelModel.getPortalY();
                        break;
                    }
                    if (!this.levelModel.isBlockEmpty(originX, y)) {
                        target.x = originX;
                        target.y = y - 1;
                        break;
                    }
                }
                break;
            case ArrowDirection.LEFT:
                for (let x = originX - 1; x >= 0; x--) {
                    if (this.levelModel.isBlockTunnel(x, originY)) {
                        target.x = this.levelModel.getPortalX();
                        target.y = this.levelModel.getPortalY();
                        break;
                    }
                    if (!this.levelModel.isBlockEmpty(x, originY)) {
                        target.x = x + 1;
                        target.y = originY;
                        break;
                    }
                }                
                break;
            default:
                console.error(`Unknown direction to move atom at ${originX},${originY} !`);
        }

        // In case, portal is occupied!
        if (this.levelModel.isBlockAtom(target.x, target.y)) return null;

        this.levelModel.relocateAtom(originX, originY, target.x, target.y);

        return target;
    }

    public getMolecule(): Molecule {
        return this.moleculeModel;
    }
}