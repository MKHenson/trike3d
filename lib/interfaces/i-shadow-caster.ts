namespace Trike {
	/**
	* Interface for lights that cast shadows
	*/
    export interface IShadowCaster {
		/**
		* Gets the render target that this light draws its shadows onto
		* @returns {RenderTarget}
		*/
        shadowMap(): RenderTarget;

		/**
		* Gets the shadow matrix of this light
		* @returns {Matrix4}
		*/
        shadowMatrix(): Matrix4;

		/**
		* Gets the camera used to draw the shadows of this light
		* @returns {Camera}
		*/
        shadowCamera(): Camera;

		/**
		* Gets or sets if this light does shadow mapping
		* @param {boolean} val
		* @returns {boolean}
		*/
        shadowMapping( val?: boolean ): boolean;

		/**
		* Gets the shadow map size
		* @param {number} val
		* @returns {number}
		*/
        shadowMapSize( val?: number ): number;

		/**
		* Gets the shadow darkness
		* @param {number} val
		* @returns {number}
		*/
        shadowDarkness( val?: number ): number;

		/**
		* Gets the shadow bias
		* @param {number} val
		* @returns {number}
		*/
        shadowBias( val?: number ): number;
    }
}