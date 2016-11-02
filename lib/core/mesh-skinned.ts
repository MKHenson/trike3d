namespace Trike {
	/**
	* A Mesh object which draws a animated geometry object using a material. Skinned meshes are made up
	* by a skeleton of bones.
	* Each vertex in a skinned mesh is influenced by a max of 4 bones. Each vertex therefore
	* has 4 corresponding skin indexes and 4 weight influences. When the vertex position is
	* computed in the shader it fetches the 4 bone matrices assigned to it looking at the indices
	* (from _boneMatrices stored in a texture) and
	* multiples itself with each of the matrices stored there by the corresponding 'weight' or influence.
	* See http://ogldev.atspace.co.uk/www/tutorial38/tutorial38.html for a more detailed explanation.
	*/
    export class MeshSkinned extends Mesh {
        public static indentityMatrix: Matrix4;
        private static _offsetMatrix: Matrix4;

        private _bones: Array<Bone>;
        private _boneMatrices: Float32Array;
        private _boneInverses: Array<Matrix4>;
        private _boneTextureWidth: number;
        private _boneTextureHeight: number;
        private _boneTexture: DataTexture;
        private _animations: Array<AnimationPlayer>;



        private _time: number;
        private _curGeomBuild: number;

        constructor( material: MaterialMulti, geometry: Geometry ) {
            super( material, geometry );

            this._bones = new Array<Bone>();
            this._boneInverses = new Array<Matrix4>();
            this._boneMatrices = null;
            this._boneTextureWidth = 0;
            this._boneTextureHeight = 0;
            this._curGeomBuild = -1;
            this._boneTexture;
            this._animations = new Array<AnimationPlayer>();
            this._time = 0;

            if ( !MeshSkinned.indentityMatrix ) {
                MeshSkinned.indentityMatrix = new Matrix4();
                MeshSkinned._offsetMatrix = new Matrix4();
            }
        }

		/**
		* An update call made before the rendering process begins
		* @param {number} totalTime The total number of milliseconds since the start of the app
		* @param {number} delta The delta time since the last update call
		* @param {Camera} camera The camera being for the render
		* @param {Renderer} renderer The renderer used to draw the scene
		*/
        update( totalTime: number, delta: number, camera: Camera, renderer: Renderer ) {
            super.update( totalTime, delta, camera, renderer );

            if ( !this.geometry )
                return;

            // If the geometry was re-built, then we likely need to re-build the bones too
            if ( this.geometry.buildCount !== this._curGeomBuild )
                this.setupBones();

            // update children
            const animations = this._animations;

            for ( let i = 0, l = animations.length; i < l; i++ )
                animations[ i ].update( delta );
        }


		/*
		* Called just before we render the mesh. The mesh would have passed culling and already be updated.
		* A good place to update custom uniforms.
		* @param {Renderer} renderer The renderer used to draw the scene
		* @param {RenderPass} renderPass The render pass associated with this call
		*/
        preRender( renderer: Renderer, renderPass: RenderPass ) {
            super.preRender( renderer, renderPass );
            const mat: MaterialMulti = this._material;

            if ( mat && mat.skinning ) {
                mat.setUniform( 'boneTexture', this._boneTexture, true );
                mat.setUniform( 'boneTextureWidth', this._boneTextureWidth, true );
                mat.setUniform( 'boneTextureHeight', this._boneTextureHeight, true );
            }
        }

        getBoneByName( name: string ): Bone {
            const bones: Array<Bone> = this._bones;
            for ( let i = 0, l = bones.length; i < l; i++ )
                if ( bones[ i ].name === name )
                    return bones[ i ];

            return null;
        }

		/**
		* Clears the animation data for the object
		*/
        cleanup() {
            const bones: Array<Bone> = this._bones;

            // Clean up existing bones / objects
            for ( let i = 0, l = bones.length; i < l; i++ )
                bones[ i ].dispose();

            bones.splice( 0, bones.length );
            this._boneInverses.splice( 0, this._boneInverses.length );

            // Clean up animations
            const animations = this._animations;
            for ( let i = 0, l = animations.length; i < l; i++ )
                animations[ i ].dispose();
            this._animations.splice( 0, this._animations.length );

            this._boneTextureWidth = 0;
            this._boneTextureHeight = 0;

            if ( this._boneTexture )
                this._boneTexture.dispose();

            this._boneTexture = null;
        }


        /** Use this function to replace one geometry with another */
        public setGeometry( val: Geometry ) {
            this._curGeomBuild = -1; // Reset the geom ID
            super.setGeometry( val );

            this.setupBones();
        }

		/***
		* Helper function to create the bone data from the geometry
		*/
        public setupBones() {
            let b, bone: Bone, gbone: BoneInfo, p, q, s;
            const geometry: Geometry = this.geometry,
                bones: Array<Bone> = this._bones;

            this.cleanup();

            if ( !geometry )
                return;

            this._curGeomBuild = geometry.buildCount;

            // Create new bones and assign them to this mesh

            if ( geometry && geometry.bones !== undefined && geometry.bones.length > 0 ) {
                // First create each of the bones and associate them to this mesh
                for ( b = 0; b < geometry.bones.length; b++ ) {
                    bone = this.addBone();
                    bone.setFromBoneInfo( geometry.bones[ b ] );
                }

                // Now that we have each of the bones, we add them to either the mesh or the parent bone
                for ( b = 0; b < bones.length; b++ ) {
                    gbone = geometry.bones[ b ];
                    bone = bones[ b ];

                    if ( gbone.parent === -1 )
                        this.add( bone );
                    else
                        bones[ gbone.parent ].add( bone );
                }

                const nBones = this._bones.length;

                // We store the bone matrices in the RGBA values of a texture.
                // This obviously requires that the user has a video card that supports float textures
                //

                // layout (1 matrix = 4 pixels)
                // RGBA RGBA RGBA RGBA (=> column1, column2, column3, column4)
                // with  8x8  pixel texture max   16 bones  (8 * 8  / 4)
                //       16x16 pixel texture max   64 bones (16 * 16 / 4)
                //       32x32 pixel texture max  256 bones (32 * 32 / 4)
                //       64x64 pixel texture max 1024 bones (64 * 64 / 4)

                let size;

                if ( nBones > 256 )
                    size = 64;
                else if ( nBones > 64 )
                    size = 32;
                else if ( nBones > 16 )
                    size = 16;
                else
                    size = 8;

                this._boneTextureWidth = size;
                this._boneTextureHeight = size;

                this._boneMatrices = new Float32Array( size * size * 4 ); // 4 floats per RGBA pixel

                // Create the texure with the data array which represents the matrices
                this._boneTexture = new DataTexture( this._boneMatrices, size, size );

                // Set texture properties
                this._boneTexture.minFilter = TextureFilter.Nearest;
                this._boneTexture.magFilter = TextureFilter.Nearest;
                this._boneTexture.format = TextureFormat.RGBAFormat;
                this._boneTexture.type = TextureType.FloatType;
                this._boneTexture.generateMipmaps = false;
                this._boneTexture.flipY = false;

                this.pose();
            }
        }

		/**
		* Updates the world matrix as well as updating the world sphere and bounding boxes.
		*/
        public updateWorldMatrix( force: boolean = false ) {
            // First update the matrices (including bones)
            // Note that the bones handle updateWorldMatrix slightly differently.
            super.updateWorldMatrix( force );

            if ( !this._geometry || !this._material || this.geometry.requiresBuild || !this._boneTexture )
                return;

            // flatten bone matrices to array
            const bones: Array<Bone> = this._bones;
            const boneInverses: Array<Matrix4> = this._boneInverses;
            const offsetMatrix = MeshSkinned._offsetMatrix;
            const boneMatrices: Float32Array = this._boneMatrices;

            for ( let b = 0, bl = bones.length; b < bl; b++ ) {
                // compute the offset between the current and the original transform;

                // TODO: we could get rid of this multiplication step if the skinMatrix
                // was already representing the offset; however, this requires some
                // major changes to the animation system

                offsetMatrix.multiplyMatrices( bones[ b ].skinMatrix, boneInverses[ b ] );
                offsetMatrix.flattenToArrayOffset( boneMatrices, b * 16 );
            }

            // We've updated the matrices in the texture data, so we need to update the texture.
            this._boneTexture.requiresBuild = true;
        }

		/**
		* Fetches a bone by its name
		* @returns {Bone} Returns the bone or null if one cant be found
		*/
        getBone( name: string ): Bone {
            let toRet: Bone = null;

            const bones: Array<Bone> = this._bones;
            for ( let i: number = 0, l: number = bones.length; i < l; i++ )
                if ( bones[ i ].name === name )
                    return bones[ i ];

            return toRet;
        }


        /** Adds a new bone to the mesh */
        private addBone( bone?: Bone ) {
            if ( bone === undefined )
                bone = new Bone( this );

            this._bones.push( bone );
            return bone;
        }

        private pose() {
            super.updateWorldMatrix( true );
            this.normalizeSkinWeights();

            // We need to get the bone inverse matrices. This is the same as getting their 'pose' state
            // before being moved around.
            this._boneInverses = [];
            const bones: Array<Bone> = this._bones;

            for ( let b = 0, bl = bones.length; b < bl; b++ ) {
                const inverse = new Matrix4();
                inverse.getInverse( bones[ b ].skinMatrix );
                this._boneInverses.push( inverse );
            }
        }


		/**
		* Adds an animation to the mesh
		* @param {string} name The name of the animation to add. Trike will look for this animation within the geometry
		* @param {number} weight The amount of influence this animation has on the mesh.
		* @param {boolean} looped If true, the animation will loop indefinately
		*/
        addAnimation( name: string, weight: number = 1.0, looped: boolean = true ): AnimationPlayer {
            if ( !this.geometry )
                return null;

            const animSet: AnimationTrack = this.geometry.getAnimationSet( name );

            if ( !animSet )
                return null;

            const toRet: AnimationPlayer = new AnimationPlayer( this, this.geometry.getAnimationSet( name ), name );
            toRet.weight = weight;
            toRet.loop = looped;

            this._animations.push( toRet );
            return toRet;
        }

		/**
		* Adds an animation to the mesh
		* @param {string} name The name of the animation to remove.
		*/
        removeAnimation( name: string ) {
            const animations: Array<AnimationPlayer> = this._animations;
            for ( let i = 0, l = animations.length; i < l; i++ )
                if ( animations[ i ].name === name ) {
                    animations[ i ].dispose();
                    animations.splice( i, 1 );
                    return;
                }
        }

		/**
		* The skin weights must be between 0 and 1
		*/
        normalizeSkinWeights() {
            let skinWeights: Array<Vec4> = null;
            let skinIndices: Array<Vec4> = null;

            if ( this.geometry.buffers[ AttributeType.SKIN_WEIGHT ] )
                skinWeights = this.geometry.buffers[ AttributeType.SKIN_WEIGHT ].data;

            if ( this.geometry.buffers[ AttributeType.SKIN_INDEX ] )
                skinIndices = this.geometry.buffers[ AttributeType.SKIN_INDEX ].data;

            if ( !skinIndices || !skinWeights ) {
                console.error( 'A skinned mesh must have both indices as well as weights in the geometry.' );
                return;
            }

            for ( let i = 0; i < skinIndices.length; i++ ) {
                const sw: Vec4 = skinWeights[ i ];

                const scale = 1.0 / sw.lengthManhattan();

                if ( scale !== Infinity )
                    sw.multiplyScalar( scale );
            }

            this.geometry.dirtyBuffers.push( this.geometry.buffers[ AttributeType.SKIN_WEIGHT ] );
        }

		/**
		* Cleans up the mesh for disposal
		*/
        dispose() {
            super.dispose();
            this.cleanup();

            this._bones = null;
            this._boneInverses = null;
            this._boneMatrices = null;
            this._boneTexture = null;
            this._animations = null;
        }

        get boneTextureWidth(): number { return this._boneTextureWidth; }
        get boneTextureHeight(): number { return this._boneTextureHeight; }
        get boneTexture(): DataTexture { return this._boneTexture; }
        get bones(): Array<Bone> { return this._bones; }
    }
}