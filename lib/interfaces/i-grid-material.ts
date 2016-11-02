namespace Trike {
	/**
	* Materials that implement the functions neccessary for a ViewspaceGrid
	*/
    export interface IGridMaterial extends IMaterial {
        altitude( val?: number ): number;
        heightOffset( val?: number ): number;
        tileResolution( val?: number ): number;
        worldScale( val?: number ): number;
        heightmap( val?: TextureBase ): TextureBase;
    }
}