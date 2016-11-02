namespace Trike {
	/**
	* The acceleration module is used to change the opacity of each point cloud particle over time
	*/
    export class ModuleOpacity extends Module {
        public birthOpacity: number;
        public deathOpacity: number;
        public velocityScale: number;
        private _v: Vec3;

		/*
		* Creates an instance of a module
		*/
        constructor() {
            super();

            this.birthOpacity = 1;
            this.deathOpacity = 0;
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
                opacityBuffer: GeometryBuffer = geom.buffers[ AttributeType.ALPHA ];

            if ( !opacityBuffer )
                return false;

            const opacityData: Array<number> = opacityBuffer.data,
                birthOpacity: number = this.birthOpacity,
                deathOpacity: number = this.deathOpacity,
                d: number = parent.frameSpeed,
                maxlife: number = parent.maxLife,
                velocityScale = this.velocityScale;


            let normalizedLife: number = 0,
                vi: number = 0,
                velocity = this._v,
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
                    opacityData[ i ] = Interpolater.interpolate( birthOpacity * velocityFactor, deathOpacity * velocityFactor, normalizedLife );
                }
                else
                    opacityData[ i ] = Interpolater.interpolate( birthOpacity, deathOpacity, normalizedLife );
            }

            if ( updateBuffers && geom.dirtyBuffers.indexOf( opacityBuffer ) === -1 )
                geom.dirtyBuffers.push( opacityBuffer );

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