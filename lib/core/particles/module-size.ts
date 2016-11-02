namespace Trike {
	/**
	* The size module is used to change the size of each point cloud particle over time
	*/
    export class ModuleSize extends Module {
        public birthSize: number;
        public deathSize: number;
        public velocityScale: number;
        private _v: Vec3;

		/*
		* Creates an instance of a module
		*/
        constructor() {
            super();

            this.birthSize = 1;
            this.deathSize = 0;
            this.velocityScale = 0;
            this._v = new Vec3();
        }


		/*
		* Updates buffers of the parent emitters point cloud, based on the life of each particle
		* @param {number} totalTime The total time in milliseconds from the start of the application
		* @param {number} delta The delta time since the last frame update
		* @param {Float32Array} lifetimes The lifespan of each point of the emitter's point cloud. The length of this array matches the number of points in the cloud.
		* @param {Float32Array} velocities The velocities of each point of the emitter's point cloud. The length of this array matches the number of points in the cloud times by 3.
		* @param {Array<boolean>} loopArray An array indicating if a specific particle has reached the end of its track
		* @param {Emitter} The emitter calling this module
		* @returns {boolean} If false is returned, then the position buffer will not be updated. If true, it will.
		*/
        update( totalTime: number, delta: number, lifetimes: Float32Array, velocities: Float32Array, loopArray: Array<boolean>, parent: Emitter ): boolean {
            const geom: Geometry = parent._pointCloud._geometry,
                sizeBuffer: GeometryBuffer = geom.buffers[ AttributeType.SCALE ];

            if ( !sizeBuffer )
                return false;

            const sizeData: Array<number> = sizeBuffer.data,
                birthSize: number = this.birthSize,
                deathSize: number = this.deathSize,
                d: number = parent.frameSpeed,
                maxlife: number = parent.maxLife,
                velocityScale = this.velocityScale,
                velocity = this._v;


            let vi: number = 0,
                normalizedLife: number = 0,
                velocityFactor: number = 0,
                updateBuffers = false;

            for ( let i = 0, l = lifetimes.length; i < l; i++ ) {
                if ( loopArray[ i ] === false )
                    continue;

                updateBuffers = true;

                if ( lifetimes[ i ] + d <= maxlife )
                    normalizedLife = lifetimes[ i ] / maxlife;
                else
                    normalizedLife = 0;


                if ( velocityScale ) {
                    vi = i * 3;
                    velocity.set( velocities[ vi ], velocities[ vi + 1 ], velocities[ vi + 2 ] );
                    velocityFactor = velocityScale * velocity.length();
                    sizeData[ i ] = Interpolater.interpolate( birthSize * velocityFactor, deathSize * velocityFactor, normalizedLife );
                }
                else
                    sizeData[ i ] = Interpolater.interpolate( birthSize, deathSize, normalizedLife );
            }

            if ( loopArray && geom.dirtyBuffers.indexOf( sizeBuffer ) === -1 )
                geom.dirtyBuffers.push( sizeBuffer );

            return false;
        }


		/*
		* Cleans up all class references
		*/
        dispose() {
            super.dispose();
        }
    }
}