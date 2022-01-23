import { CachedJSONData } from "./CachedJSONData";
import { Atom, Bonds, Level, LevelBlock, Block } from "./Level";

export class Molecule {
    private width: number;
    private height: number;
    private blocks: LevelBlock[][];

    constructor(data: CachedJSONData, level: number) {
        let levelData = data.getObjectByKey(level.toString());
        let shape: string[] = levelData['molecule'] as string[];
        this.height = shape.length;
        this.width = shape[0].length;

        this.blocks = [];
        let blockRow: LevelBlock[];
        let atomData: {[index: string]: string[]} = levelData['atom'] as {};
        let charAtomRef: string;
        let atomConfig: {atom: Atom, bonds: Bonds};

        for (let y = 0; y < this.height; y++) {
            blockRow = [];
            for (let x = 0; x < this.width; x++) {
                charAtomRef = Level.getCharAtomRef(shape[y].charAt(x));
                if (charAtomRef === null) {
                    blockRow.push({
                        type: Block.VOID,
                        atom: null,
                        bonds: null
                    });
                    continue;
                }

                atomConfig = Level.getAtomConfig(atomData, charAtomRef);

                blockRow.push({
                    type: Level.blockCharToType(shape[y].charAt(x)),
                    atom: atomConfig === null ? Atom.NONE : atomConfig.atom,
                    bonds: atomConfig === null ? null : atomConfig.bonds
                });
            }
            this.blocks.push(blockRow);
        }
    }

    public getBlocks(): LevelBlock[][] {
        return this.blocks;
    }

    public getWidth(): number {
        return this.width;
    }

    public getHeight(): number {
        return this.height;
    }
}