namespace Trike {
    export class FrustumCorners {
        public farTopLeft: Vec3;
        public farTopRight: Vec3;
        public farBottomLeft: Vec3;
        public farBottomRight: Vec3;
        public nearTopLeft: Vec3;
        public nearTopRight: Vec3;
        public nearBottomLeft: Vec3;
        public nearBottomRight: Vec3;
        public cornerUniform: UniformArray<Vec3>;
        private _t: Vec4 = new Vec4();

        constructor() {
            this.farTopLeft = new Vec3();
            this.farTopRight = new Vec3();
            this.farBottomLeft = new Vec3();
            this.farBottomRight = new Vec3();
            this.nearTopLeft = new Vec3();
            this.nearTopRight = new Vec3();
            this.nearBottomLeft = new Vec3();
            this.nearBottomRight = new Vec3();
            this.cornerUniform = new UniformArray<Vec3>( [
                this.farTopLeft, this.farTopRight, this.farBottomLeft, this.farBottomRight,
                this.nearTopLeft, this.nearTopRight, this.nearBottomLeft, this.nearBottomRight
            ], 3 );
        }

		/**
		* Applies a transformation matrix to the corners.
		* @param {Matrix4} matrix
		* @returns {FrustumCorners}
		*/
        applyMatrix( matrix: Matrix4 ): FrustumCorners {
            this.farTopLeft.applyMatrix4( matrix );
            this.farBottomRight.applyMatrix4( matrix );
            this.farTopRight.applyMatrix4( matrix );
            this.farBottomLeft.applyMatrix4( matrix );
            this.nearTopLeft.applyMatrix4( matrix );
            this.nearBottomRight.applyMatrix4( matrix );
            this.nearTopRight.applyMatrix4( matrix );
            this.nearBottomLeft.applyMatrix4( matrix );

            return this;
        }

		/**
		* Applies a direction matrix to the corners.
		* @param {Matrix4} matrix
		* @returns {FrustumCorners}
		*/
        transformDirection( matrix: Matrix4 ): FrustumCorners {
            this.farTopLeft.transformDirection( matrix );
            this.farBottomRight.transformDirection( matrix );
            this.farTopRight.transformDirection( matrix );
            this.farBottomLeft.transformDirection( matrix );
            this.nearTopLeft.transformDirection( matrix );
            this.nearBottomRight.transformDirection( matrix );
            this.nearTopRight.transformDirection( matrix );
            this.nearBottomLeft.transformDirection( matrix );

            return this;
        }

		/**
		* Gets the frustum's 8 vertices that make up the near and far plane corners of the camera.
		* @param {Camera} camera
		* @returns {FrustumCorners}
		*/
        setFrustumCorners( camera: Camera ): FrustumCorners {
            let pCam: CameraPerspective;
            let oCam: CameraOrthographic;

            if ( camera instanceof CameraCombined )
                camera = ( <CameraCombined>camera ).activeCamera;

            if ( camera instanceof CameraPerspective )
                pCam = <CameraPerspective>camera;
            else if ( camera instanceof CameraOrthographic )
                oCam = <CameraOrthographic>camera;

            const near: number = ( pCam ? pCam.near : oCam.near );
            const far: number = ( pCam ? pCam.far : oCam.far );
            let hNear: number, wNear: number, hFar: number, wFar: number;

            if ( pCam ) {
                const fov: number = pCam.fov;

                hNear = 2 * Math.tan( fov * Math.PI / 180 / 2 ) * near; // height
                wNear = hNear * pCam.aspect; // width

                // Far Plane dimensions
                hFar = 2 * Math.tan( fov * Math.PI / 180 / 2 ) * far; // height
                wFar = hFar * pCam.aspect; // width
            }
            else {
                wNear = oCam._right - oCam._left;
                wFar = wNear;
            }

            this.farTopLeft.set( -wFar / 2, hFar / 2, -far );
            this.farBottomRight.set( wFar / 2, -hFar / 2, -far );
            this.farTopRight.set( wFar / 2, hFar / 2, -far );
            this.farBottomLeft.set( -wFar / 2, -hFar / 2, -far );
            this.nearTopLeft.set( -wNear / 2, hNear / 2, -near );
            this.nearBottomRight.set( wNear / 2, -hNear / 2, -near );
            this.nearTopRight.set( wNear / 2, hNear / 2, -near );
            this.nearBottomLeft.set( -wNear / 2, -hNear / 2, -near );
            return this;
        }
    }

    export class Frustum {
        public planes: Array<Plane>;

        private static _sphere: Sphere;
        private static _v1: Vec3;
        private static _v2: Vec3;

        constructor( p0?: Plane, p1?: Plane, p2?: Plane, p3?: Plane, p4?: Plane, p5?: Plane ) {
            this.planes = [
                ( p0 !== undefined ) ? p0 : new Plane(),
                ( p1 !== undefined ) ? p1 : new Plane(),
                ( p2 !== undefined ) ? p2 : new Plane(),
                ( p3 !== undefined ) ? p3 : new Plane(),
                ( p4 !== undefined ) ? p4 : new Plane(),
                ( p5 !== undefined ) ? p5 : new Plane()
            ];

            if ( !Frustum._v1 ) {
                Frustum._sphere = new Sphere();
                Frustum._v1 = new Vec3();
                Frustum._v2 = new Vec3();
            }
        }


        set( p0: Plane, p1: Plane, p2: Plane, p3: Plane, p4: Plane, p5: Plane ) {
            const planes = this.planes;
            planes[ 0 ].copy( p0 );
            planes[ 1 ].copy( p1 );
            planes[ 2 ].copy( p2 );
            planes[ 3 ].copy( p3 );
            planes[ 4 ].copy( p4 );
            planes[ 5 ].copy( p5 );
            return this;
        }

		/**
		* Copies the contents of a frustum into this
		* @param {Frustum} frustum Frustum to copy from
		* @returns {Frustum}
		*/
        copy( frustum: Frustum ): Frustum {
            const planes = this.planes;
            for ( let i = 0; i < 6; i++ )
                planes[ i ].copy( frustum.planes[ i ] );

            return this;
        }

		/**
		* Sets the planes of this frustrum to that of the provided matrix
		* @param {Matrix4} m
		* @returns {Frustum}
		*/
        setFromMatrix( m: Matrix4 ): Frustum {
            const planes = this.planes;
            const me = m.elements;
            const me0 = me[ 0 ], me1 = me[ 1 ], me2 = me[ 2 ], me3 = me[ 3 ];
            const me4 = me[ 4 ], me5 = me[ 5 ], me6 = me[ 6 ], me7 = me[ 7 ];
            const me8 = me[ 8 ], me9 = me[ 9 ], me10 = me[ 10 ], me11 = me[ 11 ];
            const me12 = me[ 12 ], me13 = me[ 13 ], me14 = me[ 14 ], me15 = me[ 15 ];

            planes[ 0 ].setComponents( me3 - me0, me7 - me4, me11 - me8, me15 - me12 ).normalize();
            planes[ 1 ].setComponents( me3 + me0, me7 + me4, me11 + me8, me15 + me12 ).normalize();
            planes[ 2 ].setComponents( me3 + me1, me7 + me5, me11 + me9, me15 + me13 ).normalize();
            planes[ 3 ].setComponents( me3 - me1, me7 - me5, me11 - me9, me15 - me13 ).normalize();
            planes[ 4 ].setComponents( me3 - me2, me7 - me6, me11 - me10, me15 - me14 ).normalize();
            planes[ 5 ].setComponents( me3 + me2, me7 + me6, me11 + me10, me15 + me14 ).normalize();

            return this;
        }

        intersectsObject( object: Mesh ): boolean {
            // const sphere = Frustum._sphere;

            // const geometry = object.geometry;
            // if ( geometry.boundingSphere === null )
            //  geometry.computeBoundingSphere();



            // sphere.copy( geometry.boundingSphere );
            // sphere.applyMatrix4( object.worldMatrix );
            return this.intersectsSphere( object._worldSphere );
        }

		/**
		* Checks if this frustum intersects a sphere. Returns true if the frustum contains the sphere
		* @param {Sphere} sphere
		* @returns {boolean}
		*/
        intersectsSphere( sphere: Sphere ): boolean {
            const planes = this.planes;
            const center = sphere.center;
            const negRadius = -sphere.radius;

            for ( let i = 0; i < 6; i++ ) {
                const distance = planes[ i ].distanceToPoint( center );
                if ( distance < negRadius ) {
                    return false;
                }
            }

            return true;
        }


		/**
		* Checks if this frustum intersects a box 3d. Returns true if the frustum contains the box
		* @param {Box3} box
		* @returns {boolean}
		*/
        intersectsBox( box: Box3 ): boolean {
            const p1 = Frustum._v1,
                p2 = Frustum._v2;

            const planes = this.planes;

            for ( let i = 0; i < 6; i++ ) {
                const plane = planes[ i ];

                p1.x = plane.normal.x > 0 ? box.min.x : box.max.x;
                p2.x = plane.normal.x > 0 ? box.max.x : box.min.x;
                p1.y = plane.normal.y > 0 ? box.min.y : box.max.y;
                p2.y = plane.normal.y > 0 ? box.max.y : box.min.y;
                p1.z = plane.normal.z > 0 ? box.min.z : box.max.z;
                p2.z = plane.normal.z > 0 ? box.max.z : box.min.z;

                const d1 = plane.distanceToPoint( p1 );
                const d2 = plane.distanceToPoint( p2 );

                // if both outside plane, no intersection
                if ( d1 < 0 && d2 < 0 ) {
                    return false;
                }
            }

            return true;
        }


		/**
		* Checks if this frustum contains a point. Returns true if the frustum contains the point.
		* @param {Vec3} point
		* @returns {boolean}
		*/
        containsPoint( point: Vec3 ): boolean {
            const planes = this.planes;

            for ( let i = 0; i < 6; i++ )
                if ( planes[ i ].distanceToPoint( point ) < 0 )
                    return false;

            return true;
        }

		/**
		* Returns a clone of this frustum
		* @returns {Frustum}
		*/
        clone(): Frustum {
            return new Frustum().copy( this );
        }
    }
}