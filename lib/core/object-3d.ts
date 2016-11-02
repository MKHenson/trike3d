namespace Trike {
	/**
	* Base class for all 3d objects
	*/
    export class Object3D extends EventDispatcher {
        // Shadows
        private _castShadows: boolean;

        public static defaultEulerOrder: string = 'XYZ';
        private static _v1: Vec3;
        private static _v2: Vec3;

        public disposed: boolean;
        public parent: Object3D;
        public children: Array<Object3D>;
        public matrix: Matrix4;
        public worldMatrix: Matrix4;
        public up: Vec3;
        public position: Vec3;
        public scale: Vec3;
        public updateMatrixWorld: boolean;
        public updateMatrix: boolean;
        public _modelViewMatrix: Matrix4;
        public _normalMatrix: Matrix3;

        private _rotation: Euler;
        private _options: { [ s: string ]: any; };

		/**
		* Creates a new Object3D instance
		*/
        constructor() {
            super();

            this._castShadows = true;

            this.matrix = new Matrix4();
            this.worldMatrix = new Matrix4();
            this.disposed = false;

            this._modelViewMatrix = new Matrix4();
            this._normalMatrix = new Matrix3();
            this.parent = null;
            this.children = [];

            this.updateMatrixWorld = true;
            this.updateMatrix = true;

            this.up = new Vec3( 0, 1, 0 );
            this.position = new Vec3();
            this._rotation = new Euler();
            this.scale = new Vec3( 1, 1, 1 );

            this._options = {};

            if ( !Object3D._v1 ) {
                Object3D._v1 = new Vec3();
                Object3D._v2 = new Vec3();
            }
        }

		/**
		* Copies the values of the given object into this. Does not copy children, parent or optional variables
		* @param {Object3D} o3d the object to copy from
		* @returns {Object3D}
		*/
        copy( o3d: Object3D ): Object3D {
            this.matrix.copy( o3d.matrix );
            this.worldMatrix.copy( o3d.worldMatrix );
            this.disposed = o3d.disposed;

            this._modelViewMatrix.copy( o3d._modelViewMatrix );
            this._normalMatrix.copy( o3d._normalMatrix );

            this.updateMatrixWorld = o3d.updateMatrixWorld;
            this.updateMatrix = o3d.updateMatrix;

            this.up.copy( o3d.up );
            this.position.copy( o3d.position );
            this._rotation.copy( o3d._rotation );
            this.scale.copy( o3d.scale );
            return this;
        }

		/**
		* Gets or sets if this object can cast shadows
		* @param {number} val
		*/
        castShadows( val?: boolean ): boolean {
            if ( val === undefined ) return this._castShadows;

            this._castShadows = val;
            return val;
        }

		/**
		* Sets the x rotation in radians
		* @param {number} val
		*/
        set rotationX( val: number ) { this._rotation.x = val; this.updateMatrix = true; }

		/**
		* Sets the y rotation in radians
		* @param {number} val
		*/
        set rotationY( val: number ) { this._rotation.y = val; this.updateMatrix = true; }

		/**
		* Sets the z rotation in radians
		* @param {number} val
		*/
        set rotationZ( val: number ) { this._rotation.z = val; this.updateMatrix = true; }

		/**
		* Gets the x rotation in radians
		* @returns {number}
		*/
        get rotationX(): number { return this._rotation.x; }

		/**
		* Gets the y rotation in radians
		* @returns {number}
		*/
        get rotationY(): number { return this._rotation.y; }

		/**
		* Gets the z rotation in radians
		* @returns {number}
		*/
        get rotationZ(): number { return this._rotation.z; }

		/**
		* Sets the x scale
		* @param {number} val
		*/
        set scaleX( val: number ) { val = val || 0.00001; this.scale.x = val; this.updateMatrix = true; }

		/**
		* Sets the y scale
		* @param {number} val
		*/
        set scaleY( val: number ) { val = val || 0.00001; this.scale.y = val; this.updateMatrix = true; }

		/**
		* Sets the z scale
		* @param {number} val
		*/
        set scaleZ( val: number ) { val = val || 0.00001; this.scale.z = val; this.updateMatrix = true; }

		/**
		* Gets the x scale
		* @returns {number}
		*/
        get scaleX(): number { return this.scale.x; }

		/**
		* Gets the y scale
		* @returns {number}
		*/
        get scaleY(): number { return this.scale.y; }

		/**
		* Gets the z scale
		* @returns {number}
		*/
        get scaleZ(): number { return this.scale.z; }

		/**
		* Sets the x position
		* @param {number} val
		*/
        set positionX( val: number ) { this.position.x = val; this.updateMatrix = true; }

		/**
		* Sets the y position
		* @param {number} val
		*/
        set positionY( val: number ) { this.position.y = val; this.updateMatrix = true; }

		/**
		* Sets the z position
		* @param {number} val
		*/
        set positionZ( val: number ) { this.position.z = val; this.updateMatrix = true; }

		/**
		* Gets the x position
		* @returns {number}
		*/
        get positionX(): number { return this.position.x; }

		/**
		* Gets the y position
		* @returns {number}
		*/
        get positionY(): number { return this.position.y; }

		/**
		* Gets the z position
		* @returns {number}
		*/
        get positionZ(): number { return this.position.z; }

		/**
		* Gets the rotation euluer
		* @returns {Euler}
		*/
        get rotation(): Euler { return this._rotation; }

		/**
		* Sets the rotation euluer
		* @param {Euler} value
		*/
        set rotation( value: Euler ) {
            this._rotation = value;
            this._rotation._updateQuaternion();
            this.updateMatrix = true;
        }

		/**
		* Gets the quaternion of this objects Euler
		* @returns {Quat}
		*/
        get quaternion(): Quat { return this._rotation._quaternion; }

		/**
		* Sets the x, y, z coordinates of the object
		* @param {number} x
		* @param {number} y
		* @param {number} z
		*/
        setPosition( x: number, y: number, z: number ) {
            const p = this.position;
            p.x = x;
            p.y = y;
            p.z = z;
            this.updateMatrix = true;
        }

		/**
		* Sets the x, y, z rotation of the object
		* @param {number} x
		* @param {number} y
		* @param {number} z
		*/
        setRotation( x: number, y: number, z: number ) {
            const r = this._rotation;
            r._x = x;
            r._y = y;
            r._z = z;
            r._updateQuaternion();
            this.updateMatrix = true;
        }

		/**
		* Sets the x, y, z scale of the object
		* @param {number} x
		* @param {number} y
		* @param {number} z
		*/
        setScale( x: number, y: number, z: number ) {
            x = x || 0.00001;
            y = y || 0.00001;
            z = z || 0.00001;

            const s = this.scale;
            s.x = x;
            s.y = y;
            s.z = z;
            this.updateMatrix = true;
        }

		/**
		* Adds a child to this object
		* @param {Object3D} child The child to add
		*/
        add( child: Object3D ) {
            if ( child === this )
                throw new Error( 'An object can\'t be added as a child of itself' );

            if ( child.parent )
                child.parent.remove( child );

            child.parent = this;

            this.children.push( child );

            child.updateMatrixWorld = true;

            // add to scene
            let scene: Object3D = this;
            while ( scene.parent )
                scene = scene.parent;

            if ( scene !== undefined && scene instanceof Scene )
                ( <Scene>scene )._addObject( child );
        }



		/**
		* removes a child from this object
		* @param {Object3D} child The child to remove
		*/
        remove( child: Object3D ) {
            const index = this.children.indexOf( child );

            if ( index !== - 1 ) {
                child.parent = null;
                this.children.splice( index, 1 );
            }

            // Remove from scene
            let scene: Object3D = this;
            while ( scene.parent )
                scene = scene.parent;

            if ( scene !== undefined && scene instanceof Scene )
                ( <Scene>scene )._removeObject( child );
        }

		/**
		* An update call made before the rendering process begins
		* @param {number} totalTime The total number of milliseconds since the start of the app
		* @param {number} delta The delta time since the last update call
		* @param {Camera} camera The camera being for the render
		* @param {Renderer} renderer The renderer used to draw the scene
		*/
        update( totalTime: number, delta: number, camera: Camera, renderer: Renderer ) {
            // update children
            const children = this.children;
            for ( let i = 0, l = children.length; i < l; i++ ) {
                children[ i ].update( totalTime, delta, camera, renderer );
            }
        }


		/**
		* Updates the objects vertices
		* @param {boolean} forceWorldUpdate If true, the world matrices will be forced to update
		* @param {boolean} forceLocalUpdate If true, the local matrices will be forced to update
		*/
        updateWorldMatrix( forceWorldUpdate: boolean = false, forceLocalUpdate: boolean = false ) {
            if ( this.updateMatrix || forceLocalUpdate ) {
                this.matrix.compose( this.position, this.quaternion, this.scale );
                this.updateMatrix = false;
                forceWorldUpdate = true;
            }

            if ( this.updateMatrixWorld || forceWorldUpdate ) {
                const worldMat = this.worldMatrix;

                if ( this.parent )
                    worldMat.multiplyMatrices( this.parent.worldMatrix, this.matrix );
                else
                    worldMat.copy( this.matrix );

                this.updateMatrixWorld = false;
                forceWorldUpdate = true;
            }

            // update children
            const children = this.children;
            for ( let i = 0, l = children.length; i < l; i++ ) {
                children[ i ].updateWorldMatrix( forceWorldUpdate, forceLocalUpdate );
            }
        }

		/**
		* Moves the object in the direction defined by the axis
		* @param {Vec3} axis The direction axis
		* @param {number} distance The amount to move
		* @returns {Object3D}
		*/
        translateOnAxis( axis: Vec3, distance: number ): Object3D {
            // translate object by distance along axis in object space
            // axis is assumed to be normalized
            const v1 = Object3D._v1.set( 0, 0, 0 );
            v1.copy( axis );
            v1.applyQuaternion( this.quaternion );
            this.position.add( v1.multiplyScalar( distance ) );
            return this;
        }

		/**
		* Moves the object along its X axis
		* @param {number} distance The amount to move
		* @returns {Object3D}
		*/
        translateX( distance: number ): Object3D {
            const v1 = Object3D._v2.set( 1, 0, 0 );
            return this.translateOnAxis( v1, distance );
        }

		/**
		* Moves the object along its Y axis
		* @param {number} distance The amount to move
		* @returns {Object3D}
		*/
        translateY( distance: number ): Object3D {
            const v1 = Object3D._v2.set( 0, 1, 0 );
            return this.translateOnAxis( v1, distance );
        }

		/**
		* Moves the object along its Z axis
		* @param {number} distance The amount to move
		* @returns {Object3D}
		*/
        translateZ( distance: number ): Object3D {
            const v1 = Object3D._v2.set( 0, 0, 1 );
            return this.translateOnAxis( v1, distance );
        }


		/**
		* Updates the rotation values to look at a target
		* @param {Vec3} vector the target to look at
		*/
        lookAt( vector: Vec3 ) {
            const m1 = new Matrix4();

            m1.lookAt( vector, this.position, this.up );
            this.quaternion.setFromRotationMatrix( m1 );

            this.updateMatrix = true;
        }

		/**
		* Gets all the children of this node.
		* @param {Array<Object3D>} out Optionally you can pass an array to fill. If none is given an array is created for you.
		* @returns {Array<Object3D>}
		*/
        getAllChildren( out?: Array<Object3D> ): Array<Object3D> {
            if ( out === undefined ) out = [];

            out.push( this );

            const children: Array<Object3D> = this.children;
            for ( let i = 0, l = children.length; i < l; i++ )
                children[ i ].getAllChildren( out );

            return out;
        }

		/**
		* Returns true if the object is added to a scene
		* @returns {boolean}
		*/
        get addedToScene(): boolean {
            // Check if its added to the stage - if not then do nothing
            let p: Object3D = this.parent;
            const addedToStage: boolean = true;
            while ( p ) {
                if ( p instanceof Scene )
                    return true;

                p = p.parent;
            }

            return false;
        }

		/**
		* Creates an option which is associated with this asset. The name of the option must be unique.
		* Use this to add your own custom data
		* @param {string} name the name of the option
		* @param {any} val the value of the option
		*/
        createOption( name: string, val: any ) { this._options[ name ] = val; }

		/**
		* Destroys an option
		* @param {string} name the name of the option to destroy
		*/
        removeOption( name: string ) { delete this._options[ name ]; }

		/**
		* Update the value of an option
		* @param {string} name the name of the option
		* @param {any} val the value of the option
		*/
        updateOption( name: string, val: any ) { this._options[ name ] = val; }

		/**
		* Returns the value of an option
		* @param {string} name the name of the option
		* @returns {any} The value of the option
		*/
        getOption( name: string ): any { return this._options[ name ]; }

		/**
		* Cleans up the object.
		*/
        dispose() {
            if ( this.parent )
                this.parent.remove( this );

            this.disposed = true;
            this._options = null;
        }
    }
}