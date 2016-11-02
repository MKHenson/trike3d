namespace Trike {
	/**
	* Base class for all animation keys. Represents an animation key frame at a given time.
	*/
    export class AnimationKey {
        public time: number;

		/**
		* Creates an instance
		*/
        constructor( time?: number ) {
            this.time = time || 0;
        }
    }

	/**
	* A key that represents a translation at a given time
	*/
    export class TranslateKey extends AnimationKey {
        public position: Vec3;

		/**
		* Creates an instance
		*/
        constructor( time?: number, position?: Vec3 ) {
            super( time );
            this.position = position || null;
        }
    }

	/**
	* A key that represents a rotation at a given time
	*/
    export class RotateKey extends AnimationKey {
        public rotation: Quat;

		/**
		* Creates an instance
		*/
        constructor( time?: number, rotation?: Quat ) {
            super( time );
            this.rotation = rotation || null;
        }
    }

	/**
	* A key that represents a scale at a given time
	*/
    export class ScaleKey extends AnimationKey {
        public scale: Vec3;

		/**
		* Creates an instance
		*/
        constructor( time?: number, scale?: Vec3 ) {
            super( time );
            this.scale = scale || null;
        }
    }
}