namespace Trike {
	/**
	* Builds the shaders of the materials used in the passes
	*/
    export class ShaderPassBuilder {
        private static _singleton: ShaderPassBuilder;

        constructor() {
            ShaderPassBuilder._singleton = this;
        }


        buildPassShaders( materials: { [ pass: number ]: MaterialMulti; }) {
            let material: MaterialMulti;

            for ( const m in materials ) {
                material = materials[ m ];
            }
        }

        static getSingleton( customBuilder?: ShaderPassBuilder ): ShaderPassBuilder {
            if ( !ShaderPassBuilder._singleton )
                new ShaderPassBuilder();

            return ShaderPassBuilder._singleton;
        }
    }
}