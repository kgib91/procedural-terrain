import { IEnvironment, IEnvironmentSurfaceColor, IEnvironmentSurfaceTexture, IEnvironmentTerrainLayer } from "./Environment";

/*
    & Rocky Oceans
*/
export class RockyOceans implements IEnvironment {
    surfaceColors: IEnvironmentSurfaceColor[];
    surfaceTextures: IEnvironmentSurfaceTexture[];
    terrainLayers: IEnvironmentTerrainLayer[];

    constructor() {
        this.surfaceColors = [
            {
                minThreshold: 0,
                maxThreshold: 1,
                callback: () => [128,128,128] 
            }
        ];

        this.surfaceTextures = [
            {
                minThreshold: 0,
                maxThreshold: 1,
                callback: (data,j) => data[j]
            }
        ];

        this.terrainLayers = [
            {
                minThreshold: 0,
                maxThreshold: 1,
                mapHeight: 64,
                mapScale: 2,
                mapPower: 4
            }
        ];
    }

    static instance() {
        return new RockyOceans();
    }
}