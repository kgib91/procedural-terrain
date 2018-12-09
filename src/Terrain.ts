import * as THREE from "three";
import { IEnvironment } from "./Environments/Environment";
import { ImprovedNoise } from "./ImprovedNoise";
import { networkInterfaces } from "os";
import { MathHelper } from "./MathHelper";
import KalmanFilter from 'kalmanjs';

interface ITerrainCallbackPerPixel {
    (x: number, y: number, i: number, j: number): void;
}

export enum TerrainStitchSide {
    Top,
    Left
}

export interface ITerrainOptions {
    width?: number;
    depth?: number;
    offsetX?: number;
    offsetZ?: number;
    strideX?: number;
    strideZ?: number;
    sunDirection?: THREE.Vector3;
    environment?: IEnvironment;
    skipInitialEnvironmentMapping?: boolean;
    skipInitialMesh?: boolean;
    noiseGenerator?: ITerrainNoiseGenerator;
}

export interface ITerrainNoiseGenerator {
    generate(x: number, y: number): number;
}

export class TerrainDefaultNoiseGenerator implements ITerrainNoiseGenerator {
    perlin: ImprovedNoise;
    seed: number;

    constructor(seed: number = null) {
        this.perlin = new ImprovedNoise();
        this.seed = seed || (Math.random() * 100);
        console.log('new generator');
    }

    generate(x: number, y: number): number {
        var quality = 1;
        var height = 0;
        for (var j = 0; j < 4; j++) {
            height += Math.abs(this.perlin.noise(x / quality, y / quality, this.seed) * quality * 1.75)
            quality *= 5.5;
        }
        return height;
    }
}

export class Terrain extends THREE.Object3D {
    width: number;
    depth: number;
    size: number;
    surfaceData: number[][];
    data: Float32Array;
    noiseData: Float32Array;
    offsetX: number;
    offsetZ: number;
    strideX: number;
    strideZ: number;
    sunDirection: THREE.Vector3;
    environment: IEnvironment;
    noiseGenerator: ITerrainNoiseGenerator;
    bakedLightingTexture: THREE.CanvasTexture;
    terrainTexture: THREE.CanvasTexture;
    kf: KalmanFilter;

    protected mesh: THREE.Mesh;

    constructor(
        options?: ITerrainOptions
    ) {
        super();

        this.type = "Terrain";
        this.name = `Terrain_${this.uuid.substr(0, 16)}`
        var defaultOptions = Terrain.getDefaultOptions();
        options = options || defaultOptions;

        this.width = options.width || defaultOptions.width;
        this.depth = options.depth || defaultOptions.depth;
        this.offsetX = options.offsetX || defaultOptions.offsetX;
        this.offsetZ = options.offsetZ || defaultOptions.offsetZ;
        this.strideX = options.strideX || defaultOptions.strideX;
        this.strideZ = options.strideZ || defaultOptions.strideZ;
        this.sunDirection = options.sunDirection || defaultOptions.sunDirection;
        this.noiseGenerator = options.noiseGenerator;
        this.size = options.width * options.depth;
        this.environment = options.environment || defaultOptions.environment;
        

        var skipInitialEnvironmentMapping = options.skipInitialEnvironmentMapping || false;
        var skipInitialMesh = options.skipInitialMesh || false;

        this.initializeTerrain(skipInitialEnvironmentMapping, skipInitialMesh);
    }

    public initializeTerrain(skipEnvironmentMapping: boolean, skipMesh: boolean) {
        if (this.environment != null) {
            if (!skipEnvironmentMapping) {
                this.applyEnvironment();
            } else {
                this.data = new Float32Array(this.size);
                this.surfaceData = [];
            }
            if (!skipMesh) {
                this.applyMesh();
            }
        } else if (
            (this.data != null && this.data.length > 0) &&
            (this.surfaceData != null && this.surfaceData.length > 0)
        ) {
            if (!skipMesh) {
                this.applyMesh();
            }
        }
    }

    public applyMesh() {
        this.disposeMesh();

        var bakedLightingCanvas = this.generateBakedLightingTexture();
        this.bakedLightingTexture = new THREE.CanvasTexture(bakedLightingCanvas);
        this.bakedLightingTexture.name = `BakedLightTex_${this.name}`;
        this.bakedLightingTexture.wrapS = THREE.MirroredRepeatWrapping;
        this.bakedLightingTexture.wrapT = THREE.MirroredRepeatWrapping;

        var terrainCanvas = this.generateTerrainTexture(bakedLightingCanvas);
        this.terrainTexture = new THREE.CanvasTexture(terrainCanvas);
        this.terrainTexture.name = `SurfaceTex_${this.name}`;
        this.terrainTexture.wrapS = THREE.MirroredRepeatWrapping;
        this.terrainTexture.wrapT = THREE.MirroredRepeatWrapping;

        var material = new THREE.MeshStandardMaterial({
            map: this.terrainTexture,
            roughness: 1.0,
            metalness: 1.0
        });

        material.name = `Material_${this.name}`;
        var geometry = new THREE.PlaneBufferGeometry(this.width, this.depth, this.width - 1, this.depth - 1);
        geometry.name = `Geometry_${this.name}`;
        geometry.rotateX(-Math.PI * 0.5);
        var vertices = geometry.attributes.position.array as number[];
        for (var i = 0, j = 0, l = vertices.length; i < l; i++ , j += 3) {
            vertices[j + 1] = (this.data[i] * 64);
        }
        geometry.computeVertexNormals();

        var mesh = new THREE.Mesh(geometry, material);
        mesh.name = `Mesh_${this.name}`;
        this.mesh = mesh;
        this.position.set(this.offsetX, 0, this.offsetZ);
        this.scale.set(Math.max(1, 0.5 / this.strideX), 1, Math.max(1, 0.5 / this.strideZ));

        this.add(this.mesh);
    }

    private disposeMesh() {
        if (this.mesh != null) {
            this.remove(this.mesh);
        }
    }

    public dispose() {
        this.disposeMesh();
    }

    private createNoiseData() {
        if (this.noiseGenerator == null) {
            this.noiseGenerator = new TerrainDefaultNoiseGenerator();
        }

        this.noiseData = new Float32Array(this.size);
        var noiseHeightMax = 0;
        for (var i = 0; i < this.size; i++) {
            var x = i % this.width, y = ~ ~(i / this.width);
            var rx = this.offsetX + (x * this.strideX);
            var ry = this.offsetZ + (y * this.strideZ);
            this.noiseData[i] += this.noiseGenerator.generate(rx, ry);
            noiseHeightMax = Math.max(this.noiseData[i], noiseHeightMax);
        }

        for (var i = 0; i < this.size; i++) {
            this.noiseData[i] = Math.min(1, Math.max(0, this.noiseData[i] / noiseHeightMax));
        }
    }

    private applyEnvironment() {
        this.data = new Float32Array(this.size);
        this.surfaceData = [];
        
        this.kf = new KalmanFilter({R: 1, Q: 1});

        this.createNoiseData();

        // transform layers
        var maxHeight = 0;
        this.graphXY((x, y, i, j) => {
            var prev_height = 0;
            for (var k = 0; k < this.environment.terrainLayers.length; ++k) {
                var layer = this.environment.terrainLayers[k];
                if (
                    this.noiseData[j] < layer.minThreshold ||
                    this.noiseData[j] >= layer.maxThreshold
                ) {
                    prev_height += layer.mapHeight;
                    continue;
                }

                var thresholdRange = layer.maxThreshold - layer.minThreshold;
                var intensity = Math.min(1, Math.max(0, (this.noiseData[j] - layer.minThreshold)) / thresholdRange);
                var intensity_pow = Math.min(1, Math.max(0, Math.pow(intensity, layer.mapPower) * layer.mapScale));
                var generatedHeight = prev_height + (intensity_pow * layer.mapHeight);
                if (this.data[j] > generatedHeight) {
                    prev_height += layer.mapHeight;
                    continue;
                }
                this.data[j] = generatedHeight;
                prev_height += layer.mapHeight;
                maxHeight = Math.max(maxHeight, prev_height);
                break;
            }

            // surface textures
            for (var k = 0; k < this.environment.surfaceTextures.length; ++k) {
                var texture = this.environment.surfaceTextures[k];
                var normalizedHeight = Math.max(0, Math.min(1, this.data[j] / maxHeight));
                if (
                    normalizedHeight < texture.minThreshold ||
                    normalizedHeight >= texture.maxThreshold
                ) {
                    continue;
                }

                this.data[j] = texture.callback(this.data, j, x, y);
                break;
            }

            // surface colors
            for (var k = 0; k < this.environment.surfaceColors.length; ++k) {
                var surfaceColor = this.environment.surfaceColors[k];
                var normalizedHeight = Math.max(0, Math.min(1, this.data[j] / maxHeight));
                if (
                    normalizedHeight < surfaceColor.minThreshold ||
                    normalizedHeight > surfaceColor.maxThreshold
                ) {
                    continue;
                }

                this.surfaceData[j] = surfaceColor.callback(this.data, normalizedHeight, j, this.width);
            }
        });

        for (var j = 0; j < this.size; ++j) {
            this.data[j] = Math.max(0, Math.min(1, this.data[j] / maxHeight));
            this.data[j] = this.kf.filter(this.data[j], 0.5);
        }
        
    }

    private generateTerrainTexture(bakedLighting: HTMLCanvasElement) {
        // bake lighting into texture
        var canvas, context, image, imageData;
        canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.depth;
        context = canvas.getContext('2d');
        context.fillStyle = '#000';
        context.fillRect(0, 0, this.width, this.depth);
        image = context.getImageData(0, 0, canvas.width, canvas.height);
        imageData = image.data;

        for (var i = 0, j = 0; i < imageData.length; i += 4, j++) {
            var [r, g, b] = this.surfaceData[j] || [255, 0, 255];
            imageData[i] = r;
            imageData[i + 1] = g;
            imageData[i + 2] = b;
        }
        context.putImageData(image, 0, 0);

        // scale
        var cnvs = document.createElement("canvas");
        var ctx = cnvs.getContext("2d");

        // set size proportional to image
        cnvs.height = canvas.width * (canvas.height / canvas.width);

        // step 1 - resize to 50%
        var oc = document.createElement('canvas');
        var octx = oc.getContext('2d');

        oc.width = canvas.width * 0.5;
        oc.height = canvas.height * 0.5;
        octx.drawImage(canvas, 0, 0, oc.width, oc.height);

        // step 2
        octx.drawImage(oc, 0, 0, oc.width * 0.5, oc.height * 0.5);

        // step 3, resize to final size
        ctx.filter = 'blur(5)'
        ctx.drawImage(oc, 0, 0, oc.width * 0.5, oc.height * 0.5,
            0, 0, cnvs.width, cnvs.height);

        // multiply lighting
        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(bakedLighting, 0, 0, cnvs.width, cnvs.height);

        // remove lighting border
        ctx.globalCompositeOperation = 'source-over';
        image = ctx.getImageData(0, 0, cnvs.width, cnvs.height);
        imageData = image.data;
        for(var x = 0; x < cnvs.width; ++x) {
            for(var y = 0; y < cnvs.height; ++y) {
                var i = (x + y * cnvs.width) * 4;
                if(
                    x < 3
                ) {
                    var t = (x+3 + y * cnvs.width) * 4;
                    imageData[i] = imageData[t];
                    imageData[i + 1] = imageData[t + 1];
                    imageData[i + 2] = imageData[t + 2];
                }
                if(
                    y < 3
                ) {
                    var t = (x + (y+3) * cnvs.width) * 4;
                    imageData[i] = imageData[t];
                    imageData[i + 1] = imageData[t + 1];
                    imageData[i + 2] = imageData[t + 2];
                }
                if(
                    x > cnvs.width-4
                ) {
                    var t = (x-3 + y * cnvs.width) * 4;
                    imageData[i] = imageData[t];
                    imageData[i + 1] = imageData[t + 1];
                    imageData[i + 2] = imageData[t + 2];
                }
                if(
                    y > cnvs.height-4
                ) {
                    var t = (x + (y-3) * cnvs.width) * 4;
                    imageData[i] = imageData[t];
                    imageData[i + 1] = imageData[t + 1];
                    imageData[i + 2] = imageData[t + 2];
                }
            }
        }
        ctx.putImageData(image, 0, 0);

        return cnvs;
    }

    private generateBakedLightingTexture() {
        // bake lighting into texture
        var canvas, canvasScaled, context, image, imageData, vector3, sun, shade;
        vector3 = new THREE.Vector3(0, 0, 0);
        sun = this.sunDirection;
        sun.normalize();
        canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.depth;
        context = canvas.getContext('2d');
        context.fillStyle = '#000';
        context.fillRect(0, 0, this.width, this.depth);
        image = context.getImageData(0, 0, canvas.width, canvas.height);
        imageData = image.data;
        for (var i = 0, j = 0, l = imageData.length; i < l; i += 4, j++) {
            vector3.x = this.data[j - 2] - this.data[j + 2];
            vector3.y = 1.5;
            vector3.z = this.data[j - this.width * 2] - this.data[j + this.width * 3];
            vector3.normalize();
            shade = vector3.dot(sun);
            var lam = (Math.pow(0.02 + shade, 64)) * 256;
            imageData[i] = lam;
            imageData[i + 1] = lam;
            imageData[i + 2] = lam;
        }
        context.putImageData(image, 0, 0);
        // after-affects
        canvasScaled = document.createElement('canvas');
        canvasScaled.width = this.width;
        canvasScaled.height = this.depth;
        context = canvasScaled.getContext('2d');
        context.drawImage(canvas, 0, 0);
        context.putImageData(image, 0, 0);
        return canvasScaled;
    }

    private graphXY(callback: ITerrainCallbackPerPixel) {
        var inspectedPixels = [];
        for (var x = 0; x < this.width; ++x) {
            for (var y = 0; y < this.depth; ++y) {
                var j = x + y * this.width;
                if (inspectedPixels[j] != null) {
                    continue;
                }
                var i = j * 4;
                callback(x, y, i, j);
                inspectedPixels[j] = true;
            }
        }
    }

    static interpolate(a: Terrain, b: Terrain, c: Terrain, d: Terrain): Terrain {
        var options = a.cloneOptions(true);
        var newTerrain = new Terrain({ ...options, skipInitialMesh: true, skipInitialEnvironmentMapping: true });
        for (var j = 0; j < newTerrain.size; ++j) {
            var x = j % newTerrain.width,
                y = ~ ~(j / newTerrain.width);
            var u = x / newTerrain.width;
            var v = y / newTerrain.depth;
            var horizontalWeight = Math.max(0, Math.min(1, Math.pow(u, 2)));
            var verticalWeight = Math.max(0, Math.min(1, Math.pow(v, 2)));
            newTerrain.data[j] = THREE.Math.lerp(
                THREE.Math.lerp(a.data[j], b.data[j], horizontalWeight),
                THREE.Math.lerp(c.data[j], d.data[j], horizontalWeight),
                verticalWeight
            );
            newTerrain.surfaceData[j] = MathHelper.lerpColor(
                MathHelper.lerpColor(a.surfaceData[j], b.surfaceData[j], horizontalWeight),
                MathHelper.lerpColor(c.surfaceData[j], d.surfaceData[j], horizontalWeight),
                verticalWeight  
            );
        }
        newTerrain.applyMesh();
        return newTerrain;
    }

    static merge(a: Terrain, b: Terrain, c: Terrain, d: Terrain): Terrain {
        var options = a.cloneOptions(true);
        var newTerrain = new Terrain({ ...options, skipInitialMesh: true, skipInitialEnvironmentMapping: true });
        for (var j = 0; j < newTerrain.size; ++j) {
            var maxTerrainValue = Math.max(Math.max(a.data[j], b.data[j]), Math.max(c.data[j], d.data[j]))
            newTerrain.data[j] = maxTerrainValue;
            if(a.data[j] == maxTerrainValue) {
                newTerrain.surfaceData[j] = a.surfaceData[j];
            } else if(b.data[j] == maxTerrainValue) {
                newTerrain.surfaceData[j] = b.surfaceData[j];
            } else if(c.data[j] == maxTerrainValue) {
                newTerrain.surfaceData[j] = c.surfaceData[j];
            } else if(d.data[j] == maxTerrainValue) {
                newTerrain.surfaceData[j] = d.surfaceData[j];
            }
        }
        newTerrain.applyMesh();
        return newTerrain;
    }

    static mutate(a: Terrain, b: Terrain, c: Terrain, d: Terrain): Terrain {
        var options = a.cloneOptions(true);
        var newTerrain = new Terrain({ ...options, skipInitialMesh: true, skipInitialEnvironmentMapping: true });
        for (var j = 0; j < newTerrain.size; ++j) {
            var x = j % newTerrain.width,
                y = ~ ~(j / newTerrain.width);
            var u = x / newTerrain.width;
            var v = y / newTerrain.depth;
            var horizontalWeight = Math.max(0, Math.min(1, Math.pow(u, 2)));
            var verticalWeight = Math.max(0, Math.min(1, Math.pow(v, 2)));
            newTerrain.data[j] = THREE.Math.lerp(
                THREE.Math.lerp(a.data[j], b.data[j], horizontalWeight),
                THREE.Math.lerp(c.data[j], d.data[j], horizontalWeight),
                verticalWeight
            );
            var targetLayerHeight = newTerrain.data[j];
            var aDis = Math.abs(targetLayerHeight - a.data[j] * (1.0 - horizontalWeight) * (1.0 - verticalWeight));
            var bDis = Math.abs(targetLayerHeight - b.data[j] * (horizontalWeight) * (1.0 - verticalWeight));
            var cDis = Math.abs(targetLayerHeight - c.data[j] * (1.0 - horizontalWeight) * (verticalWeight));
            var dDis = Math.abs(targetLayerHeight - d.data[j] * (horizontalWeight) * (verticalWeight));
            var maxTerrainValue = Math.min(Math.min(aDis, bDis), Math.min(cDis, dDis))
            if(aDis == maxTerrainValue) {
                newTerrain.surfaceData[j] = a.surfaceData[j];
            } else if(bDis == maxTerrainValue) {
                newTerrain.surfaceData[j] = b.surfaceData[j];
            } else if(cDis == maxTerrainValue) {
                newTerrain.surfaceData[j] = c.surfaceData[j];
            } else if(dDis == maxTerrainValue) {
                newTerrain.surfaceData[j] = d.surfaceData[j];
            }
        }
        newTerrain.applyMesh();
        return newTerrain;
    }

    static stitch(source: Terrain, target: Terrain, side: TerrainStitchSide) {
        switch (side) {
            case TerrainStitchSide.Top:
                var size = (source.depth * 0.05) | 0;
                var sizeM1 = (1/(size - 1));
                for(var y = 0; y < size; ++y) {
                    var sizeStep = sizeM1*y;
                    var aStep = Math.pow((1.0 - sizeStep), 2);
                    for(var x = 0; x < source.width; ++x) {
                        var j = x + y * source.width;
                        var i = x + ((source.depth-1)-y) * source.width;
                        var sourceData = source.data[j];
                        var targetData = target.data[i];
                        var sourceColor = source.surfaceData[j];
                        var targetColor = target.surfaceData[i];
                        source.data[j] = THREE.Math.lerp(sourceData, targetData, aStep);
                        source.surfaceData[j] = MathHelper.lerpColor(sourceColor, targetColor, aStep);
                    }
                }
                source.applyMesh();
                break;
            case TerrainStitchSide.Left:
                var size = (source.width * 0.05) | 0;
                var sizeM1 = (1/(size - 1));
                for(var x = 0; x < size; ++x) {
                    var sizeStep = sizeM1*x;
                    var aStep = Math.pow((1.0 - sizeStep), 2);
                    for(var y = 0; y < source.depth; ++y) {
                        var j = x + y * source.width;
                        var i = ((source.width-1)-x) + y * source.width;
                        var sourceData = source.data[j];
                        var targetData = target.data[i];
                        var sourceColor = source.surfaceData[j];
                        var targetColor = target.surfaceData[i];
                        source.data[j] = THREE.Math.lerp(sourceData, targetData, aStep);
                        source.surfaceData[j] = MathHelper.lerpColor(sourceColor, targetColor, aStep);
                    }
                }
                source.applyMesh();
                break;
        }
    }

    static create(options, environments: IEnvironment[]): Terrain {
        if (environments.length != 4) {
            throw "Must have exactly 4 environments";
        }
        var terrainA = new Terrain({ ...options, environment: environments[0], skipInitialMesh: true });
        var terrainB = new Terrain({ ...options, environment: environments[1], skipInitialMesh: true });
        var terrainC = new Terrain({ ...options, environment: environments[2], skipInitialMesh: true });
        var terrainD = new Terrain({ ...options, environment: environments[3], skipInitialMesh: true });
        return Terrain.mutate(terrainA, terrainB, terrainC, terrainD);
    }

    static getDefaultOptions(): ITerrainOptions {
        return {
            width: 128,
            depth: 128,
            offsetX: 0,
            offsetZ: 0,
            strideX: 1,
            strideZ: 1,
            sunDirection: new THREE.Vector3(1, 0.45, 1)
        };
    }

    public cloneOptions(includeNoise: boolean = false): ITerrainOptions {
        return {
            width: this.width,
            depth: this.depth,
            environment: this.environment,
            offsetX: this.offsetX,
            offsetZ: this.offsetZ,
            strideX: this.strideX,
            strideZ: this.strideZ,
            sunDirection: this.sunDirection,
            noiseGenerator: includeNoise ? this.noiseGenerator : undefined
        };
    }
}