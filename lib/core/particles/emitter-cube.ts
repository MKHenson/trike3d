namespace Trike {
	/**
	* The cube emitter will place each particle in a cube centered at its position and using its dimensions
	*/
    export class EmitterCube extends Emitter {
        public width: number;
        public height: number;
        public depth: number;


		/**
		* Creates an  instance of this emitter
		* @param {number} width The width of this emitter
		* @param {number} height The width of this emitter
		* @param {number} depth The width of this emitter
		* @param {number} maxLife The lifetime of each particle in milliseconds
		* @param {PointCloud} cloud The point cloud associated with this emitter
		*/
        constructor( width: number, height: number, depth: number, maxLife: number = 2000, cloud?: PointCloud ) {
            super( maxLife, cloud );
            this.width = width;
            this.height = height;
            this.depth = depth;
        }

		/**
		* Updates the position of a point so that its back within the boundary of the emitter
		* @param {Vec3} position The position vector to update
		*/
        updateLocation( position: Vec3 ) {
            Random.pointInsideBox( this.width, this.height, this.depth, null, position );
        }


		/*
		* Cleans up all class references
		*/
        dispose() {
            super.dispose();
        }
    }
}