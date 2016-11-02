namespace Trike {
	/**
	* A Mesh object which draws a geometry object using a material
	*/
    export class Mesh extends Object3D {
        /** Don't set the geometry directly. Use the setGeometry function instead */
        public _geometry: Geometry;

        /** Can this mesh be picked by rays */
        public pickable: boolean;
        public boundsReset: boolean;
        public _visible: boolean;
        public _worldSphere: Sphere;
        public _worldBox: Box3;
        public updateWorldSphere: boolean;
        public culled: boolean;
        public sceneCull: boolean;

        public buildNumber: number;


        protected _material: MaterialMulti;


        /** Set this to true to do custom culling using the isCulled function*/
        public customCulling: boolean;

		/**
		* Creates a Skybox instance
		* @param {MaterialMulti} material The material used with this mesh
		* @param {Geometry} geometry The geometry to use with this mesh
		*/
        constructor( material: MaterialMulti, geometry: Geometry ) {
            super();
            this._geometry = geometry;
            this._material = material;
            this.culled = false;
            this._worldSphere = new Sphere();
            this._worldBox = new Box3();
            this.updateWorldSphere = true;
            this._visible = true;
            this.pickable = true;
            this.boundsReset = false;
            this.customCulling = false;
            this.sceneCull = true;
            this.buildNumber = -1;
        }

		/**
		* Copies the values of the given mesh
		* @param {Mesh} mesh the mesh to copy from
		* @returns {Object3D}
		*/
        copy( mesh: Mesh ): Object3D {
            super.copy( mesh );

            this._geometry = mesh._geometry;
            this._material = mesh._material;
            this.culled = mesh.culled;
            this._worldSphere.copy( mesh._worldSphere );
            this._worldBox.copy( mesh._worldBox );
            this.updateWorldSphere = mesh.updateWorldSphere;
            this._visible = mesh._visible;
            this.pickable = mesh.pickable;
            this.boundsReset = mesh.boundsReset;
            this.customCulling = mesh.customCulling;
            this.sceneCull = mesh.sceneCull;
            return this;
        }

		/*
		* Called whenever the geometry is updated
		*/
        geometryUpdated( val: Geometry ) {
            this.updateWorldSphere = true;

            if ( !val )
                this.buildNumber = -1;
            else
                this.buildNumber = val.buildCount;
        }

		/*
		* This function is called when customCulling is true. You can perform your own scene culling
		* and return if an object should be culled or not.
		* @param {Camera} camera The camera used to render the scene
		* @param {Frustum} frustum The render target the scene is being drawn to
		* @returns {boolean} Returns false if the mesh must be drawn
		*/
        isCulled( camera: Camera, frustum: Frustum ): boolean { return false; }

		/*
		* This function is called after updating and culling. Its useful for objects
		* that need to sort any geometry before a render call.
		* @param {Camera} camera The camera used to render the scene
		*/
        sortGeometry( camera: Camera ) { }

		/*
		* Use this function to perform any pre-renders. Useful if an object needs to do its own render pass before a
		* the render call begins.
		* @param {Scene} scene The scene  being rendered
		* @param {Camera} camera The camera beinf used to render the scene
		* @param {RenderTarget} renderTarget The render target the scene is being drawn to
		* @param {Renderer} renderer The renderer being used to draw the scene
		* @param {boolean} Returns false if an error occurred
		*/
        prepRender( scene: Scene, camera: Camera, renderTarget?: RenderTarget, renderer?: Renderer ): boolean { return true; }

		/*
		* Use this function to perform any pre-renders (Called before the solid draws).
		* @param {Scene} scene The scene  being rendered
		* @param {Camera} camera The camera beinf used to render the scene
		* @param {RenderTarget} renderTarget The render target the scene is being drawn to
		* @param {Renderer} renderer The renderer being used to draw the scene
		* @param {boolean} Returns false if an error occurred
		*/
        prepRenderSolids( scene: Scene, camera: Camera, renderTarget?: RenderTarget, renderer?: Renderer ): boolean { return true; }

		/*
		* Called just before we render the mesh. The mesh would have passed culling and already be updated.
		* A good place to update custom uniforms.
		* @param {Renderer} renderer The renderer used to draw the scene
		* @param {RenderPass} renderPass The render pass associated with this call
		*/
        preRender( renderer: Renderer, renderPass: RenderPass ) { }

		/*
		* Called just after we render the mesh
		* @param {WebGLRenderingContext} gl The webgl context
		* @param {RenderPass} renderPass The render pass associated with this call
		*/
        postRender( gl: WebGLRenderingContext, renderPass: RenderPass ) { }

		/**
		* Updates the world matrix as well as updating the world sphere and bounding boxes.
		* @param {boolean} forceWorldUpdate If true, the world matrices will be forced to update
		* @param {boolean} forceLocalUpdate If true, the local matrices will be forced to update
		*/
        updateWorldMatrix( forceWorldUpdate: boolean = false, forceLocalUpdate: boolean = false ) {
            this.boundsReset = false;
            const geometry = this._geometry;

            if ( geometry ) {
                if ( forceWorldUpdate || this.updateMatrixWorld || this.updateMatrix || this.updateWorldSphere ) {
                    super.updateWorldMatrix( forceWorldUpdate, forceLocalUpdate );

                    this._worldSphere.copy( geometry.boundingSphere );
                    this._worldSphere.applyMatrix4( this.worldMatrix );

                    this._worldBox.copy( geometry.boundingBox );
                    this._worldBox.applyMatrix4( this.worldMatrix );

                    this.boundsReset = true;
                }
                else
                    super.updateWorldMatrix( forceWorldUpdate, forceLocalUpdate );
            }
            else
                super.updateWorldMatrix( forceWorldUpdate, forceLocalUpdate );
        }

		/**
		* Cleans up the object.
		*/
        dispose() {
            this._geometry = null;
            this._material = null;
            super.dispose();
        }

		/**
		* Use this function to replace the material of this mesh
		* @param {MaterialMulti} val
		*/
        setMaterial( val: MaterialMulti ) {
            this._material = val;
        }

		/**
		* Use this function to replace one geometry with another
		* @param {Geometry} val
		* @returns {boolean}
		*/
        setGeometry( val: Geometry ) {
            this._geometry = val;
            // this.updateWorldSphere = true;
            this.buildNumber = -1;
        }

		/**
		* Sets if the mesh is visible. This will propagate to all child nodes
		* @param {boolean} val
		*/
        set visible( val: boolean ) {
            this._visible = val;
            const children: Array<Object3D> = this.children;
            for ( let i = 0, len = children.length; i < len; i++ )
                if ( children[ i ] instanceof Mesh )
                    ( <Mesh>children[ i ] ).visible = val;
        }

		/**
		* Gets if the mesh is visible. This will propagate to all child nodes
		* @returns {boolean}
		*/
        get visible(): boolean { return this._visible; }

		/**
		* Gets the geometry of the mesh. If you want to set a new geometry then use the setGeometry function
		* @returns {Geometry}
		*/
        get geometry(): Geometry { return this._geometry; }

        /**
		* Gets the material associated with this mesh
		* @returns {MaterialMulti}
		*/
        get material(): MaterialMulti {
            return this._material;
        }
    }
}