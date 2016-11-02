namespace Trike {
    export enum ForceType {
        Spherical,
        Cone,
        Box,
        Directional
    }

	/**
	* Sets the velocity/initial force of each particle
	*/
    export class ModuleForce extends Module {
        public direction: Vec3;
        public coneDirection: Vec3;
        public coneAngle: number;
        public scale: number;
        public forceType: ForceType;


        private _v: Vec3;
        private _v2: Vec3;
        private _q: Quat;

		/*
		* Creates an instance of a module
		*/
        constructor( forceType: ForceType = ForceType.Directional ) {
            super();

            this.scale = 1;
            this.direction = new Vec3( 0, 0, 1 );
            this.coneDirection = new Vec3( 0, 0, 1 );
            this.coneAngle = Math.PI * 0.5;
            this._v = new Vec3( 0, 0, 0 );
            this._v2 = new Vec3( 0, 0, 0 );
            this._q = new Quat();
            this.forceType = forceType;
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
            const scale: number = this.scale,
                d = parent.frameSpeed,
                maxlife = parent.maxLife,
                v = this._v,
                v2 = this._v2,
                q = this._q,
                forceType = this.forceType,
                direction = this.direction,
                coneDirection = this.coneDirection,
                coneAngle = this.coneAngle;


            let vi: number = 0,
                updateBuffers = false;

            for ( let i = 0, l = lifetimes.length; i < l; i++ ) {
                if ( loopArray[ i ] === false )
                    continue;

                vi = i * 3;

                updateBuffers = true;

                if ( lifetimes[ i ] === 0 ) {
                    if ( forceType === ForceType.Directional ) {
                        velocities[ vi ] += direction.x * scale;
                        velocities[ vi + 1 ] += direction.y * scale;
                        velocities[ vi + 2 ] += direction.z * scale;
                    }
                    else if ( forceType === ForceType.Spherical ) {
                        Random.pointOnSphere( 1, null, v );
                        velocities[ vi ] += v.x * scale;
                        velocities[ vi + 1 ] += v.y * scale;
                        velocities[ vi + 2 ] += v.z * scale;
                    }
                    else if ( forceType === ForceType.Box ) {
                        Random.pointInsideBox( 1, 1, 1, v.set( 0, 0, 0 ), v );
                        velocities[ vi ] += v.x * scale;
                        velocities[ vi + 1 ] += v.y * scale;
                        velocities[ vi + 2 ] += v.z * scale;
                    }
                    else if ( forceType === ForceType.Cone ) {
                        // Create random axis
                        v.set( Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1 );
                        v.normalize();
                        v2.copy( coneDirection );
                        v2.applyQuaternion( q.setFromAxisAngle( v, coneAngle ) );

                        velocities[ vi ] += v2.x * scale;
                        velocities[ vi + 1 ] += v2.y * scale;
                        velocities[ vi + 2 ] += v2.z * scale;
                    }
                }
            }

            return updateBuffers;
        }

		/*
		* Cleans up all class references
		*/
        dispose() {
            this.direction = null;
            this._v = null;
            this._q = null;

            super.dispose();
        }
    }
}