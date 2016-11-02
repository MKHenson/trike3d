namespace Trike {
	/**
	* A simple mesh, used as part of a viewspace grid. All tiles of a given grid share the same material & geometry
	* but update the uniforms before each render. The geometry of the tile is a horizontal planar geometry with a width and depth
	* of 1. The tesselation can be high, but the dimensions are always 1 unit. In the material, each of the vertices
	* of this unit geometry are scaled based on the tileScale and moved based on the tileOffset.
	* So even though the geometry is shared, the vertices
	* are scaled and offset by the tiles respective vectors. This means each tile is drawn and scaled in different positions.
	* Good example from here: http://www.pheelicks.com/2014/03/rendering-large-terrains/
	*/
    export class ViewspaceTile extends Mesh {
        public edgeMorh: number;
        public tileOffset: Vec2;
        public tileScale: number;
        public altitude: number;
        public heightOffset: number;

        public _vec: Vec3;
        private _box: Box3;

		/**
		* Creates an instance of the terrain tile
		*/
        constructor( mat: MaterialMulti, geom: Geometry ) {
            super( mat, geom );
            this._vec = new Vec3();
            this._box = new Box3();
            this.pickable = false;

            // We do custom pre-render culling
            this.customCulling = true;
        }

		/**
		* An update call made before the rendering process begins
		* @param {number} totalTime The total number of milliseconds since the start of the app
		* @param {number} delta The delta time since the last update call
		* @param {Camera} camera The camera being for the render
		* @param {Renderer} renderer The renderer used to draw the scene
		*/
        update( totalTime: number, delta: number, camera: Camera, renderer: Renderer ) {
            super.update( totalTime, delta, camera, renderer );

            const box: Box3 = this._box;
            const tileOffset: Vec2 = this.tileOffset;
            const altitude: number = this.altitude;
            const heightOffset: number = this.heightOffset;
            const v: Vec3 = this._vec;
            const scale: number = this.tileScale;

            v.getPositionFromMatrix( camera.worldMatrix );
            box.min.set( v.x + tileOffset.x, heightOffset, v.z + tileOffset.y );
            box.max.set( v.x + tileOffset.x + scale, altitude + heightOffset, v.z + tileOffset.y + scale );
        }

		/**
		* Updates the world matrix as well as updating the world sphere and bounding boxes.
		* @param {boolean} forceWorldUpdate If true, the world matrices will be forced to update
		* @param {boolean} forceLocalUpdate If true, the local matrices will be forced to update
		*/
        updateWorldMatrix( forceWorldUpdate: boolean = false, forceLocalUpdate: boolean = false ) {
            super.updateWorldMatrix( forceWorldUpdate, forceLocalUpdate );

            // Customly set the bounding volumes

            // First the bounding box
            const box: Box3 = this._box;
            this._worldBox.copy( box );

            // Now the sphere
            box.center( this._worldSphere.center );
            const x = box.max.x - this._worldSphere.center.x;
            const z = box.max.z - this._worldSphere.center.z;
            this._worldSphere.radius = Math.sqrt(( x * x ) + ( z * z ) );
        }

		/*
		* This function is called
		* @param {Camera} camera The camera used to render the scene
		* @param {Frustum} frustum The render target the scene is being drawn to
		* @returns {boolean} Returns false if the mesh must be drawn
		*/
        isCulled( camera: Camera, frustum: Frustum ): boolean {
            const inView: boolean = frustum.intersectsBox( this._box );
            if ( inView === false )
                return true;
            else
                return false;
        }

		/*
		* Called just before we render the mesh. The mesh would have passed culling and already be updated.
		* A good place to update custom uniforms.
		* @param {Renderer} renderer The renderer used to draw the scene
		* @param {RenderPass} renderPass The render pass associated with this call
		*/
        preRender( renderer: Renderer, renderPass: RenderPass ) {
            super.preRender( renderer, renderPass );

            const mat: MaterialTerrain = <MaterialTerrain>this._material;
            mat.setUniform( 'camPosition', this._vec, true );
            mat.setUniform( 'uEdgeMorph', this.edgeMorh, true );
            mat.setUniform( 'uTileOffset', this.tileOffset, true );
            mat.setUniform( 'uScale', this.tileScale, true );
        }

		/**
		* Cleans up the tile
		*/
        dispose() {
            super.dispose();
            this.tileOffset = null;
            this._vec = null;
        }
    }
}