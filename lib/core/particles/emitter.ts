namespace Trike {
	/**
	* The emitter class is used to control the geometry buffers of point clouds. Each emitter
	* is responsible for the birth position, velocity and lifespan of each point cloud particle.
	* Sub classes of the Emitter will specialize in setting the birth position of each particle
	* by overriding the updateLocation function. The updateLocation is called whenever a particle
	* lifespan goes over the maxLife (which it does as it ages).
	* Each emitter has an array of optional modules that are used to modify
	* the position, and other, buffers of the point cloud geometry over time.
	*/
    export class Emitter {
        public maxLife: number;
        public frameSpeed: number;
        public _pointCloud: PointCloud;
        public boundingBox: Box3;
        public randomizeLifespan: boolean;
        public worldSpace: boolean;
        public loop: boolean;

        private _loopArray: Array<boolean>;
        private _lifetimes: Float32Array;
        private _velocities: Float32Array;
        private _modules: Array<Module>;
        private _numPoints: number;
        private _lifeSorter: Array<number>;
        private _velSorter: Array<number>;
        private _v: Vec3;

		/**
		* Creates an  instance of this emitter
		* @param {number} maxLife The max lifetime of each particle in milliseconds
		* @param {PointCloud} cloud The point cloud associated with this emitter
		*/
        constructor( maxLife: number = 2000, cloud?: PointCloud ) {
            this._modules = [];
            this._lifetimes = null;
            this._velocities = null;
            this.maxLife = maxLife;
            this._numPoints = 0;
            this.pointCloud = cloud;
            this._lifeSorter = [];
            this._velSorter = [];
            this.boundingBox = new Box3();
            this.frameSpeed = 10;
            this.randomizeLifespan = true;
            this.worldSpace = true;
            this.loop = true;
            this._loopArray = [];
            this._v = new Vec3();
        }

		/**
		* Updates the position of a point so that its back within the boundary of the emitter.
		* The updateLocation is called whenever a particle lifespan goes over the maxLife.
		* @param {Vec3} position The position vector to update
		*/
        updateLocation( position: Vec3 ) { }

		/**
		* An update call made before the rendering process begins
		* @param {number} totalTime The total number of milliseconds since the start of the app
		* @param {number} delta The delta time since the last update call
		*/
        update( totalTime: number, delta: number ) {
            const pointCloud: PointCloud = this._pointCloud,
                mods: Array<Module> = this._modules,
                lifetimes: Float32Array = this._lifetimes,
                velocities: Float32Array = this._velocities,
                geom: Geometry = pointCloud._geometry,
                pBuffer: GeometryBuffer = geom.buffers[ AttributeType.POSITION ],
                maxLife: number = this.maxLife,
                verts: Array<Vec3> = pBuffer.data,
                frameSpeed: number = this.frameSpeed,
                worldSpace: boolean = this.worldSpace,
                velocityLocal: Vec3 = this._v,
                invWorldMat: Matrix4 = pointCloud.invWorld,
                loop: boolean = this.loop,
                loopArray = this._loopArray;

            let position: Vec3,
                updatePBuffer: boolean = false,
                i3: number = 0,
                life: number = 0;


            // Update each of the modules
            for ( let i: number = 0, l: number = mods.length; i < l; i++ )
                if ( mods[ i ].update( totalTime, delta, lifetimes, velocities, loopArray, this ) )
                    updatePBuffer = true;

            // Age each of the particles
            for ( let i: number = 0, l: number = lifetimes.length; i < l; i++ ) {
                i3 = i * 3;
                life = lifetimes[ i ];
                life += frameSpeed;

                if ( life > maxLife ) {
                    life = 0;
                    loopArray[ i ] = loop;
                }

                lifetimes[ i ] = life;

                if ( updatePBuffer ) {
                    position = verts[ i ];

                    if ( life === 0 ) {
                        velocities[ i3 ] = 0;
                        velocities[ i3 + 1 ] = 0;
                        velocities[ i3 + 2 ] = 0;

                        this.updateLocation( position );
                    }
                    else {
                        if ( worldSpace ) {
                            velocityLocal.set( velocities[ i3 ], velocities[ i3 + 1 ], velocities[ i3 + 2 ] );
                            velocityLocal.applyMatrix4( invWorldMat );

                            position.x += velocityLocal.x;
                            position.y += velocityLocal.y;
                            position.z += velocityLocal.z;
                        }
                        else {
                            position.x += velocities[ i3 ];
                            position.y += velocities[ i3 + 1 ];
                            position.z += velocities[ i3 + 2 ];
                        }
                    }
                }
            }

            // Put the position buffer in the firty queue if it needs to be updated
            if ( updatePBuffer && geom.dirtyBuffers.indexOf( pBuffer ) === -1 ) {
                pointCloud.updateWorldSphere = true;
                geom.dirtyBuffers.push( pBuffer );
            }
        }

		/*
		* Cleans up all class references
		*/
        dispose() {
            this._modules = null;
            this._lifetimes = null;
            this._velocities = null;
            this._pointCloud = null;
            this._lifeSorter = null;
            this._velSorter = null;
        }

		/*
		* If the point cloud is sorted, it will call this function. Any internal buffers representing vertex buffers
		* will need to be sorted as well. The array passed to this function represents the sorted order. Each item is
		* an array of [depth, originalIndex]. You should really only focus on the originalIndex, which is the index
		* of the item before it was sorted.
		* @param {Array<Array<number>>} sortArray An array representing the new sorted order. Each item is
		* an array of [depth, originalIndex]
		*/
        sort( sortArray: Array<Array<number>> ) {
            const lifeSorter = this._lifeSorter,
                velSorter = this._velSorter,
                velocities = this._velocities,
                lifetimes = this._lifetimes,
                loopArray = this._loopArray;


            let prevIndex: number,
                vi: number = 0;

            lifeSorter.splice( 0, lifeSorter.length );
            velSorter.splice( 0, velSorter.length );
            const l = sortArray.length;

            for ( let i = 0; i < l; i++ ) {
                prevIndex = sortArray[ i ][ 1 ];
                vi = prevIndex * 3;

                loopArray.push( loopArray[ prevIndex ] );
                lifeSorter.push( lifetimes[ prevIndex ] );
                velSorter.push( velocities[ vi ] );
                velSorter.push( velocities[ vi + 1 ] );
                velSorter.push( velocities[ vi + 2 ] );
            }

            lifetimes.set( lifeSorter, 0 );
            velocities.set( velSorter, 0 );
            loopArray.splice( l, l * 2 );
        }

		/*
		* When a point cloud is updated with new points, this function needs to be called so that it
		* can update its internal buffers
		* @param {number} numPoints the number of points to create
		*/
        generatePoints( numPoints: number ) {
            if ( numPoints === 0 ) {
                this._lifetimes = null;
                this._velocities = null;
                return;
            }

            this._numPoints = numPoints;
            numPoints = this._numPoints;
            this._lifetimes = new Float32Array( numPoints );
            this._loopArray = new Array( numPoints );
            this._velocities = new Float32Array( numPoints * 3 );
            this.reset();
        }

		/*
		* Resets the emitters particles arrays
		*/
        reset() {
            if ( !this._pointCloud || this._numPoints === 0 )
                return;

            const numPoints: number = this._numPoints,
                lifetimes: Float32Array = this._lifetimes,
                velocities: Float32Array = this._velocities,
                geom: Geometry = this._pointCloud._geometry,
                pBuffer: GeometryBuffer = geom.buffers[ AttributeType.POSITION ],
                verts: Array<Vec3> = pBuffer.data,
                loopArray = this._loopArray,
                maxLife = this.maxLife,
                randomizeLifespan: boolean = this.randomizeLifespan;

            let i3: number = 0;

            // Age each of the particles
            for ( let i: number = 0, l: number = lifetimes.length; i < l; i++ ) {
                i3 = i * 3;
                if ( randomizeLifespan )
                    lifetimes[ i ] = Math.random() * maxLife;
                else
                    lifetimes[ i ] = 0;

                loopArray[ i ] = true;

                velocities[ i3 ] = 0;
                velocities[ i3 + 1 ] = 0;
                velocities[ i3 + 2 ] = 0;

                this.updateLocation( verts[ i ] );
            }

            // Put the position buffer in the firty queue if it needs to be updated
            if ( geom.dirtyBuffers.indexOf( pBuffer ) === -1 )
                geom.dirtyBuffers.push( pBuffer );
        }

		/*
		* Sets the point cloud of this emitter
		* @param {PointCloud}
		*/
        set pointCloud( val: PointCloud ) {
            this._pointCloud = val;
            if ( val )
                this.generatePoints( val.numPoints );
            else {
                this._lifetimes = null;
                this._velocities = null;
            }
        }

		/*
		* Gets the point cloud of this emitter
		* @returns {PointCloud}
		*/
        get pointCloud(): PointCloud { return this._pointCloud; }

		/*
		* Gets the modules affecting this emitter
		* @returns {Array<Module>}
		*/
        get modules(): Array<Module> { return this._modules; }

		/*
		* Adds a module to this emitter
		* @param {Module} val The module to add
		*/
        addModule( val: Module ) {
            const modules: Array<Module> = this._modules;
            if ( modules.indexOf( val ) === -1 )
                modules.push( val );
        }

		/*
		* Removes a module from this emitter
		* @param {Module} val The module to remove
		*/
        removeModule( val: Module ) {
            const modules: Array<Module> = this._modules;
            if ( modules.indexOf( val ) !== -1 )
                modules.splice( modules.indexOf( val ), 1 );
        }

		/*
		* Removes all modules from this emitter
		*/
        clearModules() {
            const modules: Array<Module> = this._modules;
            modules.splice( 0, modules.length );
        }
    }
}