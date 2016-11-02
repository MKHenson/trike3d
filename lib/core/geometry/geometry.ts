namespace Trike {
	/**
	* A simple holder class for geometry bone data. This is not the actual bone
	* attached to a mesh. This is simply a holder of the original data loaded in from files.
	*/
    export class BoneInfo {
        public name: string;
        public parent: number;
        public position: Array<number>;
        public rotation: Array<number>;
        public scale: Array<number>;

        constructor( pos: Array<number>, rotation: Array<number>, scale: Array<number>, name: string, parent: number ) {
            this.name = name;
            this.parent = parent;
            this.position = pos;
            this.rotation = rotation;
            this.scale = scale;
        }
    }

	/**
	* A buffer which correlates to a material attribute. Geometries can have multiple buffers and each must be
	* unique using the AttributeType to identify the buffer. Fill the data member with Vectors or
	* data then needs to be sent to the GPU. When being compiled the data variable is flattened out into a
	* single Float32Array called dataFlat. Rebuilding the geometry will often mean having to rebuild these
	* buffers.
	*/
    export class GeometryBuffer {
        public data: Array<any>;
        public dataFlat: Float32Array;
        public type: AttributeType;
        public elementSize: number;
        public buffer: WebGLBuffer;

        constructor( data: Array<any>, elementSize: number, type: AttributeType ) {
            this.data = data;
            this.elementSize = elementSize;
            this.type = type;
            this.buffer = null;
            this.dataFlat = null;
        }

		/**
		* Use this function to convert the data object to a flat Float32Array stored in the variable dataFlat
		* @param {Array<any>} flattenedData Optionally you can pass data instead of using the data stored in the buffer.
		*/
        flattenData( flattenedData?: Array<any> ) {
            const elmSize = this.elementSize;
            const data = ( flattenedData ? flattenedData : this.data );

            const df: Float32Array = new Float32Array( data.length * elmSize );
            let counter = 0;

            for ( let i = 0, len = data.length; i < len; i++ ) {
                if ( data[ i ] instanceof Vec2 ) {
                    df[ counter ] = data[ i ].x;
                    df[ counter + 1 ] = data[ i ].y;
                }
                else if ( data[ i ] instanceof Vec3 ) {
                    df[ counter ] = data[ i ].x;
                    df[ counter + 1 ] = data[ i ].y;
                    df[ counter + 2 ] = data[ i ].z;
                }
                else if ( data[ i ] instanceof Vec4 || data[ i ] instanceof Quat ) {
                    df[ counter ] = data[ i ].x;
                    df[ counter + 1 ] = data[ i ].y;
                    df[ counter + 2 ] = data[ i ].z;
                    df[ counter + 3 ] = data[ i ].w;
                }
                else if ( data[ i ] instanceof Color ) {
                    df[ counter ] = data[ i ].r;
                    df[ counter + 1 ] = data[ i ].g;
                    df[ counter + 2 ] = data[ i ].b;
                    df[ counter + 3 ] = data[ i ].a;
                }
                else if ( typeof ( data[ i ] ) === 'number' ) {
                    df[ counter ] = data[ i ];
                }
                else {
                    for ( let ii = 0, len2 = elmSize; ii < len2; ii++ )
                        df[ counter + ii ] = data[ i ][ ii ];
                }

                counter += elmSize;
            }

            this.dataFlat = df;
        }
    }

	/**
	* Holds the indices used to draw a mesh. These are generated from the faces of the geometry object.
	*/
    export class GeometryIndexBuffer {
        public data: Array<any>;
        public dataFlat: Uint32Array | Uint16Array;
        public elementSize: number;
        public buffer: WebGLBuffer;
        public glBufferType: WebGLBuffer;

        constructor( data?: Array<any> ) {
            this.data = data || [];
            this.elementSize = 1;
            this.buffer = null;
            this.dataFlat = null;
        }

		/**
		* Use this function to convert the data object to a flat Float32Array stored in the variable dataFlat
		*/
        flattenData( numTris: number ) {
            const data: Array<number> = this.data;

            // If the index buffer is very big, then we need to use a bigger buffer. Simply check the tri count
            // i.e. 65535 / 3
            if ( numTris > 21845 && Capabilities.getSingleton().uintIndices )
                this.dataFlat = new Uint32Array( data.length );
            else
                this.dataFlat = new Uint16Array( data.length );

            let df: ArrayBufferView = this.dataFlat;
            for ( let i = 0, len = data.length; i < len; i++ )
                df[ i ] = data[ i ];
        }
    }

    export enum BufferUsage {
        Static,
        Dynamic,
        Streaming
    }

	/**
	* The base class for all geometry. Every visual in a 3D scene requires some form of Geometry. You can either
	* use the class directly and add attribures & faces, or you can use some of the premade sub classes such as GeometryCube.
	*/
    export class Geometry extends Trike.EventDispatcher {
        public bones: Array<BoneInfo>;
        public animationSets: Array<AnimationTrack>;
        public compileStatus: string;
        public faces: Array<Face3>;
        public boundingSphere: Sphere;
        public boundingBox: Box3;
        public bufferUsage: BufferUsage;
        public buildCount: number;

        /** The number of bone influences for this geometry - the default is 2 */
        public numInfluences: number;

        private _requiresBuild: boolean;
        private _buffers: Array<GeometryBuffer>;
        private _numElements: number;
        private _usage: number;
        private _cleanup: Array<WebGLBuffer>;
        private _indexBuffer: GeometryIndexBuffer;
        private _indexBufferLines: GeometryIndexBuffer;
        private _positionRef;

        // Cache
        private _dataMap: Array<any>;

        public dirtyBuffers: Array<GeometryBuffer>;

        constructor() {
            super();

            this._requiresBuild = true;
            this.bufferUsage = BufferUsage.Static;

            this._buffers = new Array( 10 ); // There are 10 AttributeTypes
            for ( let i = 0; i < 10; i++ )
                this._buffers[ i ] = null;

            this._cleanup = [];
            this.faces = [];
            this._indexBuffer = null;
            this._indexBufferLines = null;
            this.compileStatus = '';
            this.boundingSphere = new Sphere();
            this.boundingBox = new Box3();
            this.numInfluences = 2;
            this.buildCount = 0;
            this.animationSets = new Array<AnimationTrack>();

            this.bones = new Array<BoneInfo>();
            this.dirtyBuffers = new Array<GeometryBuffer>();
            this._dataMap = [];
        }

		/**
		* Attempts to merge the provided geometry into this geometry's buffers. Try to make sure that all geometries you merge
		* should have the same number of buffers and buffer types
		* @param {Geometry} geom The geometry we are merging to this geometry
		* @returns {Geometry}
		*/
        mergGeometry( geom: Geometry ): Geometry {
            const buffers: Array<GeometryBuffer> = this._buffers;
            const animationSets: Array<AnimationTrack> = this.animationSets;
            const bones: Array<BoneInfo> = this.bones;
            const faces: Array<Face3> = this.faces;
            const newFaces: Array<Face3> = new Array<Face3>();

            for ( let i = 0, l = geom.faces.length; i < l; i++ ) {
                const newFace: Face3 = geom.faces[ i ].clone();
                newFaces.push( newFace );

                for ( const a in geom.faces[ i ].attributeIndices ) {
                    if ( !geom.faces[ i ].attributeIndices[ a ] )
                        continue;

                    if ( !buffers[ a ] )
                        continue;

                    // Get the current number of attribute items of that attribute type
                    const curSize: number = buffers[ a ].data.length;

                    newFace.attributeIndices[ a ][ 0 ] = newFace.attributeIndices[ a ][ 0 ] + curSize;
                    newFace.attributeIndices[ a ][ 1 ] = newFace.attributeIndices[ a ][ 1 ] + curSize;
                    newFace.attributeIndices[ a ][ 2 ] = newFace.attributeIndices[ a ][ 2 ] + curSize;
                }
            }

            for ( let i = 0, l = geom._buffers.length; i < l; i++ ) {
                if ( !geom._buffers[ i ] )
                    continue;

                if ( !buffers[ i ] )
                    buffers[ i ] = new GeometryBuffer( geom._buffers[ i ].data.slice( 0 ), geom._buffers[ i ].elementSize, geom._buffers[ i ].type );
                else
                    buffers[ i ].data.push.apply( buffers[ i ].data, geom._buffers[ i ].data );
            }

            animationSets.push.apply( animationSets, geom.animationSets );
            bones.push.apply( bones, geom.bones );
            faces.push.apply( faces, newFaces );



            this.computeFaceNormals();
            this.generateNormals();
            this.computeCentroids();
            // this.mergeVertices();



            this._requiresBuild = true;
            return this;
        }

		/**
		* Gets an animation set by its name
		* @returns {AnimationTrack}
		*/
        getAnimationSet( name: string ): AnimationTrack {
            const animationSets: Array<AnimationTrack> = this.animationSets;
            for ( let i = 0, l = animationSets.length; i < l; i++ )
                if ( animationSets[ i ].name === name )
                    return animationSets[ i ];

            return null;
        }

		/**
		* Adds a new buffer to the geometry. This will replace any existing buffers of the same type.
		* Will trigger a rebuild.
		* @returns {GeometryBuffer}
		*/
        addAttributes( buffer: GeometryBuffer ): GeometryBuffer {
            // If we are replacing a buffer we need to make sure the existing buffer is added to
            // the cleanup array.
            const buffers = this._buffers;
            if ( buffers[ buffer.type ] )
                this._cleanup.push( buffers[ buffer.type ].buffer );

            buffers[ buffer.type ] = buffer;
            this._requiresBuild = true;
            return buffer;
        }

		/**
		* Removes an attribute buffer
		*/
        removeAttribute( type: AttributeType ) {
            const buffers = this._buffers;
            if ( buffers[ type ] )
                this._cleanup.push( buffers[ type ].buffer );

            buffers[ type ] = null;
        }

		/**
		* Removes all data from the Geometry. This is useful if you want re-make the geometry.
		*/
        resetBuffers(): Geometry {
            const buffers = this._buffers;
            for ( let i in buffers )
                if ( buffers[ i ] ) {
                    this._cleanup.push( buffers[ i ].buffer );
                    buffers[ i ] = null;
                }

            if ( this._indexBuffer )
                this._cleanup.push( this._indexBuffer.buffer );

            if ( this._indexBufferLines )
                this._cleanup.push( this._indexBufferLines.buffer );

            this._indexBuffer = null;
            this._indexBufferLines = null;
            this.faces = [];

            this.animationSets.splice( 0, this.animationSets.length );
            this.bones.splice( 0, this.bones.length );

            this._requiresBuild = true;
            return this;
        }

		/**
		* Rebuilds only specific buffers whose data has been modified outside the class.
		* If the number data of elements has changed, then this will throw errors and you should instead flag
		* the geometry for rebuild. Use this function, when the number of items stays the same, but we just need to flush
		* new values.
		* @param {WebGLRenderingContext} gl The webgl context
		*/
        updateDirtyBuffers( gl: WebGLRenderingContext ): boolean {
            const dirty = this.dirtyBuffers,
                usage: number = this._usage,
                faces = this.faces,
                dataMap = this._dataMap;

            let b: GeometryBuffer,
                face: Face3;

            for ( let i = 0, l = dirty.length; i < l; i++ ) {
                b = dirty[ i ];

                if ( faces.length > 0 ) {
                    // Create arrays to hold the face data.
                    dataMap.splice( 0, dataMap.length );

                    // For each face
                    for ( let fi = 0, flen = faces.length; fi < flen; fi++ ) {
                        face = faces[ fi ];

                        const faceAttributeIndices: Array<number> = face.attributeIndices[ b.type ];

                        // This will override any existing data which ensures only the data we need will go through.
                        dataMap.push( b.data[ faceAttributeIndices[ 0 ] ] );
                        dataMap.push( b.data[ faceAttributeIndices[ 1 ] ] );
                        dataMap.push( b.data[ faceAttributeIndices[ 2 ] ] );
                    }

                    b.flattenData( dataMap );
                    gl.bindBuffer( gl.ARRAY_BUFFER, b.buffer );
                    gl.bufferData( gl.ARRAY_BUFFER, b.dataFlat, usage );
                }
                else {
                    // Flatten and bind
                    b.flattenData();
                    gl.bindBuffer( gl.ARRAY_BUFFER, b.buffer );
                    gl.bufferData( gl.ARRAY_BUFFER, b.dataFlat, usage );
                }
            }

            dirty.splice( 0, dirty.length );
            return true;
        }

		/**
		* Builds the geometry webgl buffers
		* @param {WebGLRenderingContext} gl The webgl context
		*/
        buildGeometry( gl: WebGLRenderingContext ): boolean {
            this.compileStatus = 'Compiled Successfully';
            const buffers = this._buffers;
            let i: number = buffers.length;
            let numElements: number = 0;
            const faces = this.faces;
            let usage: number = gl.STREAM_DRAW;
            const dataMap = this._dataMap;
            this.buildCount++;

            if ( this.bufferUsage === BufferUsage.Static )
                usage = gl.STATIC_DRAW;
            else if ( this.bufferUsage === BufferUsage.Dynamic )
                usage = gl.DYNAMIC_DRAW;

            // Cleanup any buffers buffers who have been replaced by new ones.
            const cleanup: Array<WebGLBuffer> = this._cleanup;
            i = cleanup.length;
            while ( i-- )
                if ( cleanup[ i ] )
                    gl.deleteBuffer( cleanup[ i ] );

            this._cleanup.splice( 0, this._cleanup.length );

            // If a webgl buffer exists, delete it as we are creating new data.
            i = buffers.length;
            while ( i-- ) {
                if ( !buffers[ i ] )
                    continue;

                if ( buffers[ i ].buffer )
                    gl.deleteBuffer( buffers[ i ].buffer );

                buffers[ i ].buffer = null;
            }

            // Cleanup the index buffers
            if ( this._indexBuffer )
                gl.deleteBuffer( this._indexBuffer.buffer );
            if ( this._indexBufferLines )
                gl.deleteBuffer( this._indexBufferLines.buffer );

            this._indexBuffer = null;
            this._indexBufferLines = null;

            // IF we have faces, we need to take the data stored in each buffer and essentially flatten it out by the face index.
            // We do this by looking at the face indices of each buffer and matching those indices to the data stored in the
            // geometry buffers. This will not only flatten the data out - it will also mean the data is order from 0 - num of faces
            if ( faces.length > 0 ) {
                // Since we have faces we can create a new index buffer.
                this._indexBuffer = new GeometryIndexBuffer();
                this._indexBufferLines = new GeometryIndexBuffer();

                const c = 0,
                    flatCounter: number = 0;

                let face: Face3,
                    datum: Float32Array;

                // For each buffer
                i = buffers.length;
                while ( i-- ) {
                    if ( !buffers[ i ] )
                        continue;

                    // Create arrays to hold the face data.
                    dataMap.splice( 0, dataMap.length );

                    // For each face
                    for ( let fi = 0, flen = faces.length; fi < flen; fi++ ) {
                        face = faces[ fi ];

                        // Do nothing if we dont have a set of face attribute indices
                        if ( !face.attributeIndices[ buffers[ i ].type ] ) {
                            this.compileStatus = 'Geometry [' + this.constructor.name + '] uses faces, but does map the vertex data for its buffer[' + buffers[ i ].type + '].';
                            return false;
                        }


                        const faceAttributeIndices: Array<number> = face.attributeIndices[ buffers[ i ].type ];

                        // This will override any existing data which ensures only the data we need will go through.
                        dataMap.push( buffers[ i ].data[ faceAttributeIndices[ 0 ] ] );
                        dataMap.push( buffers[ i ].data[ faceAttributeIndices[ 1 ] ] );
                        dataMap.push( buffers[ i ].data[ faceAttributeIndices[ 2 ] ] );
                    }

                    buffers[ i ].flattenData( dataMap );
                }

                let indexCounter = 0;
                for ( let fi = 0, flen = faces.length; fi < flen; fi++ ) {
                    this._indexBuffer.data.push( indexCounter, indexCounter + 1, indexCounter + 2 );

                    // Create the line indices (as squares)
                    if ( fi % 2 === 0 ) {
                        this._indexBufferLines.data.push(
                            indexCounter, indexCounter + 1,
                            indexCounter, indexCounter + 2
                        );
                    }
                    else {
                        this._indexBufferLines.data.push(
                            indexCounter, indexCounter + 1,
                            indexCounter + 1, indexCounter + 2
                        );
                    }

                    indexCounter += 3;
                }
            }
            // There are no indices, so just flatten the arrays using their element sizes.
            else {
                i = buffers.length;
                while ( i-- ) {
                    if ( !buffers[ i ] )
                        continue;

                    buffers[ i ].flattenData();


                    // Make sure the buffer lengths are the same.
                    let len = buffers[ i ].dataFlat.length / buffers[ i ].elementSize;
                    if ( len !== numElements && numElements !== 0 ) {
                        this.compileStatus = 'Could not compile geometry. The buffers sizes are not consistent. For each geometry you can have multiple attribute buffers, but each buffer size must be the same as buffer.dataFlat.length / buffer.elementSize.';
                        return false;
                    }

                    numElements = len;
                }
            }

            // Now go through each buffer and bind its data.
            i = buffers.length;
            while ( i-- ) {
                if ( !buffers[ i ] )
                    continue;

                // First create the buffer
                buffers[ i ].buffer = gl.createBuffer();

                // Then bind the data
                gl.bindBuffer( gl.ARRAY_BUFFER, buffers[ i ].buffer );
                gl.bufferData( gl.ARRAY_BUFFER, buffers[ i ].dataFlat, usage );
            }


            // If an index buffer was set, then lets create it.
            if ( this._indexBuffer ) {
                this._indexBuffer.flattenData( this.faces.length );
                this._indexBuffer.buffer = gl.createBuffer();
                gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer.buffer );
                gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer.dataFlat, usage );

                this._indexBufferLines.flattenData( this.faces.length );
                this._indexBufferLines.buffer = gl.createBuffer();
                gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this._indexBufferLines.buffer );
                gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, this._indexBufferLines.dataFlat, usage );
            }

            this._numElements = numElements;
            this._usage = usage;
            this._requiresBuild = false;
            this.dirtyBuffers.splice( 0, this.dirtyBuffers.length );

            // this.computeBoundingBox();
            // this.computeBoundingSphere();

            return true;
        }


		/**
		* Computes the bounding box of the geometry.
		*/
        computeBoundingBox() {
            const pBuffer: GeometryBuffer = this.buffers[ AttributeType.POSITION ];
            if ( pBuffer ) {
                const vertices: Array<Vec3> = pBuffer.data;
                this.boundingBox.setFromPoints( vertices );
            }
        }

		/**
		* Computes the bounding sphere of the geometry.
		*/
        computeBoundingSphere() {
            const pBuffer: GeometryBuffer = this.buffers[ AttributeType.POSITION ];
            if ( pBuffer ) {
                const vertices: Array<Vec3> = pBuffer.data;
                this.boundingSphere.setFromPoints( vertices );
            }
        }

		/**
		* Reverses the face order so that A, B, C becomes C, B, A
		*/
        reverseFaceOrder() {
            const faces: Array<Face3> = this.faces;
            for ( let i = 0, l = faces.length; i < l; i++ ) {
                let a: number = faces[ i ].a, c: number = faces[ i ].c;

                faces[ i ].a = c;
                faces[ i ].c = a;

                for ( const att in faces[ i ].attributeIndices ) {
                    if ( faces[ i ].attributeIndices[ att ] ) {
                        a = faces[ i ].attributeIndices[ att ][ 0 ];
                        c = faces[ i ].attributeIndices[ att ][ 2 ];

                        faces[ i ].attributeIndices[ att ][ 0 ] = c;
                        faces[ i ].attributeIndices[ att ][ 2 ] = a;
                    }
                }
            }
        }

		/**
		* Transforms the vertices and normals by a matrix
		*/
        applyMatrix( matrix: Matrix4 ): Geometry {
            const normalMatrix = new Matrix3().getNormalMatrix( matrix );
            const vertices: Array<Vec3> = this.buffers[ AttributeType.POSITION ].data;
            const normals: Array<Vec3> = ( this.buffers[ AttributeType.NORMAL ] ? this.buffers[ AttributeType.NORMAL ].data : null );

            for ( let i = 0, il = vertices.length; i < il; i++ ) {
                const vertex = vertices[ i ];
                vertex.applyMatrix4( matrix );
            }

            if ( normals ) {
                for ( let i = 0, il = this.faces.length; i < il; i++ ) {
                    const face: Face3 = this.faces[ i ];
                    face.normal.applyMatrix3( normalMatrix ).normalize();

                    normals[ face.attributeIndices[ AttributeType.NORMAL ][ 0 ] ].applyMatrix3( normalMatrix ).normalize();
                    normals[ face.attributeIndices[ AttributeType.NORMAL ][ 1 ] ].applyMatrix3( normalMatrix ).normalize();
                    normals[ face.attributeIndices[ AttributeType.NORMAL ][ 2 ] ].applyMatrix3( normalMatrix ).normalize();
                    face.centroid.applyMatrix4( matrix );
                }
            }

            this.computeBoundingBox();
            this.computeBoundingSphere();
            this._requiresBuild = true;
            return this;
        }


		/**
		* Will generate a color buffer if one doesnt exist. If one does exist it will set each of its colors
		* to the given color parameter.
		*/
        generateColors( color: number = 0xFFFFFF ) {
            const faces = this.faces;
            let face: Face3;

            let colors: Array<Color>;

            if ( this._buffers[ AttributeType.COLOR ] )
                this._cleanup.push( this._buffers[ AttributeType.COLOR ].buffer );

            // We need to get / create the colors for this geometry and fill it with color data.
            const colorBuffer: GeometryBuffer = new GeometryBuffer( [], 4, AttributeType.COLOR );
            this._buffers[ AttributeType.COLOR ] = colorBuffer;
            colors = colorBuffer.data;

            // Now that we have color data, we need to tell each face which datum it points to
            for ( let i = 0, flen = faces.length; i < flen; i++ ) {
                face = faces[ i ];
                colors.push( new Color( color ) );
                colors.push( new Color( color ) );
                colors.push( new Color( color ) );

                face.attributeIndices[ AttributeType.COLOR ] = [ colors.length - 3, colors.length - 2, colors.length - 1 ];
            }

            this._requiresBuild = true;
        }

		/**
		* Generates a normal buffer if none exists, or otherwise re-calculates the normal buffer data.
		* Will trigger a re-build.
		* @param {boolean} smoothNormals If true, then each normal will be smoothed. If false the normals will create
		* flat shading.
		*/
        generateNormals( smoothNormals: boolean = false ) {
            if ( !this._buffers[ AttributeType.POSITION ] )
                throw new Error( 'You must have a position buffer to calculate the normal buffer.' );

            // Create vars
            let v, vl, f, fl, face: Face3;
            const faces: Array<Face3> = this.faces;
            const positions: Array<Vec3> = this._buffers[ AttributeType.POSITION ].data;
            let normals: Array<Vec3>;

            // We need to get / create the normals for this geometry.
            // No normal buffer, so lets create one with the same size as the positions
            if ( this._buffers[ AttributeType.NORMAL ] )
                this._cleanup.push( this._buffers[ AttributeType.NORMAL ].buffer );

            const normalBuffer: GeometryBuffer = new GeometryBuffer( new Array( positions.length ), 3, AttributeType.NORMAL );
            this._buffers[ AttributeType.NORMAL ] = normalBuffer;
            normals = normalBuffer.data;

            let i: number = positions.length;
            while ( i-- )
                normals[ i ] = new Vec3( 0, 0, 0 );


            // If smooth, then we average out the normals over each face.
            if ( smoothNormals ) {
                // vertex normals weighted by triangle areas
                // http://www.iquilezles.org/www/articles/normals/normals.htm

                let vA, vB, vC, vD;
                const cb = new Vec3( 0, 0, 0 ), ab = new Vec3( 0, 0, 0 ),
                    db = new Vec3( 0, 0, 0 ), dc = new Vec3( 0, 0, 0 ),
                    bc = new Vec3( 0, 0, 0 );

                for ( f = 0, fl = faces.length; f < fl; f++ ) {
                    face = faces[ f ];

                    vA = positions[ face.a ];
                    vB = positions[ face.b ];
                    vC = positions[ face.c ];

                    cb.subVectors( vC, vB );
                    ab.subVectors( vA, vB );
                    cb.subVectors( cb, ab );

                    // Cumulate the normals value
                    normals[ face.a ].addVectors( normals[ face.a ], cb );
                    normals[ face.b ].addVectors( normals[ face.b ], cb );
                    normals[ face.c ].addVectors( normals[ face.c ], cb );
                }
            }
            else {
                // Just copy the face normal
                for ( f = 0, fl = faces.length; f < fl; f++ ) {
                    face = faces[ f ];
                    normals[ face.a ].addVectors( normals[ face.a ], face.normal );
                    normals[ face.b ].addVectors( normals[ face.b ], face.normal );
                    normals[ face.c ].addVectors( normals[ face.c ], face.normal );
                }
            }

            // Normalise the vectors so they are from 0 to 1
            for ( v = 0, vl = normals.length; v < vl; v++ )
                normals[ v ].normalize();


            for ( f = 0, fl = faces.length; f < fl; f++ ) {
                face = faces[ f ];

                // Vec3.copy( face.vertexNormals[0], normals[face.a] );
                // Vec3.copy( face.vertexNormals[1], normals[face.b] );
                // Vec3.copy( face.vertexNormals[2], normals[face.c] );

                face.attributeIndices[ AttributeType.NORMAL ] = [ face.a, face.b, face.c ];
            }

            this._requiresBuild = true;
        }

		/**
		* Computes the face normal by getting the cross product of each of its position vertices. You must have a position buffer added in order for this to work.
		*/
        computeFaceNormals() {
            if ( !this._buffers[ AttributeType.POSITION ] )
                return;

            const cb = new Vec3( 0, 0, 0 ), ab = new Vec3( 0, 0, 0 );
            const vertices = this._buffers[ AttributeType.POSITION ].data;

            for ( let f = 0, fl = this.faces.length; f < fl; f++ ) {
                const face = this.faces[ f ];

                const vA = vertices[ face.a ];
                const vB = vertices[ face.b ];
                const vC = vertices[ face.c ];

                cb.subVectors( vC, vB ); // cb.subVectors( vC, vB );
                ab.subVectors( vA, vB ); // ab.subVectors( vA, vB );
                cb.crossVectors( cb, ab ); // cb.cross( ab );
                cb.normalize();
                face.normal.copy( cb );
            }
        }

		/**
		* Checks for duplicate vertices with hashmap and faces'vertex indices are updated. You must have a position buffer added in order for this to work.
		* @returns The number of vertices removed.
		*/
        mergeVertices(): number {
            if ( !this._buffers[ AttributeType.POSITION ] )
                return;

            const precisionPoints: number = 4; // number of decimal points, eg. 4 for epsilon of 0.0001
            const precision: number = Math.pow( 10, precisionPoints );

            let verticesMap: { [ name: string ]: number } = {},
                i, il, face: Face3,
                indices, k, j, jl, bl, b, u, q, ql,
                v: Vec3,
                key: string = '',
                buffers = this._buffers,
                unique: Array<Vec3> = [],
                changes: Array<number> = [],
                faces: Array<Face3> = this.faces,
                faceIndicesToRemove = [],
                positionBuffer = this._buffers[ <number>AttributeType.POSITION ];

            for ( i = 0, il = positionBuffer.data.length; i < il; i++ ) {
                v = positionBuffer.data[ i ];
                key = Math.round( v.x * precision ).toString() + '_' + Math.round( v.y * precision ).toString() + '_' + Math.round( v.z * precision ).toString();

                // IF the vertex already exists then use that one otherwise create a new entry.
                if ( verticesMap[ key ] === undefined ) {
                    verticesMap[ key ] = i;
                    unique.push( positionBuffer.data[ i ] );
                    changes[ i ] = unique.length - 1;
                }
                else
                    changes[ i ] = changes[ verticesMap[ key ] ];
            }

            // if faces are completely degenerate after merging vertices, we
            // have to remove them from the geometry.
            for ( i = 0, il = faces.length; i < il; i++ ) {
                face = this.faces[ i ];
                face.a = changes[ face.a ];
                face.b = changes[ face.b ];
                face.c = changes[ face.c ];

                indices = [ face.a, face.b, face.c ];

                // update the face position's index buffer
                face.attributeIndices[ AttributeType.POSITION ].splice( 0, 3, face.a, face.b, face.c );

                let dupIndex = -1;

                // if any duplicate vertices are found in a Face3
                // we have to remove the face as nothing can be saved
                for ( let n = 0; n < 3; n++ ) {
                    if ( indices[ n ] === indices[ ( n + 1 ) % 3 ] ) {
                        dupIndex = n;
                        faceIndicesToRemove.push( i );
                        break;
                    }
                }
            }

            for ( i = faceIndicesToRemove.length - 1; i >= 0; i-- ) {
                const idx = faceIndicesToRemove[ i ];
                faces.splice( idx, 1 );

                // for ( j = 0, jl = this.faceVertexUvs.length; j < jl; j++ )
                // {
                //  this.faceVertexUvs[j].splice( idx, 1 );
                // }
            }

            // Get the difference in vertices - i.e. how much have we removed.
            const diff = positionBuffer.data.length - unique.length;

            // Remove unnecessary data
            positionBuffer.data = unique;
            this._requiresBuild = true;

            // positionBuffer.data = unique;
            return diff;
        }

		/**
		* Computes the centroid of the faces. This is essentially the mid-point of the face.
		*/
        computeCentroids() {
            const vertices: Array<Vec3> = this._buffers[ AttributeType.POSITION ].data;
            const faces: Array<Face3> = this.faces;
            let f, fl, face: Face3;
            for ( f = 0, fl = faces.length; f < fl; f++ ) {
                face = faces[ f ];
                face.centroid.set( 0, 0, 0 );
                face.centroid.addVectors( face.centroid, vertices[ face.a ] );
                face.centroid.addVectors( face.centroid, vertices[ face.b ] );
                face.centroid.addVectors( face.centroid, vertices[ face.c ] );
                face.centroid.divideScalar( 3 );
            }
        }

		/**
		* Cleans up the object.
		*/
        dispose() {
            super.dispose();

            // Calls destroyBuffers later
            Renderer.resoucesToRemove.push( this );

            this.faces = null;
            this.boundingSphere = null;
            this.boundingBox = null;
            this.bones = null;
            this._dataMap = null;
        }

		/**
		* Cleans up the references and frees the memory buffers
		*/
        destroyBuffers( gl: WebGLRenderingContext ) {
            const buffers = this._buffers;
            const cleanup = this._cleanup;

            // If a webgl buffer exists, delete it as we are creating new data.
            let i = buffers.length;
            while ( i-- ) {
                if ( !buffers[ i ] )
                    continue;

                if ( buffers[ i ].buffer )
                    gl.deleteBuffer( buffers[ i ].buffer );
            }

            i = cleanup.length;
            while ( i-- )
                if ( cleanup[ i ] )
                    gl.deleteBuffer( cleanup[ i ] );


            if ( this._indexBuffer && this._indexBuffer.buffer )
                gl.deleteBuffer( this._indexBuffer.buffer );

            if ( this._indexBufferLines && this._indexBufferLines.buffer )
                gl.deleteBuffer( this._indexBufferLines.buffer );

            this._buffers = null;
            this._indexBuffer = null;
            this._cleanup = null;
            this._indexBufferLines = null;


        }

        // Getters and Setters
        get buffers(): Array<GeometryBuffer> { return this._buffers; }
        get requiresBuild(): boolean { return this._requiresBuild; }
        get numElements(): number { return this._numElements; }
        get indexBuffer(): GeometryIndexBuffer { return ( this._indexBuffer ? this._indexBuffer : null ); }
        get indexBufferLines(): GeometryIndexBuffer { return ( this._indexBufferLines ? this._indexBufferLines : null ); }


    }
}