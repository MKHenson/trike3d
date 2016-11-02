namespace Trike {
	/**
	* The base node for a 3D scene
	*/
    export class Scene extends Object3D {
        public allVisuals: Array<Mesh>;
        public meshes: Array<Mesh>;
        public pointClouds: Array<PointCloud>;
        public lights: Array<Light>;
        public skyboxes: Array<Skybox>;
        public mirrors: Array<Mirror>;
        public cubeRenderers: Array<CubeRenderer>;
        public convolvers: Array<CubeConvolver>;

        /** Lights that need to be rendered with screen quad*/
        public lightsFullScreen: Array<Light>;

        /** Lights that need to be rendered with the user camera */
        public lightsPerspective: Array<Light>;

        private _tempChildList: Array<Object3D>;

        constructor() {
            super();

            this.allVisuals = [];
            this.meshes = [];
            this.pointClouds = [];
            this.lights = [];
            this.skyboxes = [];
            this.mirrors = [];
            this.lightsFullScreen = [];
            this.lightsPerspective = [];
            this._tempChildList = [];
            this.cubeRenderers = [];
            this.convolvers = [];
        }

		/**
		* Adds a child to this object
		* @param {Object3D} child The child object to add
		*/
        add( child: Object3D ) {
            super.add( child );

            // For each object, we need to flatten it out and get the various
            // raw renderables & components of a scene render list.

            const temp = this._tempChildList;
            temp.splice( 0, temp.length );
            child.getAllChildren( temp );

            for ( let i = 0, ilen = temp.length; i < ilen; i++ )
                this._addObject( temp[ i ], false );

            this.allVisuals.sort( this.sortObjects );

            // Cleanup
            temp.splice( 0, temp.length );
        }

		/**
		* Called from Object3D - friend class - adds the object to the scene's array lists
		* @param {Object3D} o3D The child object to add
		* @param {boolean} sort If true, the mesh arrays will be sorted
		*/
        _addObject( o3D: Object3D, sort: boolean = true ) {
            const allVisuals = this.allVisuals,
                lights = this.lights,
                meshes = this.meshes,
                skyboxes = this.skyboxes,
                pointClouds = this.pointClouds,
                mirrors = this.mirrors,
                cubeRenderers = this.cubeRenderers,
                convolvers = this.convolvers;

            // Light
            if ( o3D instanceof Light ) {
                if ( lights.indexOf( <Light>o3D ) === -1 ) {
                    lights.push( <Light>o3D );

                    if ( o3D instanceof LightPoint )
                        this.lightsPerspective.push( <Light>o3D );
                    else
                        this.lightsFullScreen.push( <Light>o3D );
                }
            }
            // Point Clouds
            else if ( o3D instanceof PointCloud ) {
                if ( pointClouds.indexOf( <PointCloud>o3D ) === -1 )
                    pointClouds.push( <PointCloud>o3D );
            }
            // Cube renderer
            else if ( o3D instanceof CubeRenderer ) {
                if ( cubeRenderers.indexOf( o3D ) === -1 )
                    cubeRenderers.push( o3D );
            }
            // Cube convolver
            else if ( o3D instanceof CubeConvolver ) {
                if ( convolvers.indexOf( o3D ) === -1 )
                    convolvers.push( o3D );
            }
            // Skybox
            else if ( o3D instanceof Skybox ) {
                if ( skyboxes.indexOf( <Skybox>o3D ) === -1 )
                    skyboxes.push( <Skybox>o3D );
            }
            // Mesh
            else if ( o3D instanceof Mesh ) {
                if ( meshes.indexOf( <Mesh>o3D ) === -1 )
                    meshes.push( <Mesh>o3D );
            }

            if ( o3D instanceof Mesh ) {
                if ( allVisuals.indexOf( <Mesh>o3D ) === -1 )
                    allVisuals.push( <Mesh>o3D );
            }

            // Mirrors
            if ( ( <IMirrorMesh><any>o3D ).mirror ) {
                if ( ( <IMirrorMesh><any>o3D ).mirror && mirrors.indexOf(( <IMirrorMesh><any>o3D ).mirror ) === -1 )
                    mirrors.push(( <IMirrorMesh><any>o3D ).mirror );
            }

            if ( sort )
                allVisuals.sort( this.sortObjects );
        }

		/**
		* Called from Object3D - friend class - removes the object from the scene's array lists
		* @param {Object3D} o3D The child object to add
		* @param {boolean} sort If true, the mesh arrays will be sorted
		*/
        _removeObject( o3D: Object3D, sort: boolean = true ) {
            const allVisuals = this.allVisuals,
                lights = this.lights,
                meshes = this.meshes,
                skyboxes = this.skyboxes,
                pointClouds = this.pointClouds,
                mirrors = this.mirrors,
                cubeRenderers = this.cubeRenderers,
                convolvers = this.convolvers;

            // Lights
            if ( o3D instanceof Light && lights.indexOf( <Light>o3D ) !== -1 ) {
                lights.splice( lights.indexOf( <Light>o3D ), 1 );

                if ( o3D instanceof LightPoint )
                    this.lightsPerspective.splice( this.lightsPerspective.indexOf( <Light>o3D ), 1 );
                else
                    this.lightsFullScreen.splice( this.lightsFullScreen.indexOf( <Light>o3D ), 1 );
            }
            // Point Clouds
            else if ( o3D instanceof PointCloud && pointClouds.indexOf( <PointCloud>o3D ) !== -1 )
                pointClouds.splice( pointClouds.indexOf( <PointCloud>o3D ), 1 );
            // Cube Renderers
            else if ( o3D instanceof CubeRenderer && cubeRenderers.indexOf( <CubeRenderer>o3D ) !== -1 )
                cubeRenderers.splice( cubeRenderers.indexOf( <CubeRenderer>o3D ), 1 );
            // Convolvers
            else if ( o3D instanceof CubeConvolver && convolvers.indexOf( <CubeConvolver>o3D ) !== -1 )
                convolvers.splice( convolvers.indexOf( <CubeConvolver>o3D ), 1 );
            // Skybox
            else if ( o3D instanceof Skybox && skyboxes.indexOf( <Skybox>o3D ) !== -1 )
                skyboxes.splice( skyboxes.indexOf( <Skybox>o3D ), 1 );
            // Meshes
            else if ( o3D instanceof Mesh && meshes.indexOf( <Mesh>o3D ) !== -1 )
                meshes.splice( meshes.indexOf( <Mesh>o3D ), 1 );

            if ( o3D instanceof Mesh && allVisuals.indexOf( <Mesh>o3D ) !== -1 )
                allVisuals.splice( allVisuals.indexOf( <Mesh>o3D ), 1 );

            // Mirrors
            if ( ( <IMirrorMesh><any>o3D ).mirror )
                mirrors.splice( mirrors.indexOf(( <IMirrorMesh><any>o3D ).mirror ), 1 );

            if ( sort )
                allVisuals.sort( this.sortObjects );
        }



		/**
		* removes a child from this object
		* @param {Object3D} child The child object to remove
		*/
        remove( child: Object3D ) {
            super.remove( child );

            // Fpr each object, we need to remove any
            // raw renderables or components of a scene render list.

            const temp = this._tempChildList;

            child.getAllChildren( temp );

            const lights = this.lights,
                meshes = this.meshes;

            for ( let i = 0, ilen = temp.length; i < ilen; i++ )
                this._removeObject( temp[ i ], false );

            this.allVisuals.sort( this.sortObjects );

            // Cleanup
            temp.splice( 0, temp.length );
        }


		/**
		* Optimizes the scene by sorting the objects accordingly.
		*/
        sortObjects( a: Mesh, b: Mesh ): number {
            if ( a.geometry === b.geometry && a.material === b.material )
                return -1;
            else if ( a.geometry === b.geometry )
                return 0;
            else if ( a.material === b.material )
                return 0;
            else
                return 1;
        }
    }
}