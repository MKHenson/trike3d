namespace Trike {
	/**
	* This pass is responsible for drawing each of the lights in the scene
	*/
    export class LightPass extends RenderPass {
        public camera: Camera;
        public drawSpecificMesh: Mesh;
        private _v1: Vec3;
        private _combined: Vec4;
        private _mat: Matrix4;

        public transparencyPass: boolean;

		/**
		* Creates an instance of the pass
		* @param {number} width The width of the render target
		* @param {height} width The height of the render target
		* @param {boolean} transparencyPass True if this pass deals with transparent objects
		*/
        constructor( width: number, height: number, transparencyPass: boolean ) {
            if ( !transparencyPass )
                super( null, new RenderTarget( width, height, TextureType.HalfFloatType, TextureWrapping.ClampToEdgeWrapping, TextureWrapping.ClampToEdgeWrapping, TextureFilter.Nearest, TextureFilter.Nearest, TextureFormat.RGBFormat, 1, true, true ), PassType.Lights );
            else
                super( null, new RenderTarget( width, height, TextureType.HalfFloatType, TextureWrapping.ClampToEdgeWrapping, TextureWrapping.ClampToEdgeWrapping, TextureFilter.Nearest, TextureFilter.Nearest, TextureFormat.RGBAFormat, 1, true, true ), PassType.Lights );

            this._v1 = new Vec3();
            this._mat = new Matrix4();
            this._combined = new Vec4();
            this.transparencyPass = transparencyPass;
        }

        resize( width: number, height: number ) {
            super.resize( width, height );
        }


		/**
		* Called just before a mesh is drawn
		* @param {Camera} mesh The Mesh we are about to draw
		*/
        evaluateMesh( mesh: Mesh ): boolean {
            const lightMat: MaterialMulti = mesh.material.materials[ PassType.Lights ];

            if ( !this.transparencyPass ) {
                if ( mesh instanceof LightPoint === false )
                    lightMat.setUniform( 'limitScreenQuad', 0 );

                return true;
            }


            const drawSpecificMesh = this.drawSpecificMesh;

            // Optimize the mesh - p light drawing by checking if they even intersect
            if ( mesh instanceof LightPoint )
                return;

            // We have a specific mesh to draw (not a whole scene). To optimize the drawing
            // of this object, we need to limit screen quad so that it only draws the region
            // where the targeted mesh is in screen space. We do this by getting the min and max
            // points of the target mesh's boundaries and tranforming them to screen space positions
            // x:(-1 (left) to 1 (right) ), y: (-1 (top) to 1 (bottom))


            if ( lightMat ) {
                if ( drawSpecificMesh ) {
                    const combined = this._combined,
                        mat = this._mat,
                        radius = drawSpecificMesh._worldSphere.radius,
                        sphereCenter = this._v1,
                        camWorldPos = this._v1;


                    const cam = this.camera;
                    camWorldPos.getPositionFromMatrix( cam.worldMatrix );

                    const d = camWorldPos.distanceTo( drawSpecificMesh._worldSphere.center );
                    const fov = ( <CameraPerspective>cam ).fov / 2 * Math.PI / 180.0;
                    let screenSpaceRadius = 1.0 / Math.tan( fov ) * radius / Math.sqrt( Math.abs( d * d - radius * radius ) );
                    screenSpaceRadius += screenSpaceRadius * 0.25;

                    if ( screenSpaceRadius < 1 ) {
                        // Get the projection matrix of the object
                        mat.multiplyMatrices( cam.projectionMatrix, mat.getInverse( cam.worldMatrix ) );

                        // Get center in screen space
                        sphereCenter.copy( drawSpecificMesh._worldSphere.center );
                        sphereCenter.project( cam, false );

                        combined.set(
                            sphereCenter.x - screenSpaceRadius,
                            sphereCenter.y - screenSpaceRadius,
                            sphereCenter.x + screenSpaceRadius,
                            sphereCenter.y + screenSpaceRadius
                        );

                        lightMat.setUniform( 'limitScreenQuad', 1 );
                        lightMat.setUniform( 'minMax', combined );
                    }
                    else
                        lightMat.setUniform( 'limitScreenQuad', 0 );
                }
            }

            return true;
        }
    }
}