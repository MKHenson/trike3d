namespace Trike {
    export class KeySetRef {
        public position: AnimationKey;
        public rotation: AnimationKey;
        public scale: AnimationKey;
    }

    export class KeySet {
        public prevKey: KeySetRef;
        public nextKey: KeySetRef;

        constructor() {
            this.prevKey = new KeySetRef();
            this.nextKey = new KeySetRef();
        }
    }

	/**
	* Represents a bone that transforms vertices in a skinned mesh.
	* It acts pretty the same a bone in real life.
	*/
    export class Bone extends Object3D {
        public name: string;
        public mesh: MeshSkinned;
        public skinMatrix: Matrix4;

        public activeKeySets: { [ name: string ]: KeySet };

		/**
		* Creates a bone and assigngs its mesh
		* @param {MeshSkinned} mesh The mesh associated with this bone
		*/
        constructor( mesh: MeshSkinned ) {
            super();

            this.mesh = mesh;
            this.skinMatrix = new Matrix4();
            this.activeKeySets = {};
        }

		/**
		* Fills the values of the bone from a geometry bone
		* @param {BoneInfo} gBone The node we are getting data from
		*/
        setFromBoneInfo( gBone: BoneInfo ) {
            this.name = gBone.name;
            this.position.set( gBone.position[ 0 ], gBone.position[ 1 ], gBone.position[ 2 ] );
            this.quaternion.set( gBone.rotation[ 0 ], gBone.rotation[ 1 ], gBone.rotation[ 2 ], gBone.rotation[ 3 ] );

            if ( gBone.scale !== undefined )
                this.scale.set( gBone.scale[ 0 ], gBone.scale[ 1 ], gBone.scale[ 2 ] );
            else
                this.scale.set( 1, 1, 1 );
        }

		/**
		* Overloaded the update world matrix for bones. We need to set the skin matrix
		* @param {boolean} forceWorldUpdate If true, the world matrices will be forced to update
		* @param {boolean} forceLocalUpdate If true, the local matrices will be forced to update
		*/
        updateWorldMatrix( forceWorldUpdate: boolean = false, forceLocalUpdate: boolean = false ) {
            const skinMatrix: Matrix4 = this.skinMatrix;

            if ( this.updateMatrix ) {
                this.matrix.compose( this.position, this.quaternion, this.scale );
                this.updateMatrix = false;
                forceWorldUpdate = true;
            }

            if ( this.updateMatrixWorld || forceWorldUpdate ) {
                // Added for the skin matrix
                if ( this.parent instanceof MeshSkinned )
                    skinMatrix.multiplyMatrices( MeshSkinned.indentityMatrix, this.matrix );
                else if ( this.parent instanceof Bone )
                    skinMatrix.multiplyMatrices(( <Bone>this.parent ).skinMatrix, this.matrix );
                else
                    skinMatrix.copy( this.matrix );


                const worldMat = this.worldMatrix;

                if ( this.parent )
                    worldMat.multiplyMatrices( this.parent.worldMatrix, this.matrix );
                else
                    worldMat.copy( this.matrix );

                this.updateMatrixWorld = false;
                forceWorldUpdate = true;
            }


            // update children
            const children = this.children;
            for ( let i = 0, l = children.length; i < l; i++ )
                children[ i ].updateWorldMatrix( forceWorldUpdate, forceLocalUpdate );
        }

		/**
		* Cleans up and nullifies the bone
		*/
        dispose() {
            if ( this.parent )
                this.parent.remove( this );

            super.dispose();

            this.name = null;
            this.mesh = null;
            this.skinMatrix = null;
        }
    }
}