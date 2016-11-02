namespace Trike {
	/**
	* Mirrors are 3D objects typically associated with MirrorMesh objects that hold and prepare a mirror camera,
	* its texture matrix, clip plane and a render target. The mirror render target is used to store the rendering
	* of a reflected scene. The texture matrix and clip plane are used in other materials to properly draw the
	* reflected scenes. Typically you wont work with a mirror, instead use the mirror mesh.
	*/
    export class Mirror extends Object3D {
        public mirrorCamera: CameraPerspective;
        public renderTarget: RenderTarget;
        public textureMatrix: Matrix4;
        public clipPlane: Vec4;
        public material: IReflectiveMaterial;
        public passCollection: PassCollection;

        private _width: number;
        private _height: number;
        private _plane: Plane;
        private _normal: Vec3;
        private _mirrorWorldPosition: Vec3;
        private _mirrorTarget: Vec3;
        private _cameraWorldPosition: Vec3;
        private _rotationMatrix: Matrix4;
        private _lookAtPosition: Vec3;
        private _mirrowCamPosition: Vec3;

		/**
		* Creates a new mirror instance
		* @param {IReflectiveMaterial} material The reflective material
		* @param {number} width The width of the render target
		* @param {number} height The height of the render target
		*/
        constructor( material: IReflectiveMaterial, width: number = 1024, height: number = 1024 ) {
            super();

            this.material = material;
            this._width = width;
            this._height = height;
            this._plane = new Plane();
            this._normal = new Vec3( 0, 0, 1 );
            this._mirrorTarget = new Vec3( 0, 0, 0 );
            this._mirrorWorldPosition = new Vec3();
            this._cameraWorldPosition = new Vec3();
            this._rotationMatrix = new Matrix4();
            this._lookAtPosition = new Vec3( 0, 0, -1 );
            this._mirrowCamPosition = new Vec3();
            this.clipPlane = new Vec4();
            this.textureMatrix = new Matrix4();
            this.passCollection = new PassCollection();
            this.passCollection.initialize( width, height );

            this.mirrorCamera = new CameraPerspective();
            this.renderTarget = new RenderTarget( width, height, TextureType.HalfFloatType );

            if ( !MathUtils.isPowerOfTwo( width ) || !MathUtils.isPowerOfTwo( height ) )
                this.renderTarget.generateMipmaps = false;
        }

		/**
		* Prepares the mirror camera and its texture matrix and clip plane
		* @param {CameraPerspective} camera The camera we are rending the current scene with
		*/
        updateTextureMatrix( camera: CameraPerspective ) {
            const sign = MathUtils.sign,
                normal = this._normal,
                camWorldPos = this._cameraWorldPosition,
                mirrorWorldPos = this._mirrorWorldPosition,
                mirrorCamera = this.mirrorCamera,
                rotMatrix = this._rotationMatrix,
                lookAt = this._lookAtPosition,
                textureMatrix = this.textureMatrix,
                plane = this._plane,
                clipPlane = this.clipPlane,
                worldMat = this.worldMatrix,
                mirrowCamPosition = this._mirrowCamPosition,
                up = this.up,
                mirrorTarget = this._mirrorTarget;

            mirrorCamera.copy( camera );

            mirrorWorldPos.getPositionFromMatrix( worldMat );
            camWorldPos.getPositionFromMatrix( camera.worldMatrix );
            rotMatrix.extractRotation( worldMat );

            // Get the direction of the mirror in world space
            normal.set( 0, 0, 1 );
            normal.applyMatrix4( rotMatrix );

            mirrowCamPosition.copy( mirrorWorldPos ).sub( camWorldPos );
            mirrowCamPosition.reflect( normal ).negate();
            mirrowCamPosition.add( mirrorWorldPos );

            rotMatrix.extractRotation( camera.worldMatrix );

            lookAt.set( 0, 0, -1 );
            lookAt.applyMatrix4( rotMatrix );
            lookAt.add( camWorldPos );

            mirrorTarget.copy( mirrorWorldPos ).sub( lookAt );
            mirrorTarget.reflect( normal ).negate();
            mirrorTarget.add( mirrorWorldPos );

            up.set( 0, -1, 0 );
            up.applyMatrix4( rotMatrix );
            up.reflect( normal ).negate();

            mirrorCamera.position.copy( mirrowCamPosition );
            mirrorCamera.up = up;
            mirrorCamera.lookAt( mirrorTarget );

            mirrorCamera.updateProjectionMatrix();
            mirrorCamera.updateWorldMatrix();
            mirrorCamera.matrixWorldInverse.getInverse( mirrorCamera.worldMatrix );

            // Update the texture matrix
            textureMatrix.set( 0.5, 0.0, 0.0, 0.5,
                0.0, 0.5, 0.0, 0.5,
                0.0, 0.0, 0.5, 0.5,
                0.0, 0.0, 0.0, 1.0 );
            textureMatrix.multiply( mirrorCamera.projectionMatrix );
            textureMatrix.multiply( mirrorCamera.matrixWorldInverse );

            // Update the clip plane
            plane.setFromNormalAndCoplanarPoint( normal, mirrorWorldPos );
            plane.applyMatrix4( mirrorCamera.matrixWorldInverse );
            clipPlane.set( plane.normal.x, plane.normal.y, plane.normal.z, plane.constant );
        }

		/**
		* Resizes the mirror so that it uses
		* @param {number} val
		*/
        resize( val: number ) {
            this.passCollection.setSize( val, val );
            this.renderTarget.resize( val, val )
        }

		/**
		* Cleans up the object.
		*/
        dispose() {
            this.renderTarget.dispose();
            this.passCollection.dispose();
            this.mirrorCamera.dispose();

            this._plane = null;
            this._normal = null;
            this._mirrorWorldPosition = null;
            this._mirrorTarget = null;
            this._cameraWorldPosition = null;
            this._rotationMatrix = null;
            this._lookAtPosition = null;
            this._mirrowCamPosition = null;

            this.passCollection = null;
            this.mirrorCamera = null;
            this.renderTarget = null;
            this.textureMatrix = null;
            this.clipPlane = null;
            this.material = null;

            super.dispose();
        }
    }
}