import { IEnvironment, IEnvironmentSurfaceColor, IEnvironmentSurfaceTexture, IEnvironmentTerrainLayer } from "./Environment";

/*
    & Bluffs
*/
    export class Bluffs implements IEnvironment {
        surfaceColors: IEnvironmentSurfaceColor[];
        surfaceTextures: IEnvironmentSurfaceTexture[];
        terrainLayers: IEnvironmentTerrainLayer[];

        constructor() {
            this.surfaceColors = [
                {
                    minThreshold: 0.0,
                    maxThreshold: 0.15,
                    callback: () => [254,243,223] 
                },
                {
                    minThreshold: 0.15,
                    maxThreshold: 0.95,
                    callback: () => [128,128,128] 
                },
                {
                    minThreshold: 0.95,
                    maxThreshold: 1,
                    callback: () => [0,128,0] 
                }
            ];

            this.surfaceTextures = [
                {
                    minThreshold: 0.8,
                    maxThreshold: 1,
                    callback: (data,j) => data[j]
                },
                {
                    minThreshold: 0.3,
                    maxThreshold: 0.8,
                    callback: (data,j) => {
                        return (Math.floor(data[j] / 5) * 5);
                    }
                },
                {
                    minThreshold: 0,
                    maxThreshold: 0.3,
                    callback: (data,j,x,y) => {
                        return data[j];
                    }
                }
            ];

            this.terrainLayers = [
                {
                    minThreshold: 0,
                    maxThreshold: 0.25,
                    mapHeight: 8,
                    mapScale: 2,
                    mapPower: 1
                },
                {
                    minThreshold: 0.25,
                    maxThreshold: 0.5,
                    mapHeight: 8,
                    mapScale: 2,
                    mapPower: 1
                },
                {
                    minThreshold: 0.5,
                    maxThreshold: 0.75,
                    mapHeight: 48,
                    mapScale: 1,
                    mapPower: 0.75
                },
                {
                    minThreshold: 0.75,
                    maxThreshold: 1,
                    mapHeight: 4,
                    mapScale: 4,
                    mapPower: 2
                },
            ];
        }

        static instance() {
            return new Bluffs();
        }
    }