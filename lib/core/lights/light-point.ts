namespace Trike {
	/**
	* A light that points in a target direction.
	*/
    export class LightPoint extends Light {
        private static _mat: MaterialLightPoint;
        private static _tempVS: Vec3;

        private _radius: number;
        public intensity: number;
        public translucencyIntensity: number;
        public translucencyColor: Color;

        constructor( color: number = 0xFFFFFF ) {
            super( null, null, color );

            // Set the materials and geometries
            if ( !LightPoint._mat ) {
                LightPoint._mat = new MaterialLightPoint();
                LightPoint._tempVS = new Vec3();
            }

            this.setMaterial( LightPoint._mat );
            if ( LightPoint._mat.renderType === POINT_LIGHT_RENDER_TYPE.Perspective )
                this.setGeometry( Light.geomSphere );
            else {
                this.setGeometry( Light.geomPlane );
                this.sceneCull = false;
            }
            this.intensity = 1;
            this._radius = 1;
            this.translucencyIntensity = 1;
            this.translucencyColor = new Color();
        }

		/**
		* Updates the objects vertices
		* @param {boolean} If true, the world matrices will be forced to update
		* @param {boolean} If true, the local matrices will be forced to update
		*/
        updateWorldMatrix( forceWorldUpdate: boolean = false, forceLocalUpdate: boolean = false ) {
            // For point lights we set the scale to be equal to that of the radius.
            if ( LightPoint._mat.renderType === POINT_LIGHT_RENDER_TYPE.Perspective ) {
                const radius = this._radius;
                if ( forceWorldUpdate || this.updateMatrixWorld || this.updateMatrix )
                    this.setScale( radius, radius, radius );
            }

            super.updateWorldMatrix( forceWorldUpdate, forceLocalUpdate );
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
            material.setUniform( 'lightRadius', this.radius, false );
            material.setUniform( 'translucencyIntensity', this.translucencyIntensity, false );
            material.setUniform( 'translucencyColor', this.translucencyColor, false );

            // Get the light position in viewspace
            const tempVS = LightPoint._tempVS;
            tempVS.getPositionFromMatrix( this.worldMatrix );
            tempVS.applyMatrix4( lightPass.camera.matrixWorldInverse );
            material.setUniform( 'lightPositionVS', tempVS, false );

        }

		/**
		* Cleans up the object.
		*/
        dispose() {
            super.dispose();
        }

		/**
		* Sets the radius of the light
		*/
        set radius( val: number ) {
            this._radius = val;
            this.updateMatrix = true;
        }

		/**
		* Gets the radius of the light
		*/
        get radius(): number { return this._radius; }
    }
}