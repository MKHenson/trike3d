namespace Trike {
	/**
	* The viewspace grid picker is used to get contact points on a grid instance.
	*/
    export class ViewspaceGridPicker {
        private _grid: ViewspaceGrid;
        private _canvas: HTMLCanvasElement;
        private _heightData: ArrayBufferView;
        private _tempVec: Vec2;
        private _intersection: Intersection;

		/**
		* Creates an instance of the picker
		*/
        constructor( grid: ViewspaceGrid ) {
            this._grid = grid;
            this._canvas = document.createElement( 'canvas' );
            this._tempVec = new Vec2();
            this._intersection = new Intersection( 0, null, null, null );
        }

		/**
		* Nullifies values for GC
		*/
        dispose() {
            this._grid = null;
            this._canvas = null;
            this._heightData = null;
            this._canvas = null;
            this._tempVec = null;
            this._intersection.object = null;
            this._intersection = null;
        }

		/**
		* Updates the height data stored in the picker. This must be updated whenever the heightfield texture is changed.
		* @param {Texture} texture The updated texture
		*/
        updateHeightData( texture: Texture ) {
            const context: CanvasRenderingContext2D = this._canvas.getContext( '2d' );

            if ( texture ) {
                const w = texture.image.width;
                const h = texture.image.height;
                this._canvas.width = w;
                this._canvas.height = h;

                context.drawImage( texture.image, 0, 0, w, h );
                this._heightData = <any>context.getImageData( 0, 0, w, h ).data;
            }
            else
                this._heightData = null;
        }

		/**
		* Clamps a number p within the range of l determined by the wrapping function
		* @returns {number} Number within the range of l
		*/
        clampFragment( p: number, l: number, wrapping: TextureWrapping ): number {
            // Wrap the coordinates based on the wrapping style
            if ( wrapping === TextureWrapping.RepeatWrapping ) {
                if ( p >= 0 )
                    return p = p % l;
                else
                    return ( l - Math.abs( p % l ) );
            }
            else if ( wrapping === TextureWrapping.MirroredRepeatWrapping ) {
                p = Math.abs( p );
                return ( p % ( l * 2 ) < l ? p % l : ( l * 2 ) - ( p % ( l * 2 ) ) );
            }
            else if ( wrapping === TextureWrapping.ClampToEdgeWrapping ) {
                if ( p > l )
                    p = l;
                else if ( p < 0 )
                    p = 0;
            }

            return p;
        }

		/**
		* Gets normalized UV coordinates of the grid from the world x and z position
		* @param {number} x The world x position
		* @param {number} z The world z position
		* @param {TextureWrapping} wrappingS The S wrapping of the heightfield texture
		* @param {TextureWrapping} wrappingU The U wrapping of the heightfield texture
		* @param {Vec2} out Specify a vector to store the data in.
		* @returns {Vec2} The normalized UV coordinates
		*/
        getUVCoordinate( x: number, z: number, wrappingS: TextureWrapping, wrappingT: TextureWrapping, out: Vec2 = new Vec2() ): Vec2 {
            const grid: ViewspaceGrid = this._grid;
            const worldSize: number = ( <MaterialTerrain>grid.material ).worldScale();

            let u: number, v: number;

            // Gets the normalized UV coordinates of the position on the heightfield map
            u = x / worldSize + 0.5;
            v = 1 - ( z / worldSize + 0.5 );

            u = this.clampFragment( u, 1, wrappingS );
            v = this.clampFragment( v, 1, wrappingT );

            return out.set( u, v );
        }

		/**
		* Gets the height of the terrain at x and z world coordinates
		* @param {number} x The world x position
		* @param {number} z The world z position
		* @returns {number} The height of the terrain at that point
		*/
        getHeight( x: number, z: number ): number {
            let heightData: ArrayBufferView = this._heightData;

            if ( heightData ) {
                const grid: ViewspaceGrid = this._grid;
                const heightTexture: Texture = <Texture>grid.heightfield();

                if ( heightTexture instanceof CanvasTexture )
                    heightData = <any>( <CanvasTexture>heightTexture ).imageData.data;
                else if ( heightTexture instanceof DataTexture )
                    heightData = ( <DataTexture>heightTexture ).data;
                else
                    heightData = heightData;

                const test: ArrayBufferView = new Uint8Array( 20 );

                const altitude: number = grid.altitude();
                const heightOffset: number = grid.heightOffset();

                // Gets the normalized UV coordinates of the position on the heightfield map
                const heightUv: Vec2 = this._tempVec;
                this.getUVCoordinate( x, z, heightTexture.wrapS, heightTexture.wrapT, heightUv );

                const componentSize = heightTexture.getNumberComponents();

                const val: number = this.sample( heightData, heightTexture.width, heightTexture.height, componentSize, heightUv.x, heightUv.y, heightTexture );
                return val * altitude + heightOffset;
            }
            else
                return 0.0;
        }

		/**
		* Gets the normalized value of an image's  pixel from the x and y coordinates. Assumes the height is in the r channel.
		* The x and y coordinates expected here must be between 0 and 1. This sampler will get the interpolated value
		* of a pixel. I.e. if the coorindates are a fraction between two pixels, this function will get the interpolated
		* value between them (essentially performing a bilinear texture sample)
		* returns {number} Colour information from 0 to 1 from the red channel
		*/
        private sample( data: ArrayBufferView, width: number, height: number, componentSize: number, x: number, y: number, texture: TextureBase ): number {
            const interpolator: Function = Interpolater.interpolate;
            const clamp: Function = this.clampFragment;
            const catmul: Function = Interpolater.catmullRom;

            let hWidthLimit: number, hHeightLimit: number;
            if ( texture.wrapS === TextureWrapping.ClampToEdgeWrapping )
                hWidthLimit = width - 1;
            else
                hWidthLimit = width;

            if ( texture.wrapT === TextureWrapping.ClampToEdgeWrapping )
                hHeightLimit = height - 1;
            else
                hHeightLimit = height;

            // Make sure the x and y are clamped by looking at the wrapping functions
            x = clamp( x, 1, texture.wrapS );
            y = clamp( y, 1, texture.wrapT );

            let fracX: number = ( ( x * width ) % 1 )
            let fracY: number = ( ( y * height ) % 1 );

            let pixX: number = Math.floor( x * width );
            let pixY: number = Math.floor( y * height );

            // The pixels values are actually located in the middle. So we have to shift
            // The values so that they reflect this.
            if ( fracX < 0.5 ) {
                pixX = clamp( pixX - 1, hWidthLimit, texture.wrapS );
                fracX += 0.5;
            }
            else
                fracX = fracX - 0.5;

            if ( fracY < 0.5 ) {
                pixY = clamp( pixY - 1, hHeightLimit, texture.wrapT );
                fracY += 0.5;
            }
            else
                fracY = fracY - 0.5;


            // If the filter is nearest, then return the absolute pixel
            if ( texture.magFilter === TextureFilter.Nearest )
                return data[ ( ( width * clamp( pixY, hHeightLimit, texture.wrapT ) ) + clamp( pixX, hWidthLimit, texture.wrapS ) ) * componentSize ] / 255;

            // Texture is linear, so we need to do some bicubic interpolatoion

            // Collects all pixels around the center pixel
            let h: Array<number> = [], i: number = 0, sx: number, sy: number;
            for ( sy = -1; sy <= 2; ++sy )
                for ( sx = -1; sx <= 2; ++sx )
                    h[ i++ ] = data[ ( ( width * clamp( pixY + sy, hHeightLimit, texture.wrapT ) ) + clamp( pixX + sx, hWidthLimit, texture.wrapS ) ) * componentSize ];

            // Gets an average pixel value by assessing each of the pixels around the center pixel
            return catmul(
                catmul( h[ 0 ], h[ 1 ], h[ 2 ], h[ 3 ], fracX ),
                catmul( h[ 4 ], h[ 5 ], h[ 6 ], h[ 7 ], fracX ),
                catmul( h[ 8 ], h[ 9 ], h[ 10 ], h[ 11 ], fracX ),
                catmul( h[ 12 ], h[ 13 ], h[ 14 ], h[ 15 ], fracX ),
                fracY ) / 255.0;


        }

        private heightRayDelta( lambda: number, rayDirX: number, rayDirY: number, rayDirZ: number, rayOriginX: number, rayOriginY: number, rayOriginZ: number ): number {
            // Project the ray along its direction by the lamda
            rayDirX = rayDirX * lambda + rayOriginX;
            rayDirY = rayDirY * lambda + rayOriginY;
            rayDirZ = rayDirZ * lambda + rayOriginZ;

            // Now we are at some point along the ray - lets get the grid height at that point
            const gridHeight: number = this.getHeight( rayDirX, rayDirZ );

            return gridHeight - rayDirY;
        }

        private zeroCrossing( lower: number, upper: number, rayDirX: number, rayDirY: number, rayDirZ: number, rayOriginX: number, rayOriginY: number, rayOriginZ: number, iterations: number = 4 ) {
            const fnLower: number = this.heightRayDelta( lower, rayDirX, rayDirY, rayDirZ, rayOriginX, rayOriginY, rayOriginZ );
            const fnUpper: number = this.heightRayDelta( upper, rayDirX, rayDirY, rayDirZ, rayOriginX, rayOriginY, rayOriginZ );

            // Approximate the function as a line.
            const gradient: number = ( fnUpper - fnLower ) / ( upper - lower );
            const constant: number = fnLower - gradient * lower;
            const crossing: number = -constant / gradient;
            if ( iterations <= 1 )
                return crossing;

            const fnCrossing: number = this.heightRayDelta( crossing, rayDirX, rayDirY, rayDirZ, rayOriginX, rayOriginY, rayOriginZ );
            if ( fnCrossing < 0 )
                return this.zeroCrossing( crossing, upper, rayDirX, rayDirY, rayDirZ, rayOriginX, rayOriginY, rayOriginZ, iterations - 1 );
            else
                return this.zeroCrossing( lower, crossing, rayDirX, rayDirY, rayDirZ, rayOriginX, rayOriginY, rayOriginZ, iterations - 1 );
        }

		/**
		* Returns an intersection with the grid against a Ray
		* @param {Ray} ray The ray we are testing
		* returns {Intersection} Returns the intersection or null
		*/
        intersectRay( ray: Ray ): Intersection {
            // lamda defines how far down the ray we are sampling
            let lambda: number = 0;

            // Increments the lamda along the Ray direction by a given step
            let step: number = 0.2

            let nextLambda: number;

            const dX = ray.direction.x, dY = ray.direction.y, dZ = ray.direction.z,
                oX = ray.origin.x, oY = ray.origin.y, oZ = ray.origin.z;

            // We test the ray along a max distance of 200,000 units
            while ( lambda < 200000 ) {
                nextLambda = lambda + step
                if ( this.heightRayDelta( nextLambda, dX, dY, dZ, oX, oY, oZ ) > 0 ) {
                    lambda = this.zeroCrossing( lambda, nextLambda, dX, dY, dZ, oX, oY, oZ );

                    // Get the contact Vec of the grid against the grid based on the lamda along the ray
                    const rayProjX: number = dX * lambda + oX;
                    const rayProjY: number = dY * lambda + oY;
                    const rayProjZ: number = dZ * lambda + oZ;
                    const contact: Vec3 = new Vec3( rayProjX, this.getHeight( rayProjX, rayProjZ ), rayProjZ );

                    this._intersection.distance = lambda;
                    this._intersection.point = contact;
                    this._intersection.object = this._grid;
                    return this._intersection;
                }

                lambda = nextLambda;

                // Increment the step each time as the grid could potentially be huge
                step *= 1.1;
            }

            return null;
        }
    }
}