namespace Trike {
	/**
	* A simple orthographic camera
	*/
    export class CameraOrthographic extends Camera {
        public _left: number;
        public _right: number;
        public _top: number;
        public _bottom: number;
        public _near: number;
        public _far: number;

        constructor( left: number, right: number, top: number, bottom: number, near: number = 0.1, far: number = 1000.0, passes?: { [ name: number ]: Array<CompositionPass> }) {
            super( passes );

            this._left = left;
            this._right = right;
            this._top = top;
            this._bottom = bottom;
            this._near = near;
            this._far = far;

            this.updateProjectionMatrix();
        }

		/**
		* Copies the values of the given camera
		* @param {CameraOrthographic} cam the camera to copy from
		* @returns {Object3D}
		*/
        copy( cam: CameraOrthographic ): Object3D {
            super.copy( cam );
            this._left = cam._left;
            this._right = cam._right;
            this._top = cam._top;
            this._bottom = cam._bottom;
            this._near = cam._near;
            this._far = cam._far;
            return this;
        }

		/**
		* Rebuilds the camera projection matrices
		*/
        updateProjectionMatrix() {
            this.projectionMatrix.makeOrthographic( this._left, this._right, this._top, this._bottom, this._near, this._far );
            this.projectionInverseMatrix.getInverse( this.projectionMatrix );
        }

		/**
		* Cleans up the object.
		*/
        dispose() {
            super.dispose();
        }

        updateDimensions( left: number, right: number, top: number, bottom: number, near: number, far: number ) {
            this._left = left;
            this._right = right;
            this._top = top;
            this._bottom = bottom;
            this._near = near;
            this._far = far;
            this.updateProjectionMatrix();
        }

        get left(): number { return this._left; }
        get right(): number { return this._right; }
        get top(): number { return this._top; }
        get bottom(): number { return this._bottom; }
        get near(): number { return this._near; }
        get far(): number { return this._far; }

        set left( val: number ) {
            if ( this._left === val ) return;
            this._left = val; this.updateProjectionMatrix();
        }

        set right( val: number ) {
            if ( this._right === val ) return;
            this._right = val; this.updateProjectionMatrix();
        }

        set top( val: number ) {
            if ( this._top === val ) return;
            this._top = val; this.updateProjectionMatrix();
        }

        set bottom( val: number ) {
            if ( this._bottom === val ) return;
            this._bottom = val; this.updateProjectionMatrix();
        }

        set near( val: number ) {
            if ( this._near === val ) return;
            this._near = val; this.updateProjectionMatrix();
        }

        set far( val: number ) {
            if ( this._far === val ) return;
            this._far = val; this.updateProjectionMatrix();
        }
    }
}