namespace Trike {
	/**
	* A simple perspective camera
	*/
    export class CameraPerspective extends Camera {
        public _fov: number;
        public _aspect: number;
        public _near: number;
        public _far: number;

        constructor( fov: number = 60, aspect: number = 8 / 6, near: number = 0.1, far: number = 1000.0, passes?: { [ name: number ]: Array<CompositionPass> }) {
            super( passes );

            this._fov = fov;
            this._aspect = aspect;
            this._near = near;
            this._far = far;

            this.updateProjectionMatrix();
        }

		/**
		* Copies the values of the given camera
		* @param {CameraPerspective} cam the camera to copy from
		* @returns {Object3D}
		*/
        copy( cam: CameraPerspective ): Object3D {
            super.copy( cam );
            this._fov = cam._fov;
            this._aspect = cam._aspect;
            this._near = cam._near;
            this._far = cam._far;
            return this;
        }

		/**
		* Rebuilds the camera projection matrices
		*/
        updateProjectionMatrix() {
            this.projectionMatrix.makePerspective( this._fov, this._aspect, this._near, this._far );
            this.projectionInverseMatrix.getInverse( this.projectionMatrix );
        }



		/**
		* Cleans up the object.
		*/
        dispose() {
            super.dispose();
        }

        get fov(): number { return this._fov; }
        get aspect(): number { return this._aspect; }
        get far(): number { return this._far; }
        get near(): number { return this._near; }

        set fov( val: number ) {
            if ( val === this._fov ) return;
            this._fov = val; this.updateProjectionMatrix();
        }

        set aspect( val: number ) {
            if ( val === this._aspect ) return;
            this._aspect = val; this.updateProjectionMatrix();
        }

        set far( val: number ) {
            if ( val === this._far ) return;
            this._far = val; this.updateProjectionMatrix();
        }

        set near( val: number ) {
            if ( val === this._near ) return;
            this._near = val; this.updateProjectionMatrix();
        }
    }
}