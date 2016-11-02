namespace Trike {
	/**
	* The acceleration module is used to accelerate or deccelerate the point cloud velocities over time
	*/
    export class ModuleAcceleration extends Module {
        public acceleration: Vec3;

		/*
		* Creates an instance of a module
		*/
        constructor() {
            super();

            this.acceleration = new Vec3();
        }


		/*/*
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
            const acceleration: Vec3 = this.acceleration;
            let vi: number = 0;
            let updateBuffers = false;

            for ( let i = 0, l = lifetimes.length; i < l; i++ ) {
                if ( loopArray[ i ] === false )
                    continue;

                vi = i * 3;
                velocities[ vi ] *= acceleration.x;
                velocities[ vi + 1 ] *= acceleration.y;
                velocities[ vi + 2 ] *= acceleration.z;
                updateBuffers = true;
            }

            return updateBuffers;
        }

		/*
		* Cleans up all class references
		*/
        dispose() {
            this.acceleration = null;
            super.dispose();
        }
    }
}