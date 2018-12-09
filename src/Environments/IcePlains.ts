import { IEnvironment, IEnvironmentSurfaceColor, IEnvironmentSurfaceTexture, IEnvironmentTerrainLayer } from "./Environment";

/*
    & Ice Plains
*/
    export class IcePlains implements IEnvironment {
        surfaceColors: IEnvironmentSurfaceColor[];
        surfaceTextures: IEnvironmentSurfaceTexture[];
        terrainLayers: IEnvironmentTerrainLayer[];

        constructor() {
            this.surfaceColors = [
                {
                    minThreshold: 0,
                    maxThreshold: 0.15,
                    callback: () => [0,107,206] 
                },
                {
                    minThreshold: 0.15,
                    maxThreshold: 0.23,
                    callback: () => [180,207,250] 
                },
                {
                    minThreshold: 0.23,
                    maxThreshold: 1,
                    callback: () => [255,255,255] 
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
                    maxThreshold: 0.5,
                    mapHeight: 8,
                    mapScale: 1,
                    mapPower: 8
                },
                {
                    minThreshold: 0.5,
                    maxThreshold: 1,
                    mapHeight: 32,
                    mapScale: 0.25,
                    mapPower: 1
                }
               ];
        }

        static instance() {
            return new IcePlains();
        }
    }