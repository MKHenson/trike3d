namespace Trike {
	/**
	* A light that points in a target direction.
	*/
    export class LightDirectional extends Light implements IShadowCaster {
        private static _mat: MaterialLightAmbient;
        private static _dir: Vec3;
        private static _tempVS: Vec3;

        public target: Vec3;
        public intensity: number;
        public translucencyIntensity: number;
        public translucencyColor: Color;

        // Shadow mapping properties
        private _shadowMapping: boolean;
        public onlyShadow: boolean;
        private _shadowMap: RenderTarget;
        private _shadowMatrix: Matrix4;
        private _shadowCamera: CameraOrthographic;
        private _shadowMapSize: number;
        private _shadowBoxSize: number;
        private _shadowBoxNear: number;
        private _shadowBoxFar: number;
        private _shadowBias: number;
        private _shadowDarkness: number;
        private _shadowFilter: ShadowQuality;

        constructor( target: Vec3 = new Vec3( 0, 0, 0 ), color: number = 0xFFFFFF ) {
            super( null, null, color );

            // Set the materials and geometries
            if ( !LightDirectional._mat ) {
                LightDirectional._mat = new MaterialLightDirectional();
                LightDirectional._dir = new Vec3();
                LightDirectional._tempVS = new Vec3();
            }

            this.setMaterial( LightDirectional._mat );
            this.setGeometry( Light.geomPlane );
            this.target = target;
            this.intensity = 1;
            this.sceneCull = false;
            this.translucencyColor = new Color();

            this._shadowMapping = false;
            this.castShadows( false );
            this.onlyShadow = false;
            this._shadowFilter = ShadowQuality.Low;
            this._shadowMapSize = 512;
            this._shadowBoxSize = 10;
            this._shadowBoxNear = 0.1;
            this._shadowBoxFar = 500;
            this._shadowBias = 0;
            this._shadowDarkness = 0.5;
        }

		/*
		* Called just before we render the mesh. The mesh would have passed culling and already be updated.
		* A good place to update custom uniforms.
		* @param {Renderer} renderer The renderer used to draw the scene
		* @param {RenderPass} renderPass The render pass associated with this call
		*/
        preRender( renderer: Renderer, renderPass: RenderPass ) {
            super.preRender( renderer, renderPass );
            const material = this.material.materials[ PassType.Lights ];
            const lightPass: LightPass = <LightPass>renderPass;

            material.setUniform( 'lightIntensity', this.intensity );
            material.setUniform( 'translucencyIntensity', this.translucencyIntensity );
            material.setUniform( 'translucencyColor', this.translucencyColor );

            // Get the light direction in viewspace
            const dir = LightDirectional._dir;
            const tempVS = LightDirectional._tempVS;
            dir.getPositionFromMatrix( this.worldMatrix );
            tempVS.copy( this.target );
            dir.sub( tempVS );
            dir.normalize();
            dir.transformDirection( lightPass.camera.matrixWorldInverse );
            material.setUniform( 'lightDirectionVS', dir );
        }

		/**
		* Gets or sets the quality of the shadow mapping filtering
		* @param val {boolean} [Optional]
		* @returns {boolean}
		*/
        shadowQuality( val?: ShadowQuality ): ShadowQuality {
            if ( val === undefined ) return this._shadowFilter;

            if ( this._shadowMap )
                this._shadowMap.dispose();

            if ( this._shadowFilter === ShadowQuality.High ) {
                const textureFilter: TextureFilter = TextureFilter.Linear;
                this._shadowMap = new RenderTarget( this._shadowMapSize, this._shadowMapSize, TextureType.FloatType, TextureWrapping.ClampToEdgeWrapping, TextureWrapping.ClampToEdgeWrapping, TextureFilter.Linear, TextureFilter.Linear, TextureFormat.RGBFormat, 1, false, false );
            }
            else {
                const textureFilter: TextureFilter = TextureFilter.Nearest;
                this._shadowMap = new RenderTarget( this._shadowMapSize, this._shadowMapSize, TextureType.UnsignedByteType, TextureWrapping.ClampToEdgeWrapping, TextureWrapping.ClampToEdgeWrapping, textureFilter, textureFilter, TextureFormat.RGBAFormat, 1, true, false );
            }

            return val;
        }

		/**
		* Gets or sets if this light does shadow mapping
		* @param val {boolean} [Optional]
		* @returns {boolean}
		*/
        shadowMapping( val?: boolean ): boolean {
            if ( val === undefined ) return ( this._shadowMapping ? true : false );

            if ( this._shadowMapping === val )
                return val;

            this._shadowMapping = val;

            if ( val ) {
                this.shadowQuality( this._shadowFilter );

                this._shadowMatrix = new Matrix4();
                this._shadowCamera = new CameraOrthographic(
                    -this._shadowBoxSize,
                    this._shadowBoxSize,
                    this._shadowBoxSize,
                    -this._shadowBoxSize,
                    this._shadowBoxNear,
                    this._shadowBoxFar
                );

                this.castShadows( true );
            }
            else if ( this._shadowCamera ) {
                this._shadowMap.dispose();
                this._shadowCamera.dispose();
                this._shadowMap = null;
                this._shadowMatrix = null;
                this._shadowCamera = null;
                this.castShadows( false );
            }
        }

		/**
		* Cleans up the object.
		*/
        dispose() {
            super.dispose();
        }

		/**
		* Gets the render target that this light draws its shadows onto
		* @returns {RenderTarget}
		*/
        shadowMap(): RenderTarget { return this._shadowMap; }

		/**
		* Gets the shadow matrix of this light
		* @returns {Matrix4}
		*/
        shadowMatrix(): Matrix4 { return this._shadowMatrix; }

		/**
		* Gets the camera used to draw the shadows of this light
		* @returns {Camera}
		*/
        shadowCamera(): Camera { return this._shadowCamera; }

		/**
		* Gets the shadow map size
		* @param {number} val [Optional]
		* @returns {number}
		*/
        shadowMapSize( val?: number ): number {
            if ( val === undefined ) return this._shadowMapSize;

            if ( this._shadowMap )
                this._shadowMap.resize( val, val );

            this._shadowMapSize = val;
        }

		/**
		* Gets the shadow darkness
		* @param {number} val [Optional]
		* @returns {number}
		*/
        shadowBoxSize( val?: number ): number {
            if ( val === undefined ) return this._shadowBoxSize;

            this._shadowBoxSize = val;
            if ( this._shadowCamera )
                this._shadowCamera.updateDimensions(
                    -this._shadowBoxSize, this._shadowBoxSize, this._shadowBoxSize,
                    -this._shadowBoxSize, this._shadowBoxNear, this._shadowBoxFar );

            return val;
        }

		/**
		* Gets the shadow near value
		* @param {number} val [Optional]
		* @returns {number}
		*/
        shadowBoxNear( val?: number ): number {
            if ( val === undefined ) return this._shadowBoxNear;

            this._shadowBoxNear = val;
            if ( this._shadowCamera )
                this._shadowCamera.updateDimensions(
                    -this._shadowBoxSize, this._shadowBoxSize, this._shadowBoxSize,
                    -this._shadowBoxSize, this._shadowBoxNear, this._shadowBoxFar );

            return val;
        }

		/**
		* Gets the shadow near value
		* @param {number} val [Optional]
		* @returns {number}
		*/
        shadowBoxFar( val?: number ): number {
            if ( val === undefined ) return this._shadowBoxFar;

            this._shadowBoxFar = val;

            if ( this._shadowCamera )
                this._shadowCamera.updateDimensions(
                    -this._shadowBoxSize, this._shadowBoxSize, this._shadowBoxSize,
                    -this._shadowBoxSize, this._shadowBoxNear, this._shadowBoxFar );

            return val;
        }

		/**
		* Gets the shadow darkness
		* @param {number} val [Optional]
		* @returns {number}
		*/
        shadowDarkness( val?: number ): number {
            if ( val === undefined ) return this._shadowDarkness;

            this._shadowDarkness = val;
            return val;
        }

		/**
		* Gets the shadow bias
		* @param {number} val [Optional]
		* @returns {number}
		*/
        shadowBias( val?: number ): number {
            if ( val === undefined ) return this._shadowBias;

            this._shadowBias = val;
            return val;
        }
    }
}