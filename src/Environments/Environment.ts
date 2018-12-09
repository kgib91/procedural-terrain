
    export interface ISurfaceColorCallback {
        (data: Float32Array, amount: number, j: number, width: number): number[];
    }

    export interface IEnvironmentSurfaceColor {
        minThreshold: number;
        maxThreshold: number;
        callback: ISurfaceColorCallback;
    }

    export interface ISurfaceTextureCallback {
        (data: Float32Array, j: number, x: number, y: number): number;
    }

    export interface IEnvironmentSurfaceTexture {
        minThreshold: number;
        maxThreshold: number;
        callback: ISurfaceTextureCallback;
    }

    export interface IEnvironmentTerrainLayer {
        minThreshold: number;
        maxThreshold: number;
        mapHeight: number;
        mapScale: number;
        mapPower: number;
    }

    export interface IEnvironmentRegionCheckCallback {
        (x: number, y: number): number;
    }

    export interface IEnvironment {
        surfaceColors: IEnvironmentSurfaceColor[];
        surfaceTextures: IEnvironmentSurfaceTexture[];
        terrainLayers: IEnvironmentTerrainLayer[];
        waterLevel?: number;
    }