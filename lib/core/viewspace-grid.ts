namespace Trike {
    export enum Edge {
        NONE = 0,
        TOP = 1,
        LEFT = 2,
        BOTTOM = 4,
        RIGHT = 8
    }

	/**
	* The viewspace grid class is used to draw a collection of viewspace tiles.
	* Each grid uses a common geometry and material to draw each of its tiles. The shader
	* of the material is updated with position and scale on each prerender based on the values of each tile.
	* Each grid can optionally have a heightmap from where it gets its height data.
	*/
    export class ViewspaceGrid extends Object3D {
        protected _tileGeom: GeometryPlane;
        protected _material: IGridMaterial;
        protected _heightTexture: Texture;
        protected _drawDistance: number;
        protected _levels: number;
        protected _resolution: number;
        protected _altitude: number;
        protected _heightOffset: number;
        protected _tiles: Array<ViewspaceTile>;
        protected _picker: ViewspaceGridPicker;

		/**
		* Creates an instance of the terrain class
		* @param {IGridMaterial} material The material associated with this grid
		* @param {number} drawDistance Determines how far off the terrain is drawn. Its recommended you use multiples of 2 as it can cause holes in the terrain if you don't
		* @param {number} levels The number of resolution levels. Closer levels are higher density mesh triangulations and far ones are less.
		* @param {number} resolution The resolution of the terrain tiles. This must be a multiple of 2. Anything lower than 16 or greater than 128 is not advisable.
		*/
        constructor( material: IGridMaterial, drawDistance: number = 1024, levels: number = 4, resolution: number = 32 ) {
            super();

            this._material = material;
            this._drawDistance = drawDistance;
            this._levels = levels;
            this._resolution = resolution;
            this._tiles = new Array<ViewspaceTile>();
            this._altitude = 50;
            this._heightOffset = 0;
            this._material.altitude( this._altitude );
            this._material.heightOffset( this._heightOffset );

            // set the resolution and builds the geometry
            this.resolution( resolution );

            this._picker = new ViewspaceGridPicker( this );
        }

		/**
		* Gets or sets if this object can cast shadows
		* @param {number} val
		*/
        castShadows( val?: boolean ): boolean {
            if ( val === undefined ) return super.castShadows( val );

            const tiles: Array<ViewspaceTile> = this._tiles;
            for ( let i = 0, l = tiles.length; i < l; i++ )
                tiles[ i ].castShadows( val );

            return super.castShadows( val );
        }

		/**
		* Gets or sets how far off the grid is drawn. Its recommended you use multiples of 2 as it can cause holes in the terrain if you don't
		* @param {number} val [Optional]
		* @returns {number}
		*/
        drawDistance( val?: number ): number {
            if ( val === undefined ) return this._drawDistance;
            this._drawDistance = val;
            this._build();

            return val;
        }

		/**
		* Gets the grid picker associated with this grid
		* @returns {ViewspaceGridPicker}
		*/
        picker(): ViewspaceGridPicker { return this._picker; }

		/**
		* If the texture is updated, we need to re-draw the context
		*/
        onHeightmapChanged( e: TextureLoaderEvents, event: ITextureLoaderEvent, sender?: EventDispatcher ) {
            this._picker.updateHeightData( <Texture>sender );
        }

		/**
		* Gets or sets the texute we use to sample height data from
		* @param {Texture} val [Optional]
		* @returns {Texture}
		*/
        heightfield( val?: Texture ): Texture {
            if ( val === undefined ) return this._heightTexture;

            const heightfield: Texture = this._heightTexture;

            if ( heightfield )
                heightfield.off<TextureLoaderEvents, ITextureLoaderEvent>( 'texture_loader_complete', this.onHeightmapChanged, this );

            this._heightTexture = val;
            this._material.heightmap( val );
            this._picker.updateHeightData( val );

            if ( val ) {
                val.on<TextureLoaderEvents, ITextureLoaderEvent>( 'texture_loader_complete', this.onHeightmapChanged, this );
                this.onHeightmapChanged( 'texture_loader_complete', null, val );
            }

            return val;
        }


		/**
		* Gets or sets the number of resolution levels. Closer levels are higher density mesh triangulations and far ones are less.
		* @param {number} val [Optional]
		* @returns {number}
		*/
        levels( val?: number ): number {
            if ( val === undefined ) return this._levels;

            this._levels = val;
            this._build();

            return val;
        }

		/**
		* Sets the number of altitude of the grid
		* @param {number} val [Optional]
		* @returns {number}
		*/
        altitude( val?: number ): number {
            if ( val === undefined ) return this._altitude;

            this._altitude = val;
            this._material.altitude( val );
            const tiles: Array<ViewspaceTile> = this._tiles;
            for ( let i = 0, l = tiles.length; i < l; i++ )
                tiles[ i ].altitude = val;

            return val;
        }

		/**
		* Sets the number of height offset of the grid.
		* @param {number} val [Optional]
		* @returns {number}
		*/
        heightOffset( val?: number ): number {
            if ( val === undefined ) return this._heightOffset;

            this._heightOffset = val;
            this._material.heightOffset( val );
            const tiles: Array<ViewspaceTile> = this._tiles;
            for ( let i = 0, l = tiles.length; i < l; i++ )
                tiles[ i ].heightOffset = val;

            return val;
        }

		/**
		* Sets resolution of the grid tiles. This must be a multiple of 2. Anything lower than 16 or greater than 128 is not advisable.
		* @param {number} val [Optional]
		* @returns {number}
		*/
        resolution( val?: number ): number {
            if ( val === undefined ) return this._resolution;

            this._resolution = val;

            if ( this._tileGeom )
                this._tileGeom.dispose();

            // Create geometry that we'll use for each tile, just a standard plane
            this._tileGeom = new GeometryPlane( 1, 1, val, val );

            // Rotate the geometry so its flat on the ground.
            // Also place origin at bottom left corner, rather than center. So that all verts are possitive.
            // 1 _ _ 1
            // |   / |
            // |  /  |
            // | /   |
            // 0/_ _ 1

            const m = new Matrix4();
            m.makeTranslation( 0.5, 0.5, 0 );
            this._tileGeom.applyMatrix( m );

            m.makeRotationX( 90 * Math.PI / 180 );
            this._tileGeom.applyMatrix( m );
            this._tileGeom.reverseFaceOrder();

            this._tileGeom.computeFaceNormals();
            this._tileGeom.generateNormals( false );

            // Tell the material what the resolution is
            this._material.tileResolution( val );

            this._build();
            return val;
        }

		/**
		* Builds the grid - should not be called outside of the grid class
		*/
        private _build() {
            const worldWidth: number = this._drawDistance;
            const levels: number = this._levels;

            const tiles: Array<ViewspaceTile> = this._tiles;
            for ( let i = 0, l = tiles.length; i < l; i++ )
                tiles[ i ].dispose();

            tiles.splice( 0, tiles.length );

            // Create collection of tiles to fill required space
            const initialScale: number = worldWidth / Math.pow( 2, levels );

            // Create center layer first
            //    +---+---+
            //    | O | O |
            //    +---+---+
            //    | O | O |
            //    +---+---+
            this.createTile( -initialScale, -initialScale, initialScale, Edge.NONE );
            this.createTile( -initialScale, 0, initialScale, Edge.NONE );
            this.createTile( 0, 0, initialScale, Edge.NONE );
            this.createTile( 0, -initialScale, initialScale, Edge.NONE );

            // Create 'quadtree' of tiles, with smallest in center
            // Each added layer consists of the following tiles (marked 'A'), with the tiles
            // in the middle being created in previous layers
            // +---+---+---+---+
            // | A | A | A | A |
            // +---+---+---+---+
            // | A |   |   | A |
            // +---+---+---+---+
            // | A |   |   | A |
            // +---+---+---+---+
            // | A | A | A | A |
            // +---+---+---+---+
            for ( let scale = initialScale; scale < worldWidth; scale *= 2 ) {
                this.createTile( -2 * scale, -2 * scale, scale, Edge.BOTTOM | Edge.LEFT );
                this.createTile( -2 * scale, -scale, scale, Edge.LEFT );
                this.createTile( -2 * scale, 0, scale, Edge.LEFT );
                this.createTile( -2 * scale, scale, scale, Edge.TOP | Edge.LEFT );

                this.createTile( -scale, -2 * scale, scale, Edge.BOTTOM );

                // 2 tiles 'missing' here are in previous layer
                this.createTile( -scale, scale, scale, Edge.TOP );

                this.createTile( 0, -2 * scale, scale, Edge.BOTTOM );

                // 2 tile
                this.createTile( 0, scale, scale, Edge.TOP );

                this.createTile( scale, -2 * scale, scale, Edge.BOTTOM | Edge.RIGHT );
                this.createTile( scale, -scale, scale, Edge.RIGHT );
                this.createTile( scale, 0, scale, Edge.RIGHT );
                this.createTile( scale, scale, scale, Edge.TOP | Edge.RIGHT );
            }
        }


		/**
		* Creates each grid tile
		*/
        private createTile( x: number, y: number, scale: number, edgeMorph: number ) {
            const tiles: Array<ViewspaceTile> = this._tiles;

            const plane = new ViewspaceTile( <MaterialMulti><IMaterial>this._material, this._tileGeom );
            plane.castShadows( this.castShadows() );
            plane.edgeMorh = edgeMorph;
            plane.tileOffset = new Vec2( x, y );
            plane.tileScale = scale;
            plane.altitude = this._altitude;
            plane.heightOffset = this._heightOffset;

            this.add( plane );
            tiles.push( plane );
        }

		/**
		* Gets the material assigned to this terrain
		* @returns {MaterialMulti}
		*/
        get material(): MaterialMulti { return <MaterialMulti><IMaterial>this._material; }

		/**
		* Gets the tiles of this terrain
		* @returns {Array<ViewspaceTile>}
		*/
        get tiles(): Array<ViewspaceTile> { return this._tiles; }

		/**
		* Gets the geometrt of this terrain
		* @returns {Geometry}
		*/
        get geometry(): Geometry { return this._tileGeom; }


		/**
		* Cleans up the grid
		*/
        dispose() {
            if ( this._heightTexture )
                this._heightTexture.off<TextureLoaderEvents, ITextureLoaderEvent>( 'texture_loader_complete', this.onHeightmapChanged, this );

            const tiles: Array<ViewspaceTile> = this._tiles;
            for ( let i = 0, l = tiles.length; i < l; i++ )
                tiles[ i ].dispose();

            if ( this._tileGeom )
                this._tileGeom.dispose();

            this._material = null;
            this._picker.dispose();

            this._material = null;
            this._tiles = null;
            this._heightTexture = null;
            this._tileGeom = null;
            this._picker = null;

            super.dispose();
        }
    }
}