// namespace Trike {
// 	/**
// 	* The Animation class is used to transform a {MeshSkinned} bones based on an {AnimationSet}. {AnimationSet}'s are created from a skinned
// 	* object's geometry. The set contains a hierarchy of transforms that define interpolation points over time for each of the bones. The Animation
// 	* class tries to manage a given Animation set over time and performs the neccessary transforms on the bones the set represents.
// 	*/
//     export class Animation {
// 		/** Tells the animated mesh, how much this animation affects the bones. This weight is distributed before playing the animation to all
// 		other active animations. If 2  animations are active and both have a weight of 1, then both animations will play at the same time */
//         public weight: number;

//         /** Dynamically  calculated each frame - do not edit directly. Instead use weight */
//         public distributedWeight: number;

//         private _root: MeshSkinned;
//         private _name: string;
//         private _isPlaying: boolean;
//         private _isPaused: boolean;
//         private _loop: boolean;
//         private _currentTime: number;
//         private _timeScale: number;
//         private _interpolationType: InterpolationType;

//         private _animSet: AnimationTrack;
//         private _bones: Array<Bone>;

//         constructor( root: MeshSkinned, animSet: AnimationTrack ) {
//             this._animSet = animSet;
//             this._name = name;
//             this._currentTime = 0;
//             this._timeScale = 0.0005;
//             this._isPlaying = false;
//             this._isPaused = true;
//             this._loop = true;
//             this.weight = 1;
//             this.distributedWeight = 0;
//             this._interpolationType = InterpolationType.LINEAR;


//             this._bones = root.bones;

//             // this._animSet.boneTracks.splice( 0, this._animSet.boneTracks.length );
//             // this._animSet.boneTracks.push();
//         }

// 		/**
// 		* Plays the animation at a given start time.
// 		*/
//         play( startTime: number = 0 ): Animation {
//             this._currentTime = startTime;

//             if ( this._isPlaying === false ) {
//                 this._isPlaying = true;
//                 this.reset();
//                 this.update( 0 );
//             }

//             this._isPaused = false;
//             return this;
//         }


// 		/**
// 		* Pauses the play back of the animation
// 		*/
//         pause(): Animation {
//             this._isPlaying = false;
//             this._isPaused = true;
//             return this;
//         }

// 		/**
// 		* Un-pauses the play back of the animation
// 		*/
//         unPause(): Animation {
//             this._isPlaying = true;
//             this._isPaused = false;
//             return this;
//         }

// 		/**
// 		* Pauses the animation and sets the frame back to the beginning
// 		*/
//         stop(): Animation {
//             this.reset();
//             this._isPlaying = false;
//             this._isPaused = false;
//             return this;
//         }


// 		/**
// 		* Sets the animation play head back to the beginning of the animation
// 		*/
//         reset() {
//             this._currentTime = 0;
//         }

//         getKeyBefore( keys: Array<AnimationKey>, curTime: number ): AnimationKey {
//             var toRet: AnimationKey = null;
//             for ( let i= 0, l = keys.length; i < l; i++ )
//                 if ( keys[ i ].time > curTime )
//                     return toRet;
//                 else
//                     toRet = keys[ i ];
//         }

//         getKeyAfter( keys: Array<AnimationKey>, curTime: number ): AnimationKey {
//             var toRet: AnimationKey = null;
//             for ( let i= keys.length - 1; i > -1; i-- )
//                 if ( keys[ i ].time <= curTime )
//                     return toRet;
//                 else
//                     toRet = keys[ i ];
//         }

// 		/**
// 		* Updates the animation transforms based on time
// 		* @param {number} deltaTimeMS The delta time in miliseconds
// 		*/
//         public update( delta: number ) {
//             if ( this._isPlaying === false )
//                 return;

//             var duration: number = this._animSet.duration;
//             this._currentTime += delta * this._timeScale;

//             // If we looping, then start from the beginning
//             if ( this._loop === true && this._currentTime > duration ) {
//                 this._currentTime %= duration;
//             }
//             // Not looping - so just stop
//             else if ( this._loop === false && this._currentTime > duration ) {
//                 this.stop();
//                 return;
//             }
//             else {
//                 // Set the current time again because the above might have changed it/
//                 this._currentTime = Math.min( this._currentTime, duration );
//             }

//             var weight: number = this.weight;
//             var bones: Array<Bone> = this._bones;
//             var boneTracks: Array<BoneTrack> = this._animSet.boneTracks;
//             var interpolationType: InterpolationType = this._interpolationType;
//             var curTime: number = this._currentTime;
//             var bone: Bone;
//             var boneTrack: BoneTrack;
//             var translateKeys: Array<TranslateKey>;
//             var rotateKeys: Array<RotateKey>;
//             var scaleKeys: Array<ScaleKey>;
//             var prevKeyT: TranslateKey;
//             var nextKeyT: TranslateKey
//             var prev2KeyT: TranslateKey;
//             var next2KeyT: TranslateKey
//             var prevKeyR: RotateKey;
//             var nextKeyR: RotateKey
//             var prevKeyS: ScaleKey;
//             var nextKeyS: ScaleKey
//             var scale: number = 0;
//             var bonePos: Vec3;
//             var boneScale: Vec3;
//             var prevVector: Vec3;
//             var nextVector: Vec3;
//             var target = new Vec3();
//             var points: Array<Vec3> = new Array<Vec3>();
//             var updateBone: boolean = false;

//             // Go through each of the bone tracks
//             for ( var bt = 0, btl = boneTracks.length; bt < btl; bt++ ) {
//                 boneTrack = boneTracks[ bt ];
//                 bone = bones[ boneTrack.boneIndex ];

//                 // Calculate position offsets
//                 translateKeys = boneTrack.translateKeys;
//                 if ( translateKeys.length > 0 ) {
//                     prevKeyT = <TranslateKey>this.getKeyBefore( translateKeys, curTime );
//                     nextKeyT = <TranslateKey>this.getKeyAfter( translateKeys, curTime );

//                     if ( !prevKeyT || !nextKeyT )
//                         continue;

//                     bone.updateMatrix = true;

//                     // Get the normalised position of the current time from the previous key to the next
//                     scale = ( curTime - prevKeyT.time ) / ( nextKeyT.time - prevKeyT.time );
//                     if ( scale < 0 )
//                         scale = 0;
//                     if ( scale > 1 )
//                         scale = 1;

//                     bonePos = bone.position;
//                     prevVector = prevKeyT.position;
//                     nextVector = nextKeyT.position;

//                     if ( interpolationType === InterpolationType.LINEAR ) {
//                         var newVector = new Vec3();
//                         newVector.x = prevVector.x + ( nextVector.x - prevVector.x ) * scale;
//                         newVector.y = prevVector.y + ( nextVector.y - prevVector.y ) * scale;
//                         newVector.z = prevVector.z + ( nextVector.z - prevVector.z ) * scale;

//                         bonePos.lerp( newVector, weight );
//                     }
//                     else if ( interpolationType === InterpolationType.CATMULLROM || this._interpolationType === InterpolationType.CATMULLROM_FORWARD ) {
//                         prev2KeyT = <TranslateKey>this.getKeyBefore( translateKeys, prevKeyT.time - 0.0001 );
//                         next2KeyT = <TranslateKey>this.getKeyAfter( translateKeys, nextKeyT.time + 0.0001 );

//                         if ( !prev2KeyT || !next2KeyT )
//                             continue;

//                         points[ 0 ] = prev2KeyT.position;
//                         points[ 1 ] = prevVector;
//                         points[ 2 ] = nextVector;
//                         points[ 3 ] = next2KeyT.position;

//                         scale = scale * 0.33 + 0.33;

//                         var currentPoint: Vec3 = this.interpolateCatmullRom( points, scale );

//                         bonePos.x = bonePos.x + ( currentPoint.x - bonePos.x ) * weight;
//                         bonePos.y = bonePos.y + ( currentPoint.y - bonePos.y ) * weight;
//                         bonePos.z = bonePos.z + ( currentPoint.z - bonePos.z ) * weight;

//                         if ( this._interpolationType === InterpolationType.CATMULLROM_FORWARD ) {
//                             var forwardPoint: Vec3 = this.interpolateCatmullRom( points, scale * 1.01 );

//                             target.set( forwardPoint.x, forwardPoint.y, forwardPoint.z );
//                             target.sub( bonePos );
//                             target.y = 0;
//                             target.normalize();

//                             var angle = Math.atan2( target.x, target.z );
//                             bone.setRotation( 0, angle, 0 );
//                         }
//                     }
//                 }


//                 // Calculate rotation offsets
//                 rotateKeys = boneTrack.rotateKeys;
//                 if ( rotateKeys.length > 0 ) {
//                     prevKeyR = <RotateKey>this.getKeyBefore( rotateKeys, curTime );
//                     nextKeyR = <RotateKey>this.getKeyAfter( rotateKeys, curTime );

//                     if ( !prevKeyR || !nextKeyR )
//                         continue;

//                     bone.updateMatrix = true;

//                     // Get the normalised position of the current time from the previous key to the next
//                     scale = ( curTime - prevKeyR.time ) / ( nextKeyR.time - prevKeyR.time );
//                     if ( scale < 0 )
//                         scale = 0;
//                     if ( scale > 1 )
//                         scale = 1;

//                     var newRotation = new Quat();
//                     Quat.slerp( prevKeyR.rotation, nextKeyR.rotation, newRotation, scale );
//                     newRotation.normalize();
//                     Quat.slerp( bone.quaternion, newRotation, bone.quaternion, weight );
//                 }

//                 // Calculate scale offsets
//                 scaleKeys = boneTrack.scaleKeys;
//                 if ( scaleKeys.length > 0 ) {
//                     prevKeyS = <ScaleKey>this.getKeyBefore( scaleKeys, curTime );
//                     nextKeyS = <ScaleKey>this.getKeyAfter( scaleKeys, curTime );

//                     if ( !prevKeyS || !nextKeyS )
//                         continue;

//                     bone.updateMatrix = true;

//                     // Get the normalised position of the current time from the previous key to the next
//                     scale = ( curTime - prevKeyS.time ) / ( nextKeyS.time - prevKeyS.time );
//                     if ( scale < 0 )
//                         scale = 0;
//                     if ( scale > 1 )
//                         scale = 1;

//                     prevVector = prevKeyS.scale;
//                     nextVector = nextKeyS.scale;
//                     boneScale = bone.scale;

//                     var newScale = new Vec3();
//                     newScale.x = prevVector.x + ( nextVector.x - prevVector.x ) * scale;
//                     newScale.y = prevVector.y + ( nextVector.y - prevVector.y ) * scale;
//                     newScale.z = prevVector.z + ( nextVector.z - prevVector.z ) * scale;

//                     boneScale.lerp( newScale, weight );
//                 }

//             }
//         }

// 		/***
// 		* Creates a Catmull-Rom interpolation based on the given scale
// 		* see http://www.mvps.org/directx/articles/catmull/
// 		*/
//         interpolateCatmullRom( points: Array<Vec3>, scale: number ): Vec3 {
//             var c: Array<number> = new Array<number>(), v3: Vec3 = new Vec3(),
//                 point: number, intPoint: number, weight: number, w2: number, w3: number,
//                 pa: Vec3, pb: Vec3, pc: Vec3, pd: Vec3;

//             point = ( points.length - 1 ) * scale;
//             intPoint = Math.floor( point );
//             weight = point - intPoint;

//             c[ 0 ] = intPoint === 0 ? intPoint : intPoint - 1;
//             c[ 1 ] = intPoint;
//             c[ 2 ] = intPoint > points.length - 2 ? intPoint : intPoint + 1;
//             c[ 3 ] = intPoint > points.length - 3 ? intPoint : intPoint + 2;

//             pa = points[ c[ 0 ] ];
//             pb = points[ c[ 1 ] ];
//             pc = points[ c[ 2 ] ];
//             pd = points[ c[ 3 ] ];

//             w2 = weight * weight;
//             w3 = weight * w2;

//             v3.x = Animation.interpolate( pa.x, pb.x, pc.x, pd.x, weight, w2, w3 );
//             v3.y = Animation.interpolate( pa.y, pb.y, pc.y, pd.y, weight, w2, w3 );
//             v3.z = Animation.interpolate( pa.z, pb.z, pc.z, pd.z, weight, w2, w3 );

//             return v3;
//         }

// 		/***
// 		* Quick n dirty interpolation
// 		*/
//         public static interpolate( p0: number, p1: number, p2: number, p3: number, t: number, t2: number, t3: number ): number {
//             var v0 = ( p2 - p0 ) * 0.5,
//                 v1 = ( p3 - p1 ) * 0.5;

//             return ( 2 * ( p1 - p2 ) + v0 + v1 ) * t3 + ( - 3 * ( p1 - p2 ) - 2 * v0 - v1 ) * t2 + v0 * t + p1;
//         }

// 		/**
// 		* Cleans up the Animation set for disposal.
// 		*/
//         dispose() {
//             this._root = null;
//             this._name = null;
//             this._animSet = null;
//             this._bones = null;
//         }

//         /** Gets the name of this animation*/
//         get name(): string { return this._name; }

//         /** Gets if this animation is paused. */
//         get isPaused(): boolean { return this._isPaused; }
//     }
// }