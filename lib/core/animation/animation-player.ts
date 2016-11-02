namespace Trike {
    export type AnimationPlayerEvents = 'player_complete' | 'player_on_loop' | 'player_on_stopped';

    export interface IAnimationPlayerEvent {
        player: AnimationPlayer | null;
    }

	/**
	* The {AnimationPlayer} class is used to transform a skinned mesh's bones based on an {AnimationTrack}. {AnimationTrack}'s are created from a skinned
	* object's geometry. The track contains a series of BoneTrack's that subsequently contain keys to define interpolation points over time for each of the bones.
	* The {AnimationPlayer} class manages a given animation track over time and performs the neccessary transforms on the bones of its skinned mesh.
	*/
    export class AnimationPlayer extends EventDispatcher {
		/** Tells the player, how much of the animation track is allowed to affects the bones.
		If 2  animations are active and both have a weight of 1, then both animations will play at the same time.
		*/
        public weight: number;
        public loop: boolean;
        public speed: number;

        private _root: MeshSkinned;
        private _name: string;
        private _isPlaying: boolean;
        private _isPaused: boolean;
        private _currentTime: number;
        private _interpolationType: InterpolationType;
        private _animTrack: AnimationTrack;
        private _bones: Array<Bone>;

        // Optimisation vars
        private static _c: Array<number>;
        private static _points: Array<Vec3>;
        private static _target: Vec3;
        private static _tmpVec: Vec3;
        private static _tmpQuat: Quat;

        private static _eventComplete: IAnimationPlayerEvent = { player: null }
        private static _eventLoop: IAnimationPlayerEvent = { player: null }
        private static _eventStopped: IAnimationPlayerEvent = { player: null }

		/**
		* Creates an instance of the AnimationPlayer
		* @param {MeskSkinned} root The skinned mesh this player is animating
		* @param {AnimationTrack} track The track from where this player gets its transform data from.
		* @param {string} name The name of the animation this player represents
		*/
        constructor( root: MeshSkinned, track: AnimationTrack, name: string ) {
            super();

            if ( !AnimationPlayer._c ) {
                AnimationPlayer._c = new Array<number>();
                AnimationPlayer._points = [];
                AnimationPlayer._target = new Vec3();
                AnimationPlayer._tmpVec = new Vec3();
                AnimationPlayer._tmpQuat = new Quat();
            }

            this._animTrack = track;
            this._name = name;
            this._currentTime = 0;
            this.speed = 0.0005;
            this._isPlaying = false;
            this._isPaused = true;
            this.loop = true;
            this.weight = 1;
            this._interpolationType = InterpolationType.LINEAR;
            this._bones = root.bones;
        }

		/**
		* Gets this player to play the animation from its AnimationTrack
		* @param {number} startTime [Optional] You can specify the time at which the animation will play at
		* @returns {AnimationPlayer}
		*/
        play( startTime?: number ): AnimationPlayer {
            this._currentTime = startTime;

            if ( this._isPlaying === false ) {
                this._isPlaying = true;
                this.reset();
                this.update( 0 );
            }

            this._isPaused = false;
            return this;
        }


		/**
		* Pauses the play back of the animation
		* @returns {AnimationPlayer}
		*/
        pause(): AnimationPlayer {
            this._isPlaying = false;
            this._isPaused = true;
            return this;
        }

		/**
		* Un-pauses the play back of the animation
		* @returns {AnimationPlayer}
		*/
        unPause(): AnimationPlayer {
            this._isPlaying = true;
            this._isPaused = false;
            return this;
        }

		/**
		* stops the animation play head and sets the time back to the beginning of the track
		* @returns {AnimationPlayer}
		*/
        stop(): AnimationPlayer {
            this.reset();
            this._isPlaying = false;
            this._isPaused = false;
            if ( this._listeners.length > 0 ) {
                AnimationPlayer._eventStopped.player = this;
                this.emit<AnimationPlayerEvents, IAnimationPlayerEvent>( 'player_on_stopped', AnimationPlayer._eventStopped );
            }
            return this;
        }


		/**
		* Sets the animation play head back to the beginning of the animation
		* @returns {AnimationPlayer}
		*/
        reset(): AnimationPlayer {
            this._currentTime = 0;
            return this;
        }

		/**
		* Gets the first available key before a given time
		* @param {Array<AnimationKey>} keys The animation keys we are searching through
		* @param {number} time The time from where we start searching
		* @returns {AnimationKey}
		*/
        private getKeyBefore( keys: Array<AnimationKey>, time: number ): AnimationKey {
            let toRet: AnimationKey = null;
            for ( let i = 0, l = keys.length; i < l; i++ )
                if ( keys[ i ].time > time )
                    return toRet;
                else
                    toRet = keys[ i ];
        }

		/**
		* Gets the first available key after a given time
		* @param {Array<AnimationKey>} keys The animation keys we are searching through
		* @param {number} time The time from where we start searching
		* @returns {AnimationKey}
		*/
        private getKeyAfter( keys: Array<AnimationKey>, time: number ): AnimationKey {
            let toRet: AnimationKey = null;
            for ( let i = keys.length - 1; i > -1; i-- )
                if ( keys[ i ].time <= time )
                    return toRet;
                else
                    toRet = keys[ i ];
        }

		/**
		* Updates the animation transforms based on time
		* @param {number} delta The delta time in miliseconds
		* @returns {AnimationKey}
		*/
        public update( delta: number ): AnimationPlayer {
            if ( this._isPlaying === false )
                return;

            const duration: number = this._animTrack.duration;
            const listeners = this._listeners;

            this._currentTime += delta * this.speed;

            // If we looping, then start from the beginning
            if ( this.loop === true && this._currentTime > duration ) {
                this._currentTime %= duration;
                if ( listeners.length > 0 ) {
                    AnimationPlayer._eventLoop.player = this;
                    AnimationPlayer._eventComplete.player = this;
                    this.emit<AnimationPlayerEvents, IAnimationPlayerEvent>( 'player_on_loop', AnimationPlayer._eventLoop );
                    this.emit<AnimationPlayerEvents, IAnimationPlayerEvent>( 'player_complete', AnimationPlayer._eventComplete );
                }
            }
            // Not looping - so just stop
            else if ( this.loop === false && this._currentTime > duration ) {
                this.stop();
                if ( listeners.length > 0 ) {
                    AnimationPlayer._eventComplete.player = this;
                    this.emit<AnimationPlayerEvents, IAnimationPlayerEvent>( 'player_complete', AnimationPlayer._eventComplete );
                }
                return;
            }
            else {
                // Set the current time again because the above might have changed it/
                this._currentTime = Math.min( this._currentTime, duration );
            }

            const weight: number = this.weight;
            const bones: Array<Bone> = this._bones;
            const boneTracks: Array<BoneTrack> = this._animTrack.boneTracks;
            const interpolationType: InterpolationType = this._interpolationType;
            const curTime: number = this._currentTime;
            let bone: Bone;
            let boneTrack: BoneTrack;
            let translateKeys: Array<TranslateKey>;
            let rotateKeys: Array<RotateKey>;
            let scaleKeys: Array<ScaleKey>;
            let prevKeyT: TranslateKey;
            let nextKeyT: TranslateKey
            let prev2KeyT: TranslateKey;
            let next2KeyT: TranslateKey
            let prevKeyR: RotateKey;
            let nextKeyR: RotateKey
            let prevKeyS: ScaleKey;
            let nextKeyS: ScaleKey
            let scale: number = 0;
            let bonePos: Vec3;
            let boneScale: Vec3;
            let prevVector: Vec3;
            let nextVector: Vec3;
            let target = AnimationPlayer._target;
            let points: Array<Vec3> = AnimationPlayer._points;
            let updateBone: boolean = false;
            let tempQuat: Quat = AnimationPlayer._tmpQuat;
            let tempVec: Vec3 = AnimationPlayer._tmpVec;

            points.splice( 0, points.length );

            // Go through each of the bone tracks
            for ( let bt = 0, btl = boneTracks.length; bt < btl; bt++ ) {
                boneTrack = boneTracks[ bt ];
                bone = bones[ boneTrack.boneIndex ];

                // Calculate position offsets
                translateKeys = boneTrack.translateKeys;
                if ( translateKeys.length > 0 ) {
                    prevKeyT = <TranslateKey>this.getKeyBefore( translateKeys, curTime );
                    nextKeyT = <TranslateKey>this.getKeyAfter( translateKeys, curTime );

                    if ( !prevKeyT || !nextKeyT )
                        continue;

                    bone.updateMatrix = true;

                    // Get the normalised position of the current time from the previous key to the next
                    scale = ( curTime - prevKeyT.time ) / ( nextKeyT.time - prevKeyT.time );
                    if ( scale < 0 )
                        scale = 0;
                    if ( scale > 1 )
                        scale = 1;

                    bonePos = bone.position;
                    prevVector = prevKeyT.position;
                    nextVector = nextKeyT.position;

                    if ( interpolationType === InterpolationType.LINEAR ) {
                        const newVector = tempVec;
                        newVector.x = prevVector.x + ( nextVector.x - prevVector.x ) * scale;
                        newVector.y = prevVector.y + ( nextVector.y - prevVector.y ) * scale;
                        newVector.z = prevVector.z + ( nextVector.z - prevVector.z ) * scale;

                        bonePos.lerp( newVector, weight );
                    }
                    else if ( interpolationType === InterpolationType.CATMULLROM || this._interpolationType === InterpolationType.CATMULLROM_FORWARD ) {
                        prev2KeyT = <TranslateKey>this.getKeyBefore( translateKeys, prevKeyT.time - 0.0001 );
                        next2KeyT = <TranslateKey>this.getKeyAfter( translateKeys, nextKeyT.time + 0.0001 );

                        if ( !prev2KeyT || !next2KeyT )
                            continue;

                        points[ 0 ] = prev2KeyT.position;
                        points[ 1 ] = prevVector;
                        points[ 2 ] = nextVector;
                        points[ 3 ] = next2KeyT.position;

                        scale = scale * 0.33 + 0.33;

                        const currentPoint: Vec3 = AnimationPlayer.interpolateCatmullRom( points, scale );

                        bonePos.x = bonePos.x + ( currentPoint.x - bonePos.x ) * weight;
                        bonePos.y = bonePos.y + ( currentPoint.y - bonePos.y ) * weight;
                        bonePos.z = bonePos.z + ( currentPoint.z - bonePos.z ) * weight;

                        if ( this._interpolationType === InterpolationType.CATMULLROM_FORWARD ) {
                            const forwardPoint: Vec3 = AnimationPlayer.interpolateCatmullRom( points, scale * 1.01 );

                            target.set( forwardPoint.x, forwardPoint.y, forwardPoint.z );
                            target.sub( bonePos );
                            target.y = 0;
                            target.normalize();

                            const angle = Math.atan2( target.x, target.z );
                            bone.setRotation( 0, angle, 0 );
                        }
                    }
                }


                // Calculate rotation offsets
                rotateKeys = boneTrack.rotateKeys;
                if ( rotateKeys.length > 0 ) {
                    prevKeyR = <RotateKey>this.getKeyBefore( rotateKeys, curTime );
                    nextKeyR = <RotateKey>this.getKeyAfter( rotateKeys, curTime );

                    if ( !prevKeyR || !nextKeyR )
                        continue;

                    bone.updateMatrix = true;

                    // Get the normalised position of the current time from the previous key to the next
                    scale = ( curTime - prevKeyR.time ) / ( nextKeyR.time - prevKeyR.time );
                    if ( scale < 0 )
                        scale = 0;
                    if ( scale > 1 )
                        scale = 1;

                    const newRotation: Quat = tempQuat;
                    Quat.slerp( prevKeyR.rotation, nextKeyR.rotation, newRotation, scale );
                    newRotation.normalize();
                    Quat.slerp( bone.quaternion, newRotation, bone.quaternion, weight );
                }

                // Calculate scale offsets
                scaleKeys = boneTrack.scaleKeys;
                if ( scaleKeys.length > 0 ) {
                    prevKeyS = <ScaleKey>this.getKeyBefore( scaleKeys, curTime );
                    nextKeyS = <ScaleKey>this.getKeyAfter( scaleKeys, curTime );

                    if ( !prevKeyS || !nextKeyS )
                        continue;

                    bone.updateMatrix = true;

                    // Get the normalised position of the current time from the previous key to the next
                    scale = ( curTime - prevKeyS.time ) / ( nextKeyS.time - prevKeyS.time );
                    if ( scale < 0 )
                        scale = 0;
                    if ( scale > 1 )
                        scale = 1;

                    prevVector = prevKeyS.scale;
                    nextVector = nextKeyS.scale;
                    boneScale = bone.scale;

                    const newScale: Vec3 = tempVec;
                    newScale.x = prevVector.x + ( nextVector.x - prevVector.x ) * scale;
                    newScale.y = prevVector.y + ( nextVector.y - prevVector.y ) * scale;
                    newScale.z = prevVector.z + ( nextVector.z - prevVector.z ) * scale;

                    boneScale.lerp( newScale, weight );
                }

            }

            return this;
        }

		/***
		* Creates a Catmull-Rom interpolation based on the given scale
		* see http://www.mvps.org/directx/articles/catmull/
		*/
        private static interpolateCatmullRom( points: Array<Vec3>, scale: number ): Vec3 {
            const c: Array<number> = AnimationPlayer._c, v3: Vec3 = new Vec3();
            let point: number, intPoint: number, weight: number, w2: number, w3: number,
                pa: Vec3, pb: Vec3, pc: Vec3, pd: Vec3;

            point = ( points.length - 1 ) * scale;
            intPoint = Math.floor( point );
            weight = point - intPoint;

            c[ 0 ] = intPoint === 0 ? intPoint : intPoint - 1;
            c[ 1 ] = intPoint;
            c[ 2 ] = intPoint > points.length - 2 ? intPoint : intPoint + 1;
            c[ 3 ] = intPoint > points.length - 3 ? intPoint : intPoint + 2;

            pa = points[ c[ 0 ] ];
            pb = points[ c[ 1 ] ];
            pc = points[ c[ 2 ] ];
            pd = points[ c[ 3 ] ];

            w2 = weight * weight;
            w3 = weight * w2;

            v3.x = AnimationPlayer.interpolate( pa.x, pb.x, pc.x, pd.x, weight, w2, w3 );
            v3.y = AnimationPlayer.interpolate( pa.y, pb.y, pc.y, pd.y, weight, w2, w3 );
            v3.z = AnimationPlayer.interpolate( pa.z, pb.z, pc.z, pd.z, weight, w2, w3 );

            return v3;
        }

		/***
		* Quick n dirty interpolation of some numbers
		*/
        private static interpolate( p0: number, p1: number, p2: number, p3: number, t: number, t2: number, t3: number ): number {
            const v0 = ( p2 - p0 ) * 0.5,
                v1 = ( p3 - p1 ) * 0.5;

            return ( 2 * ( p1 - p2 ) + v0 + v1 ) * t3 + ( - 3 * ( p1 - p2 ) - 2 * v0 - v1 ) * t2 + v0 * t + p1;
        }

		/**
		* Cleans up the Animation set for disposal.
		*/
        dispose() {
            this._root = null;
            this._name = null;
            this._animTrack = null;
            this._bones = null;
            super.dispose();
        }

		/**
		* Gets the name of this animation
		* @returns {string}
		*/
        get name(): string { return this._name; }

		/**
		* Gets if this player is currently paused
		* @returns {boolean}
		*/
        get isPaused(): boolean { return this._isPaused; }

		/**
		* Gets the animation track of this player
		* @returns {AnimationTrack}
		*/
        get animationTrack(): AnimationTrack { return this._animTrack; }

		/**
		* Gets if this player is currently playing
		* @returns {boolean}
		*/
        get isPlaying(): boolean { return this._isPlaying; }

    }
}