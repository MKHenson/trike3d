namespace Trike {
	/**
	* An emissive light that gets its ambient terms from the cube texture of a sky box using variance environment maps
	*/
    export class LightAtmospheric extends Light {
        private _mat: MaterialLightAtmospheric;
        private _convolver: CubeConvolver;
        private _intensity: number;

		/**
		* Creates an instance of the light
		*/
        constructor( color: number = 0xffffff ) {
            super( null, null, color );

            // Set the materials and geometries
            this._mat = new MaterialLightAtmospheric();
            this.setMaterial( this._mat );
            this.setGeometry( Light.geomPlane );
            this.sceneCull = false;
            this._intensity = 1;
        }

		/*
		* Cleans up the class
		*/
        dispose() {
            this._mat.dispose();
            this._mat = null;
            this.convolver = null;
        }


		/*
		* Set the sky box from where this light gets its values
		* @param {CubeConvolver} [Optional]
		* @returns {CubeConvolver}
		*/
        convolver( val?: CubeConvolver ): CubeConvolver {
            if ( val === undefined ) return this._convolver;
            this._convolver = val;
            this._mat.setSky( val ? true : false );
            return val;
        }

		/*
		* Get or set the intensity of the light
		* @param {number} [Optional]
		* @returns {number}
		*/
        intensity( val?: number ): number {
            if ( val === undefined ) return this._intensity;
            this._intensity = val;
            this._mat.setUniform( 'lightIntensity', this._intensity, true );
            return val;
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

            if ( this._convolver ) {
                const target = this._convolver.cubeTexture();
                material.setUniform( 'viewMat', renderPass.camera.matrixWorldInverse, false );
                material.setUniform( 'sampler', target, false );
            }
        }
    }
}