namespace Trike {
	/**
	* The sphere emitter will place each particle in a sphere centered at its position and radius
	*/
    export class EmitterSphere extends Emitter {
        public radius: number;

		/**
		* Creates an  instance of this emitter
		* @param {number} radius The radius of this emitter
		* @param {number} maxLife The lifetime of each particle in milliseconds
		* @param {PointCloud} cloud The point cloud associated with this emitter
		*/
        constructor( radius: number, maxLife: number = 2000, cloud?: PointCloud ) {
            super( maxLife, cloud );
            this.radius = radius;
        }

		/**
		* Updates the position of a point so that its back within the boundary of the emitter
		* @param {Vec3} position The position vector to update
		*/
        updateLocation( position: Vec3 ) {
            Random.pointInsideSphere( this.radius, null, position );
        }


		/*
		* Cleans up all class references
		*/
        dispose() {
            super.dispose();
        }
    }
}