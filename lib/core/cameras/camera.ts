namespace Trike {
	/**
	* Base class for all cameras
	*/
    export class Camera extends Object3D {
        public matrixWorldInverse: Matrix4;
        public projectionMatrix: Matrix4;
        public projectionInverseMatrix: Matrix4;

        // Used for building frustums
        public _projScreenMatrix: Matrix4;
        private _lookAt: Matrix4;

        public passes: { [ name: number ]: Array<CompositionPass> };

        constructor( passes?: { [ name: number ]: Array<CompositionPass> }) {
            super();

            this.matrixWorldInverse = new Matrix4();
            this.projectionMatrix = new Matrix4();
            this.projectionInverseMatrix = new Matrix4();
            this._projScreenMatrix = new Matrix4();
            this._lookAt = new Matrix4();

            this.passes = {};
            this.passes[ Phase.Composition ] = ( passes ? passes[ Phase.Composition ] : [ new CameraPass() ] );
            this.passes[ Phase.LightingSolid ] = ( passes ? passes[ Phase.LightingSolid ] : [] );
            this.passes[ Phase.PostCompostion ] = ( passes ? passes[ Phase.PostCompostion ] : [] );
        }

		/**
		* Copies the values of the given camera
		* @param {Camera} cam the camera to copy from
		* @returns {Object3D}
		*/
        copy( cam: Camera ): Object3D {
            super.copy( cam );
            this.matrixWorldInverse.copy( cam.matrixWorldInverse );
            this.projectionMatrix.copy( cam.projectionMatrix );
            this.projectionInverseMatrix.copy( cam.projectionInverseMatrix );
            this._projScreenMatrix.copy( cam._projScreenMatrix );
            this._lookAt.copy( cam._lookAt );

            this.passes[ Phase.Composition ] = cam.passes[ Phase.Composition ].slice( 0, cam.passes[ Phase.Composition ].length );
            this.passes[ Phase.LightingSolid ] = cam.passes[ Phase.LightingSolid ].slice( 0, cam.passes[ Phase.LightingSolid ].length );
            this.passes[ Phase.PostCompostion ] = cam.passes[ Phase.PostCompostion ].slice( 0, cam.passes[ Phase.PostCompostion ].length );
            return this;
        }

        get compositionMaterial(): MaterialCamEffects {
            return ( <CameraPass>this.getPassByName( 'Camera Pass' ) ).camEffects;
        }

		/**
		* Updates the camera matrices related to its world matrix
		*/
        updateWorldMatrix( force?: boolean ) {
            super.updateWorldMatrix( force );
            this.matrixWorldInverse.getInverse( this.worldMatrix );
            this._projScreenMatrix.multiplyMatrices( this.projectionMatrix, this.matrixWorldInverse );
        }

		/**
		* Override the look at function - for camera's we essentially swap the position and vector around.
		*/
        lookAt( vector: Vec3 ) {
            const m1 = this._lookAt.identity();
            m1.lookAt( this.position, vector, this.up );
            this.quaternion.setFromRotationMatrix( m1 );
            this.updateMatrix = true;
        }

		/**
		* Cleans up the object.
		*/
        dispose() {
            super.dispose();

            for ( let i = 0, l = this.passes[ Phase.Composition ].length; i < l; i++ )
                this.passes[ Phase.Composition ][ i ].dispose();
            for ( let i = 0, l = this.passes[ Phase.LightingSolid ].length; i < l; i++ )
                this.passes[ Phase.LightingSolid ][ i ].dispose();
            for ( let i = 0, l = this.passes[ Phase.PostCompostion ].length; i < l; i++ )
                this.passes[ Phase.PostCompostion ][ i ].dispose();

            this.passes = null;
            this.matrixWorldInverse = null;
            this.projectionMatrix = null;
            this._projScreenMatrix = null;
            this._lookAt = null;
        }

		/**
		* Gets a composition pass by its name or null if it cant be found
		* @returns {CompositionPass}
		*/
        getPassByName( name: string ): CompositionPass {
            for ( let i = 0, passes = this.passes[ Phase.Composition ], l = passes.length; i < l; i++ )
                if ( passes[ i ].name === name )
                    return passes[ i ];

            for ( let i = 0, passes = this.passes[ Phase.LightingSolid ], l = passes.length; i < l; i++ )
                if ( passes[ i ].name === name )
                    return passes[ i ];

            for ( let i = 0, passes = this.passes[ Phase.PostCompostion ], l = passes.length; i < l; i++ )
                if ( passes[ i ].name === name )
                    return passes[ i ];

            return null;
        }
    }
}