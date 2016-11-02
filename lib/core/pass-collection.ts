namespace Trike {
    export class PassCollection {
        private _allPasses: Array<RenderPass>;

        public gBufferPass: GBufferPass;
        public gBuffer2Pass: GBuffer2Pass;
        public lightPass: LightPass;
        public tLightPass: LightPass;
        public skyPass: SkyPass;
        public compositionPass: ScreenPass;
        public texturePass: TexturePass;
        public shadowLightPass: ShadowLightPass;
        public shadowMapPass: RenderPass;
        public framePass: FramePass;

        public width: number;
        public height: number;

        constructor() {
            this._allPasses = [];
            this.gBuffer2Pass = null;
            this.gBufferPass = null;
            this.lightPass = null;
            this.tLightPass = null;
            this.skyPass = null;
            this.texturePass = null;
            this.shadowLightPass = null;
            this.shadowMapPass = null;
            this.compositionPass = null;
            this.framePass = null;
        }

        initialize( width: number, height: number ): boolean {
            this.width = width;
            this.height = height;

            this._allPasses = [
                this.gBuffer2Pass = new GBuffer2Pass( width, height ),
                this.gBufferPass = new GBufferPass( width, height ),
                this.lightPass = new LightPass( width, height, false ),
                this.tLightPass = new LightPass( width, height, true ),
                this.skyPass = new SkyPass( null ),
                this.texturePass = new TexturePass(),
                this.shadowLightPass = new ShadowLightPass(),
                this.shadowMapPass = new RenderPass( null, new RenderTarget( width, height, TextureType.UnsignedIntType, TextureWrapping.ClampToEdgeWrapping, TextureWrapping.ClampToEdgeWrapping, TextureFilter.Nearest, TextureFilter.Nearest, TextureFormat.RGBAFormat, 1, true, true ), PassType.ShadowPass ),
                this.compositionPass = new ScreenPass( new RenderTarget( width, height, TextureType.HalfFloatType, TextureWrapping.ClampToEdgeWrapping, TextureWrapping.ClampToEdgeWrapping, TextureFilter.Nearest, TextureFilter.Nearest, TextureFormat.RGBAFormat, 1, true, true ) ),
                this.framePass = new FramePass( this.compositionPass.renderTarget )
            ];

            // The material and light passes share the same depth / stencil buffer as the normal
            this.shadowMapPass.renderTarget.sharedRenderBuffer = this.gBufferPass.renderTarget;
            this.gBuffer2Pass.renderTarget.sharedRenderBuffer = this.gBufferPass.renderTarget;
            this.lightPass.renderTarget.sharedRenderBuffer = this.gBufferPass.renderTarget;
            this.tLightPass.renderTarget.sharedRenderBuffer = this.gBufferPass.renderTarget;
            this.compositionPass.renderTarget.sharedRenderBuffer = this.gBufferPass.renderTarget;

            return true;
        }

		/**
		* Sets the base size for all passes
		* @param {number} width The new width
		* @param {number} height The new height
		*/
        setSize( width: number, height: number ) {
            this.width = width;
            this.height = height;

            for ( let i = 0, l = this._allPasses.length; i < l; i++ )
                this._allPasses[ i ].resize( width, height );
        }

		/**
		* Cleans up the renderer
		*/
        dispose() {
            for ( let i = 0, l = this._allPasses.length; i < l; i++ )
                this._allPasses[ i ].dispose();

            this._allPasses = null;
            this.gBuffer2Pass = null;
            this.gBufferPass = null;
            this.lightPass = null;
            this.tLightPass = null;
            this.skyPass = null;
            this.texturePass = null;
            this.shadowLightPass = null;
            this.shadowMapPass = null;
            this.compositionPass = null;
            this.framePass = null;
        }
    }
}