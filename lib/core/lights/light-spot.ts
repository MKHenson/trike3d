namespace Trike {
	/**
	* A light that points in a target direction.
	*/
    export class LightSpot extends Light {
        private static _mat: MaterialLightSpot;
        private static _tempVS: Vec3;
        private static _dir: Vec3;

        public intensity: number;
        public angle: number;
        public target: Vec3;
        public translucencyIntensity: number;
        public translucencyColor: Color;

        constructor( target: Vec3 = new Vec3( 0, 0, 0 ), color: number = 0xFFFFFF ) {
            super( null, null, color );

            // Set the materials and geometries
            if ( !LightSpot._mat ) {
                LightSpot._mat = new MaterialLightSpot();
                LightSpot._tempVS = new Vec3();
                LightSpot._dir = new Vec3();
            }

            this.setMaterial( LightSpot._mat );
            this.setGeometry( Light.geomPlane );
            this.intensity = 1;
            this.translucencyIntensity = 1;
            this.translucencyColor = new Color();
            this.angle = 1;
            this.target = target;
            this.sceneCull = false;
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

            const target = this.target;


            material.setUniform( 'lightIntensity', this.intensity, false );
            material.setUniform( 'lightAngle', this.angle, false );
            material.setUniform( 'translucencyIntensity', this.translucencyIntensity, false );
            material.setUniform( 'translucencyColor', this.translucencyColor, false );

            // Get the light position in viewspace
            const tempVS = LightSpot._tempVS;
            tempVS.getPositionFromMatrix( this.worldMatrix );
            tempVS.applyMatrix4( lightPass.camera.matrixWorldInverse );
            material.setUniform( 'lightPositionVS', tempVS, false );

            // Get the light direction in viewspace
            const dir = LightSpot._dir;
            dir.getPositionFromMatrix( this.worldMatrix );
            tempVS.copy( this.target );
            dir.sub( tempVS );
            dir.normalize();
            dir.transformDirection( lightPass.camera.matrixWorldInverse );
            material.setUniform( 'lightDirectionVS', dir, false );
        }

		/**
		* Cleans up the object.
		*/
        dispose() {
            super.dispose();
        }
    }
}