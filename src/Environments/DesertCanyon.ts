import { IEnvironment, IEnvironmentSurfaceColor, IEnvironmentSurfaceTexture, IEnvironmentTerrainLayer } from "./Environment";

/*
    & Desert Canyons
*/
    export class DesertCanyons implements IEnvironment {
        surfaceColors: IEnvironmentSurfaceColor[];
        surfaceTextures: IEnvironmentSurfaceTexture[];
        terrainLayers: IEnvironmentTerrainLayer[];
        waterLevel: number = 10;

        constructor() {
            this.surfaceColors = [
                {
                    minThreshold: 0,
                    maxThreshold: 0.18,
                    callback: () => [88,2,1] 
                },
                {
                    minThreshold: 0.18,
                    maxThreshold: 0.21,
                    callback: () => [254,243,223] 
                },
                {
                    minThreshold: 0.21,
                    maxThreshold: 0.37,
                    callback: () => [171,0,104] 
                },
                {
                    minThreshold: 0.37,
                    maxThreshold: 0.42,
                    callback: () => [254,243,223] 
                },
                {
                    minThreshold: 0.42,
                    maxThreshold: 0.58,
                    callback: () => [224,7,2] 
                },
                {
                    minThreshold: 0.58,
                    maxThreshold: 0.61,
                    callback: () => [254,243,223] 
                },
                {
                    minThreshold: 0.61,
                    maxThreshold: 0.77,
                    callback: () => [255,108,2] 
                },
                {
                    minThreshold: 0.77,
                    maxThreshold: 0.84,
                    callback: () => [254,243,223] 
                },
                {
                    minThreshold: 0.84,
                    maxThreshold: 0.97,
                    callback: () => [254,193,6] 
                },
                {
                    minThreshold: 0.97,
                    maxThreshold: 1,
                    callback: () => [254,243,223] 
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
                    minThreshold: 0.0,
                    maxThreshold: 0.2,
                    mapHeight: 10,
                    mapScale: 1,
                    mapPower: 1
                },
                {
                    minThreshold: 0.2,
                    maxThreshold: 0.3,
                    mapHeight: 8,
                    mapScale: 5,
                    mapPower: 4
                },
                {
                    minThreshold: 0.3,
                    maxThreshold: 0.4,
                    mapHeight: 2,
                    mapScale: 1,
                    mapPower: 1
                },
                {
                    minThreshold: 0.4,
                    maxThreshold: 0.5,
                    mapHeight: 8,
                    mapScale: 5,
                    mapPower: 4
                },
                {
                    minThreshold: 0.5,
                    maxThreshold: 0.6,
                    mapHeight: 2,
                    mapScale: 1,
                    mapPower: 1
                },
                {
                    minThreshold: 0.6,
                    maxThreshold: 0.7,
                    mapHeight: 8,
                    mapScale: 5,
                    mapPower: 4
                },
                {
                    minThreshold: 0.7,
                    maxThreshold: 0.8,
                    mapHeight: 2,
                    mapScale: 1,
                    mapPower: 1
                },
                {
                    minThreshold: 0.8,
                    maxThreshold: 0.9,
                    mapHeight: 8,
                    mapScale: 5,
                    mapPower: 4
                },
                {
                    minThreshold: 0.9,
                    maxThreshold: 1,
                    mapHeight: 2,
                    mapScale: 1,
                    mapPower: 1
                }
            ];
        }

        static instance() {
            return new DesertCanyons();
        }
    }