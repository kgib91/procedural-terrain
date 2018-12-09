import { IEnvironment, IEnvironmentSurfaceColor, IEnvironmentSurfaceTexture, IEnvironmentTerrainLayer } from "./Environment";

/*
    & Test
*/
export class TestTerrain implements IEnvironment {
    surfaceColors: IEnvironmentSurfaceColor[];
    surfaceTextures: IEnvironmentSurfaceTexture[];
    terrainLayers: IEnvironmentTerrainLayer[];

    constructor(color: number[], striped: boolean = false) {
        this.surfaceColors = [
            {
                minThreshold: 0,
                maxThreshold: 1,
                callback: () => color 
            }
        ];

        var surfaceFunction = (data,j) =>
            (striped && ((j * 0.25)|0) % 2 == 0 ? 1 : 0.95) * data[j];

        this.surfaceTextures = [
            {
                minThreshold: 0,
                maxThreshold: 1,
                callback: surfaceFunction
            }
        ];

        this.terrainLayers = [
            {
                minThreshold: 0,
                maxThreshold: 1,
                mapHeight: 64,
                mapScale: 1,
                mapPower: 1
            }
        ];
    }
}