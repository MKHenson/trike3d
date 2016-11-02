namespace Trike {
	/**
	* A skybox is a Mesh that typically uses a cube / sphere or planar geometry that is very large so as to mimic a sky covering the scene.
	*/
    export class Skybox extends Mesh {
        private _skyTexture: TextureBase;
        private _geomCube: GeometryCube;
        private _prevCamPos: Vec3;
        private _prevFar: number;
        private _size: number;

		/**
		* Creates a Skybox instance
		*/
        constructor( size: number = 100000 ) {
            super( new MaterialSkybox(), null );

            this._material.depthRead = false;
            this._material.depthWrite = false;
            this._skyTexture = null;
            this._geomCube = new GeometryCube( 1, 1, 1 );
            this.setGeometry( this._geomCube );

            this.size( size );
            this._prevFar = 0;
            this.sceneCull = false;
            this._prevCamPos = new Vec3();
            this.pickable = false;
            this.castShadows( false );
        }

		/*
		* Gets or sets the brightness of the sky
		* @param {number} val [Optional]
		* @returns {number}
		*/
        brightness( val?: number ): number {
            if ( val === undefined ) return this.material._uniforms[ 'brightness' ].value;

            this.material.setUniform( 'brightness', val, true );
            return val;
        }

		/*
		* Gets or sets the sky texture
		* @param {TextureBase} val [Optional]
		* @returns {TextureBase}
		*/
        skyTexture( val?: TextureBase ): TextureBase {
            if ( val === undefined ) return this._skyTexture;

            if ( this._skyTexture && val ) {
                this._skyTexture = val;
                this._material.setUniform( 'skybox', val, true );
            }
            else if ( !this._skyTexture && val ) {
                this._skyTexture = val;
                this._material.addUniform( new UniformVar( 'skybox', Trike.UniformType.TEXTURE_CUBE, val ) );
                this._material.addUniform( new UniformVar( 'modelMatrix', Trike.UniformType.MAT4 ), true );
                this._material.addDefine( '#define USE_TEXTURE' );
            }
            else {
                this._skyTexture = null;
                this._material.removeUniform( 'skybox' );
                this._material.removeUniform( 'modelMatrix' );
                this._material.removeDefine( '#define USE_TEXTURE' );
            }

            return val;

        }

		/*
		* Cleans up the references
		*/
        dispose() {
            this._geomCube.dispose();
            this._geomCube = null;
            super.dispose();
        }

		/*
		* Called just before we render the mesh. The mesh would have passed culling and already be updated.
		* A good place to update custom uniforms.
		* @param {Renderer} renderer The renderer used to draw the scene
		* @param {RenderPass} renderPass The render pass associated with this call
		*/
        preRender( renderer: Renderer, renderPass: RenderPass ) {
            const camera: Camera = renderPass.camera;
            super.preRender( renderer, renderPass );
            let far: number;
            const sizeHalf = this._worldSphere.radius;

            if ( camera instanceof CameraCombined )
                far = ( <CameraCombined>camera ).far;
            else if ( camera instanceof CameraPerspective )
                far = ( <CameraPerspective>camera ).far;
            else if ( camera instanceof CameraOrthographic )
                far = ( <CameraOrthographic>camera ).far;

            if ( sizeHalf > far ) {
                this._prevFar = far;
                this.size( far - 1 );
                this.updateWorldMatrix();
            }
            else
                this._prevFar = -1;

            // Get the current position
            this._prevCamPos.getPositionFromMatrix( camera.matrixWorldInverse );

            // Now set the position of the camera to be 0,0,0
            camera.matrixWorldInverse.elements[ 12 ] = 0;
            camera.matrixWorldInverse.elements[ 13 ] = 0;
            camera.matrixWorldInverse.elements[ 14 ] = 0;
        }

		/*
		* Called just after we render the mesh
		* @param {WebGLRenderingContext} gl The webgl context
		* @param {RenderPass} renderPass The render pass associated with this call
		*/
        postRender( gl: WebGLRenderingContext, renderPass: RenderPass ) {
            const camera: Camera = renderPass.camera;

            if ( this._prevFar !== -1 )
                this.size( this._prevFar );

            // Now revert the camera back
            camera.matrixWorldInverse.elements[ 12 ] = this._prevCamPos.x;
            camera.matrixWorldInverse.elements[ 13 ] = this._prevCamPos.y;
            camera.matrixWorldInverse.elements[ 14 ] = this._prevCamPos.z;
        }

		/*
		* Gets or sets the size of the cube
		* @param {number} val [Optional]
		* @returns {number}
		*/
        size( val?: number ): number {
            if ( val === undefined ) return this._size;

            if ( val === 0 )
                val = 0.00001;

            this._size = val;
            this.setScale( val, val, val );
            return val;
        }
    }
}