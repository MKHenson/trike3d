namespace Trike {
	/*
	* A specialized scene class, designed for drawing screen quads
	*/
    export class SceneScreenQuad extends Scene {
        public camera: CameraOrthographic;
        public quad: Mesh;

        constructor() {
            super();

            this.quad = new Mesh( new MaterialScreenQuad(), new GeometryScreenPlane() );
            this.camera = new CameraOrthographic( -1, 1, 1, - 1, 0, 1 );
            this.add( this.quad );
        }

        /** Returns the material applied to the quad mesh */
        get material(): MaterialMulti { return this.quad.material; }
    }
}