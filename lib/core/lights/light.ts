namespace Trike {
	/**
	* Base class for all lights
	*/
    export class Light extends Mesh {
        public color: Color;

        // These two geometries are used in all light types.
        public static geomPlane: GeometryPlane;
        public static geomSphere: GeometrySphere;
        private static lightCount: number;

        constructor( material: MaterialMulti, geometry: Geometry, color: number = 0xFFFFFF ) {
            super( material, geometry );
            this.color = new Color( color );

            // Create the static geometry
            if ( !Light.geomPlane ) {
                Light.geomPlane = new GeometryScreenPlane();
                Light.geomSphere = new GeometrySphere( 1, 16, 8 );
                Light.lightCount = 0;
            }

            Light.lightCount++;

            this.pickable = false;
        }

		/*
		* Called just before we render the mesh. The mesh would have passed culling and already be updated.
		* A good place to update custom uniforms.
		* @param {Renderer} renderer The renderer used to draw the scene
		* @param {RenderPass} renderPass The render pass associated with this call
		*/
        preRender( renderer: Renderer, renderPass: RenderPass ) {
            const material = this._material.materials[ PassType.Lights ];
            const pass: LightPass = <LightPass>renderPass;
            material.setUniform( 'lightColor', this.color );
        }


		/**
		* Cleans up the object.
		*/
        dispose() {
            Light.lightCount--;

            if ( Light.lightCount === 0 ) {
                Light.geomPlane.dispose();
                Light.geomSphere.dispose();
            }

            this.color = null;
            super.dispose();
        }
    }
}