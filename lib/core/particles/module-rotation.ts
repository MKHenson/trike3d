namespace Trike {
	/**
	* The rotation module is used to change the rotation of each point cloud particle over time
	*/
    export class ModuleRotation extends Module {
        public birthRotation: number;
        public deathRotation: number;
        public randomize: boolean;
        public velBirthScale: number;
        public velDeathScale: number;
        public velocityScale: number;
        private _v: Vec3;

		/*
		* Creates an instance of a module
		*/
        constructor() {
            super();

            this.birthRotation = 0;
            this.deathRotation = Math.PI * 2;
            this.randomize = true;
            this.velBirthScale = 1;
            this.velDeathScale = 1;
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
                rotationBuffer: GeometryBuffer = geom.buffers[ AttributeType.ROTATION ];

            if ( !rotationBuffer )
                return false;

            const rotationData: Array<number> = rotationBuffer.data,
                birthRotation: number = this.birthRotation,
                deathRotation: number = this.deathRotation,
                d: number = parent.frameSpeed,
                deltaRot: number = deathRotation - birthRotation,
                maxlife: number = parent.maxLife,
                timeFrac: number = delta / parent.maxLife,
                normalizedLife: number = 0,
                velocityScale = this.velocityScale,
                velocity = this._v;


            let vi: number = 0,
                velocityFactor: number = 0,
                updateBuffers = false;

            for ( let i = 0, l = lifetimes.length; i < l; i++ ) {
                if ( loopArray[ i ] === false )
                    continue;

                updateBuffers = true;
                if ( this.randomize && lifetimes[ i ] + d > maxlife )
                    rotationData[ i ] = ( Math.random() * Math.PI * 4 ) - Math.PI * 2;

                if ( velocityScale ) {
                    vi = i * 3;
                    velocity.set( velocities[ vi ], velocities[ vi + 1 ], velocities[ vi + 2 ] );
                    velocityFactor = velocityScale * velocity.length();
                    if ( rotationData[ i ] > 0 )
                        rotationData[ i ] += deltaRot * timeFrac * velocityFactor;
                    else
                        rotationData[ i ] -= deltaRot * timeFrac * velocityFactor;
                }
                else {
                    if ( rotationData[ i ] > 0 )
                        rotationData[ i ] += deltaRot * timeFrac;
                    else
                        rotationData[ i ] -= deltaRot * timeFrac;
                }
            }

            if ( updateBuffers && geom.dirtyBuffers.indexOf( rotationBuffer ) === -1 )
                geom.dirtyBuffers.push( rotationBuffer );

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