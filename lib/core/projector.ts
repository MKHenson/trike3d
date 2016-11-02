namespace Trike {
	/**
	* A helper class used to project 3D points to screen 2D coordinates and viceversa
	*/
    export class Projector {
        private _viewProjectionMatrix: Matrix4;
        private _projectionMatrixInverse: Matrix4;

        constructor() {
            this._viewProjectionMatrix = new Matrix4();
            this._projectionMatrixInverse = new Matrix4();
        }


		/**
		* Projects a 3D world coordinate to screen coordinates
		*/
        projectVector( vector: Vec3, camera: Camera ): Vec3 {
            camera.matrixWorldInverse.getInverse( camera.worldMatrix );

            this._viewProjectionMatrix.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse );

            return vector.applyProjection( this._viewProjectionMatrix );
        }


		/**
		* Projects a normalized 2D screen coordinate to 3D. The x and y correspond to the screen coordinates, and the z (i think) is the depth in the scene.
		* Use a z value of 1 to project to the back of the camera frustum.
		*/
        unprojectVector( vector: Vec3, camera: Camera ): Vec3 {
            this._projectionMatrixInverse.getInverse( camera.projectionMatrix );
            this._viewProjectionMatrix.multiplyMatrices( camera.worldMatrix, this._projectionMatrixInverse );

            return vector.applyProjection( this._viewProjectionMatrix );
        }


		/**
		* Projects a normalized 2D screen coordinate to 3D. This creates a RayCaster, or can optionally be provided with one,
		* which can be used to pick 3d objects.
		*/
        pickingRay( vector: Vec3, camera: Camera, optionalRayCastor?: RayCaster ): RayCaster {
            // set two vectors with opposing z values
            vector.z = -1.0;
            const end: Vec3 = new Vec3( vector.x, vector.y, 1.0 );

            this.unprojectVector( vector, camera );
            this.unprojectVector( end, camera );

            // find direction from vector to end
            end.sub( vector ).normalize();

            if ( optionalRayCastor )
                return optionalRayCastor.set( vector, end );
            else
                return new RayCaster( vector, end );
        }
    }
}