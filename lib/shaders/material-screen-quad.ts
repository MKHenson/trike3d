namespace Trike {
	/**
	* An extremely basic material used for rendering a texture onto screen quads
	*/
    export class MaterialScreenQuad extends MaterialMulti {
        private _map: Texture;

        constructor() {
            // Call the material base
            super( MultiMaterialOptions.CreateGBuffer );

            this._map = null;

            // Define the common uniforms of the material
            this.addUniform( new UniformVar( 'modelViewMatrix', Trike.UniformType.MAT4 ), true );
            this.addUniform( new UniformVar( 'projectionMatrix', Trike.UniformType.MAT4 ), true );
            this.addUniform( new UniformVar( 'map', Trike.UniformType.TEXTURE ), true );

            // Define the attributes sent from the buffers
            this.addAttribute( new AttributeVar( 'position', Trike.AttributeType.POSITION ) );
            this.addAttribute( new AttributeVar( 'uv', Trike.AttributeType.UV ) );

            // Any define macros
            this.addDefine( ShaderDefines.ATTR_POSITION );
            this.addDefine( ShaderDefines.ATTR_UV );
        }
    }
}