namespace Trike {
	/**
	* The Terrain class is used to draw vast areas of land based on a height map texture.
	* Trike's Terrain system uses Geom Clipmapping, which allows for expansive terrains
	* that are heavily based on the GPU as opposed to the CPU.
	*/
    export class Terrain extends ViewspaceGrid {
		/**
		* Creates an instance of the terrain class
		* @param {number} drawDistance Determines how far off the terrain is drawn. Its recommended you use multiples of 2 as it can cause holes in the terrain if you don't
		* @param {number} levels The number of resolution levels. Closer levels are higher density mesh triangulations and far ones are less.
		* @param {number} resolution The resolution of the terrain tiles. This must be a multiple of 2. Anything lower than 16 or greater than 128 is not advisable.
		*/
        constructor( drawDistance: number = 1024, levels: number = 4, resolution: number = 32 ) {
            super( new MaterialTerrain( resolution, drawDistance ), drawDistance, levels, resolution );
        }

		/**
		* If the texture is updated, we need to re-draw the context
		*/
        onHeightmapChanged( e: TextureLoaderEvents, event: ITextureLoaderEvent, sender?: EventDispatcher ) {
            super.onHeightmapChanged( e, event, sender );

            // Remove the previous heightfield size define
            if ( event && event.previousImage )
                ( <MaterialTerrain>this._material ).removeDefine( '#define HEIGHTFIELD_SIZE ' + event.previousImage.width.toFixed( 1 ) );

            ( <MaterialTerrain>this._material ).heightmap( <Texture>sender );
        }


		/**
		* Cleans up the terrain
		*/
        dispose() {
            ( <MaterialTerrain>this._material ).dispose();
            super.dispose();
        }
    }
}