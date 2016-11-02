namespace Trike {
	/**
	* A loader used to load OBJ files. Currently supports Blender exporter
	*/
    export class OBJLoader extends ModelLoader {
        public geometry: Geometry;

        constructor( useCredentials: boolean = true ) {
            super( useCredentials );
            this.geometry = null;
        }

		/**
		* Attempts to load geometry or material data from a URL. You can optionally pass in a geometry
		* object to be filled. You should use the addEventListener function and hook into the ModelLoadEvents
		* events.
		*/
        load( url: string, geometry?: Geometry ): OBJLoader {
            this.geometry = geometry;
            super.xhrLoad( url );
            return this;
        }

		/**
		* Cleanup
		*/
        dispose() {
            super.dispose();
            this.geometry = null;
        }


		/**
		* Once the data has been loaded, subsequent classes must parse the load content
		* @returns {Geometry}
		*/
        onParse( text: string, xhr: XMLHttpRequest ): Geometry {
            // fixes
            text = text.replace( /\\\r\n/g, '' ); // handles line continuations \

            const geometries: Array<{ vertices: Array<Vec3>; normals: Array<Vec3>; uvs: Array<Vec2>; faces: Array<Face3> }> = [];
            let curGeometry: { vertices: Array<Vec3>; normals: Array<Vec3>; uvs: Array<Vec2>; faces: Array<Face3> };

            // If no objects are define, then create the default
            if ( /^o /gm.test( text ) === false ) {
                curGeometry = { faces: [], normals: [], uvs: [], vertices: [] };
                geometries.push( curGeometry );
            }

            // Each line of the OBJ file
            const lines: Array<string> = text.split( '\n' );
            let dataSplit: Array<string>;
            let faceSplit: Array<string>;
            let code: string;
            let aSplit: Array<string>;
            let bSplit: Array<string>;
            let cSplit: Array<string>;
            let dSplit: Array<string>;
            let lastVertIndex: number = 0;
            let lastNormIndex: number = 0;
            let lastUVIndex: number = 0;
            let v1: number, v2: number, v3: number, n1: number, n2: number, n3: number, u1: number, u2: number;

            // v float float float
            const vertex_pattern: RegExp = /v( +[\d|\.|\+|\-|e]+)( +[\d|\.|\+|\-|e]+)( +[\d|\.|\+|\-|e]+)/;

            // vn float float float
            const normal_pattern: RegExp = /vn( +[\d|\.|\+|\-|e]+)( +[\d|\.|\+|\-|e]+)( +[\d|\.|\+|\-|e]+)/;

            // vt float float
            const uv_pattern: RegExp = /vt( +[\d|\.|\+|\-|e]+)( +[\d|\.|\+|\-|e]+)/;

            // f vertex vertex vertex ...
            const face_pattern1: RegExp = /f( +-?\d+)( +-?\d+)( +-?\d+)( +-?\d+)?/;

            // f vertex/uv vertex/uv vertex/uv ...
            const face_pattern2: RegExp = /f( +(-?\d+)\/(-?\d+))( +(-?\d+)\/(-?\d+))( +(-?\d+)\/(-?\d+))( +(-?\d+)\/(-?\d+))?/;

            // f vertex/uv/normal vertex/uv/normal vertex/uv/normal ...
            const face_pattern3: RegExp = /f( +(-?\d+)\/(-?\d+)\/(-?\d+))( +(-?\d+)\/(-?\d+)\/(-?\d+))( +(-?\d+)\/(-?\d+)\/(-?\d+))( +(-?\d+)\/(-?\d+)\/(-?\d+))?/;

            // f vertex// normal vertex// normal vertex// normal ...
            const face_pattern4: RegExp = /f( +(-?\d+)\/\/(-?\d+))( +(-?\d+)\/\/(-?\d+))( +(-?\d+)\/\/(-?\d+))( +(-?\d+)\/\/(-?\d+))?/

            let result: RegExpExecArray;

            // For each line in the OBJ file
            for ( let i = 0; i < lines.length; i++ ) {
                let line: string = lines[ i ];
                line = line.trim();

                if ( line === '' )
                    continue;

                // Makes sure that the line has no long spaces within itself
                line = line.replace( /^(\s*)|(\s*)$/g, '' ).replace( /\s+/g, ' ' );

                dataSplit = line.split( ' ' );
                code = dataSplit[ 0 ].toLowerCase();

                switch ( code ) {
                    // New Object
                    case 'o':
                        lastVertIndex += ( curGeometry ? curGeometry.vertices.length : 0 );
                        lastNormIndex += ( curGeometry ? curGeometry.normals.length : 0 );
                        lastUVIndex += ( curGeometry ? curGeometry.uvs.length : 0 );

                        curGeometry = { faces: [], normals: [], uvs: [], vertices: [] };
                        geometries.push( curGeometry );
                        break;
                    // Vertex
                    case 'v':
                        curGeometry.vertices.push( new Vec3( parseFloat( dataSplit[ 1 ] ), parseFloat( dataSplit[ 2 ] ), parseFloat( dataSplit[ 3 ] ) ) );
                        break;
                    // UV
                    case 'vt':
                        curGeometry.uvs.push( new Vec2( parseFloat( dataSplit[ 1 ] ), parseFloat( dataSplit[ 2 ] ) ) );
                        break;
                    // Normal
                    case 'vn':
                        curGeometry.normals.push( new Vec3( parseFloat( dataSplit[ 1 ] ), parseFloat( dataSplit[ 2 ] ), parseFloat( dataSplit[ 3 ] ) ) );
                        break;
                    // Face
                    case 'f':

                        aSplit = dataSplit[ 1 ].split( '/' );
                        bSplit = dataSplit[ 2 ].split( '/' );
                        cSplit = dataSplit[ 3 ].split( '/' );
                        dSplit = null;
                        if ( dataSplit.length > 4 )
                            dSplit = dataSplit[ 4 ].split( '/' );

                        // 3 component face
                        if ( dataSplit.length === 4 ) {
                            const faceA: Face3 = new Face3( parseFloat( aSplit[ 0 ] ) - 1 - lastVertIndex, parseFloat( bSplit[ 0 ] ) - 1 - lastVertIndex, parseFloat( cSplit[ 0 ] ) - 1 - lastVertIndex );

                            if ( aSplit.length > 1 )
                                faceA.setAttributeIndices( AttributeType.UV, parseFloat( aSplit[ 1 ] ) - 1 - lastUVIndex, parseFloat( bSplit[ 1 ] ) - 1 - lastUVIndex, parseFloat( cSplit[ 1 ] ) - 1 - lastUVIndex );
                            if ( aSplit.length > 2 )
                                faceA.setAttributeIndices( AttributeType.NORMAL, parseFloat( aSplit[ 2 ] ) - 1 - lastNormIndex, parseFloat( bSplit[ 2 ] ) - 1 - lastNormIndex, parseFloat( cSplit[ 2 ] ) - 1 - lastNormIndex );

                            curGeometry.faces.push( faceA );
                        }
                        // 4 component face
                        else if ( dataSplit.length > 4 ) {
                            const faceA: Face3 = new Face3( parseFloat( aSplit[ 0 ] ) - 1 - lastVertIndex, parseFloat( bSplit[ 0 ] ) - 1 - lastVertIndex, parseFloat( dSplit[ 0 ] ) - 1 - lastVertIndex );
                            const faceB: Face3 = new Face3( parseFloat( bSplit[ 0 ] ) - 1 - lastVertIndex, parseFloat( cSplit[ 0 ] ) - 1 - lastVertIndex, parseFloat( dSplit[ 0 ] ) - 1 - lastVertIndex );

                            if ( aSplit.length > 1 ) {
                                faceA.setAttributeIndices( AttributeType.UV, parseFloat( aSplit[ 1 ] ) - 1 - lastUVIndex, parseFloat( bSplit[ 1 ] ) - 1 - lastUVIndex, parseFloat( dSplit[ 1 ] ) - 1 - lastUVIndex );
                                faceB.setAttributeIndices( AttributeType.UV, parseFloat( bSplit[ 1 ] ) - 1 - lastUVIndex, parseFloat( cSplit[ 1 ] ) - 1 - lastUVIndex, parseFloat( dSplit[ 1 ] ) - 1 - lastUVIndex );
                            }
                            if ( aSplit.length > 2 ) {
                                faceA.setAttributeIndices( AttributeType.NORMAL, parseFloat( aSplit[ 2 ] ) - 1 - lastNormIndex, parseFloat( bSplit[ 2 ] ) - 1 - lastNormIndex, parseFloat( dSplit[ 2 ] ) - 1 - lastNormIndex );
                                faceB.setAttributeIndices( AttributeType.NORMAL, parseFloat( bSplit[ 2 ] ) - 1 - lastNormIndex, parseFloat( cSplit[ 2 ] ) - 1 - lastNormIndex, parseFloat( dSplit[ 2 ] ) - 1 - lastNormIndex );
                            }

                            curGeometry.faces.push( faceA );
                            curGeometry.faces.push( faceB );
                        }

                        break;
                }
            }

            const geom: Geometry = this.geometry;
            geom.resetBuffers();

            for ( let i = 0, l = geometries.length; i < l; i++ ) {
                const newGeom = new Geometry();
                if ( geometries[ i ].vertices.length > 0 )
                    newGeom.addAttributes( new GeometryBuffer( geometries[ i ].vertices, 3, AttributeType.POSITION ) );
                if ( geometries[ i ].uvs.length > 0 )
                    newGeom.addAttributes( new GeometryBuffer( geometries[ i ].uvs, 2, AttributeType.UV ) );
                if ( geometries[ i ].normals.length > 0 )
                    newGeom.addAttributes( new GeometryBuffer( geometries[ i ].normals, 3, AttributeType.NORMAL ) );
                if ( geometries[ i ].faces.length > 0 )
                    newGeom.faces = geometries[ i ].faces;

                geom.mergGeometry( newGeom );
            }

            geom.computeCentroids();
            geom.computeFaceNormals();
            geom.computeBoundingBox();
            geom.computeBoundingSphere();

            return geom;
        }
    }
}