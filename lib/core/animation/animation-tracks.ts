namespace Trike {
    export enum InterpolationType {
        LINEAR,
        CATMULLROM,
        CATMULLROM_FORWARD
    }

	/**
	* Represents an transform of a bone over time. Each track has an array of {AnimationKey}'s for translation, rotation and scale over time.
	*/
    export class BoneTrack {
        public translateKeys: Array<TranslateKey>;
        public rotateKeys: Array<RotateKey>;
        public scaleKeys: Array<ScaleKey>;
        public boneIndex: number;
        public boneName: string;

		/**
		* Creates an instance of a BoneTrack
		* @param {number} boneIndex The index of the bone this track represents
		* @param {string} boneName The name of the bone this track represents
		*/
        constructor( boneIndex: number, boneName: string ) {
            this.boneIndex = boneIndex;
            this.boneName = boneName;
            this.translateKeys = new Array<TranslateKey>();
            this.rotateKeys = new Array<RotateKey>();
            this.scaleKeys = new Array<ScaleKey>();
        }
    }

	/**
	* Represents an animation consisting of a number of bone tracks. Each bone track has keys for translation, rotation and scale over time.
	* An AnimationPlayer can apply these transforms over time to a skinned mesh
	*/
    export class AnimationTrack {
        public name: string;
        public duration: number;
        public boneTracks: Array<BoneTrack>;

		/**
		* Creates an instance of an AnimationTrack
		* @param {string} name The name of the animation this track represents
		* @param {number} duration The amount of time, in seconds, this track spans
		*/
        constructor( name?: string, duration?: number ) {
            this.name = name;
            this.duration = duration;
            this.boneTracks = new Array<BoneTrack>();
        }

		/**
		* Sets the values of this track from a loaded JSON object
		* @param {any} data The JSON object representing this track
		* @param {Array<BoneInfo>} bones The bones of the mesh that this track will be modifying
		* @returns {AnimationTrack}
		*/
        fromJSON( data: any, bones: Array<BoneInfo> ): AnimationTrack {
            this.name = data.name;
            this.duration = data.length;

            const keys: Array<AnimationKey> = new Array<AnimationKey>();

            // loop through all keys
            for ( let h = 0; h < data.hierarchy.length; h++ ) {
                for ( let k = 0; k < data.hierarchy[ h ].keys.length; k++ ) {
                    // remove minus times
                    if ( data.hierarchy[ h ].keys[ k ].time < 0 )
                        data.hierarchy[ h ].keys[ k ].time = 0;
                }

                // remove all keys that are on the same time
                for ( let k = 1; k < data.hierarchy[ h ].keys.length; k++ ) {
                    if ( data.hierarchy[ h ].keys[ k ].time === data.hierarchy[ h ].keys[ k - 1 ].time ) {
                        data.hierarchy[ h ].keys.splice( k, 1 );
                        k--;
                    }
                }


                // We need to find the bone index for each of the tracks
                let boneIndex: number = -1;
                let boneName: string = '';
                for ( let i = 0, l = bones.length; i < l; i++ )
                    if ( bones[ i ].name === data.hierarchy[ h ].boneName ) {
                        boneIndex = i;
                        boneName = bones[ i ].name;
                        break;
                    }

                // Create the bone track
                const animNode: BoneTrack = new BoneTrack( boneIndex, boneName );
                this.boneTracks.push( animNode );

                // Now fill the keys in their respective tracks
                for ( let k = 0; k < data.hierarchy[ h ].keys.length; k++ ) {
                    if ( data.hierarchy[ h ].keys[ k ].pos )
                        animNode.translateKeys.push( new TranslateKey( data.hierarchy[ h ].keys[ k ].time, new Vec3().fromArray( data.hierarchy[ h ].keys[ k ].pos ) ) );

                    if ( data.hierarchy[ h ].keys[ k ].rot )
                        animNode.rotateKeys.push( new RotateKey( data.hierarchy[ h ].keys[ k ].time, new Quat().fromArray( data.hierarchy[ h ].keys[ k ].rot ) ) );

                    if ( data.hierarchy[ h ].keys[ k ].scl )
                        animNode.scaleKeys.push( new ScaleKey( data.hierarchy[ h ].keys[ k ].time, new Vec3().fromArray( data.hierarchy[ h ].keys[ k ].scl ) ) );
                }
            }

            // done
            data.initialized = true;

            return this;
        }
    }
}