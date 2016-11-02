namespace Trike {
	/**
	* Creates a mesh with a plane that is always facing the camera. This is achieved through the MaterialSprite shader.
	*/
    export class Sprite extends Mesh {
        private static _geom: GeometryPlane;
        private static _count: number = 0;

		/**
		* Creates an instance
		*/
        constructor( material: MaterialSprite ) {
            if ( !Sprite._geom )
                Sprite._geom = new GeometryPlane( 1, 1, 1, 1 );

            Sprite._count++;
            super( material, Sprite._geom );
        }

		/**
		* Cleans up the sprite and removes any outstanding geometry
		*/
        dispose() {
            super.dispose();
            Sprite._count--;

            if ( Sprite._count === 0 ) {
                Sprite._geom.dispose();
                Sprite._geom = null;
            }
        }
    }
}