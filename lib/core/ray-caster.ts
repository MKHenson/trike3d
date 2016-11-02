namespace Trike {
	/**
	* A small helper class used when collecing data about intersections
	*/
    export class Intersection {
        public distance: number;
        public point: Vec3;
        public face: Face3;
        public object: Object3D;

        constructor( distance: number, point: Vec3, face: Face3, object: Object3D ) {
            this.distance = distance;
            this.point = point;
            this.face = face;
            this.object = object;
        }
    }


    /** Internal only - used in the array loops below */
    class Triangle {
        public face: Face3;
        public a: Vec3;
        public b: Vec3;
        public c: Vec3;

        constructor( a: Vec3, b: Vec3, c: Vec3, face: Face3 = null ) {
            this.a = a;
            this.b = b;
            this.c = c;
            this.face = face;
        }
    }

	/**
	* A helper class which creates a Ray and uses it to test for intersections with objects.
	*/
    export class RayCaster {
        private static _precision: number = 0.0001;
        private static _linePrecision: number = 0.1;
        private static _trianglePool: Array<Triangle>;
        private static _numCasters: number = 0;

        public ray: Ray;
        public near: number;
        public far: number;

        private _sphere: Sphere;
        private _localRay: Ray;
        private _matrixPosition: Matrix4;
        private _inverseMatrix: Matrix4;

        // Sprite optimisations
        private _tempPos: Vec3;
        private _tempScale: Vec3;
        private _alignedPosition: Vec2;
        private _rotatedPosition: Vec2;
        private _finalPosition: Vec3;
        private _transformedVerts: Array<Vec3>;
        private _projector: Projector;

        constructor( origin: Vec3, direction: Vec3, near: number = 0, far: number = Infinity ) {
            this._sphere = new Sphere();
            this._localRay = new Ray();
            this._matrixPosition = new Matrix4();
            this._inverseMatrix = new Matrix4();
            this._tempPos = new Vec3();
            this._tempScale = new Vec3();

            this._alignedPosition = new Vec2();
            this._rotatedPosition = new Vec2();
            this._finalPosition = new Vec3();
            this._transformedVerts = Array<Vec3>();
            this._projector = new Projector();

            // direction is assumed to be normalized (for accurate distance calculations)
            this.ray = new Ray( origin, direction );
            this.near = near || 0;
            this.far = far || Infinity;

            if ( RayCaster._numCasters === 0 ) {
                RayCaster._trianglePool = new Array<Triangle>();
                RayCaster._numCasters++;
            }
        }

        /** Sort the intersections based on distance */
        private descSort( a: Intersection, b: Intersection ): number {
            return a.distance - b.distance;
        }

        unprojectSpriteVector( vector: Vec3, camera: Camera, sprite: Sprite ): Vec3 {
            const mvInv: Matrix4 = new Matrix4().getInverse( sprite.worldMatrix ).multiply( camera.worldMatrix );

            const projectionMatrixInverse: Matrix4 = new Matrix4().getInverse( camera.projectionMatrix );

            const viewProjInv: Matrix4 = new Matrix4().multiplyMatrices( mvInv, projectionMatrixInverse );

            return vector.applyProjection( viewProjInv );
        }

		/**
		* Returns an array of Intersections made between this and the object3d provided.
		*/
        intersectObject( object: Object3D, intersects: Array<Intersection>, camera: Camera ) {
            const sphere = this._sphere;
            const localRay = this._localRay;
            const matrixPosition = this._matrixPosition;
            const inverseMatrix = this._inverseMatrix;
            const ray: Ray = this.ray;
            const precision = RayCaster._precision;
            let linePrecision = RayCaster._linePrecision;
            let intersectionPoint: Vec3;
            const numIntersects = intersects.length;

            // Check for picking with sprites
            if ( object instanceof Sprite ) {
                const sprite: Sprite = <Sprite>object;

                if ( !sprite.pickable )
                    return;

                const spriteMat: MaterialSprite = <MaterialSprite>sprite.material;

                // If no material then the sprite is not visible.
                if ( !spriteMat )
                    return;

                // First check if we're intersecting the sprite sphere BB (much cheaper calc)
                const geometry: Geometry = sprite._geometry;
                sphere.copy( geometry.boundingSphere );
                sphere.applyMatrix4( sprite.worldMatrix );

                if ( ray.isIntersectionSphere( sphere ) === false )
                    return intersects;

                // First get some temp vars to speed up the process

                const temoPos: Vec3 = this._tempPos;
                const tempScale = this._tempScale;
                let alignedPosition = this._alignedPosition;
                const rotatedPosition = this._rotatedPosition;
                let finalPosition = this._finalPosition;
                const rotation: number = spriteMat.rotation();
                const verts: Array<Vec3> = geometry.buffers[ AttributeType.POSITION ].data;
                const transformedVerts: Array<Vec3> = this._transformedVerts;
                const projector: Projector = this._projector;

                // Get the world position and scale of the sprite
                tempScale.getScaleFromMatrix( object.worldMatrix );

                // Now for each vertex, we apply the same formula thats applied to the vert in the vertex shader.
                for ( let i: number = 0, len = verts.length; i < len; i++ ) {
                    alignedPosition = alignedPosition.set( verts[ i ].x, verts[ i ].y ).multiply2( tempScale.x, tempScale.y );
                    rotatedPosition.x = Math.cos( rotation ) * alignedPosition.x - Math.sin( rotation ) * alignedPosition.y;
                    rotatedPosition.y = Math.sin( rotation ) * alignedPosition.x + Math.cos( rotation ) * alignedPosition.y;

                    finalPosition = finalPosition.set( 0.0, 0.0, 0.0 ).applyMatrix4( sprite._modelViewMatrix );
                    finalPosition.x += rotatedPosition.x;
                    finalPosition.y += rotatedPosition.y;

                    if ( !transformedVerts[ i ] )
                        transformedVerts[ i ] = new Vec3();

                    transformedVerts[ i ].set( finalPosition.x, finalPosition.y, finalPosition.z ).applyProjection( camera.projectionMatrix );

                    // At the moment the vert position is in normalized screen space coordinates - facing the camera

                    // Now lets unproject those normalized coords back into the world so we can pick against the rotated new values
                    transformedVerts[ i ] = projector.unprojectVector( transformedVerts[ i ], camera );
                }

                // Two faces in a quad
                for ( let i: number = 0; i < 2; i++ ) {
                    const face: Face3 = geometry.faces[ i ];
                    const intersectionPoint: Vec3 = ray.intersectTriangle(
                        transformedVerts[ face.a ],
                        transformedVerts[ face.b ],
                        transformedVerts[ face.c ], true );

                    if ( !intersectionPoint )
                        continue;

                    const distance: number = ray.origin.distanceTo( intersectionPoint );

                    if ( distance < precision || distance < this.near || distance > this.far )
                        continue;

                    intersects.push( new Intersection( distance, intersectionPoint, face, sprite ) );
                }
            }
            // If its a terrain then test using its internal picker
            else if ( object instanceof Terrain ) {
                const terrain: Terrain = <Terrain>object;
                const intersection: Intersection = terrain.picker().intersectRay( ray );
                if ( intersection )
                    intersects.push( intersection );
            }
            // Check for regular meshes
            else if ( object instanceof Mesh ) {
                const mesh: Mesh = <Mesh>object;
                if ( !mesh.pickable )
                    return;

                if ( !mesh.geometry || !mesh.material )
                    return;

                const geometry = mesh.geometry;
                const mat: MaterialMulti = mesh.material;

                if ( !geometry && !mat )
                    return intersects;

                sphere.copy( geometry.boundingSphere );
                sphere.applyMatrix4( object.worldMatrix );

                if ( ray.isIntersectionSphere( sphere ) === false )
                    return intersects;

                // The reason we get the inverse is ray is because the alternative would be
                // the multiply every single vertex by the world matrix. Instead of doing that
                // we take the ray and multiply it by the inverse world matrix so that its in the object's
                // coordinate system and we dont have to multiply each vert.
                inverseMatrix.getInverse( object.worldMatrix );
                localRay.copy( ray ).applyMatrix4( inverseMatrix );



                // Test line geometry using segment tests
                if ( geometry instanceof GeometryLine ) {
                    const geomLines: GeometryLine = <GeometryLine>geometry;
                    const verts: Array<Vec3> = geometry.buffers[ AttributeType.POSITION ].data;
                    const interSegment = new Vec3();
                    const interRay = new Vec3();
                    const step = ( geomLines.lineMode === LineMode.HeadToTail || geomLines.lineMode === LineMode.HeadToTailClosed ? 1 : 2 );

                    for ( let i = 0, len: number = verts.length - 1; i < len; i = i + step ) {
                        const distSq = localRay.distanceSqToSegment( verts[ i ], verts[ i + 1 ], interRay, interSegment );

                        if ( distSq > linePrecision )
                            continue;

                        const distance = localRay.origin.distanceTo( interRay );

                        if ( distance < this.near || distance > this.far )
                            continue;

                        intersects.push( new Intersection( distance,
                            // What do we want? intersection point on the ray or on the segment??
                            // point: raycaster.ray.at( distance ),
                            interSegment.clone().applyMatrix4( object.worldMatrix ),
                            null,
                            object
                        ) );
                    }
                }
                // Check for point clouds
                else if ( object instanceof PointCloud ) {
                    // Test the bounding box
                    if ( localRay.isIntersectionBox( geometry.boundingBox ) === false )
                        return intersects;

                    const cloud: PointCloud = <PointCloud>mesh;
                    const verts: Array<Vec3> = geometry.buffers[ AttributeType.POSITION ].data;
                    const sizes: Array<number> = ( ( <PointCloud>object ).particleSizesEnabled ? geometry.buffers[ AttributeType.SCALE ].data : null );
                    const scale = cloud.particleScale * 0.4; // The 0.4 is a rough estimate

                    for ( let i = 0, l: number = verts.length; i < l; i++ ) {
                        const distanceToPoint: number = localRay.distanceToPoint( verts[ i ] );
                        if ( distanceToPoint < scale * ( sizes ? sizes[ i ] : 1 ) ) {
                            intersectionPoint = localRay.closestPointToPoint( verts[ i ] );
                            intersectionPoint.applyMatrix4( mesh.worldMatrix );

                            const distance = ray.origin.distanceTo( intersectionPoint );
                            intersects.push( new Intersection( distance, intersectionPoint, null, object ) );
                        }
                    }
                }
                else {
                    // Test the bounding box
                    if ( localRay.isIntersectionBox( geometry.boundingBox ) === false )
                        return intersects;


                    // Get all the vertices of the mesh
                    const triangles: Array<Triangle> = RayCaster._trianglePool;
                    const verts: Array<Vec3> = geometry.buffers[ AttributeType.POSITION ].data;

                    // If we are using faces then we store the verts by index as well as the face.
                    // If not, we simply use the verts stored in the buffer.

                    let numTriangles: number = 0;

                    if ( geometry.faces && geometry.faces.length > 0 ) {
                        numTriangles = geometry.faces.length;
                        for ( let i: number = 0, len = geometry.faces.length; i < len; i++ ) {
                            if ( triangles.length < len )
                                triangles.push( new Triangle( verts[ geometry.faces[ i ].a ], verts[ geometry.faces[ i ].b ], verts[ geometry.faces[ i ].c ], geometry.faces[ i ] ) );
                            else {
                                triangles[ i ].a = verts[ geometry.faces[ i ].a ];
                                triangles[ i ].b = verts[ geometry.faces[ i ].b ];
                                triangles[ i ].c = verts[ geometry.faces[ i ].c ];
                                triangles[ i ].face = geometry.faces[ i ];
                            }
                        }
                    }
                    else {
                        numTriangles = verts.length / 3;
                        let tCount: number = 0;
                        for ( let i: number = 0, len = verts.length; i < len; i += 3 ) {
                            if ( i + 2 >= len )
                                continue;

                            if ( triangles.length < len )
                                triangles.push( new Triangle( verts[ i ], verts[ i + 1 ], verts[ i + 2 ], null ) );
                            else {
                                triangles[ tCount ].a = verts[ i ];
                                triangles[ tCount ].b = verts[ i + 1 ];
                                triangles[ tCount ].c = verts[ i + 2 ];
                                triangles[ tCount ].face = null;
                            }

                            tCount++;
                        }
                    }

                    // Check if its back facing or not
                    let backFacing: boolean = true;
                    if ( mat && mat.cullMode !== CullFormat.Back )
                        backFacing = false;

                    // Go through each triangle stored in the array and check
                    // if it intersects with the ray.

                    for ( let i: number = 0; i < numTriangles; i++ ) {
                        const t: Triangle = triangles[ i ];
                        intersectionPoint = localRay.intersectTriangle( t.a, t.b, t.c, backFacing );

                        if ( !intersectionPoint )
                            continue;

                        intersectionPoint.applyMatrix4( mesh.worldMatrix );

                        const distance: number = ray.origin.distanceTo( intersectionPoint );

                        if ( distance < precision || distance < this.near || distance > this.far )
                            continue;

                        intersects.push( new Intersection( distance, intersectionPoint, t.face, object ) );
                    }
                }
            }

            if ( numIntersects !== intersects.length )
                intersects.sort( this.descSort );
        }

		/**
		* Gets an array of possible intersections of this ray caster and the object and its children
		*/
        intersectDescendants( object: Object3D, intersects: Array<Intersection>, camera: Camera ) {
            const descendants: Array<Object3D> = object.getAllChildren();

            for ( let i = 0, l = descendants.length; i < l; i++ )
                this.intersectObject( descendants[ i ], intersects, camera );
        }


		/**
		* Sets the origin and direction of this caster. Direction is assumed to be normalized (for accurate distance calculations)
		*/
        set( origin: Vec3, direction: Vec3 ): RayCaster {
            this.ray.set( origin, direction );
            return this;
        }

		/**
		* Gets an array of possible intersections of this ray caster and the objects provided in objects
		*/
        intersectObjects( objects: Array<Object3D>, camera: Camera, recursive: boolean = true ): Array<Intersection> {
            const intersects = new Array<Intersection>();

            for ( let i = 0, l = objects.length; i < l; i++ ) {
                this.intersectObject( objects[ i ], intersects, camera );

                if ( recursive === true )
                    this.intersectDescendants( objects[ i ], intersects, camera );
            }

            intersects.sort( this.descSort );
            return intersects;
        }

		/**
		* Cleans up the ray caster
		*/
        dispose() {
            this.ray = null;
            this._sphere = null;
            this._localRay = null;
            this._matrixPosition = null;
            this._inverseMatrix = null;
            this._tempPos = null;
            this._tempScale = null;
            this._alignedPosition = null;
            this._rotatedPosition = null;
            this._finalPosition = null;
            this._transformedVerts = null;
            this._projector = null;

            RayCaster._numCasters--;
            if ( RayCaster._numCasters === 0 ) {
                const pool = RayCaster._trianglePool;
                for ( let i = 0, len = pool.length; i < len; i++ ) {
                    pool[ i ].a = null;
                    pool[ i ].b = null;
                    pool[ i ].c = null;
                    pool[ i ].face = null;
                }
                RayCaster._trianglePool = null;
            }
        }
    }
}