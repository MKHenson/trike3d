// namespace Trike {
//     export enum InterpolationType {
//         LINEAR,
//         CATMULLROM,
//         CATMULLROM_FORWARD
//     }



//     export class AnimationKey {
//         public time: number;
//         public position: Vec3;
//         public rotation: Quat;
//         public scale: Vec3;
//         public index: number;

//         constructor( index: number, position?: Vec3, rotation?: Quat, scale?: Vec3 ) {
//             this.index = index;
//             this.time = 0;
//             this.position = position || null;
//             this.rotation = rotation || null;
//             this.scale = scale || null;
//         }
//     }

//     export class BoneTrack {
//         public keys: Array<AnimationKey>;
//         public parent: number;

//         constructor( parent: number ) {
//             this.keys = new Array<AnimationKey>();
//             this.parent = parent;
//         }
//     }

//     export class AnimationTrack {
//         public name: string;
//         private fps: number;
//         public duration: number;
//         public hierarchies: Array<BoneTrack>;

//         constructor( name?: string, fps?: number, duration?: number ) {
//             this.name = name;
//             this.fps = fps;
//             this.duration = duration;
//             this.hierarchies = new Array<BoneTrack>();
//         }

//         fromJSON( data: any ): AnimationTrack {
//             this.name = data.name;
//             this.fps = data.fps;
//             this.duration = data.length;

//             var keys: Array<AnimationKey> = new Array<AnimationKey>();

//             // loop through all keys
//             for ( var h = 0; h < data.hierarchy.length; h++ ) {
//                 for ( var k = 0; k < data.hierarchy[ h ].keys.length; k++ ) {
//                     // remove minus times
//                     if ( data.hierarchy[ h ].keys[ k ].time < 0 )
//                         data.hierarchy[ h ].keys[ k ].time = 0;

//                     //// create quaternions
//                     // if ( data.hierarchy[h].keys[k].rot !== undefined && !( data.hierarchy[h].keys[k].rot instanceof Quat ) )
//                     // {
//                     //	var quat = data.hierarchy[h].keys[k].rot;
//                     //	data.hierarchy[h].keys[k].rot = new Quat( quat[0], quat[1], quat[2], quat[3] );
//                     // }
//                 }


//                 //// prepare morph target keys
//                 // if ( data.hierarchy[h].keys.length && data.hierarchy[h].keys[0].morphTargets !== undefined )
//                 // {
//                 //	// get all used
//                 //	var usedMorphTargets = {};

//                 //	for ( var k = 0; k < data.hierarchy[h].keys.length; k++ )
//                 //	{
//                 //		for ( var m = 0; m < data.hierarchy[h].keys[k].morphTargets.length; m++ )
//                 //		{
//                 //			var morphTargetName = data.hierarchy[h].keys[k].morphTargets[m];
//                 //			usedMorphTargets[morphTargetName] = -1;
//                 //		}
//                 //	}

//                 //	data.hierarchy[h].usedMorphTargets = usedMorphTargets;


//                 //	// set all used on all frames
//                 //	for ( var k = 0; k < data.hierarchy[h].keys.length; k++ )
//                 //	{
//                 //		var influences = {};

//                 //		for ( var morphTargetName in usedMorphTargets )
//                 //		{
//                 //			for ( var m = 0; m < data.hierarchy[h].keys[k].morphTargets.length; m++ )
//                 //			{
//                 //				if ( data.hierarchy[h].keys[k].morphTargets[m] === morphTargetName )
//                 //				{
//                 //					influences[morphTargetName] = data.hierarchy[h].keys[k].morphTargetsInfluences[m];
//                 //					break;
//                 //				}
//                 //			}

//                 //			if ( m === data.hierarchy[h].keys[k].morphTargets.length )
//                 //				influences[morphTargetName] = 0;
//                 //		}

//                 //		data.hierarchy[h].keys[k].morphTargetsInfluences = influences;
//                 //	}
//                 // }

//                 // remove all keys that are on the same time
//                 for ( var k = 1; k < data.hierarchy[ h ].keys.length; k++ ) {
//                     if ( data.hierarchy[ h ].keys[ k ].time === data.hierarchy[ h ].keys[ k - 1 ].time ) {
//                         data.hierarchy[ h ].keys.splice( k, 1 );
//                         k--;
//                     }
//                 }


//                 // Create the node.
//                 var animNode: BoneTrack = new BoneTrack( data.hierarchy[ h ].parent );
//                 this.hierarchies.push( animNode );

//                 // Now fill the keys
//                 for ( var k = 0; k < data.hierarchy[ h ].keys.length; k++ ) {
//                     var key: AnimationKey = new AnimationKey( k );
//                     if ( data.hierarchy[ h ].keys[ k ].pos )
//                         key.position = new Vec3().fromArray( data.hierarchy[ h ].keys[ k ].pos );

//                     if ( data.hierarchy[ h ].keys[ k ].rot )
//                         key.rotation = new Quat().fromArray( data.hierarchy[ h ].keys[ k ].rot );

//                     if ( data.hierarchy[ h ].keys[ k ].scl )
//                         key.scale = new Vec3().fromArray( data.hierarchy[ h ].keys[ k ].scl );

//                     key.time = data.hierarchy[ h ].keys[ k ].time;

//                     animNode.keys.push( key );
//                 }
//             }

//             // done
//             data.initialized = true;

//             return this;
//         }
//     }

// 	/**
// 	* This class is used to manager all animations within Animate.
// 	*/
//     export class AnimationManager {
//         private static _singleton: AnimationManager;

//         private _playing: Array<Animation>;
//         private _library: Array<{ [ name: string ]: AnimationTrack }>;

//         constructor() {
//             if ( !AnimationManager._singleton )
//                 AnimationManager._singleton = new AnimationManager();

//             this._playing = new Array<Animation>();
//             this._library = new Array<{ [ name: string ]: AnimationTrack }>();
//         }


// 		/**
// 		* This must be called each frame, the process the active animations in the scene.
// 		* @param {number} deltaTimeMS The delta time in miliseconds
// 		*/
//         update( deltaTimeMS: number ) {
//             var playing: Array<Animation> = this._playing;
//             for ( let i= 0, l = playing.length; i < l; i++ )
//                 playing[ i ].update( deltaTimeMS );
//         }


//         ///**
//         //* Adds an animation to the manager
//         //*/
//         // addToUpdate( animation: Animation )
//         // {
//         //	var playing: Array<Animation> = this._playing;
//         //	if ( playing.indexOf( animation ) === -1 )
//         //		playing.push( animation );
//         // }


//         ///**
//         //* Removes an animation from the manager
//         //*/
//         // removeFromUpdate( animation: Animation )
//         // {
//         //	var playing: Array<Animation> = this._playing;
//         //	var index = playing.indexOf( animation );

//         //	if ( index !== -1 )
//         //		playing.splice( index, 1 );
//         // }


//         ////--- add ---
//         // add( data )
//         // {
//         //	var library: Array<{ [name: string]: AnimationTree }> = this._library;

//         //	if ( library[data.name] !== undefined )
//         //		console.log( 'THREE.AnimationHandler.add: Warning! ' + data.name + ' already exists in library. Overwriting.' );

//         //	library[data.name] = data;
//         //	this.initData( data );
//         // }


// 		/**
// 		* Gets an animation by name
// 		*/
//         getAnimationSet( name: string ): AnimationTrack {
//             var library: Array<{ [ name: string ]: AnimationTrack }> = this._library;

//             if ( library[ name ] )
//                 return library[ name ];
//             else {
//                 console.log( 'THREE.AnimationHandler.get: Couldn't find animation ' + name );
//                 return null;
//             }
//         }

//         //--- parse ---
//         parse( root: MeshSkinned ): Array<Bone> {
//             // setup hierarchy
//             var hierarchy: Array<Bone> = new Array<Bone>();

//             // if ( root instanceof MeshSkinned )
//             // {
//             //	var sMesh: MeshSkinned = <MeshSkinned>root;
//             for ( var b = 0; b < root.bones.length; b++ )
//                 hierarchy.push( root.bones[ b ] );
//             // }
//             // else
//             //	this.parseRecurseHierarchy( root, hierarchy );

//             return hierarchy;
//         }

//         // parseRecurseHierarchy( root: Object3D, hierarchy: Array<Bone> )
//         // {
//         //	hierarchy.push( root );

//         //	for ( var c = 0; c < root.children.length; c++ )
//         //		this.parseRecurseHierarchy( root.children[c], hierarchy );
//         // }


//         //--- init data ---
//         initData( data ) {

//         }


//         public static getSingleton(): AnimationManager {
//             if ( !AnimationManager._singleton )
//                 new AnimationManager();

//             return AnimationManager._singleton;
//         }
//     }
// }