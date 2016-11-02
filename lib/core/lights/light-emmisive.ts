namespace Trike {
	/**
	* A simple emmisive light
	*/
    export class LightAmbient extends Light {
        private _mat: MaterialLightAmbient;
        public intensity: number;

        constructor( color: number = 0xffffff, intensity: number = 1 ) {
            super( null, null, color );

            // Set the materials and geometries
            this._mat = new MaterialLightAmbient();
            this.setMaterial( this._mat );
            this.setGeometry( Light.geomPlane );
            this.sceneCull = false;
            this.intensity = intensity;
        }

		/*
		* Cleans up the class
		*/
        dispose() {
            this._mat.dispose();
            this._mat = null;
        }

		/*
		* Called just before we render the mesh. The mesh would have passed culling and already be updated.
		* A good place to update custom uniforms.
		* @param {Renderer} renderer The renderer used to draw the scene
		* @param {RenderPass} renderPass The render pass associated with this call
		*/
        preRender( renderer: Renderer, renderPass: RenderPass ) {
            super.preRender( renderer, renderPass );
            const material = this._material.materials[ PassType.Lights ];
            const lightPass: LightPass = <LightPass>renderPass;
            material.setUniform( 'lightIntensity', this.intensity, false );
        }
    }
}