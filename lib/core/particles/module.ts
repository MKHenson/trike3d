namespace Trike {
	/**
	* The base class for all emitter modules. Each module manipulates a point cloud buffer
	* typically over time.
	*/
    export class Module {
		/*
		* Creates an instance of a module
		* @param {Emitter} parent The parent Emitter this belongs to
		*/
        constructor() {
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
            return false;
        }

		/*
		* Cleans up all class references
		*/
        dispose() {
        }
    }
}