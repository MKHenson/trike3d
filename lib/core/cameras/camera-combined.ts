namespace Trike {
	/**
	* A camera that contains both perspective as well as orthographic child cameras, that allows you to switch between the camera modes.
	*/
    export class CameraCombined extends Camera {
        public matrixWorldInverse: Matrix4;
        public inOrthographicMode: boolean;
        public inPerspectiveMode: boolean;

        // Used for building frustums
        public _projScreenMatrix: Matrix4;

        private _fov: number;
        private _left: number;
        private _top: number;
        private _right: number;
        private _bottom: number;
        private _zoom: number;

        private _camP: CameraPerspective;
        private _camO: CameraOrthographic;
        private _activeCam: CameraPerspective | CameraOrthographic;


        constructor(width: number = 800, height: number = 600, fov: number = 60, near: number = 0.1, far: number = 2000.0, orthoNear: number = 0.1, orthoFar: number = 2000.0) {
            super();

            this._fov = fov;
            this._left = -width / 2;
            this._top = height / 2;
            this._right = width / 2;
            this._bottom = -height / 2;

            this._zoom = 1;

            this.inOrthographicMode = false;
            this.inPerspectiveMode = true;
            this._activeCam = null;

            this._camP = new CameraPerspective(fov, width / height, near, far, this.passes);
            this._camO = new CameraOrthographic(width / -2, width / 2, height / 2, height / -2, orthoNear, orthoFar, this.passes);

            this.toPerspective();
        }

        //     propagateFogProperties()
        //     {
        //         var camP = this._camP;
        //         var camO = this._camO;

        //         camO.fogColor.copy( camP.fogColor.copy(this.fogColor) );
        //         camO.fogDensity = camP.fogDensity = this.fogDensity;
        //         camO.fogHeightDensity = camP.fogHeightDensity = this.fogHeightDensity;
        //         camO.fogHeightMax = camP.fogHeightMax = this.fogHeightMax;
        //         camO.fogHeightMin = camP.fogHeightMin = this.fogHeightMin;
        //         camO.fogType = camP.fogType = this.fogType;
        // camO.skybox(camP.skybox(this.skybox()));
        //     }

		/**
		* Copies the values of the given camera
		* @param {CameraOrthographic} cam the camera to copy from
		* @returns {Object3D}
		*/
        copy(cam: CameraCombined): Object3D {
            super.copy(cam);
            this.inOrthographicMode = cam.inOrthographicMode;
            this.inPerspectiveMode = cam.inPerspectiveMode;
            this._fov = cam._fov;
            this._left = cam._left;
            this._right = cam._right;
            this._top = cam._top;
            this._bottom = cam._bottom;
            this._zoom = cam._zoom;
            this._projScreenMatrix.copy(cam._projScreenMatrix);
            this.matrixWorldInverse.copy(cam.matrixWorldInverse);
            this._camP.copy(cam._camP);
            this._camO.copy(cam._camO);
            this._activeCam = (cam._activeCam === cam._camP ? this._camP : this._camO);

            return this;
        }

		/**
		* Rebuilds the camera projection matrices
		*/
        updateProjectionMatrix() {
            if (this.inPerspectiveMode)
                this.toPerspective();
            else {
                this.toPerspective();
                this.toOrthographic();
            }
        }

		/**
		* Sets the camera to be perspective
		*/
        toPerspective() {
            this._camP.fov = this._fov / this._zoom;
            this._camP.updateProjectionMatrix();

            this.inPerspectiveMode = true;
            this.inOrthographicMode = false;

            if (this._activeCam)
                this.remove(this._activeCam);

            this._activeCam = this._camP;
            this.add(this._activeCam);
        }

		/**
		* Sets the camera to be orthographic
		*/
        toOrthographic() {
            if (this._activeCam)
                this.remove(this._activeCam);

            // Switches to the Orthographic camera estimating viewport from Perspective
            const fov = this._fov;
            const aspect = this._camP.aspect;
            const near = this._camP.near;
            const far = this._camP.far;

            // The size that we set is the mid plane of the viewing frustum
            const hyperfocus = (near + far) / 2;
            let halfHeight = Math.tan(fov / 2) * hyperfocus;
            const planeHeight = 2 * halfHeight;
            let planeWidth = planeHeight * aspect;
            let halfWidth = planeWidth / 2;

            halfHeight /= this._zoom;
            halfWidth /= this._zoom;

            this._camO.left = -halfWidth;
            this._camO.right = halfWidth;
            this._camO.top = halfHeight;
            this._camO.bottom = -halfHeight;
            this._camO.updateProjectionMatrix();

            this.near = this._camO.near;
            this.far = this._camO.far;

            this.inPerspectiveMode = false;
            this.inOrthographicMode = true;
            this._activeCam = this._camO;
            this.add(this._activeCam);
        }

		/**
		* Updates the camera matrices related to its world matrix
		*/
        updateWorldMatrix(force?: boolean) {
            super.updateWorldMatrix(force);
            this.matrixWorldInverse.getInverse(this.worldMatrix);
            this._projScreenMatrix.multiplyMatrices(this._activeCam.projectionMatrix, this.matrixWorldInverse);
            this.projectionMatrix.copy(this._activeCam.projectionMatrix);
            this.projectionInverseMatrix.getInverse(this.projectionMatrix);
        }

		/**
		* Sets the aspect ratio for a perspective mode and the viewing area in orthographic
		*/
        setSize(width: number, height: number) {
            this._camP.aspect = width / height;
            this._left = -width / 2;
            this._right = width / 2
            this._top = height / 2;
            this._bottom = -height / 2;
        }

		/**
		* Sets the field of view
		*/
        setFov(fov: number) {
            this._fov = fov;
            if (this.inPerspectiveMode)
                this.toPerspective();
            else
                this.toOrthographic();
        }


		/**
		* Cleans up the object.
		*/
        dispose() {
            super.dispose();
        }

		/**
		* Sets the zoom of the camera
		*/
        setZoom(zoom: number) {
            this._zoom = zoom;
            if (this.inPerspectiveMode)
                this.toPerspective();
            else
                this.toOrthographic();
        }

		/**
		* Re-aligns the camera to face the front
		*/
        toFrontView() {
            this.setRotation(0, 0, 0);
        }

		/**
		* Re-aligns the camera to face the back
		*/
        toBackView() {
            this.setRotation(0, Math.PI, 0);
        }

		/**
		* Re-aligns the camera to face the left
		*/
        toLeftView() {
            this.setRotation(0, -Math.PI / 2, 0);
        }

		/**
		* Re-aligns the camera to face the right
		*/
        toRightView() {
            this.setRotation(0, Math.PI / 2, 0);
        }

		/**
		* Re-aligns the camera to face the top
		*/
        toTopView() {
            this.setRotation(-Math.PI / 2, 0, 0);
        }

		/**
		* Re-aligns the camera to face the bottom
		*/
        toBottomView() {
            this.setRotation(Math.PI / 2, 0, 0);
        }

        get activeCamera(): Camera { return this._activeCam; }

        get fov(): number { return this._fov; }

        get aspect(): number { return this._camP._aspect; }
        set aspect(val: number) {
            if (val === this._camP.aspect) return;
            this._camP.aspect = val; this.updateWorldMatrix();
        }

        get far(): number { return (this._activeCam).far; }
        set far(val: number) {
            if (val === this._activeCam.far) return;
            this._activeCam.far = val; this.updateWorldMatrix();
        }

        get near(): number { return (this._activeCam).near; }
        set near(val: number) {
            if (val === this._activeCam.near) return;
            this._activeCam.near = val; this.updateWorldMatrix();
        }

        get zoom(): number { return this._zoom; }
    }
}