import { IEnvironment, IEnvironmentSurfaceColor, IEnvironmentSurfaceTexture, IEnvironmentTerrainLayer } from "./Environment";
import { ImprovedNoise } from "../ImprovedNoise";

/*
    & Mountainous Everglades
*/
    export class MountainousEverglades implements IEnvironment {
        surfaceColors: IEnvironmentSurfaceColor[];
        surfaceTextures: IEnvironmentSurfaceTexture[];
        terrainLayers: IEnvironmentTerrainLayer[];

        constructor() {
            var perlin = new ImprovedNoise();
            var z = Math.random() * 10;
            this.surfaceColors = [
                {
                    minThreshold: 0.2,
                    maxThreshold: 1,
                    callback: (data, amount, j, width) => {
                        var x = j % width, y = ~ ~ ( j / width );
                        var nx = (data[(x+1)+y*width]||0)-(data[(x-1)+y*width]||0);
                        var ny = (data[x+(y+1)*width]||0)-(data[x+(y-1)*width]||0);
                        var len = Math.sqrt(nx*nx+ny*ny);
                        nx /= len;
                        ny /= len;
                        var ang = Math.atan2(ny, nx);
                        var ps = Math.PI * 0.25;
                        var deg90 = -90 * (Math.PI / 180);
                        var deg270 = 90 * (Math.PI / 180);
                        if(
                            (Math.abs(deg90 - ang) < ps)
                        ) {
                            return [80, 69, 67];
                        } else if(
                            (Math.abs(deg270 - ang) < ps)
                        ) {
                            return [0, 128, 0];
                        } else {
                            return [65, 71, 74];
                        }
                    }
                },
                {
                    minThreshold: 0.15,
                    maxThreshold: 0.2,
                    callback: () => [0,128,0] 
                },
                {
                    minThreshold: 0.1,
                    maxThreshold: 0.15,
                    callback: () => [194,178,128] 
                },
                {
                    minThreshold: 0,
                    maxThreshold: 0.1,
                    callback: () => [86,67,22] 
                }
            ];
    

            this.surfaceTextures = [{
                minThreshold: 0,
                maxThreshold: 0.15,
                callback: (data,j,x,y) => {
                    var v = data[j];
                    var u = 0;
                    var d = 1;
                    if(z > 0.5) {
                        for(var q = 0; q < 2; ++q) {
                            var n = perlin.noise( x / d, y / d, z );
                            v = Math.min(v+n,  data[j] - n );
                            u = Math.sin(v * Math.PI);
                            d *= 6.5;
                        }
                    }
    
                    return  v+0.5*Math.cos(u*Math.PI*2);
                }
            },
            {
                minThreshold: 0.3,
                maxThreshold: 1,
                callback: (data,j,x,y) => {
                    return data[j] + Math.pow((Math.cos(x * 12) + Math.sin(y*6)), 2) * 0.5;
                }
            }];

            this.terrainLayers = [{
                minThreshold: 0,
                maxThreshold: 0.15,
                mapHeight: 5,
                mapScale: 1,
                mapPower: 2
            },
            {
                minThreshold: 0.15,
                maxThreshold: 0.5,
                mapHeight: 8,
                mapScale:  0.9,
                mapPower: 1
            },
            {
                minThreshold: 0.5,
                maxThreshold: 1,
                mapHeight: 48,
                mapScale: 1,
                mapPower: 1
            }];
        }

        static instance() {
            return new MountainousEverglades();
        }
    }