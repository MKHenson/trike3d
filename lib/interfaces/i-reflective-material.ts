namespace Trike {
    export interface IReflectiveMaterial extends IMaterial {
        mirrorReflection( val?: boolean ): boolean
        reflectionMap( val?: RenderTarget ): RenderTarget;
        textureMatrix( val?: Matrix4 ): Matrix4;
    }
}