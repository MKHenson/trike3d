namespace Trike {

	/**
	* The base class for all render passes.
	*/
    export class RenderPass {
        public renderTarget: RenderTarget;
        public material: MaterialMulti;
        public camera: Camera;
        public passType: number;
        public reflectionPass: boolean;
        public reflectionClipPlane: Vec4;
        public disposed: boolean;

		/**
		* Creates an instance of the RenderPass
		* @param {MaterialMulti} material The overriding material to use when using this pass. This is optional and the default is null.
		* @param {RenderTarget} renderTarget The render target we are drawing to. Null will draw to the screen.
		* @param {number} passType The numerical ID of this pass. The default is PassType.Colors
		*/
        constructor( material: MaterialMulti, renderTarget: RenderTarget, passType: number ) {
            this.renderTarget = renderTarget;
            this.material = material;
            this.camera = null;
            this.passType = passType;
            this.reflectionPass = false;
            this.disposed = false;
            this.reflectionClipPlane = new Vec4();
        }

		/**
		* Resizes the render target, if present, in this pass
		* @param {number} width The width of the render target
		* @param {height} width The height of the render target
		*/
        resize( width: number, height: number ) {
            if ( this.renderTarget )
                this.renderTarget.resize( width, height );
        }

		/**
		* Called just before a mesh is drawn
		* @param {Camera} mesh The Mesh we are about to draw
		* @return {boolean}
		*/
        evaluateMesh( mesh: Mesh ): boolean {
            const material: MaterialMulti = this.material;
            const meshMat: MaterialMulti = mesh.material;

            if ( material && meshMat )
                this.material.wireframe = meshMat.wireframe;

            if ( meshMat ) {
                if ( this.reflectionPass ) {
                    if ( meshMat._uniforms[ 'flipUV' ] )
                        meshMat.setUniform( 'flipUV', 1, true );

                    if ( meshMat._uniforms[ 'customClipping' ] ) {
                        meshMat.setUniform( 'customClipping', 1.0, true );
                        meshMat.setUniform( 'customClipPlane', this.reflectionClipPlane, true );
                    }

                }
                else {
                    if ( meshMat._uniforms[ 'flipUV' ] )
                        meshMat.setUniform( 'flipUV', 0, true );

                    if ( meshMat._uniforms[ 'customClipping' ] )
                        meshMat.setUniform( 'customClipping', 0.0, true );
                }
            }

            return true;
        }

		/**
		* Cleans up the variables
		*/
        dispose() {
            if ( this.renderTarget )
                this.renderTarget.dispose();
            if ( this.material )
                this.material.dispose();
            this.renderTarget = null;
            this.material = null;
            this.camera = null;
            this.disposed = true;
        }
    }
}