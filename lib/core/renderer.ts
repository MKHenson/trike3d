namespace Trike {
    export enum TransparencyQuality {
        SinglePass,
        Multipass
    }

	/**
	* The renderer class can be used to render a 3D scene.
	*/
    export class Renderer {
        public static resoucesToRemove: Array<any> = [];

        // Cache
        private static _matrix: Matrix4;
        private static _v: Vec3;
        private static _sortArray: Array<Array<number>> = [];


        public autoClearColor: boolean;
        public autoClearDepth: boolean;
        public autoClearStencil: boolean;
        public drawingCubeTargets: boolean;
        private _depthTest: boolean;
        private _drawingMirrorPasses: boolean;
        private _width: number;
        private _height: number;
        private _x: number;
        private _y: number;
        private _errors: string;
        private _timeElapsed: number;
        private _timeDelta: number;
        private _timePrev: number;
        private _frameCount: number;
        private _FPS: number;
        private _renderCount: number;
        private _FPSTimer: number;
        private _clearAlpha: number;
        private _curTextureUnit: number;
        private _curMirror: Mirror;
        private _curCube: RenderTargetCube;
        private _SSQ: SceneScreenQuad;
        private _defaultPassCollection: PassCollection;
        private _currentPassCollection: PassCollection;
        private _screenPass: ScreenPass;
        private _canvas: HTMLCanvasElement;
        private _statPopup: HTMLDivElement;
        private _glContext: WebGLRenderingContext;
        private _clearColor: Color;
        private _frustum: Frustum;
        private _camPositionPos: Vec3;
        private _solidObjects: Array<Mesh>;
        private _transparentObjects: Array<Mesh>;
        private _visuals: Array<Mesh>;
        private _shadowMeshes: Array<Mesh>;
        private _shadowLights: Array<Light>;
        private _shaderTextures: Array<ShaderTexture>;
        public transparencyQuality: TransparencyQuality;

        // The renderer keeps a count off each time its resized. This matches the resizeId of each composition pass -
        // but if it doesnt then that means the renderer was resized but this pass was not notified.
        // In those cases the pass will be notified and the resizeId synced with the renderer.
        private _resizeId: number;

        // Cache variables
        private _prevProgram: WebGLProgram;
        private _prevMaterial: MaterialMulti;
        private _prevGeometry: Geometry;
        private _texSlotMap: { [ name: number ]: WebGLTexture };
        private _prevCullMode: CullFormat;
        private _prevDepthWrite: boolean;
        private _prevDepthRead: boolean;
        private _currentFramebuffer: WebGLFramebuffer;
        private _viewport: { x: number; y: number; width: number; height: number; }
        private _activeAttributes: { [ attr: number ]: boolean }
        private _preBlendMode: BlendMode;
        private _preBlendEquation: BlendEquation;
        private _preBlendSourceFactor: PixelFactor;
        private _preBlendDestFactor: PixelFactor;
        private _preLineWidth: number;
        private _corners: FrustumCorners;
        private _texSlotArray: Array<number>;

		/**
		* Creates an instance of the Renderer
		*/
        constructor() {
            if ( !Renderer._matrix ) {
                Renderer._matrix = new Matrix4();
                Renderer._v = new Vec3();
            }

            this._glContext = null;
            this._statPopup = null;
            this._errors = '';
            this._clearColor = Color.darkgray();
            this._clearAlpha = 1;
            this._depthTest = true;
            this._prevProgram = null;
            this._prevMaterial = null;
            this._prevGeometry = null;
            this._prevCullMode = null;
            this._currentFramebuffer = null;
            this._drawingMirrorPasses = false;
            this._curMirror = null;
            this._curCube = null;
            this._resizeId = 1;
            this._texSlotArray = [];
            this._corners = new FrustumCorners();
            this.drawingCubeTargets = false;

            this.autoClearColor = true;
            this.autoClearDepth = true;
            this.autoClearStencil = false;

            this._prevDepthWrite = true;
            this._prevDepthRead = true;
            this._preLineWidth = 0;
            this._curTextureUnit = 0;
            this._texSlotMap = {};
            this._camPositionPos = new Vec3();
            this._timeElapsed = 0;
            this._timeDelta = 0;
            this._timePrev = 0;
            this._frameCount = 0;
            this._FPS = 0;
            this._FPSTimer = 0;
            this._frustum = new Frustum();
            this._viewport = { x: 0, y: 0, height: 500, width: 500 }
            this._activeAttributes = {};
            this.transparencyQuality = TransparencyQuality.Multipass;
        }

		/**
		* Creates and initializes the Webgl Context. Will return false if the webgl context fails
		* to initialize. Check the errors string for initialization errors.
		* @param {number} width The width of the renderer in pixels
		* @param {number} height The width of the renderer in pixels
		* @returns {boolean}
		*/
        initialize( width: number = 500, height: number = 500 ): boolean {
            // Create the canvas object
            const canvas: HTMLCanvasElement = document.createElement( 'canvas' );
            if ( !canvas )
                return false;

            this._width = width;
            this._height = height;
            canvas.width = width;
            canvas.height = height;
            this._canvas = canvas;

            let glContext: WebGLRenderingContext = null;
            try {
                const attributes = {
                    alpha: false,
                    premultipliedAlpha: false,
                    antialias: false,
                    stencil: true,
                    preserveDrawingBuffer: false
                }

                glContext = ( canvas.getContext( 'webgl', attributes ) || canvas.getContext( 'experimental-webgl', attributes ) ) as WebGLRenderingContext;
            }
            catch ( e ) {
                this._errors = 'Your browser does not seem to support webgl.';
                return false;
            }

            // No webgl support
            if ( !glContext )
                return false;

            this._transparentObjects = [];
            this._visuals = [];
            this._shadowMeshes = [];
            this._shaderTextures = [];
            this._shadowLights = [];
            this._solidObjects = [];

            this._glContext = glContext;
            this.depthTest = true;
            this.clearColor = this._clearColor;
            this.setViewport();
            Capabilities.getSingleton( this._glContext );

            // We require floating point textures
            if ( !Capabilities.getSingleton().glExtensionTextureFloat ) {
                this._errors = 'Floating point textures required, but not supported.';
                return false;
            }

            // Setup defaults
            glContext.frontFace( glContext.CCW );
            glContext.cullFace( glContext.BACK );
            glContext.enable( glContext.CULL_FACE );
            glContext.clearStencil( 0 );

            // Create the passes
            this._SSQ = new SceneScreenQuad();

            this._defaultPassCollection = new PassCollection();
            this._defaultPassCollection.initialize( width, height );
            this._currentPassCollection = this._defaultPassCollection;
            this._screenPass = new ScreenPass( null );

            // Build the screen quad mesh geometry
            for ( let i = 0, l = this._SSQ.meshes.length; i < l; i++ ) {
                if ( this._SSQ.meshes[ i ]._geometry.buildGeometry( glContext ) === false ) {
                    this._errors = this._SSQ.meshes[ i ]._geometry.compileStatus;
                    return false;
                }
            }

            return true;
        }

		/**
		* Must be called before each call to render. Used to traverse the scene and do any pre-render updates
		* @param {Scene} scene The scene object to update
		* @param {Camera} camera The camera we are drawing the scene with
		*/
        update( scene: Scene, camera: Camera ) {
            this._frameCount++;
            const now: number = new Date().getTime(),
                deltaTime: number = now - this._timePrev,
                shaderTextures = this._shaderTextures;

            this._timePrev = now;
            this._timeElapsed += deltaTime;
            this._timeDelta = deltaTime;
            this._FPSTimer += deltaTime;

            // Calculate the FPS
            if ( this._FPSTimer >= 1000 ) {
                this._FPS = this._frameCount;
                this._frameCount = 0;
                this._FPSTimer = 0;
            }

            // Update all animated textures
            for ( let i = 0, l = shaderTextures.length; i < l; i++ )
                shaderTextures[ i ].update( this._timeElapsed, deltaTime, camera, this );

            scene.updateWorldMatrix();

            scene.update( this._timeElapsed, deltaTime, camera, this );

            if ( this._statPopup )
                this._statPopup.innerHTML = 'FPS: ' + this._FPS.toString();
        }

		/**
		* Cleans up any resources that require buffers to be destroyed
		*/
        cleanupResources() {
            const gl: WebGLRenderingContext = this._glContext;
            const toRemove: Array<any> = Renderer.resoucesToRemove;

            for ( let i = 0, len = toRemove.length; i < len; i++ )
                if ( toRemove[ i ] instanceof TextureBase )
                    toRemove[ i ].destroyBuffers( gl );
                else if ( toRemove[ i ] instanceof Geometry )
                    toRemove[ i ].destroyBuffers( gl );

            toRemove.splice( 0, toRemove.length );
        }

		/**
		* Sorts the transparent meshes so that they are drawn from back to front
		* @param {Array<Mesh>} meshes The meshes to sort
		* @param {Camera} camera The camera to base the sorting on
		*/
        sortTransparents( meshes: Array<Mesh>, camera: Camera ) {
            const v: Vec3 = Renderer._v;
            let sortArray = Renderer._sortArray;
            let mesh: Mesh;

            sortArray.splice( 0, sortArray.length );

            for ( let i = 0, l = meshes.length; i < l; i++ ) {
                v.getPositionFromMatrix( meshes[ i ].worldMatrix );
                v.project( camera, false );
                sortArray[ i ] = [ v.z, i ]
            }

            // Uses a fast sorting algorithm to sort the particles based on their distance to the camera
            sortArray = AdaptiveSort.sort( sortArray, 0 );

            // We need to reverse the sort as its from closest to farthest
            sortArray = sortArray.reverse();

            for ( let i = 0, l = sortArray.length; i < l; i++ )
                meshes.push( meshes[ sortArray[ i ][ 1 ] ] );

            meshes.splice( 0, sortArray.length );
        }

		/**
		* Call this to draw the scene. Returns false if a problem occurred with drawing the scene. Check
		* the errors string for causes.
		* @param {Scene} scene The scene to draw
		* @param {Camera} camera The camera to draw the scene with
		* @param {RenderTarget} renderTarget The optional texture to draw on
		* @returns {boolean}
		*/
        render( scene: Scene, camera: Camera, renderTarget?: RenderTarget ): boolean {
            const gl: WebGLRenderingContext = this._glContext,
                transparentObjects = this._transparentObjects,
                shadowMeshes = this._shadowMeshes,
                allVisuals = scene.allVisuals,
                shaderTextures = this._shaderTextures,
                solidObjects = this._solidObjects,
                mirrors = scene.mirrors,
                cubeRenderers = scene.cubeRenderers,
                convolvers = scene.convolvers;

            let shaderTextureIndex: number = 0,
                visuals = this._visuals,
                mesh: Mesh, geom: Geometry,
                mat: MaterialMulti,
                matShaderTextures: Array<ShaderTexture>;

            this._renderCount = 0;

            // Clear perf arrays
            transparentObjects.splice( 0, transparentObjects.length );
            solidObjects.splice( 0, solidObjects.length );
            visuals.splice( 0, visuals.length );
            shadowMeshes.splice( 0, shadowMeshes.length );
            shaderTextures.splice( 0, shaderTextures.length );

            visuals = visuals.concat( scene.meshes );
            visuals = visuals.concat( scene.pointClouds );

            // Enable stencil test
            gl.enable( gl.STENCIL_TEST );
            gl.enable( gl.DEPTH_TEST );
            this._prevDepthRead = true;
            this._drawingMirrorPasses = false;
            this._currentPassCollection = this._defaultPassCollection;

            // Clean up any objects that have been disposed.
            this.cleanupResources();

            // Build any geometry that needs to be built before we call update
            for ( let i = 0, l = allVisuals.length; i < l; i++ ) {
                mesh = allVisuals[ i ];
                geom = mesh._geometry;

                if ( mesh.visible && mesh.castShadows() )
                    shadowMeshes.push( mesh );

                if ( geom ) {
                    // Check if the geometry has been updated
                    if ( mesh.buildNumber !== geom.buildCount )
                        mesh.geometryUpdated( geom );

                    // Check if geometry needs to be rebuilt. If it fails then catch the error and return
                    if ( geom.requiresBuild && geom.buildGeometry( gl ) === false ) {
                        this._errors = geom.compileStatus;
                        return false;
                    }
                    else if ( geom.dirtyBuffers.length )
                        geom.updateDirtyBuffers( gl );
                }

                // Look for any shader materials that might need to be updated
                if ( mesh.material ) {
                    mat = mesh.material;
                    matShaderTextures = mat._shaderTextures;
                    for ( let s = 0, sl = matShaderTextures.length; s < sl; s++ ) {
                        shaderTextureIndex = shaderTextures.indexOf( matShaderTextures[ s ] );
                        if ( shaderTextureIndex === -1 )
                            shaderTextures.push( matShaderTextures[ s ] );
                    }
                }
            }

            // Add the perspective lights
            for ( let i = 0, l = scene.lightsPerspective.length; i < l; i++ )
                visuals.push( scene.lightsPerspective[ i ] );

            // Update the scene
            this.update( scene, camera );

            // Sort the draw arrays and potential geometry, and call any prep renders
            for ( let i = 0, l = visuals.length; i < l; i++ ) {
                mesh = visuals[ i ];

                // perform any geometry sorting
                mesh.sortGeometry( camera );

                if ( !visuals[ i ].prepRender( scene, camera, renderTarget, this ) )
                    return false;

                if ( visuals[ i ].material && visuals[ i ].material.transparent )
                    transparentObjects.push( visuals[ i ] );
                else
                    solidObjects.push( visuals[ i ] );
            }

            // First draw any animated textures
            for ( let i = 0, l = shaderTextures.length; i < l; i++ ) {
                if ( shaderTextures[ i ].requiresDraw && !this.drawShaderTexture( shaderTextures[ i ] ) )
                    return false;

                if ( shaderTextures[ i ].animated === false )
                    shaderTextures[ i ].requiresDraw = false;
            }

            // Call prep render on any skyboxes
            for ( let i = 0, l = scene.skyboxes.length; i < l; i++ )
                if ( !scene.skyboxes[ i ].prepRender( scene, camera, renderTarget, this ) )
                    return false;

            // Call prep render on any convolvers
            for ( let i = 0, l = convolvers.length; i < l; i++ )
                if ( !convolvers[ i ].prepRender( scene, camera, renderTarget, this ) )
                    return false;

            // Call prep render on any lights
            for ( let i = 0, l = scene.lights.length; i < l; i++ )
                if ( !scene.lights[ i ].prepRender( scene, camera, renderTarget, this ) )
                    return false;

            // Draw the shadow maps
            if ( !this.drawShadowMaps( gl, shadowMeshes, scene.lightsFullScreen, camera ) )
                return false;

            let c: Camera;

            // Draw any mirrors or scene cameras
            let mirror: Mirror;
            for ( let i = 0, l = mirrors.length; i < l; i++ ) {
                mirror = mirrors[ i ];
                this._currentPassCollection = mirror.passCollection;

                if ( !mirror.material || !mirror.material.mirrorReflection() )
                    continue;

                this._drawingMirrorPasses = true;

                this._curMirror = mirror;

                if ( camera instanceof CameraCombined && ( <CameraCombined>camera ).activeCamera instanceof CameraPerspective )
                    mirror.updateTextureMatrix( <CameraPerspective>( <CameraCombined>camera ).activeCamera );
                else if ( camera instanceof CameraPerspective )
                    mirror.updateTextureMatrix( <CameraPerspective>camera );
                else
                    throw new Error( 'Mirror only supports perspective camera at this time' );

                c = mirror.mirrorCamera;

                // Prep the camera for the reflection
                this.prepCamera( c, visuals );

                if ( !this.renderPasses( scene, c, solidObjects, transparentObjects, false, mirror.renderTarget ) )
                    return false;

                if ( mirror.material ) {
                    mirror.material.reflectionMap( mirror.renderTarget );
                    mirror.material.textureMatrix( mirror.textureMatrix );
                }
            }

            // Draw any cube renderers
            let cubeRenderer: CubeRenderer;
            for ( let i = 0, l = cubeRenderers.length; i < l; i++ ) {
                cubeRenderer = cubeRenderers[ i ];
                cubeRenderer.updateCameras();
                this._currentPassCollection = cubeRenderer.passCollection;

                // Turn off mipmaps for most of the targets
                const mipmaps = cubeRenderer.cubeTarget.generateMipmaps;
                cubeRenderer.cubeTarget.generateMipmaps = false;

                // We use this to make sure we dont draw any materials using actuve the cube.
                // You cant draw a material when the render target is still being drawn
                this._curCube = cubeRenderer.cubeTarget;

                // Draw each of the cube sides
                c = cubeRenderer.activateCamera( 0 );
                this.prepCamera( c, visuals );
                if ( !this.renderPasses( scene, c, solidObjects, transparentObjects, false, cubeRenderer.cubeTarget ) )
                    return false;

                c = cubeRenderer.activateCamera( 1 );
                this.prepCamera( c, visuals );
                if ( !this.renderPasses( scene, c, solidObjects, transparentObjects, false, cubeRenderer.cubeTarget ) )
                    return false;

                c = cubeRenderer.activateCamera( 2 );
                this.prepCamera( c, visuals );
                if ( !this.renderPasses( scene, c, solidObjects, transparentObjects, false, cubeRenderer.cubeTarget ) )
                    return false;

                c = cubeRenderer.activateCamera( 3 );
                this.prepCamera( c, visuals );
                if ( !this.renderPasses( scene, c, solidObjects, transparentObjects, false, cubeRenderer.cubeTarget ) )
                    return false;

                c = cubeRenderer.activateCamera( 4 );
                this.prepCamera( c, visuals );
                if ( !this.renderPasses( scene, c, solidObjects, transparentObjects, false, cubeRenderer.cubeTarget ) )
                    return false;

                cubeRenderer.cubeTarget.generateMipmaps = mipmaps;

                c = cubeRenderer.activateCamera( 5 );
                this.prepCamera( c, visuals );
                if ( !this.renderPasses( scene, c, solidObjects, transparentObjects, false, cubeRenderer.cubeTarget ) )
                    return false;
            }

            // Make sure these are null again
            this._curCube = null;
            this._curMirror = null;

            this._drawingMirrorPasses = false;
            this._currentPassCollection = this._defaultPassCollection;

            // Prep the camera for the scene
            this.prepCamera( camera, visuals );

            // Draw each of the passes
            if ( !this.renderPasses( scene, camera, solidObjects, transparentObjects, true, renderTarget ) )
                return false;

            // Disable stencil test
            gl.disable( gl.STENCIL_TEST );
            return true;
        }

		/**
		* Preps the camera variables before a render as well as
		* checks if each visual is within the furstum of the camera
		* @param {Camera} The camera to prepare
		* @param {Array<Mesh>} visuals The mesh objects to frust check
		*/
        prepCamera( camera: Camera, visuals: Array<Mesh> ) {
            let mesh: Mesh,
                frustum: Frustum = this._frustum;

            // Get the camera position for uniforms later
            this._camPositionPos.getPositionFromMatrix( camera.worldMatrix );

            // Get the 4 frustum corners of the camera. This is used in the post process effect
            // to get the depth and position of each fragment
            this._corners.setFrustumCorners( camera );

            // Build the frustum from the camera
            frustum.setFromMatrix( camera._projScreenMatrix );

            // Do all culling after the update call
            for ( let i = 0, l = visuals.length; i < l; i++ ) {
                mesh = visuals[ i ];

                if ( !mesh.visible )
                    mesh.culled = true;
                else if ( mesh.sceneCull === false )
                    mesh.culled = false;
                else if ( mesh.customCulling === false && frustum.intersectsObject( mesh ) )
                    mesh.culled = false;
                else if ( mesh.customCulling )
                    mesh.culled = mesh.isCulled( camera, frustum );
                else
                    mesh.culled = true;
            }
        }

		/**
		* Draws the passes of a scene. This must be called after the scene is updated and culled. Returns false if a problem occurred with drawing the scene. Check
		* the errors string for causes.
		* @param {Scene} scene The scene to draw
		* @param {Camera} camera The camera to draw the scene with
		* @param {Array<Mesh>} solidObjects The solid objects to draw
		* @param {Array<Mesh>} transparentObjects The transparent objects to draw
		* @param {boolean} drawCompositions If true, the camera compositions will be enabled
		* is only useful or neccessary when multiple scenes are being rendered on top of eachother
		* @returns {boolean}
		*/
        renderPasses( scene: Scene, camera: Camera, solidObjects: Array<Mesh>, transparentObjects: Array<Mesh>, drawCompositions: boolean, renderTarget?: RenderTarget ): boolean {
            const clearCol = this._clearColor,
                clearAlpha = this._clearAlpha,
                gl: WebGLRenderingContext = this._glContext,
                autoClearColor = this.autoClearColor,
                autoClearStencil = this.autoClearStencil,
                autoClearDepth = this.autoClearDepth,
                passCollection = this._currentPassCollection;

            // The first pass involves the skybox. The skybox should draw 1's to the stencil buffer.
            // Solids will later draw 2's and transparents 3's, 4's & 5's x [n transparents]
            gl.stencilFunc( gl.ALWAYS, 1, 0xffffffff );
            gl.stencilOp( gl.KEEP, gl.KEEP, gl.REPLACE );

            // Set the clear color
            this._glContext.clearColor( clearCol.r, clearCol.g, clearCol.b, clearAlpha );

            // Set the solid material
            passCollection.compositionPass.material = passCollection.compositionPass.solidMaterial;

            // For a new render call, we need to clear the stencil.
            this.autoClearStencil = true;

            // Render the skyboxes
            passCollection.skyPass.renderTarget = passCollection.compositionPass.renderTarget;
            if ( !this.renderObjects( scene.skyboxes, camera, passCollection.skyPass ) )
                return false;

            // If there was a sky render we do not need to clear again
            if ( scene.skyboxes.length > 0 )
                this.autoClearStencil = false;

            // Draw the solid objects into the respective passes.
            if ( !this.drawSolidObjects( this._glContext, solidObjects, scene.lightsPerspective, scene.lightsFullScreen, camera ) )
                return false;

            // Draw any lighting based post processes
            this.drawCompositionPasses( camera.passes[ Phase.LightingSolid ], passCollection.compositionPass.renderTarget, camera, scene, solidObjects, transparentObjects );

            // Turn off the stencil check for the composition
            gl.stencilFunc( gl.LESS, 0, 0xffffffff );
            gl.stencilOp( gl.KEEP, gl.KEEP, gl.KEEP );

            // Draw the camera effects on the solid pass
            this.drawCompositionPasses( camera.passes[ Phase.Composition ], passCollection.compositionPass.renderTarget, camera, scene, solidObjects, transparentObjects );

            // Draw the transparent objects
            if ( transparentObjects.length > 0 ) {
                // second prep call for post solid rendering
                for ( let i = 0, l = transparentObjects.length; i < l; i++ )
                    transparentObjects[ i ].prepRenderSolids( scene, camera, renderTarget, this );

                this.sortTransparents( transparentObjects, camera );

                // Draw the transparent objects into the respective passes.
                this.drawTransparentObjects( this._glContext, transparentObjects, scene.lightsPerspective, scene.lightsFullScreen, camera );

                //// The stencil is now filled with 1's from the sky, 2's from the solids pass and 3's from the transparents
                //// To make sure we only draw those we set the test to be stencil !== 0 (i.e. 1 and 2 are ok!)
                // gl.stencilFunc(gl.LESS, 2, 0xffffffff);
                // gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP); // Do not modify the stencil values (keep them as they are)

                //// Draw the post processing effects onto the composition pass
                // this.drawCompositionPasses(camera.passes[Phase.Composition], passCollection.compositionPass.renderTarget, camera, scene, solidObjects, transparentObjects);
            }

            // We turn the stencil back to always as we're gonna be doing post process effects
            gl.stencilFunc( gl.ALWAYS, 0, 0xffffffff );
            gl.stencilOp( gl.KEEP, gl.KEEP, gl.KEEP );

            if ( drawCompositions && camera.passes[ Phase.PostCompostion ].length > 0 )
                this.drawCompositionPasses( camera.passes[ Phase.PostCompostion ], passCollection.compositionPass.renderTarget, camera, scene, solidObjects, transparentObjects );

            // Finally send the composition to the frame or render buffer provided
            passCollection.framePass.prepPass( renderTarget, scene, camera, this );
            if ( !this.renderObjects( this._SSQ.meshes, this._SSQ.camera, passCollection.framePass ) )
                return false;

            this.autoClearColor = autoClearColor;
            this.autoClearStencil = autoClearStencil;
            this.autoClearDepth = autoClearDepth;


            return true;
        }

        drawCompositionPasses( compPasses: Array<CompositionPass>, renderTarget: RenderTarget, camera: Camera, scene: Scene, solidObjects: Array<Mesh>, transparentObjects: Array<Mesh> ) {
            // Now that the main passes are drawn, we do the composition passes attached the camera
            let compositionPass: CompositionPass, compositionMeshes: Array<Mesh>, compositionCam: Camera;
            for ( let i = 0, l = compPasses.length; i < l; i++ ) {
                compositionPass = compPasses[ i ];
                if ( !compositionPass.enabled )
                    continue;

                switch ( compositionPass.filterType ) {
                    case FilterType.Solids:
                        compositionMeshes = solidObjects;
                        compositionCam = camera;
                        break;
                    case FilterType.Transparents:
                        compositionMeshes = transparentObjects;
                        compositionCam = camera;
                        break;
                    case FilterType.ScreenQuad:
                        compositionMeshes = this._SSQ.meshes;
                        compositionCam = this._SSQ.camera;
                        break;
                }

                // Check if the pass needs to be resized
                if ( compositionPass.resizeId !== this._resizeId ) {
                    compositionPass.resize( this._width, this._height );
                    compositionPass.resizeId = this._resizeId;
                }

                for ( let p = 0, pl = compositionPass.numSubPasses; p < pl; p++ ) {
                    compositionPass.currentSubPass = p;
                    compositionPass.prepPass( renderTarget, scene, camera, this );

                    this.autoClearColor = compositionPass.autoClearColor;
                    this.autoClearStencil = compositionPass.autoClearStencil;
                    this.autoClearDepth = compositionPass.autoClearDepth;

                    if ( !this.renderObjects( compositionMeshes, compositionCam, compositionPass ) )
                        return false;
                }
            }
        }

		/*
		* Draws the non transparent objects to their respective passes. Returns false if a problem occurred with drawing the scene. Check
		* the errors string for causes.
		* @return {boolean}
		*/
        drawSolidObjects( gl: WebGLRenderingContext, meshes: Array<Mesh>, lightsP: Array<Light>, lightsS: Array<Light>, camera: Camera ): boolean {
            const passCollection = this._currentPassCollection
            this.autoClearColor = true;
            this._glContext.clearColor( 0, 0, 0, 0 );

            // You need to start these before calling clear as it seems the clear is ignored when its false
            gl.depthMask( true );
            this._prevDepthWrite = true;

            // write 1 to the stencil buffer of each pixel we draw
            gl.stencilFunc( gl.ALWAYS, 2, 0xffffffff ); // Always pass the stencil
            gl.stencilOp( gl.KEEP, gl.KEEP, gl.REPLACE ); // Replace the stencil value with ref=1

            // Draw the material passes
            const passes: Array<MaterialPass> = MaterialMulti.materialPasses;
            const prevDepth: boolean = this.autoClearDepth;
            const resizeId = this._resizeId;
            this.autoClearDepth = true;
            for ( let i = 0, l = passes.length; i < l; i++ ) {
                if ( passes[ i ].enabled === false )
                    continue;

                // Check if the pass needs to be resized
                if ( passes[ i ].resizeId !== resizeId ) {
                    passes[ i ].resize( this._width, this._height );
                    passes[ i ].resizeId = resizeId;
                }

                // Render the color and material information
                if ( !this.renderObjects( meshes, camera, passes[ i ] ) )
                    return false;
            }

            this.autoClearDepth = prevDepth;

            // Render the gbuffer
            if ( !this.renderObjects( meshes, camera, passCollection.gBufferPass ) )
                return false;

            // Make sure the stencil clear is false. The data in the stencil is used for subsequent calls
            this.autoClearStencil = false;

            // Do not clear the depth buffer, we can use it to disregard pixels as the buffers
            // below share the depth buffer of the _gBuffer2Pass
            this.autoClearDepth = false;

            gl.stencilFunc( gl.EQUAL, 2, 0xffffffff ); // Only draw the stencil values with 1 for both color + light passes
            gl.stencilOp( gl.KEEP, gl.KEEP, gl.KEEP ); // Do not modify the stencil values (keep them as they are)

            // Render the gbuffer 2
            if ( !this.renderObjects( meshes, camera, passCollection.gBuffer2Pass ) )
                return false;

            // Render the shadow maps onto the scene
            // TODO: OPTIMIZE
            // if (!this.renderObjects(meshes, camera, this._shadowMapPass))
            //    return false;

            // Now we do not clear the depth buffer in this pass.
            // Depth from geometry pass is used for light culling

            gl.depthFunc( gl.GEQUAL ); // Greater equal as lights will be front culled

            // Render the lights that use perspective geometry (can be culled)
            if ( !this.renderObjects( lightsP, camera, passCollection.lightPass ) )
                return false;

            // return back to less equal for screen quad lighting
            gl.depthMask( true );
            this._prevDepthWrite = true;

            gl.depthFunc( gl.LEQUAL );

            // Do not clear the scene - we are now going to render the other lights
            this.autoClearColor = false;

            // Render the lights that use screen quad geometry (cannot be culled)
            if ( !this.renderObjects( lightsS, camera, passCollection.lightPass ) )
                return false;

            // Now that the solids are drawn, we draw the light pass onto the composition target
            // For solid objects there must be no blending

            passCollection.compositionPass.map = passCollection.lightPass.renderTarget;
            if ( !this.renderObjects( this._SSQ.meshes, this._SSQ.camera, passCollection.compositionPass ) )
                return false;

            return true;
        }

		/*
		* Draws the transparent objects to their respective passes. Returns false if a problem occurred with drawing the scene. Check
		* the errors string for causes.
		* @return {boolean}
		*/
        drawTransparentObjects( gl: WebGLRenderingContext, meshes: Array<Mesh>, lightsP: Array<Light>, lightsS: Array<Light>, camera: Camera ): boolean {
            const passCollection = this._currentPassCollection

            // Draw the material passes
            this.autoClearDepth = true;
            this.autoClearStencil = true;
            this.autoClearColor = true;
            const resizeId = this._resizeId;
            const passes: Array<MaterialPass> = MaterialMulti.materialPasses;

            // Always pass the stencil for the material passes
            gl.stencilFunc( gl.ALWAYS, 1, 0xffffffff );
            gl.stencilOp( gl.KEEP, gl.KEEP, gl.REPLACE );
            for ( let i = 0, l = passes.length; i < l; i++ ) {
                if ( passes[ i ].enabled === false )
                    continue;

                // Check if the pass needs to be resized
                if ( passes[ i ].resizeId !== resizeId ) {
                    passes[ i ].resize( this._width, this._height );
                    passes[ i ].resizeId = resizeId;
                }

                // Render the color and material information
                if ( !this.renderObjects( meshes, camera, passes[ i ] ) )
                    return false;
            }


            // Set the clear color to black for the deferred rendering
            this.autoClearDepth = false;
            this.autoClearStencil = false;
            this.autoClearColor = false;
            this._glContext.clearColor( 0, 0, 0, 0 );

            const transparencyQuality = this.transparencyQuality;
            let toDraw: Array<Mesh> = [];

            let l = 1;
            if ( transparencyQuality === TransparencyQuality.Multipass )
                l = meshes.length;

            // When drawing transparent objects we flip between 3 and 4 for the drawing mask
            // This is so that we make sure we only draw the relevant pixels for each one.
            let curStencilMask = 3;

            for ( let i = 0; i < l; i++ ) {
                if ( transparencyQuality === TransparencyQuality.Multipass ) {
                    toDraw[ 0 ] = meshes[ i ];

                    if ( toDraw[ 0 ].culled || !toDraw[ 0 ].visible )
                        continue;

                    // Render the lights that use perspective geometry (can be culled)
                    passCollection.tLightPass.drawSpecificMesh = toDraw[ 0 ];
                }
                else {
                    toDraw = meshes;

                    // Render the lights that use perspective geometry (can be culled)
                    passCollection.tLightPass.drawSpecificMesh = null;
                }


                // write the cur transparent mask number to the stencil buffer of each pixel we draw
                gl.stencilFunc( gl.ALWAYS, curStencilMask, 0xffffffff ); // Always pass the stencil
                gl.stencilOp( gl.KEEP, gl.KEEP, gl.REPLACE ); // Replace the stencil value with  mask number, but not if the z/stencil fails

                // Render the gbuffer
                if ( !this.renderObjects( toDraw, camera, passCollection.gBufferPass ) )
                    return false;

                if ( transparencyQuality === TransparencyQuality.Multipass )
                    this.autoClearStencil = false;

                gl.stencilFunc( gl.EQUAL, curStencilMask, 0xffffffff ); // Only draw the stencil values with 2 for both color + light passes
                gl.stencilOp( gl.KEEP, gl.KEEP, gl.KEEP ); // Do not modify the stencil values (keep them as they are)

                // Render gbuffer 2
                if ( !this.renderObjects( toDraw, camera, passCollection.gBuffer2Pass ) )
                    return false;


                // Clear the transparent light texture to black
                this.autoClearColor = true;

                // If not depth reading, then always pass.
                // Greater equal as lights will be front culled
                if ( transparencyQuality === TransparencyQuality.Multipass ) {
                    if ( meshes[ i ].material.depthRead )
                        gl.depthFunc( gl.GEQUAL );
                    else
                        gl.depthFunc( gl.ALWAYS );
                }
                else
                    gl.depthFunc( gl.GEQUAL );

                // Draw the lights that use perspective transforms
                if ( !this.renderObjects( lightsP, camera, passCollection.tLightPass ) )
                    return false;

                // Additive blending, turn off clear color
                this.autoClearColor = false;
                gl.depthMask( true );
                this._prevDepthWrite = true;

                // Return back to less equal for screen quad lighting
                gl.depthFunc( gl.LEQUAL );

                // Render the lights that use screen quad geometry (cannot be culled)
                if ( !this.renderObjects( lightsS, camera, passCollection.tLightPass ) )
                    return false;

                // Draw the composition on the light render target
                this.drawCompositionPasses( camera.passes[ Phase.Composition ], passCollection.tLightPass.renderTarget, camera, null, null, null );

                // Once again we draw the light contributions onto the composition target. This time however we
                // do allow for blending
                passCollection.compositionPass.material = passCollection.compositionPass.transparentMaterial;
                passCollection.compositionPass.map = passCollection.tLightPass.renderTarget;
                if ( !this.renderObjects( this._SSQ.meshes, this._SSQ.camera, passCollection.compositionPass ) )
                    return false;

                // Swap the stencil
                if ( curStencilMask === 3 )
                    curStencilMask = 4;
                else
                    curStencilMask = 3;
            }
        }

		/*
		* Draws the shadow maps for each of the lights
		* @return {boolean}
		*/
        drawShadowMaps( gl: WebGLRenderingContext, shadowCasters: Array<Mesh>, lights: Array<Light>, camera: Camera ): boolean {
            const clearCol = this._clearColor,
                clearAlpha = this._clearAlpha,
                autoClearColor = this.autoClearColor,
                autoClearStencil = this.autoClearStencil,
                autoClearDepth = this.autoClearDepth,
                shadowLights = this._shadowLights;

            let light: Light;
            let shadowMatrix: Matrix4;
            let shadowMatrix2: Matrix4;
            let shadowCamera: Camera;
            let shadowMap: RenderTarget;
            const passCollection = this._currentPassCollection;

            this.autoClearColor = true;
            this.autoClearStencil = true;
            this.autoClearDepth = true;

            gl.clearColor( 1, 1, 1, 1 );
            gl.depthMask( true );

            shadowLights.splice( 0, shadowLights.length );



            for ( let i = 0, l = lights.length; i < l; i++ ) {
                light = lights[ i ];

                if ( light instanceof LightDirectional === false || !( <LightDirectional>light ).shadowMap() )
                    continue;

                shadowLights.push( light );
                shadowCamera = ( <LightDirectional>light ).shadowCamera();
                shadowMap = ( <LightDirectional>light ).shadowMap();

                shadowCamera.position.getPositionFromMatrix( light.worldMatrix );
                shadowCamera.lookAt(( <LightDirectional>light ).target );
                shadowCamera.updateWorldMatrix( true );

                shadowMatrix = ( <LightDirectional>light ).shadowMatrix();
                shadowMatrix.set( 0.5, 0.0, 0.0, 0.5,
                    0.0, 0.5, 0.0, 0.5,
                    0.0, 0.0, 0.5, 0.5,
                    0.0, 0.0, 0.0, 1.0 );

                shadowMatrix.multiply( shadowCamera.projectionMatrix );
                shadowMatrix.multiply( shadowCamera.matrixWorldInverse );

                passCollection.shadowLightPass.renderTarget = shadowMap;

                this.prepCamera( shadowCamera, shadowCasters );

                if ( !this.renderObjects( shadowCasters, shadowCamera, passCollection.shadowLightPass ) )
                    return false;

                // Stops the map from being resized
                passCollection.shadowLightPass.renderTarget = null;

                //// Now blur the shadow map
                //// First blur the x
                //            this._shadowLightPass.blurMaterialX.setUniform('map', shadowMap, true );
                //            this._shadowLightPass.material = this._shadowLightPass.blurMaterialX;
                //            this._shadowLightPass.renderTarget = this._shadowLightPass.blurX;
                //            if (!this.renderObjects(this._SSQ.meshes, this._SSQ.camera, this._shadowLightPass))
                //                return false;

                //            // Now blur the y
                //            this._shadowLightPass.blurMaterialY.setUniform('map', this._shadowLightPass.blurX, true);
                //            this._shadowLightPass.material = this._shadowLightPass.blurMaterialY;
                //            this._shadowLightPass.renderTarget = this._shadowLightPass.blurY;
                //            if (!this.renderObjects(this._SSQ.meshes, this._SSQ.camera, this._shadowLightPass))
                //                return false;

                //            // Copy the blurred image back to the original lightmap
                //            this._shadowLightPass.copyMaterial.setUniform('map', this._shadowLightPass.blurY, true);
                //            this._shadowLightPass.material = this._shadowLightPass.copyMaterial;
                //            this._shadowLightPass.renderTarget = shadowMap;
                //            if (!this.renderObjects(this._SSQ.meshes, this._SSQ.camera, this._shadowLightPass))
                //                return false;

                //            this._shadowLightPass.material = null;
            }

            gl.clearColor( clearCol.r, clearCol.g, clearCol.b, clearAlpha );
            this.autoClearColor = autoClearColor;
            this.autoClearStencil = autoClearStencil;
            this.autoClearDepth = autoClearDepth;

            return true;
        }

        setShadowUniforms( mat: MaterialMulti ) {
            const shadowLights = this._shadowLights;
            let light: Light;
            let count: number = 0;
            const maxShadows: number = ( <Array<TextureBase>>mat._uniforms[ 'shadowMap' ].value ).length;

            for ( let i = 0, l = shadowLights.length; i < l; i++ ) {
                if ( count > maxShadows )
                    return;

                light = shadowLights[ i ];
                if ( !( <LightDirectional>light ).castShadows() ) continue;

                ( <Array<TextureBase>>mat._uniforms[ 'shadowMap' ].value )[ count ] = ( <IShadowCaster><LightDirectional>light ).shadowMap();
                ( <Array<number>>mat._uniforms[ 'shadowMapSize' ].value )[ count ] = ( <IShadowCaster><LightDirectional>light ).shadowMapSize();
                ( <UniformArray<Matrix4>>mat._uniforms[ 'shadowMatrix' ].value ).values[ count ] = ( <IShadowCaster><LightDirectional>light ).shadowMatrix();
                ( <Array<number>>mat._uniforms[ 'shadowDarkness' ].value )[ count ] = ( <IShadowCaster><LightDirectional>light ).shadowDarkness();
                ( <Array<number>>mat._uniforms[ 'shadowBias' ].value )[ count ] = ( <IShadowCaster><LightDirectional>light ).shadowBias();

                count++;
            }
        }

		/**
		* Draws a render target using predefined geometry and cameras. Returns false if a problem occurred with drawing the scene. Check
		* the errors string for causes.
		* @return {boolean}
		*/
        drawRenderTarget( texture: TextureBase, target: RenderTarget ): boolean {
            this._screenPass.map = texture;
            this._screenPass.renderTarget = target;
            if ( !this.renderObjects( this._SSQ.meshes, this._SSQ.camera, this._screenPass ) )
                return false;

            return true;
        }

		/**
		* Draws a shader texture and its material. Returns false if a problem occurred with drawing the scene. Check
		* the errors string for causes.
		* @return {boolean}
		*/
        drawShaderTexture( texture: ShaderTexture ): boolean {
            const autoClearColor = this.autoClearColor,
                autoClearStencil = this.autoClearStencil,
                autoClearDepth = this.autoClearDepth,
                passCollection = this._currentPassCollection;

            passCollection.texturePass.renderTarget = texture;
            passCollection.texturePass.material = texture.material.materials[ PassType.Texture ];

            this.autoClearColor = true;
            this.autoClearStencil = true;
            this.autoClearDepth = true;

            if ( !this.renderObjects( this._SSQ.meshes, this._SSQ.camera, passCollection.texturePass ) )
                return false;

            this.autoClearColor = autoClearColor;
            this.autoClearStencil = autoClearStencil;
            this.autoClearDepth = autoClearDepth;

            return true;
        }



		/**
		* Call this to draw a single pass scene. This does not take into account the
		* multiple passes of a trike render. Returns false if a problem occurred with drawing the scene. Check
		* the errors string for causes.
		* @param {Array<Mesh>} meshes An array of meshes to draw
		* @param {Camera} camera The camera to draw the scene with
		* @param {RenderPass} pass The render pass controlling this render
		* @return {boolean}
		*/
        renderObjects( meshes: Array<Mesh>, cam: Camera, pass: RenderPass ): boolean {
            const gl = this._glContext;
            const camera = cam;
            pass.camera = camera;
            pass.reflectionPass = this._drawingMirrorPasses;
            if ( this._curMirror )
                pass.reflectionClipPlane.copy( this._curMirror.clipPlane );

            const renderTarget: RenderTarget = ( pass ? pass.renderTarget : null );

            // Set the frame buffer we are drawing to.
            if ( !this.setRenderTarget( renderTarget ) )
                return false;

            // Clear the buffers
            if ( this.autoClearColor || this.autoClearDepth || this.autoClearStencil )
                this.clear( this.autoClearColor, this.autoClearDepth, this.autoClearStencil );

            // Cache a few params to speed things up if they are the same.
            let prevProgram: WebGLProgram = this._prevProgram;
            let prevMaterial: MaterialMulti = this._prevMaterial;
            let prevGeometry: Geometry = this._prevGeometry;

            let mesh: Mesh;
            let geom: Geometry;
            let mat: MaterialMulti;
            let renderCount = 0;
            const mirrorMaterial: MaterialMulti = ( this._curMirror ? <MaterialMulti><IMaterial>this._curMirror.material : null );


            for ( let i = 0, l = meshes.length; i < l; i++ ) {
                mesh = meshes[ i ];
                geom = mesh.geometry;
                mat = mesh.material;

                if ( !geom || !mat || mat.disposed )
                    continue;

                // Check if we have a render pass.
                if ( pass ) {
                    if ( pass.evaluateMesh( mesh ) === false )
                        continue;

                    // You can't draw a material if its the same material a reflection pass
                    // is targeting.
                    if ( mirrorMaterial === mat )
                        continue;

                    else if ( mat.materials[ pass.passType ] )
                        mat = mat.materials[ pass.passType ];

                    else if ( pass.material )
                        mat = pass.material;
                    else
                        continue;
                }

                // Check if any geometries / materials need to be built.

                // If the geometry needs to be built, we must reset the previous geometry reference
                // as buffers used in the process interfere with the drawing later on...
                if ( geom.requiresBuild )
                    prevGeometry = null;

                // Check if the geometry has been updated
                if ( mesh.buildNumber !== geom.buildCount )
                    mesh.geometryUpdated( geom );

                // Check if geometry needs to be rebuilt. If it fails then catch the error and return
                if ( geom.requiresBuild && geom.buildGeometry( gl ) === false ) {
                    this._errors = geom.compileStatus;
                    return false;
                }
                else if ( geom.dirtyBuffers.length )
                    geom.updateDirtyBuffers( gl );

                // Check if material needs to be rebuilt. If it fails then catch the error and return
                if ( mat.requiresBuild && mat.compile( gl ) === false ) {
                    this._errors = mat.compileStatus;
                    return false;
                }


                // If not visible - then continue
                if ( !mesh.visible )
                    continue;

                if ( mesh.culled )
                    continue;

                // Call pre-render for any object specific setup
                mesh.preRender( this, pass );

                // Get the matrices ready
                mesh._modelViewMatrix.multiplyMatrices( camera.matrixWorldInverse, mesh.worldMatrix );

                if ( geom.buffers[ AttributeType.NORMAL ] && mat._attributes[ AttributeType.NORMAL ] )
                    mesh._normalMatrix.getNormalMatrix( mesh._modelViewMatrix );


                // Shaders and geometry is ready. Lets set the material shader and activate the
                if ( prevProgram !== mat.program )
                    gl.useProgram( mat.program );

                if ( prevGeometry !== geom || prevMaterial !== mat )
                    this.setupAttributes( mat, geom, gl );


                // Setup common GL settings
                this.setupNewMaterial( mat )

                // If the material is the same as the last render
                if ( prevMaterial === mat ) {
                    if ( this.setupUniforms( mat, mesh, gl, false, camera, renderTarget ) === false )
                        continue;
                }
                else {
                    // Finally setup the material uniforms
                    if ( this.setupUniforms( mat, mesh, gl, true, camera, renderTarget ) === false )
                        continue;
                }

                // Increment render count
                renderCount++;

                // Finally draw the verts
                if ( geom instanceof GeometryLine ) {
                    const geomLine: GeometryLine = <GeometryLine>geom;
                    if ( geomLine.lineMode === LineMode.HeadToTail )
                        gl.drawArrays( gl.LINE_STRIP, 0, geom.numElements );
                    else if ( geomLine.lineMode === LineMode.HeadToTailClosed )
                        gl.drawArrays( gl.LINE_LOOP, 0, geom.numElements );
                    else if ( geomLine.lineMode === LineMode.Pairs )
                        gl.drawArrays( gl.LINES, 0, geom.numElements );
                }
                else if ( geom.indexBuffer ) {
                    if ( prevGeometry !== geom ) {
                        if ( mat.wireframe && geom.indexBufferLines )
                            gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, geom.indexBufferLines.buffer );
                        else
                            gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, geom.indexBuffer.buffer );
                    }

                    // Check the data type of the index buffer. It may be a big 32 or smaller 16
                    const indexData = geom.indexBufferLines.dataFlat;
                    let indexType: number = gl.UNSIGNED_SHORT;
                    if ( indexData instanceof Uint32Array )
                        indexType = gl.UNSIGNED_INT;

                    if ( mat.wireframe )
                        gl.drawElements( gl.LINES, geom.indexBufferLines.dataFlat.length, indexType, 0 );
                    else
                        gl.drawElements( gl.TRIANGLES, geom.indexBuffer.dataFlat.length, indexType, 0 );

                    // var error = gl.getError()
                    // if ( error !== 0 )
                    // {
                    //  var test = 0;
                    //  test++;
                    // }
                }
                else {
                    if ( mesh instanceof PointCloud )
                        gl.drawArrays( gl.POINTS, 0, geom.numElements );
                    else if ( mat.wireframe )
                        gl.drawArrays( gl.LINES, 0, geom.numElements );
                    else
                        gl.drawArrays( gl.TRIANGLES, 0, geom.numElements );
                }

                // Call post render for any object specific setup
                mesh.postRender( gl, pass );

                prevProgram = mat.program;
                prevMaterial = mat;
                prevGeometry = geom;

            }

            this._prevProgram = prevProgram;
            this._prevGeometry = prevGeometry;
            this._prevMaterial = prevMaterial;

            // Generate mipmap if we're using any kind of mipmap filtering
            if ( renderTarget && renderTarget.generateMipmaps && renderTarget.minFilter !== TextureFilter.Nearest && renderTarget.minFilter !== TextureFilter.Linear ) {
                if ( renderTarget instanceof RenderTargetCube ) {
                    gl.bindTexture( gl.TEXTURE_CUBE_MAP, renderTarget.webglTexture );
                    gl.generateMipmap( gl.TEXTURE_CUBE_MAP );
                    gl.bindTexture( gl.TEXTURE_CUBE_MAP, null );
                }
                else {
                    gl.bindTexture( gl.TEXTURE_2D, renderTarget.webglTexture );
                    gl.generateMipmap( gl.TEXTURE_2D );
                    gl.bindTexture( gl.TEXTURE_2D, null );
                }
            }

            this._renderCount += renderCount;
            return true;
        }

		/**
		* Sets the vertex attributes of a geometry based on the material about to be drawn
		* @param {MaterialMulti} material The material drawing the current geometry
		* @param {Geometry} geometry The geometry to prepare
		* @param {WebGLRenderingContext} gl The context
		*/
        private setupAttributes( material: MaterialMulti, geometry: Geometry, gl: WebGLRenderingContext ) {
            // Set each of the attributes
            const attributes: { [ name: number ]: AttributeVar } = material._attributes;
            const buffers: Array<GeometryBuffer> = geometry.buffers;

            let ii: number = 0;
            let attrHooked: boolean = false;
            let type: AttributeType;
            let attr = null;
            let buffer: GeometryBuffer = null;
            const activeAttributes = this._activeAttributes;
            let disableAttribute = false;

            // Disable any vertex attribute that are not relevant to this material
            for ( let i in activeAttributes ) {
                disableAttribute = true;
                for ( const a in attributes )
                    if ( attributes[ a ].location === parseInt( i ) ) {
                        disableAttribute = false;
                        break;
                    }

                if ( disableAttribute ) {
                    activeAttributes[ i ] = false;
                    gl.disableVertexAttribArray( parseInt( i ) );
                }
            }

            for ( let i in attributes ) {
                attrHooked = false;
                ii = buffers.length;
                buffer = buffers[ attributes[ i ].type ];
                attr = attributes[ i ];

                if ( buffer ) {
                    attrHooked = true;
                    gl.bindBuffer( gl.ARRAY_BUFFER, buffer.buffer );
                    gl.vertexAttribPointer( attr.location, buffer.elementSize, gl.FLOAT, false, 0, 0 );

                    if ( !activeAttributes[ attr.location ] || activeAttributes[ attr.location ] === false ) // Optimization
                        gl.enableVertexAttribArray( attr.location );

                    activeAttributes[ attr.location ] = true;
                }
                else {
                    if ( !activeAttributes[ attr.location ] || activeAttributes[ attr.location ] === true ) // Optimization
                        gl.disableVertexAttribArray( attr.location );

                    activeAttributes[ attr.location ] = false;
                }
            }
        }

		/**
		* Sets the rendering viewport size as well as optionally setting the canvas's size
		* @param {number} width The new width
		* @param {number} height The new height
		* @param {boolean} updateStyle If true, the canvas object will be resized to the new dimensions as well.
		*/
        setSize( width: number, height: number, updateStyle: boolean = true ) {
            this._resizeId++;
            const pixelRatio = 1;
            const canvas = this._canvas;
            canvas.width = width * pixelRatio;
            canvas.height = height * pixelRatio;
            this._width = width;
            this._height = height;

            if ( updateStyle !== false ) {
                canvas.style.width = width + 'px';
                canvas.style.height = height + 'px';
            }

            this._defaultPassCollection.setSize( width, height );

            //  for ( let i= 0, l = this._allPasses.length; i < l; i++ )
            //      this._allPasses[i].resize( width, height  );

            this.setViewport( 0, 0, canvas.width, canvas.height );
        }

		/**
		* Called when we have a new material that needs to be sent to the GPU.
		* Essentially prepares the renderer with the material properties.
		* @param {MaterialMulti} mat The material drawing the current geometry
		*/
        setupNewMaterial( mat: MaterialMulti ) {
            const gl: WebGLRenderingContext = this._glContext;
            let prevCullMode: CullFormat = this._prevCullMode;
            let prevDepthWrite: boolean = this._prevDepthWrite;
            let prevDepthRead: boolean = this._prevDepthRead;

            const preBlendMode: BlendMode = this._preBlendMode;
            const preBlendEquation: BlendEquation = this._preBlendEquation;
            const preBlendSourceFactor: PixelFactor = this._preBlendSourceFactor;
            const preBlendDestFactor: PixelFactor = this._preBlendDestFactor;
            const prevLineWidth: number = this._preLineWidth;

            if ( mat instanceof MaterialLine && prevLineWidth !== ( <MaterialLine>mat ).lineWidth ) {
                gl.lineWidth(( <MaterialLine>mat ).lineWidth );
            }

            // Blending functions
            if ( preBlendMode !== mat.blendMode || preBlendSourceFactor !== mat.sourceFactor || preBlendDestFactor !== mat.destinationFactor ) {
                if ( preBlendMode !== mat.blendMode ) {
                    if ( mat.blendMode !== BlendMode.None ) {
                        gl.enable( gl.BLEND );

                        if ( preBlendSourceFactor !== mat.sourceFactor || preBlendDestFactor !== mat.destinationFactor ) {
                            gl.blendFunc( getGLParam( mat.sourceFactor, gl ), getGLParam( mat.destinationFactor, gl ) );
                            this._preBlendSourceFactor = mat.sourceFactor;
                            this._preBlendDestFactor = mat.destinationFactor;
                        }

                        if ( preBlendEquation !== mat.blendEquation ) {
                            gl.blendEquation( getGLParam( mat.blendEquation, gl ) );
                            this._preBlendEquation = mat.blendEquation;
                        }
                    }
                    else
                        gl.disable( gl.BLEND );
                }

                this._preBlendMode = mat.blendMode;
            }

            // Culling
            if ( prevCullMode !== mat.cullMode ) {
                if ( mat.cullMode === CullFormat.None ) {
                    if ( prevCullMode !== CullFormat.None )
                        gl.disable( gl.CULL_FACE );
                }
                else {
                    if ( prevCullMode === CullFormat.None )
                        gl.enable( gl.CULL_FACE );

                    gl.cullFace( getGLParam( mat.cullMode, gl ) );
                }

                prevCullMode = mat.cullMode;
            }

            // Depth write
            if ( prevDepthWrite !== mat.depthWrite ) {
                gl.depthMask( mat.depthWrite );
                prevDepthWrite = mat.depthWrite;
            }
            // Depth read
            if ( prevDepthRead !== mat.depthRead ) {
                if ( mat.depthRead )
                    gl.enable( gl.DEPTH_TEST );
                else
                    gl.disable( gl.DEPTH_TEST );

                prevDepthRead = mat.depthRead;
            }

            this._prevCullMode = prevCullMode;
            this._prevDepthWrite = prevDepthWrite;
            this._prevDepthRead = prevDepthRead;
        }

		/**
		* Sets the shader uniforms on a given mesh and its material
		* @param {MaterialMulti} mat The material drawing the current geometry
		* @param {Mesh} mesh The mesh being drawn
		* @param {WebGLRenderingContext} gl The context
		* @param {boolean} isNewMaterial The true if this material is different from the last
		* @param {Camera} camera The camera used to draw the scene
		* @param {RenderTarget} renderTarget The optional target we are drawing to
		* @returns {boolean} If the function returns false, then the mesh should not be drawn
		*/
        setupUniforms( mat: MaterialMulti, mesh: Mesh, gl: WebGLRenderingContext, isNewMaterial: boolean, camera: Camera, renderTarget: RenderTarget ): boolean {
            // Set each of the uniforms
            this._curTextureUnit = 0;
            const geometry = mesh.geometry,
                hasNormals = ( geometry.buffers[ AttributeType.NORMAL ] && mat._attributes[ AttributeType.NORMAL ] ? true : false ),
                textureSlot = this._texSlotMap,
                projectionMatrix: Matrix4 = camera.projectionMatrix,
                invProjectionMatrix: Matrix4 = camera.projectionInverseMatrix,
                viewMatrix: Matrix4 = camera.matrixWorldInverse,
                tex0: number = gl.TEXTURE0,
                texSlotArray = this._texSlotArray,
                uniforms: { [ name: string ]: UniformVar } = mat._uniforms,
                passCollection = this._currentPassCollection,
                curCube = this._curCube;

            let texture: Texture,
                textures: Array<Texture>,
                uniform: UniformVar,
                texSlot: number = 0,
                slot: number = 0;

            if ( mat.receivesShadows && !this._drawingMirrorPasses )
                this.setShadowUniforms( mat );

            for ( let ii in uniforms ) {
                uniform = uniforms[ ii ];

                // Increment the texture counter
                if ( uniform.type === UniformType.TEXTURE || uniform.type === UniformType.TEXTURE_CUBE )
                    this._curTextureUnit++;

                // These can only be updated if its a new material
                if ( isNewMaterial ) {
                    uniform.requiresUpdate = true;
                    switch ( uniform.name ) {
                        case 'viewWidth':
                            uniform.value = ( renderTarget ? renderTarget.width : this._width );
                            break;
                        case 'viewHeight':
                            uniform.value = ( renderTarget ? renderTarget.height : this._height );
                            break;
                        case 'time':
                            uniform.value += 0.01;
                            break
                        case 'time':
                            uniform.value = this._timeElapsed;
                            break;
                        case 'timeDelta':
                            uniform.value = this._timeDelta;
                            break;
                        case 'viewWidthHalf':
                            uniform.value = this._width / 2;
                            break;
                        case 'viewHeightHalf':
                            uniform.value = this._height / 2;
                            break;
                        case 'gBuffer2':
                            uniform.value = passCollection.gBuffer2Pass.renderTarget;
                            break;
                        case 'lightPass':
                            uniform.value = passCollection.lightPass.renderTarget;
                            break;
                        case 'compositionPass':
                            uniform.value = passCollection.compositionPass.renderTarget;
                            break;
                        case 'gBuffer':
                            uniform.value = passCollection.gBufferPass.renderTarget;
                            break;
                        case 'cameraPosition':
                            uniform.value = this._camPositionPos;
                            break;
                        case 'frustumCorners':
                            uniform.value = this._corners.cornerUniform;
                            break;
                        case 'cameraFar':
                            uniform.value = ( <any>camera ).far;
                            break;
                        case 'cameraNear':
                            uniform.value = ( <any>camera ).near;
                            break;
                    }
                }


                // If the uniform is a texture and it requires a build, then the uniform must be updated.
                if ( uniform.value instanceof TextureBase && ( <TextureBase>uniform.value ).requiresBuild )
                    uniform.requiresUpdate = true;

                // Fill the standard uniforms if present
                if ( uniform.name === 'projectionMatrix' ) {
                    if ( isNewMaterial || !uniform.value.equals( projectionMatrix ) ) {
                        gl.uniformMatrix4fv( uniform.location, false, projectionMatrix.elements );
                        uniform.value.copy( projectionMatrix );
                    }
                }
                else if ( uniform.name === 'invProjectionMatrix' ) {
                    if ( isNewMaterial || !uniform.value.equals( invProjectionMatrix ) ) {
                        gl.uniformMatrix4fv( uniform.location, false, invProjectionMatrix.elements );
                        uniform.value.copy( invProjectionMatrix );
                    }
                }
                else if ( uniform.name === 'modelViewMatrix' ) {
                    if ( isNewMaterial || !uniform.value.equals( mesh._modelViewMatrix ) ) {
                        gl.uniformMatrix4fv( uniform.location, false, mesh._modelViewMatrix.elements );
                        uniform.value.copy( mesh._modelViewMatrix );
                    }
                }
                else if ( uniform.name === 'viewMatrix' ) {
                    if ( isNewMaterial || !uniform.value.equals( viewMatrix ) ) {
                        gl.uniformMatrix4fv( uniform.location, false, viewMatrix.elements );
                        uniform.value.copy( viewMatrix );
                    }
                }
                else if ( uniform.name === 'modelMatrix' ) {
                    if ( isNewMaterial || !uniform.value.equals( mesh.worldMatrix ) ) {
                        gl.uniformMatrix4fv( uniform.location, false, mesh.worldMatrix.elements );
                        uniform.value.copy( mesh.worldMatrix );
                    }
                }
                else if ( hasNormals && uniform.name === 'normalMatrix' ) {
                    if ( isNewMaterial || !uniform.value.equals( mesh._normalMatrix ) ) {
                        gl.uniformMatrix3fv( uniform.location, false, mesh._normalMatrix.elements );
                        uniform.value.copy( mesh._normalMatrix );
                    }
                }
                else if ( uniform.requiresUpdate ) {
                    switch ( uniform.type ) {
                        case UniformType.MAT4:
                            gl.uniformMatrix4fv( uniform.location, false, ( <Matrix4>uniform.value ).elements );
                            break;
                        case UniformType.MAT3:
                            gl.uniformMatrix3fv( uniform.location, false, ( <Matrix3>uniform.value ).elements );
                            break;
                        case UniformType.MAT4_ARRAY:
                            gl.uniformMatrix4fv( uniform.location, false, ( <UniformArray<Matrix4>>uniform.value ).getElements );
                            break;
                        case UniformType.MAT3_ARRAY:
                            gl.uniformMatrix3fv( uniform.location, false, ( <UniformArray<Matrix3>>uniform.value ).getElements );
                            break;
                        case UniformType.INT:
                            gl.uniform1i( uniform.location, ( <number>uniform.value ) );
                            break;
                        case UniformType.INT_ARRAY:
                            gl.uniform1iv( uniform.location, ( <Array<number>>uniform.value ) );
                            break;
                        case UniformType.FLOAT:
                            gl.uniform1f( uniform.location, uniform.value );
                            break;
                        case UniformType.FLOAT_ARRAY:
                            gl.uniform1fv( uniform.location, ( <Array<number>>uniform.value ) );
                            break;
                        case UniformType.FLOAT2:
                        case UniformType.FLOAT2_ARRAY:
                            gl.uniform2fv( uniform.location, uniform.value.getElements );
                            break;
                        case UniformType.FLOAT3:
                        case UniformType.FLOAT3_ARRAY:
                            gl.uniform3fv( uniform.location, uniform.value.getElements );
                            break;
                        case UniformType.FLOAT4:
                        case UniformType.FLOAT4_ARRAY:
                            gl.uniform4fv( uniform.location, uniform.value.getElements );
                            break;
                        case UniformType.COLOR3:
                            gl.uniform3fv( uniform.location, uniform.value.getElements );
                            break;
                        case UniformType.QUAT:
                            gl.uniform4fv( uniform.location, uniform.value.getElements );
                            break;
                        case UniformType.TEXTURE:
                        case UniformType.TEXTURE_CUBE:

                            texSlot = this._curTextureUnit - 1;

                            slot = tex0 + texSlot;
                            texture = <Texture>uniform.value;

                            if ( !texture )
                                break;

                            // If the mesh uses a render target cube and its currently active - then it cant be drawn
                            if ( uniform.type === UniformType.TEXTURE_CUBE && uniform.value === curCube )
                                return false;

                            // If the current slot already has this texture assigned - we can ignore it.
                            if ( isNewMaterial || ( textureSlot[ texSlot ] !== texture.webglTexture || texture.requiresBuild ) ) {
                                if ( texture.requiresBuild )
                                    texture.compile( gl, slot );

                                // Update the texture map
                                textureSlot[ texSlot ] = texture.webglTexture;

                                gl.activeTexture( slot );
                                if ( uniform.type === UniformType.TEXTURE )
                                    gl.bindTexture( gl.TEXTURE_2D, texture.webglTexture );
                                else
                                    gl.bindTexture( gl.TEXTURE_CUBE_MAP, texture.webglTexture );

                                gl.uniform1i( uniform.location, texSlot );
                            }
                            break;

                        case UniformType.TEXTURE_ARRAY:

                            textures = <Array<Texture>>uniform.value;
                            texSlotArray.splice( 0, texSlotArray.length );

                            for ( let i = 0, l = textures.length; i < l; i++ ) {
                                // Increment the texture counter
                                this._curTextureUnit++;

                                texSlot = this._curTextureUnit - 1;

                                slot = tex0 + texSlot;
                                texture = textures[ i ];

                                if ( !texture )
                                    break;

                                texSlotArray.push( texSlot );

                                // If the current slot already has this texture assigned - we can ignore it.
                                if ( isNewMaterial || ( textureSlot[ texSlot ] !== texture.webglTexture || texture.requiresBuild ) ) {
                                    if ( texture.requiresBuild )
                                        texture.compile( gl, slot );

                                    // Update the texture map
                                    textureSlot[ texSlot ] = texture.webglTexture;

                                    gl.activeTexture( slot );
                                    gl.bindTexture( gl.TEXTURE_2D, texture.webglTexture );
                                }
                            }

                            if ( texSlotArray.length > 0 )
                                gl.uniform1iv( uniform.location, texSlotArray );

                            break;
                    }
                }

                uniform.requiresUpdate = false;
            }

            return true;
        }

		/**
		* Tells the renderer to create & show a statistic popup with details of the scene
		*/
        showStatsPopup() {
            if ( !this._statPopup ) {
                this._statPopup = document.createElement( 'div' );
                this._statPopup.style.width = '100px';
                this._statPopup.style.height = '100px';
                this._statPopup.style.backgroundColor = 'rgba(0,0,0,0.5)';
                this._statPopup.style.color = '#fff';
                this._statPopup.innerHTML = 'FPS: ';
                this._statPopup.style.position = 'absolute';
                this._statPopup.style.left = '0';
                this._statPopup.style.right = '0';
            }

            // Add stats to the parent of the canvas
            this._canvas.parentElement.style.position = 'relative';
            this._canvas.parentElement.insertBefore( this._statPopup, this._canvas );
        }

		/**
		* Sets the viewable area on the screen to which we will render
		* @param {number} x The x position
		* @param {number} y The y position
		* @param {number} width The viewport width
		* @param {number} height The viewport height
		*/
        setViewport( x?: number, y?: number, width?: number, height?: number ) {
            const canvas = this._canvas;
            x = x !== undefined ? x : 0;
            y = y !== undefined ? y : 0;

            width = width !== undefined ? width : canvas.width;
            height = height !== undefined ? height : canvas.height;

            this._width = width;
            this._height = height;
            this._x = x;
            this._y = y;

            const curViewport = this._viewport;
            if ( x !== curViewport.x || y !== curViewport.y || width !== curViewport.width || height !== curViewport.height ) {
                this._glContext.viewport( x, y, width, height );
                curViewport.x = x;
                curViewport.y = y;
                curViewport.height = height;
                curViewport.width = width;
            }
        }

		/**
		* Sets up GL to draw to a render target
		* @param {RenderTarget} renderTarget The renderTarget we are drawing to
		*/
        setRenderTarget( renderTarget: RenderTarget ): boolean {
            const gl: WebGLRenderingContext = this._glContext;

            // First see if we need to setup the buffers of the render target
            if ( renderTarget && renderTarget.requiresBuild ) {
                if ( !renderTarget.compile( gl ) ) {
                    this._errors = 'Could not create a render target with the texture type: ' + TextureType[ renderTarget.type ];
                    return false;
                }
            }

            if ( renderTarget instanceof RenderTargetCube && !renderTarget.frameBuffer )
                ( <RenderTargetCube>renderTarget ).activeCubeFace = ( <RenderTargetCube>renderTarget ).activeCubeFace;

            let framebuffer: WebGLFramebuffer,
                width: number,
                height: number,
                vx: number,
                vy: number;

            // Store the viewport co-ordinates for cases of where we have or have not got a buffer.
            if ( renderTarget ) {
                framebuffer = renderTarget.frameBuffer;

                width = renderTarget.width;
                height = renderTarget.height;

                vx = 0;
                vy = 0;
            }
            else {
                framebuffer = null;

                width = this._width;
                height = this._height;

                vx = this._x;
                vy = this._y;
            }

            // If the current buffer is not the same as the previous then call GL (optimisation)
            if ( framebuffer !== this._currentFramebuffer ) {
                gl.bindFramebuffer( gl.FRAMEBUFFER, framebuffer );

                const curViewport = this._viewport;
                if ( vx !== curViewport.x || vy !== curViewport.y || width !== curViewport.width || height !== curViewport.height ) {
                    gl.viewport( vx, vy, width, height );
                    curViewport.x = vx;
                    curViewport.y = vy;
                    curViewport.height = height;
                    curViewport.width = width;
                }

                this._currentFramebuffer = framebuffer;
            }

            return true;
        }

		/**
		* Cleans up the renderer
		*/
        dispose() {
            this._canvas = null;
            this._statPopup = null;
            this._glContext = null;
            this._clearColor = null;
            this._frustum = null;
            this._SSQ.dispose();
            this._defaultPassCollection.dispose();
            this._defaultPassCollection = null;
            this._currentPassCollection = null;

            this._prevProgram = null;
            this._prevMaterial = null;
            this._prevGeometry = null;
            this._texSlotMap = null;
            this._prevCullMode = null;
            this._texSlotMap = null;
            this._currentFramebuffer = null;
            this._viewport = null;
            this._activeAttributes = null;
            this._preBlendMode = null;
            this._preBlendEquation = null;
            this._preBlendSourceFactor = null;
            this._preBlendDestFactor = null;
            this._corners = null;
            this._screenPass.dispose();
            this._screenPass = null;
        }

		/**
		* Sets the clear color of the renderer
		* @param {Color} c
		*/
        set clearColor( c: Color ) {
            this._clearColor.copy( c );
            this._glContext.clearColor( c.r, c.g, c.b, this._clearAlpha );
        }

		/**
		* Gets the clear color of the renderer
		* @returns {Color}
		*/
        get clearColor(): Color { return this._clearColor; }

		/**
		* Sets the alpha of the renderer
		* @param {number} a
		*/
        set clearAlpha( a: number ) {
            const c: Color = this._clearColor;
            this._clearAlpha = a;
            this._glContext.clearColor( c.r, c.g, c.b, a );
        }

		/**
		* Gets the alpha of the renderer
		* @returns {number} a
		*/
        get clearAlpha(): number { return this._clearAlpha; }

		/**
		* Clears a render target
		* @param {boolean} color If true the color buffer will be cleared
		* @param {boolean} depth If true the depth buffer will be cleared
		* @param {boolean} stencil If true the stencil buffer will be cleared
		*/
        clear( color: boolean, depth: boolean, stencil: boolean ) {
            let bits = 0;
            const gl: WebGLRenderingContext = this._glContext;

            if ( color === undefined || color ) bits |= gl.COLOR_BUFFER_BIT;
            if ( depth === undefined || depth ) bits |= gl.DEPTH_BUFFER_BIT;
            if ( stencil === undefined || stencil ) bits |= gl.STENCIL_BUFFER_BIT;

            gl.clear( bits );
        }

		/**
		* Sets if the renderer must draw to the depth buffer
		* @param {boolean} val
		*/
        set depthTest( val: boolean ) {
            if ( val )
                this._glContext.enable( this._glContext.DEPTH_TEST );
            else
                this._glContext.disable( this._glContext.DEPTH_TEST );

            this._depthTest = val;
        }

		/**
		* Gets if the renderer must draw to the depth buffer
		* @returns {boolean}
		*/
        get depthTest(): boolean { return this._depthTest; }

		/**
		* Gets the error log string. Useful for initialization errors.
		* @returns {string}
		*/
        get errors(): string { return this._errors; }

		/**
		* Gets the rendering context
		* @returns {WebGLRenderingContext}
		*/
        get glContext(): WebGLRenderingContext { return this._glContext; }

		/**
		* Gets the canvas element this renderer is drawing to.
		* @returns {HTMLCanvasElement}
		*/
        get canvas(): HTMLCanvasElement { return this._canvas; }

		/**
		* Gets the quad scene. This is useful for drawing screen quad scenes
		* @returns {SceneScreenQuad}
		*/
        get ssq(): SceneScreenQuad { return this._SSQ; }

		/*
		* Gets the current frames per second
		* @returns {number}
		*/
        get fps(): number { return this._FPS; }

		/*
		* Gets the number of items rendered in the last frame
		* @returns {number}
		*/
        get renderCount(): number { return this._renderCount; }

		/*
		* Gets the default pass collection of this renderer
		* @returns {PassCollection}
		*/
        get defaultCollection(): PassCollection { return this._defaultPassCollection; }

		/*
		* Gets the current pass collection of this renderer
		* @returns {PassCollection}
		*/
        get currentCollection(): PassCollection { return this._currentPassCollection; }

		/**
		* Gets the width of the renderer
		* @returns {number}
		*/
        get width(): number { return this._width; }

		/**
		* Gets the height of the renderer
		* @returns {number}
		*/
        get height(): number { return this._height; }
    }
}