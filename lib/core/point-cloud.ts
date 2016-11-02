namespace Trike {
	/**
	* Describes the type of blending to be done on the cloud.
	*/
    export enum CloudBlendMode {
        NONE,
        NORMAL,
        ADD,
        MULTIPLY,
        PREMULTIPLIED_ALPHA

        // static fromString( val: string ): CloudBlendMode {
        //     if ( val === 'None' ) return CloudBlendMode.NONE;
        //     else if ( val === 'Normal' ) return CloudBlendMode.NORMAL;
        //     else if ( val === 'Add' ) return CloudBlendMode.ADD;
        //     else if ( val === 'Multiply' ) return CloudBlendMode.MULTIPLY;
        //     else if ( val === 'Premultiplied Alpha' ) return CloudBlendMode.PREMULTIPLIED_ALPHA;
        // }
    }

	/**
	* A class to draw each vertex of geometry as a screen aligned quad or 'point'. Each vertex is the center of the quad.
	* Point clouds are useful for drawing things like particle systems. The size, rotation and opacity of each quad can also
	* be controlled. To do this, you must enable the particleSizesEnabled and particleRotationsEnabled and call generatePoints.
	* This fills the geometry buffers with data that can then be edited.
	*/
    export class PointCloud extends Mesh {
        public sortParticles: boolean;
        public invWorld: Matrix4;

        private _particleSizes: boolean;
        private _particleRotations: boolean;
        private _particleAlpha: boolean;
        private _mapPass: RenderPass;
        private _normalPass: RenderPass;
        private _blendMode: CloudBlendMode;
        private _blendAlpha: number;
        private _emitter: Emitter;
        private _mapTarget: RenderTarget
        private _normalTarget: RenderTarget

        // Cache vars
        private static _meshes: Array<Mesh>;
        private static _vec: Vec3;
        private static _numClouds: number;
        private static _matrix: Matrix4;
        private static _sortArray: Array<Array<number>>;


		/**
		* Creates an instance of the point cloud
		* @param {MaterialPointCloud} material [Optional] The MaterialPointCloud to draw the particles with
		* @param {number} numParticles [Optional] The number of initial points
		* @param {boolean} particleRotations [Optional] If true, each point will be rotated
		* @param {boolean} particleSizes [Optional] If true, each point will be sized
		* @param {boolean} particleAlpha [Optional] If true, each point will be a different opacity
		*/
        constructor( material?: MaterialPointCloud, numParticles: number = 100, particleRotations: boolean = true, particleSizes: boolean = true, particleAlpha: boolean = true ) {
            material = material || new MaterialPointCloud();

            if ( !PointCloud._meshes ) {
                PointCloud._meshes = [];
                PointCloud._vec = new Vec3();
                PointCloud._numClouds = 0;
                PointCloud._matrix = new Matrix4();
                PointCloud._sortArray = [];
            }

            super( material, new GeometryPoints() );

            this._particleSizes = particleSizes;
            this._particleRotations = particleRotations;
            this._particleAlpha = particleAlpha;

            this._blendMode = CloudBlendMode.NONE;
            this.sortParticles = false;
            this._blendAlpha = 1;
            this._emitter = null;
            this.invWorld = new Matrix4();

            PointCloud._numClouds++;

            this._mapPass = new RenderPass( null, null, PassType.PointsTextureMap );
            this._normalPass = new RenderPass( null, null, PassType.PointsNormalMap );
            this._mapTarget = new RenderTarget( 512, 512, TextureType.UnsignedByteType, TextureWrapping.ClampToEdgeWrapping, TextureWrapping.ClampToEdgeWrapping, TextureFilter.Nearest, TextureFilter.Nearest, TextureFormat.RGBAFormat, 1, false, false );
            this._normalTarget = new RenderTarget( 512, 512, TextureType.UnsignedByteType, TextureWrapping.ClampToEdgeWrapping, TextureWrapping.ClampToEdgeWrapping, TextureFilter.Nearest, TextureFilter.Nearest, TextureFormat.RGBAFormat, 1, false, false );

            // Generate initial buffers
            this.generatePoints( numParticles );
        }

		/*
		* Sorts the particles from farthest to closest
		* @param {Array<number>} a
		* @param {Array<number>} b
		*/
        private numericalSort( a: Array<number>, b: Array<number> ) {
            return b[ 0 ] - a[ 0 ];
        }

		/*
		* Sorts the buffers of the point cloud so that the farthest point from the camera is drawn first
		* while the one closest to the camera is drawn last
		* @param {Camera} camera The camera used to render the scene
		*/
        sortGeometry( camera: Camera ) {
            if ( this.culled || this.sortParticles === false )
                return;

            const m = PointCloud._matrix;
            const v = PointCloud._vec;
            let sortArray = PointCloud._sortArray;
            sortArray.splice( 0, sortArray.length );

            m.copy( camera._projScreenMatrix );
            m.multiply( this.worldMatrix );

            const buffers = this._geometry.buffers;
            const verts: Array<Vec3> = buffers[ AttributeType.POSITION ].data;
            const vl = verts.length;

            for ( let i = 0; i < vl; i++ ) {
                v.copy( verts[ i ] );
                v.applyProjection( m );
                sortArray[ i ] = [ v.z, i ]
            }

            // Uses a fast sorting algorithm to sort the particles based on their distance to the camera
            sortArray = AdaptiveSort.sort( sortArray, 0 );

            // We need to reverse the sort as its from closest to farthest
            sortArray = sortArray.reverse();

            let data: Array<any>;
            let datum: any;
            const geometry: Geometry = this._geometry;
            let buffer: GeometryBuffer;
            const vl2: number = vl * 2;
            const bl = buffers.length;



            // For each of the geom buffers, add the datums of the sorted array
            // to the end of the buffers.
            for ( let i = 0, l = sortArray.length; i < l; i++ ) {
                for ( let b = 0; b < bl; b++ ) {
                    buffer = buffers[ b ];
                    if ( !buffer )
                        continue;

                    data = buffer.data;
                    datum = data[ sortArray[ i ][ 1 ] ];
                    data.push( datum );
                }
            }

            // do the same for any emitter buffers, if present
            if ( this._emitter )
                this._emitter.sort( sortArray );


            // The buffers are now exactly twice as big as before, but the later
            // half of the buffers are the sorted datums, so we simply slice the
            // the first half
            for ( let b = 0; b < bl; b++ ) {
                buffer = buffers[ b ];
                if ( !buffer )
                    continue;

                buffer.data = buffer.data.slice( vl, vl2 );
                if ( geometry.dirtyBuffers.indexOf( buffer ) === -1 )
                    geometry.dirtyBuffers.push( buffer );
            }
        }


		/*
		* Use this function to perform any pre-renders. Useful if an object needs to do its own render pass before a
		* the render call begins.
		* @param {Scene} scene The scene  being rendered
		* @param {Camera} camera The camera beinf used to render the scene
		* @param {RenderTarget} renderTarget The render target the scene is being drawn to
		* @param {Renderer} renderer The renderer being used to draw the scene
		* @param {boolean} Returns false if an error occurred
		*/
        prepRenderSolids( scene: Scene, camera: Camera, renderTarget?: RenderTarget, renderer?: Renderer ): boolean {
            if ( this.culled )
                return true;

            // Get the material and size of the render target
            const material: MaterialPointCloud = <MaterialPointCloud>this._material;

            // If there is no map, then there is no point in doing the prep render
            if ( !material.map )
                return true;

            const rendererW = renderer.width,
                rendererH = renderer.height,
                mapTarget = this._mapTarget,
                normalTarget = this._normalTarget;

            // We have a map and pass. Just make sure the sizes are the same as the renderer may
            // have been resized
            if ( mapTarget.width !== rendererW || mapTarget.height !== rendererH ) {
                mapTarget.resize( rendererW, rendererH );
                normalTarget.resize( rendererW, rendererH );
            }

            // If no blending, then we use the map as normal.
            if ( this._blendMode === CloudBlendMode.NONE )
                return true;

            const clearColor = renderer.autoClearColor;
            const clearDepth = renderer.autoClearDepth;
            const clearStencil = renderer.autoClearStencil;

            renderer.autoClearDepth = true;
            renderer.autoClearStencil = true;
            renderer.autoClearColor = true;

            renderer.ssq.updateWorldMatrix( true );
            PointCloud._meshes.splice( 0, 1, this );

            // Render the points onto the map render target
            this._mapPass.renderTarget = mapTarget;
            if ( !renderer.renderObjects( PointCloud._meshes, camera, this._mapPass ) )
                return false;

            this._normalPass.renderTarget = normalTarget;
            if ( !renderer.renderObjects( PointCloud._meshes, camera, this._normalPass ) )
                return false;

            renderer.autoClearColor = clearColor;
            renderer.autoClearDepth = clearDepth;
            renderer.autoClearStencil = clearStencil;

            return true
        }

		/**
		* Updates the world matrix as well as updating the world sphere and bounding boxes.
		* @param {boolean} forceWorldUpdate If true, the world matrices will be forced to update
		* @param {boolean} forceLocalUpdate If true, the local matrices will be forced to update
		*/
        updateWorldMatrix( forceWorldUpdate: boolean = false, forceLocalUpdate: boolean = false ) {
            let updateInverse: boolean = false;
            if ( forceWorldUpdate || forceLocalUpdate || this.updateMatrixWorld || this.updateMatrix )
                updateInverse = true;

            super.updateWorldMatrix( forceWorldUpdate, forceLocalUpdate );

            if ( forceWorldUpdate )
                this.invWorld.getInverse( this.invWorld.extractRotation( this.worldMatrix ) );
        }

		/*
		* Called just before we render the mesh. The mesh would have passed culling and already be updated.
		* A good place to update custom uniforms.
		* @param {Renderer} renderer The renderer used to draw the scene
		* @param {RenderPass} renderPass The render pass associated with this call
		*/
        preRender( renderer: Renderer, pass: RenderPass ) {
            super.preRender( renderer, pass );

            const material: MaterialPointCloud = <MaterialPointCloud>this._material;

            // If this is the normal depth pass
            if ( pass.passType === PassType.GBuffer2 && material.uvCoordinates() === UVCoordinates.ScreenBased && material.map() ) {
                // We have to override the way depth is recorded for point clouds.
                // The cloud uses screen quads which use a map that is blended however the quads cannot
                // represent this. for example if a light is in the middle of the cloud, the quads in front
                // would be darker than those at the back. But this looks bad because the points are one
                // blended object.

                // To solve this we get the view space center of the particle system and subtract its radius.
                // This value is essentially the further quad away from the camera. We normalized this by dividing
                // The value to get it in a value from 0 to 1 so that it can play nice with the depth pass.
                // We then assign this back value to all particle quads (making the depth essentially uniform
                // accross the whole cloud).
                // Finally, to make the depths a bit more varied, we subtract the normalized alpha value of the
                // blended texture multiplied by its normalized radius. That means each pixel starts with a value
                // of the furthest depth, and then depth is added based on the alpha in the diffuse map.

                // Get the center of the point cloud in view space
                const tempVS = PointCloud._vec;
                tempVS.getPositionFromMatrix( this.worldMatrix );
                tempVS.applyMatrix4( pass.camera.matrixWorldInverse );

                // normalize the depth to 0 - 1
                tempVS.z = Math.abs( tempVS.z - this._worldSphere.radius ) / ( ( <any>pass.camera ).far - ( <any>pass.camera ).near );

                // Get the normalized radius
                const normalizedRadius = ( this._worldSphere.radius / ( <any>pass.camera ).far );

                material.materials[ PassType.GBuffer ].setUniform( 'map', this._mapTarget, false );
                material.materials[ PassType.GBuffer2 ].setUniform( 'map', this._mapTarget, false );
                material.materials[ PassType.ShadowLightPass ].setUniform( 'map', this._mapTarget, false );
                material.materials[ PassType.GBuffer2 ].setUniform( 'normalMap', this._normalTarget, false );


                material.uniformDepth( tempVS.z );
                material.normalizedRadius( normalizedRadius );
            }
        }

		/*
		* Updates the boundaries of the geometry
		*/
        public updateBounds() {
            this.geometry.computeBoundingSphere();
            this.updateWorldSphere = true;
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
            if ( this._emitter )
                this._emitter.update( totalTime, delta );
        }

		/*
		* Generates the quads, rotations and sizes of each point of this point cloud. The rotations, sizes and
		* opacity are also generated based on whether or not the particleSizesEnabled and particleRotationsEnabled
		* are true.
		* @param {number} numPoints the number of points to create (default is 100)
		*/
        generatePoints( numPoints: number = 100 ) {
            const geom: Geometry = this._geometry;

            // Assume the geometry has all attributes. Remove them all
            geom.removeAttribute( AttributeType.POSITION );
            geom.removeAttribute( AttributeType.SCALE );
            geom.removeAttribute( AttributeType.ROTATION );
            geom.removeAttribute( AttributeType.ALPHA );

            const material: MaterialMulti = this._material;

            // Remove any defines
            material.removeDefine( ShaderDefines.ATTR_SIZE );
            material.removeDefine( ShaderDefines.ATTR_ROTATION );
            material.removeDefine( ShaderDefines.ATTR_ALPHA );
            material.removeAttribute( Trike.AttributeType.ROTATION );
            material.removeAttribute( Trike.AttributeType.ALPHA );
            material.removeAttribute( Trike.AttributeType.SCALE );

            // Now for each point create the buffer entries
            const pts: Array<Vec3> = [],
                rotations: Array<number> = ( this._particleRotations ? [] : null ),
                scales: Array<number> = ( this._particleSizes ? [] : null ),
                alphas: Array<number> = ( this._particleAlpha ? [] : null );

            for ( let i = 0, l = numPoints; i < l; i++ ) {
                pts.push( new Vec3() );
                if ( this._particleRotations )
                    rotations.push( 0 );
                if ( this._particleSizes )
                    scales.push( 1 );
                if ( this._particleAlpha )
                    alphas.push( 1 );
            }

            geom.addAttributes( new GeometryBuffer( pts, 3, AttributeType.POSITION ) );

            if ( this._particleRotations ) {
                geom.addAttributes( new GeometryBuffer( rotations, 1, AttributeType.ROTATION ) );
                material.addDefine( ShaderDefines.ATTR_ROTATION );
                material.addAttribute( new AttributeVar( 'rotation', Trike.AttributeType.ROTATION ) );
            }

            if ( this._particleSizes ) {
                geom.addAttributes( new GeometryBuffer( scales, 1, AttributeType.SCALE ) );

                material.addDefine( ShaderDefines.ATTR_SIZE );
                material.addAttribute( new AttributeVar( 'size', Trike.AttributeType.SCALE ) );
            }

            if ( this._particleAlpha ) {
                geom.addAttributes( new GeometryBuffer( alphas, 1, AttributeType.ALPHA ) );
                material.addDefine( ShaderDefines.ATTR_ALPHA );
                material.addAttribute( new AttributeVar( 'alpha', Trike.AttributeType.ALPHA ) );
            }

            // Update the emitter
            if ( this._emitter )
                this._emitter.generatePoints( numPoints );

            this.updateBounds();
        }

		/*
		* Gets the emitter of this point cloud
		* @returns {Emitter}
		*/
        get emitter(): Emitter { return this._emitter; }

		/*
		* Sets the emitter of this point cloud
		* @param {Emitter} val
		*/
        set emitter( val: Emitter ) {
            if ( val ) {
                if ( val.pointCloud )
                    val.pointCloud.emitter = null;

                val.pointCloud = this;
            }

            this._emitter = val;

            if ( val )
                val.generatePoints( this.numPoints );

            this.updateBounds();
        }


		/**
		* Gets if each point has an individual alpha
		* @returns {boolean}
		*/
        get particleAlphasEnabled(): boolean { return this._particleAlpha; }

		/**
		* Sets if each point has an individual alpha
		* @param {boolean} val
		*/
        set particleAlphasEnabled( val: boolean ) {
            if ( this._particleAlpha === val )
                return;

            this._particleAlpha = val;
            this.generatePoints( this._geometry.buffers[ AttributeType.POSITION ].data.length );
        }


		/**
		* Gets if each point has an individual size
		* @returns {boolean}
		*/
        get particleSizesEnabled(): boolean { return this._particleSizes; }

		/**
		* Sets if each point has an individual size
		* @param {boolean} val
		*/
        set particleSizesEnabled( val: boolean ) {
            if ( this._particleSizes === val )
                return;

            this._particleSizes = val;
            this.generatePoints( this._geometry.buffers[ AttributeType.POSITION ].data.length );
        }


		/**
		* Gets if each point has an individual rotation
		* @returns {boolean}
		*/
        get particleRotationsEnabled(): boolean { return this._particleRotations; }

		/**
		* Sets if each point has an individual rotation
		* @param {boolean} val
		*/
        set particleRotationsEnabled( val: boolean ) {
            if ( this._particleRotations === val )
                return;

            this._particleRotations = val;
            this.generatePoints( this._geometry.buffers[ AttributeType.POSITION ].data.length );
        }


		/**
		* Gets the type of blending used on the map.
		* @returns {CloudBlendMode}
		*/
        get blendMode(): CloudBlendMode { return this._blendMode; }

		/**
		* Describes the type of blending to be done on the cloud. If CloudBlendMode.NONE
		* then any diffuse map texture is applied to each point as is. If any other type
		* of blending, then the cloud has to render a separate pass to combine the quad
		* maps into a single blended texture.
		* @param {CloudBlendMode} val
		*/
        set blendMode( val: CloudBlendMode ) {
            const cloudMat: MaterialPointCloud = <MaterialPointCloud>this._material;
            const material = this._material;
            this._blendMode = val;
            if ( val === CloudBlendMode.NONE )
                cloudMat.uvCoordinates( UVCoordinates.PerPoint );
            else {
                cloudMat.uvCoordinates( UVCoordinates.ScreenBased );

                if ( val === CloudBlendMode.ADD )
                    material.materials[ PassType.PointsTextureMap ].blendMode = BlendMode.Additive;
                else if ( val === CloudBlendMode.MULTIPLY )
                    material.materials[ PassType.PointsTextureMap ].blendMode = BlendMode.Multiplication;
                else if ( val === CloudBlendMode.NORMAL )
                    material.materials[ PassType.PointsTextureMap ].blendMode = BlendMode.Normal;
                else if ( val === CloudBlendMode.PREMULTIPLIED_ALPHA )
                    material.materials[ PassType.PointsTextureMap ].blendMode = BlendMode.PremultipliedAlpha;
            }

            // Reset the map uniforms
            if ( cloudMat.map ) {
                const map = cloudMat.map;
                cloudMat.map = null;
                cloudMat.map = map;
            }
        }



		/*
		* Gets the scale multiplier for each particle
		* @returns {number}
		*/
        get particleScale(): number { return this._material._uniforms[ 'particleScale' ].value; }
		/*
		* Sets the scale multiplier for each particle
		* @param {number} val
		*/
        set particleScale( val: number ) {
            this._material.setUniform( 'particleScale', val, true );
            ( <GeometryPoints>this._geometry ).pointsScale = val;
            this.updateBounds();
        }

		/*
		* Gets the number of points for this cloud
		* @returns {number}
		*/
        get numPoints(): number {
            const geom = this._geometry;
            if ( !geom )
                return 0;

            const pBuffer = geom.buffers[ AttributeType.POSITION ];
            if ( pBuffer )
                return pBuffer.data.length;

            return 0;
        }


		/**
		* Cleans up any references or resources
		*/
        dispose() {
            PointCloud._numClouds--;

            if ( PointCloud._numClouds === 0 ) {
                PointCloud._meshes = null;
                PointCloud._vec = null;
            }

            if ( this._mapPass ) {
                this._mapPass.dispose();
                this._normalPass.dispose();
                this._mapPass = null;
                this._normalPass = null;
            }

            this._blendMode = null;
            this._geometry.dispose();
            this._material.dispose();
            this._emitter.pointCloud = null;
            this._emitter = null;

            super.dispose();
        }
    }
}