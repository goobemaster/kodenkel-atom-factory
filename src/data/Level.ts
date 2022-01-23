import { CachedJSONData } from "./CachedJSONData";
import { Molecule } from "./Molecule";

export class Level {
    public static readonly WIDTH: number = 30;
    public static readonly HEIGHT: number = 20;

    private level: number;
    private title: string;
    private blocks: LevelBlock[][];
    private portalX: number;
    private portalY: number;

    constructor(data: CachedJSONData, level: number) {
        this.level = level;
        let levelData = data.getObjectByKey(level.toString());
        this.title = levelData['title'] as string;

        // Blocks
        this.blocks = [];
        let blockData: string[] = levelData['map'] as string[];
        let blockRow: LevelBlock[];
        let atomData: {[index: string]: string[]} = levelData['atom'] as {};
        let charAtomRef: string;
        let atomConfig: {atom: Atom, bonds: Bonds};

        for (let y = 0; y < Level.HEIGHT; y++) {
            blockRow = [];
            for (let x = 0; x < Level.WIDTH; x++) {
                charAtomRef = Level.getCharAtomRef(blockData[y].charAt(x));
                atomConfig = null;
                if (charAtomRef !== null) atomConfig = Level.getAtomConfig(atomData, charAtomRef);

                blockRow.push({
                    type: Level.blockCharToType(blockData[y].charAt(x)),
                    atom: atomConfig === null ? Atom.NONE : atomConfig.atom,
                    bonds: atomConfig === null ? null : atomConfig.bonds
                });

                if (Level.blockCharToType(blockData[y].charAt(x)) === Block.PORTAL) {
                    this.portalX = x;
                    this.portalY = y;
                }
            }
            this.blocks.push(blockRow);
        }
    }

    public static blockCharToType(char: string): Block {
        let charAtomRef: string = Level.getCharAtomRef(char);

        if (charAtomRef === null) {
            return char.charAt(0) as Block;
        } else {
            return Block.ATOM;
        }
    }

    public static getCharAtomRef(char: string): string {
        let charCode: number = char.charCodeAt(0);

        if ((charCode >= 48 && charCode <= 57) || charCode === 81 || charCode === 87 || charCode === 98 || charCode === 109 || charCode === 110) {
            return char.charAt(0);
        } else {
            return null;
        }
    }

    public static getAtomConfig(atomData: {[index: string]: string[]}, atomRef: string): {atom: Atom, bonds: Bonds} {
        let atomConfig: {atom: Atom, bonds: Bonds} = {atom: atomData[atomRef.charAt(0)][0] as Atom, bonds: {
            top: BondType.NONE,
            topRight: BondType.NONE,
            right: BondType.NONE,
            bottomRight: BondType.NONE,
            bottom: BondType.NONE,
            bottomLeft: BondType.NONE,
            left: BondType.NONE,
            topLeft: BondType.NONE,
        }};

        atomData[atomRef.charAt(0)][1].split(',').forEach((bond: string) => {
            switch (bond.charAt(0) + bond.charAt(1)) {
                case 't ':
                    atomConfig.bonds.top = bond.charAt(2) as BondType;
                    break;
                case 'tr':
                    atomConfig.bonds.topRight = bond.charAt(2) as BondType;
                    break;                    
                case 'r ':
                    atomConfig.bonds.right = bond.charAt(2) as BondType;
                    break;
                case 'br':
                    atomConfig.bonds.bottomRight = bond.charAt(2) as BondType;
                    break;                    
                case 'b ':
                    atomConfig.bonds.bottom = bond.charAt(2) as BondType;
                    break;
                case 'bl':
                    atomConfig.bonds.bottomLeft = bond.charAt(2) as BondType;
                    break;                    
                case 'l ':
                    atomConfig.bonds.left = bond.charAt(2) as BondType;
                    break;
                case 'tl':
                    atomConfig.bonds.topLeft = bond.charAt(2) as BondType;
                    break;                    
                default:
                    console.error(`Unknown bonding site "${bond.charAt(0)}" for atom "${atomConfig.atom}"! Check your map.`);
            }
        });

        return atomConfig;
    }

    public getTitle(): string {
        return this.title;
    }

    public forEachBlockRow(callback: (value: LevelBlock[], index: number) => void) {
        this.blocks.forEach((value: LevelBlock[], index: number) => {
            callback(value, index);
        });
    }

    public isMoleculeAssembled(molecule: Molecule) {
        let moleculeWidth: number = molecule.getWidth();
        let moleculeHeight: number = molecule.getHeight();
        let moleculeBlocks: LevelBlock[][] = molecule.getBlocks();
        let levelBlock: LevelBlock;
        let moleculeBlock: LevelBlock;
        let matchingBlocks: number;
        let requiredBlocks: number = moleculeWidth * moleculeHeight;

        for (let y = 0; y < Level.HEIGHT; y++) {
            for (let x = 0; x < Level.WIDTH; x++) {
                matchingBlocks = 0;
                if (x + moleculeWidth >= Level.WIDTH || y + moleculeHeight >= Level.HEIGHT) continue;

                for (let my = 0; my < moleculeHeight; my++) {
                    for (let mx = 0; mx < moleculeWidth; mx++) {
                        levelBlock = this.blocks[y + my][x + mx];
                        moleculeBlock = moleculeBlocks[my][mx];

                        if (moleculeBlock.type === Block.VOID && levelBlock.type !== Block.ATOM) matchingBlocks++;
                        if (moleculeBlock.type === Block.ATOM && moleculeBlock.atom == levelBlock.atom && (
                            moleculeBlock.bonds.top == levelBlock.bonds.top ||
                            moleculeBlock.bonds.topRight == levelBlock.bonds.topRight ||
                            moleculeBlock.bonds.right == levelBlock.bonds.right ||
                            moleculeBlock.bonds.bottomRight == levelBlock.bonds.bottomRight ||
                            moleculeBlock.bonds.bottom == levelBlock.bonds.bottom ||
                            moleculeBlock.bonds.bottomLeft == levelBlock.bonds.bottomLeft ||
                            moleculeBlock.bonds.left == levelBlock.bonds.left ||
                            moleculeBlock.bonds.topLeft == levelBlock.bonds.topLeft)) {
                            matchingBlocks++;
                        }
                    }
                }

                if (matchingBlocks === requiredBlocks) return true;
            }
        }

        return false;
    }

    public isBlockEmpty(x: number, y: number) {
        if (x < 0 || y < 0 || x > Level.WIDTH || y > Level.HEIGHT) return false;
        let block = this.blocks[y][x];
        return block.type === Block.VOID || block.type === Block.EMPTY || block.type === Block.PORTAL || block.type === Block.TUNNEL;
    }

    public isBlockTunnel(x: number, y: number): boolean {
        return this.blocks[y][x].type === Block.TUNNEL;
    }

    public getPortalX(): number {
        return this.portalX;
    }

    public getPortalY(): number {
        return this.portalY;
    }

    public isBlockAtom(x: number, y: number) {
        return this.blocks[y][x].type === Block.ATOM;
    }

    public relocateAtom(originX: number, originY: number, targetX: number, targetY: number) {
        this.blocks[targetY][targetX] = JSON.parse(JSON.stringify(this.blocks[originY][originX]));

        let originBlock = this.blocks[originY][originX];
        originBlock.type = Block.EMPTY;
        originBlock.bonds = null;
        originBlock.atom = null;
    }

    public eraseWall(x: number, y: number): void {
        if (this.blocks[y][x].type !== Block.WALL) return;

        this.blocks[y][x].type = Block.EMPTY;
    }

    public placeTunnel(x: number, y: number): void {
        if (this.blocks[y][x].type !== Block.EMPTY) return;

        this.blocks[y][x].type = Block.TUNNEL;
    }
}

export interface LevelBlock {
    type: Block;
    atom: Atom;
    bonds: Bonds;
}

export interface Bonds {
    top: BondType,
    topRight: BondType,
    right: BondType,
    bottomRight: BondType,
    bottom: BondType,
    bottomLeft: BondType,
    left: BondType,
    topLeft: BondType
}

export enum Block {
    VOID = '.',
    BORDER = 'x',
    WALL = 'X',
    EMPTY = '◦',
    ATOM = '*',
    PORTAL = 'P',
    TUNNEL = 'T'
}

export enum Atom {
    NONE = '',
    CARBON = 'c',
    FLUORINE = 'f',
    HYDROGEN = 'h',
    NITROGEN = 'n',
    OXYGENE = 'o',
    SILICON = 's'
}

export enum BondType {
    NONE = '',
    SINGLE = 's',
    DOUBLE = 'd'
}