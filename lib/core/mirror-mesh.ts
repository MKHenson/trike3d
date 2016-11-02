namespace Trike {
	/**
	* A mesh that renders the scene reflected into its mirror render target. This is then applied to its
	* mirror reflective material as a texture
	*/
    export class MirrorMesh extends Mesh implements IMirrorMesh {
        private _mirror: Mirror;

		/**
		* Creates an instance of the mirror mesh
		*/
        constructor( material: IReflectiveMaterial, geom: Geometry ) {
            super( <MaterialMulti><IMaterial>material, geom );
            this._mirror = new Mirror( material );
            this.add( this._mirror );
        }

		/**
		* Use this function to replace the material of this mesh
		* @param {MaterialMulti} val
		*/
        setMaterial( material: MaterialMulti ) {
            super.setMaterial( material );
            this._mirror.material = <IReflectiveMaterial><IMaterial>material;
        }

		/**
		* Gets the mesh's mirror
		* @returns {Mirror}
		*/
        get mirror(): Mirror { return this._mirror; }

		/**
		* Cleans up the object.
		*/
        dispose() {
            this._mirror.dispose();
            this._mirror = null;
            super.dispose();
        }
    }
}