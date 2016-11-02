namespace Trike {
    export type UniformValue = string | number | boolean | Vec3 | Vec2 | Vec4 | Matrix3 | Matrix4 | Quat | Color | ShaderTexture | Array<number> | UniformArray<Vec2> | UniformArray<Vec3> | UniformArray<Vec4> | UniformArray<Matrix3> | UniformArray<Matrix4> | UniformArray<TextureBase> | TextureBase;

    export enum MultiMaterialOptions {
        None = 0,
        CreateDefaults = 1,
        CreateGBuffer = 2,
        CreateGBuffer2 = 4,
        CreateShadowLightPass = 8,
        CreateShadowPass = 16
    }

	/**
	* Wrapper class for uniform variables that the material has a reference to.
	*/
    export class UniformVar {
        public name: string;
        public value: any;
        public type: UniformType;
        public location: WebGLUniformLocation;
        public common: boolean;
        public requiresUpdate: boolean;

		/**
		* Creates an instance of the UniformVar
		* @param {string} name The name of the uniform
		* @param {UniformType} type The type of uniform
		* @param {WebGLUniformLocation} [Optional] location The webgl location
		*/
        constructor( name: string, type: UniformType, value?: any, location?: WebGLUniformLocation ) {
            this.requiresUpdate = true;
            this.name = name;


            if ( value !== undefined )
                this.value = value;
            else {
                // Create defaults
                switch ( type ) {
                    case UniformType.MAT3:
                        this.value = new Matrix3();
                        break;
                    case UniformType.MAT4:
                        this.value = new Matrix4();
                        break;
                    case UniformType.INT:
                        this.value = 0;
                        break;
                    case UniformType.FLOAT:
                        this.value = 0.0;
                        break;
                    case UniformType.FLOAT2:
                        this.value = new Vec2( 0.0, 0.0 );
                        break;
                    case UniformType.FLOAT2_ARRAY:
                        this.value = new UniformArray<Vec2>( [ new Vec2() ], 2 );
                        break;
                    case UniformType.FLOAT3:
                        this.value = new Vec3( 0.0, 0.0, 0.0 );
                        break;
                    case UniformType.FLOAT4:
                        this.value = new Vec4( 0.0, 0.0, 0.0, 0.0 );
                        break;
                    case UniformType.FLOAT_ARRAY:
                    case UniformType.INT_ARRAY:
                        this.value = [ 0 ];
                        break;
                    case UniformType.FLOAT3_ARRAY:
                        this.value = new UniformArray<Vec3>( [ new Vec3() ], 3 );
                        break;
                    case UniformType.FLOAT4_ARRAY:
                        this.value = new UniformArray<Vec4>( [ new Vec4() ], 4 );
                        break;
                    case UniformType.MAT3_ARRAY:
                        this.value = new UniformArray<Matrix3>( [ new Matrix3() ], 9 );
                        break;
                    case UniformType.MAT4_ARRAY:
                        this.value = new UniformArray<Matrix4>( [ new Matrix4() ], 16 );
                        break;
                    case UniformType.TEXTURE_ARRAY:
                        this.value = new UniformArray<TextureBase>( [], 1 );
                        break;
                    case UniformType.QUAT:
                        this.value = new Quat();
                        break;
                    case UniformType.COLOR3:
                        this.value = new Color( 0xffffff );
                        break;
                    case UniformType.TEXTURE:
                        this.value = <TextureBase>value || null;
                        break;
                }
            }

            this.type = type;
            this.location = location;
        }

        set( val: UniformValue ) {
        }

		/**
		* Clones the uniform variable
		* @returns {UniformVar}
		*/
        clone(): UniformVar {
            const toRet: UniformVar = new UniformVar( this.name, this.type, this.value );
            return toRet;
        }
    }

	/**
	* Wrapper class for attribute variables that the material has a reference to.
	*/
    export class AttributeVar {
        public name: string;
        public type: AttributeType;
        public location: number;

		/**
		* Creates an instance of the AttributeVar
		* @param {string} name The name of the attribute
		* @param {AttributeType} type The type of attribute to add
		* @param {number} [Optional] location The webgl location
		*/
        constructor( name: string, type: AttributeType, location?: number ) {
            this.name = name;
            this.type = type;
            this.location = location;

            const test: string = '';
        }

		/**
		* Clones the uniform variable
		* @returns {AttributeVar}
		*/
        clone(): AttributeVar {
            const toRet: AttributeVar = new AttributeVar( this.name, this.type );
            return toRet;
        }
    }


	/**
	* Base class for all materials. Materials are used to draw 3D polygons in the scene.
	* The MaterialMulti class represents a group of materials that are used at different stages
	* in a render call. In each call, several meshes are drawn - provided they have both geometry and
	* a MaterialMulti. A MaterialMulti class generates the vertex and fragment shaders for all
	* its child materials. Each of the child materials use different define statements and/or
	* uniforms, to accomplish different tasks - but the overall structure of the shaders is the same.
	* The renderer chooses a material based on the RenderPass that's being used. Each render call is
	* made up of different passes that do different things. For example, you can have a color pass,
	* then a normal pass or a depth pass etc... The mesh will often have to be drawn for each of these passes.
	* The currently outlined passes supported in Trike are defined in the PassType enum. Once in the render
	* call, the renderer will check if a sub material is present based on the pass type. I.e...
	* if ( renderPass.passType === GBuffer2 && material.materials[PassType.GBuffer2] )
	*	materialToUse = material.materials[PassType.GBuffer2];
	*
	* If no sub material is found, the render for that mesh on that specific pass is ignored.
	*
	* Some of the more advanced MultiMaterials also create MaterialPasses. These are
	* optional, and are run before the main operations of a render call. They essentially draw
	* the scene using the passes of the material as opposed to the passes of the renderer.
	* This is useful for things like drawing information to a render target that is used later
	* in the more standard passes.
	*/
    export class MaterialMulti extends Trike.EventDispatcher implements IMaterial {
        public static materialPasses: Array<MaterialPass>;
        private static numMaterials: number = 0;

        public receivesShadows: boolean;
        public requiresBuild: boolean;
        public sourceFactor: PixelFactor;
        public destinationFactor: PixelFactor;
        public blendEquation: BlendEquation;
        public _uniforms: { [ s: string ]: UniformVar; };
        public _attributes: { [ s: number ]: AttributeVar; };
        public _defines: Array<string>;
        public _shaderTextures: Array<ShaderTexture>;

        private _transparent: boolean;
        private _cullMode: CullFormat;
        private _skinning: boolean;
        private _numInfluences: number;
        private _materials: { [ pass: number ]: PassMaterial; };
        private _vertexSource: string;
        private _fragmentSource: string;
        private _error: boolean;
        private _compileStatus: string;
        private _vertShader: WebGLShader;
        private _fragShader: WebGLShader;
        private _program: WebGLProgram;
        private _blendMode: BlendMode;
        private _wireframe: boolean;
        private _depthWrite: boolean;
        private _depthRead: boolean;
        private _precision: ShaderPrecision;

        // Shadow mapping
        private _maxNumShadows: number;
        private _shadowFilter: ShadowQuality;
        private _shadowType: ShadowSoftener;

        // Used as an override
        private _rawVertexSource: string;
        private _rawFragmentSource: string;

		/**
		* Creates an instance of the material
		* @param {boolean} createPassMaterials If true, submaterials will be generated
		*/
        constructor( defaultSubMaterials: MultiMaterialOptions = MultiMaterialOptions.CreateDefaults ) {
            super();

            if ( MaterialMulti.numMaterials === 0 )
                MaterialMulti.materialPasses = [];

            MaterialMulti.numMaterials++;

            this._transparent = false;
            this._vertexSource = '';
            this._fragmentSource = '';
            this._rawVertexSource = '';
            this._rawFragmentSource = '';
            this._error = false;
            this._compileStatus = '';
            this._vertShader = null;
            this._fragShader = null;
            this._program = null;
            this._skinning = false;
            this.sourceFactor = PixelFactor.SourceAlpha;
            this.destinationFactor = PixelFactor.One;
            this._blendMode = BlendMode.None;
            this._numInfluences = -1;

            // Shadow mapping
            this._maxNumShadows = 0;
            this._shadowFilter = ShadowQuality.Low;
            this._shadowType = ShadowSoftener.None;

            this.receivesShadows = false;
            this._uniforms = {};
            this._attributes = {};
            this._materials = {};
            this._defines = [];
            this._shaderTextures = [];

            this.requiresBuild = true;
            this._cullMode = CullFormat.Back;
            this._depthWrite = true;
            this._depthRead = true;
            this._wireframe = false;

            // Create the standard GBuffer
            if ( Utils.checkFlag( defaultSubMaterials, MultiMaterialOptions.CreateGBuffer ) ||
                Utils.checkFlag( defaultSubMaterials, MultiMaterialOptions.CreateDefaults ) ) {
                this._materials[ PassType.GBuffer ] = new PassMaterial( 'GBuffer', this );
                this._materials[ PassType.GBuffer ].addDefine( ShaderDefines.PASS_GBUFFER );
            }

            // Create the standard GBuffer2
            if ( Utils.checkFlag( defaultSubMaterials, MultiMaterialOptions.CreateGBuffer2 ) ||
                Utils.checkFlag( defaultSubMaterials, MultiMaterialOptions.CreateDefaults ) ) {
                this._materials[ PassType.GBuffer2 ] = new PassMaterial( 'GBuffer2', this );
                this._materials[ PassType.GBuffer2 ].addDefine( ShaderDefines.ATTR_NORMAL );
                this._materials[ PassType.GBuffer2 ].addAttribute( new AttributeVar( 'normal', Trike.AttributeType.NORMAL ) );
                this._materials[ PassType.GBuffer2 ].addUniform( new UniformVar( 'normalMatrix', UniformType.MAT3, new Matrix3() ) );
                this._materials[ PassType.GBuffer2 ].addDefine( ShaderDefines.PASS_GBUFFER2 );
            }

            // Create the shadow buffer
            if ( Utils.checkFlag( defaultSubMaterials, MultiMaterialOptions.CreateShadowLightPass ) ||
                Utils.checkFlag( defaultSubMaterials, MultiMaterialOptions.CreateDefaults ) ) {
                this._materials[ PassType.ShadowLightPass ] = new PassMaterial( 'ShadowLightPass', this );
                this._materials[ PassType.ShadowLightPass ].addDefine( ShaderDefines.PASS_SHADOW );
            }

            this._precision = ShaderPrecision.HIGH;
        }


		/*
		* Sets the vertex and fragment shaders for this material as well as any pass materials
		* @param {string} vShader the vertex shader
		* @param {string} fShader the fragment shader
		*/
        setShaders( vShader: string, fShader: string ) {
            this._vertexSource = vShader;
            this._fragmentSource = fShader;

            const materials: { [ pass: number ]: PassMaterial; } = this._materials;
            for ( const m in materials )
                materials[ m ].setShaders( vShader, fShader );

            const builder: ShaderPassBuilder = ShaderPassBuilder.getSingleton();
            builder.buildPassShaders( materials );

            this.requiresBuild = true;
        }

		/**
		* Sets the material shader source code for the vertex and fragment shaders. Will trigger the material
		* to be re-built.
		*/
        createShaders() {
            this.requiresBuild = true;

            let vShader: string = '';
            let fShader: string = '';
            let defines: string = '';
            const precision: string = this.precision.toString();

            // Add the defines
            for ( let i = 0, dlen = this._defines.length; i < dlen; i++ )
                defines += this._defines[ i ] + '\n';

            // Name the shader
            vShader += '// Material - ' + ( this instanceof PassMaterial ? ( <PassMaterial>this ).parentMaterial.constructor.name + ' (' + ( <PassMaterial>this ).type + ')' : this.constructor.name ) + '  -  (vertex shader)\n\n';

            // Prepende capabilities to the fragment shader
            vShader += 'precision ' + precision + ' float;\n';
            vShader += 'precision ' + precision + ' int;\n\n';

            vShader += defines;
            vShader += this._vertexSource;

            fShader += '// Material - ' + ( this instanceof PassMaterial ? ( <PassMaterial>this ).parentMaterial.constructor.name + ' (' + ( <PassMaterial>this ).type + ')' : this.constructor.name ) + '  -  (fragment shader)\n\n';

            // Prepende capabilities to the fragment shader
            fShader += 'precision ' + precision + ' float;\n';
            fShader += 'precision ' + precision + ' int;\n\n';


            // Add the frag shader structures
            fShader += defines;
            fShader += this._fragmentSource;

            this._rawVertexSource = vShader;
            this._rawFragmentSource = fShader;
        }

		/**
		* Adds a uniform to this material. Will trigger the material to be re-built.
		* @param {UniformVar} val The Uniformconst to add
		* @param {boolean} shared If true, this uniform is added to all sub materials as well
		*/
        addUniform( val: UniformVar, shared: boolean = true ) {
            const uniforms = this._uniforms;
            uniforms[ val.name ] = val;
            this.requiresBuild = true;
            const shaderTs = this._shaderTextures;

            // Check for shader textures
            if ( val.type === UniformType.TEXTURE && val.value instanceof ShaderTexture && shaderTs.indexOf( val.value ) === -1 )
                shaderTs.push( val.value );

            if ( shared ) {
                const materials: { [ pass: number ]: PassMaterial; } = this._materials;
                for ( const m in materials )
                    materials[ m ].addUniform( val.clone() );
            }
        }

		/**
		* Removes a uniform from this material. Will trigger the material to be re-built.
		* @param {string} name The name of the uniform
		* @param {boolean} shared If true, this uniform is added to all sub materials as well
		*/
        removeUniform( name: string, shared: boolean = true ) {
            const uniforms = this._uniforms;
            const uniform = uniforms[ name ];

            if ( !uniforms[ name ] )
                return;

            delete uniforms[ name ];
            this.requiresBuild = true;

            const shaderTs = this._shaderTextures;

            // Check for shader textures
            if ( uniform && uniform.type === UniformType.TEXTURE && uniform.value instanceof ShaderTexture && shaderTs.indexOf( uniform.value ) !== -1 )
                shaderTs.splice( shaderTs.indexOf( uniform.value ), 1 );

            if ( shared ) {
                const materials: { [ pass: number ]: PassMaterial; } = this._materials;
                for ( const m in materials )
                    materials[ m ].removeUniform( name );
            }
        }

		/**
		* Adds an attribute to this material. Will trigger the material to be re-built.
		* @param {AttributeVar} val The attribute to add to this material and its children
		* @param {boolean} shared If true, the attribute will be added to all sub materials
		*/
        addAttribute( val: AttributeVar, shared: boolean = true ) {
            const attributes = this._attributes;
            attributes[ val.type ] = val;
            this.requiresBuild = true;

            if ( shared ) {
                const materials: { [ pass: number ]: PassMaterial; } = this._materials;
                for ( const m in materials )
                    materials[ m ].addAttribute( val.clone() );
            }
        }


		/**
		* Removes an attribute from this material. Will trigger the material to be re-built.
		* @param {AttributeType} val The attribute type to remove from this material and its children
		* @param {boolean} shared If true, the attribute will be removed from all sub materials
		*/
        removeAttribute( type: AttributeType, shared: boolean = true ) {
            const attributes = this._attributes;
            delete attributes[ type ];
            this.requiresBuild = true;

            if ( shared ) {
                const materials: { [ pass: number ]: PassMaterial; } = this._materials;
                for ( const m in materials )
                    materials[ m ].removeAttribute( type );
            }
        }

		/**
		* Checks if the material has a define command. Does not apply to sub materials.
		* @param {ShaderDefines|string|any} val
		*/
        hasDefine( val: ShaderDefines ): boolean
        hasDefine( val: string ): boolean
        hasDefine( val: any ): boolean {
            const defines = this._defines;

            const index = defines.indexOf( val.toString() );
            if ( index === -1 )
                return false;

            return true;
        }

		/**
		* Sets the material define macros. Will trigger the material to be re-built.
		* @param {any|Array<string>|Array<ShaderDefines>} val
		*/
        setDefines( val: Array<ShaderDefines> )
        setDefines( val: Array<string> )
        setDefines( val: any ) {
            this._defines = [];

            for ( let i = 0, len = val.length; i < len; i++ )
                if ( val[ i ] instanceof ShaderDefines )
                    this._defines.push( val[ i ].toString() );
                else
                    this._defines.push( val[ i ] );

            this.requiresBuild = true;

            const materials: { [ pass: number ]: PassMaterial; } = this._materials;
            for ( const m in materials )
                materials[ m ].setDefines( val );

            const builder: ShaderPassBuilder = ShaderPassBuilder.getSingleton();
            builder.buildPassShaders( materials );
        }


		/**
		* Adds a define to the shaders. Will trigger a rebuild.
		* @param {any|Array<string>|Array<ShaderDefines>} val
		*/
        addDefine( val: ShaderDefines )
        addDefine( val: string )
        addDefine( val: any ) {
            const defines = this._defines;

            const index = defines.indexOf( val.toString() );
            if ( index !== -1 )
                return;

            defines.push( val.toString() );
            this.requiresBuild = true;

            const materials: { [ pass: number ]: PassMaterial; } = this._materials;
            for ( const m in materials )
                materials[ m ].addDefine( val );
        }


		/**
		* Removes a define from the shaders. Will trigger a rebuild.
		* @param {any|Array<string>|Array<ShaderDefines>} val
		*/
        removeDefine( val: ShaderDefines )
        removeDefine( val: string )
        removeDefine( val: any ) {
            const defines = this._defines;

            const index = defines.indexOf( val.toString() );
            if ( index === -1 )
                return;

            defines.splice( index, 1 );
            this.requiresBuild = true;

            const materials: { [ pass: number ]: PassMaterial; } = this._materials;
            for ( const m in materials )
                materials[ m ].removeDefine( val );
        }


		/**
		* Use this function to set a uniform value on the material.
		* @param {string} name The name of the uniform
		* @param {any} val The new value of the uniform
		* @param {boolean} shared If true, then this value should be applied to all child materials
		*/
        setUniform( name: string, val: any, shared: boolean = true ): UniformVar {
            //  if (this instanceof PassMaterial === false && shared === false)
            //      throw 'NOT ALLOWED';

            const uniforms: { [ s: string ]: UniformVar; } = this._uniforms;
            const uniform = uniforms[ name ];
            const shaderTs = this._shaderTextures;

            // If the value is exactly the same, then dont update anything
            if ( uniform.value === val )
                return uniform;

            uniform.requiresUpdate = true;

            // Remove old value from shader texture array
            if ( uniform.type === UniformType.TEXTURE && uniform.value instanceof ShaderTexture && shaderTs.indexOf( uniform.value ) !== -1 )
                shaderTs.splice( shaderTs.indexOf( uniform.value ), 1 );

            // Create defaults
            switch ( uniform.type ) {
                case UniformType.MAT4:
                    if ( ( <Matrix4>uniform.value ).equals( val ) ) { uniform.requiresUpdate = false; return uniform; }
                    ( <Matrix4>uniform.value ).copy( val );
                    break;
                case UniformType.MAT3:
                    if ( ( <Matrix3>uniform.value ).equals( val ) ) { uniform.requiresUpdate = false; return uniform; }
                    ( <Matrix3>uniform.value ).copy( val );
                    break;
                case UniformType.FLOAT3:
                    if ( ( <Vec3>uniform.value ).equals( val ) ) { uniform.requiresUpdate = false; return uniform; }
                    ( <Vec3>uniform.value ).copy( val );
                    break;
                case UniformType.FLOAT4:
                    if ( ( <Vec4>uniform.value ).equals( val ) ) { uniform.requiresUpdate = false; return uniform; }
                    ( <Vec4>uniform.value ).copy( val );
                    break;
                case UniformType.QUAT:
                    ( <Quat>uniform.value ).copy( val );
                    break;
                case UniformType.COLOR3:
                    ( <Color>uniform.value ).copy( val );
                    break;
                case UniformType.FLOAT2:
                    ( <Vec2>uniform.value ).copy( val );
                    break;
                default:
                    uniform.value = val;
                    break;
            }

            // Check for shader textures
            if ( uniform.type === UniformType.TEXTURE && uniform.value instanceof ShaderTexture && shaderTs.indexOf( uniform.value ) === -1 )
                shaderTs.push( uniform.value );

            if ( shared ) {
                const materials: { [ pass: number ]: PassMaterial; } = this._materials;
                for ( let i in materials )
                    materials[ i ].setUniform( name, val, false );
            }

            return uniform;
        }


		/**
		* Compiles the vertex and fragment sources into runnable GPU programs. This is an expensive task
		* and should try to be avoided as much as possible.
		* @param {WebGLRenderingContext} gl The context to compile this material with
		*/
        compile( gl: WebGLRenderingContext ): boolean {
            this._error = false;
            this._compileStatus = '';
            this.requiresBuild = true;

            this.createShaders();

            // Create vertex shader scripts
            this._vertShader = gl.createShader( gl.VERTEX_SHADER );
            const vertexSource: string = this._rawVertexSource;
            const fragmentSource: string = this._rawFragmentSource;


            // Set the source and compile
            gl.shaderSource( this._vertShader, vertexSource );
            gl.compileShader( this._vertShader );

            // Check if the vertex shader was compiled
            if ( !gl.getShaderParameter( this._vertShader, gl.COMPILE_STATUS ) ) {
                this._compileStatus = gl.getShaderInfoLog( this._vertShader );
                Utils.compilerError( this._compileStatus, vertexSource );
                this._error = true;
                return false;
            }

            // Create fragment shader
            this._fragShader = gl.createShader( gl.FRAGMENT_SHADER );

            // Set the source and compile
            gl.shaderSource( this._fragShader, fragmentSource );
            gl.compileShader( this._fragShader );

            // Check if the vertex shader was compiled
            if ( !gl.getShaderParameter( this._fragShader, gl.COMPILE_STATUS ) ) {
                this._compileStatus = gl.getShaderInfoLog( this._fragShader );
                Utils.compilerError( this._compileStatus, fragmentSource );
                this._error = true;
                return false;
            }

            const program: WebGLProgram = gl.createProgram();
            gl.attachShader( program, this._vertShader );
            gl.attachShader( program, this._fragShader );
            gl.linkProgram( program );
            this._program = program;

            let isPassMaterial: boolean = false;
            let passMaterial: PassMaterial;
            if ( this instanceof PassMaterial ) {
                isPassMaterial = true;
                passMaterial = this;
            }

            if ( !gl.getProgramParameter( program, gl.LINK_STATUS ) ) {
                this._compileStatus = gl.getProgramInfoLog( program );
                Utils.compilerError( this._compileStatus, vertexSource + fragmentSource );
                this._error = true;
                return false;
            }

            // Now that the program is compiled, we need to fetch the uniform and attribute locations
            const uniforms: { [ s: string ]: UniformVar; } = this._uniforms;
            const attributes: { [ s: number ]: AttributeVar; } = this._attributes;
            for ( const u in uniforms ) {
                uniforms[ u ].location = gl.getUniformLocation( program, uniforms[ u ].name );
                if ( !uniforms[ u ].location ) {
                    if ( isPassMaterial ) {
                        this._compileStatus = 'A uniform \'' + uniforms[ u ].name + '\' for the material ' + passMaterial.parentMaterial.constructor.name + ' (' + passMaterial.type + ') was not located. The variable might have been removed as an optimization because it was not used in the program. Please check the shader source code and uniform array.';
                        Utils.compilerError( this._compileStatus, '' );
                        return false;
                    }
                    else {
                        this._compileStatus = 'A uniform \'' + uniforms[ u ].name + '\' for the material \'' + this.constructor.name + '\' was not located. The variable might have been removed as an optimization because it was not used in the program. Please check the shader source code and uniform array.';
                        Utils.compilerError( this._compileStatus, '' );
                        return false;
                    }
                }
            }

            for ( const a in attributes )
                if ( attributes[ a ] ) {
                    attributes[ a ].location = gl.getAttribLocation( program, attributes[ a ].name );

                    if ( attributes[ a ].location === -1 ) {
                        if ( isPassMaterial ) {
                            // The uniform is not located in the shader - so remove it
                            delete this._attributes[ a ];
                        }
                        else {
                            this._compileStatus = 'An attribute \'' + attributes[ a ].name + '\' for the material \'' + this.constructor.name + '\' was defined, but doesnt seem to be present in the shader.';
                            Utils.compilerError( this._compileStatus, '' );
                            return false;
                        }
                    }
                }

            this.requiresBuild = false;
            return true;
        }


		/**
		* Cleans up the object.
		*/
        dispose() {
            MaterialMulti.numMaterials--;

            if ( MaterialMulti.numMaterials === 0 ) {
                for ( let i in MaterialMulti.materialPasses )
                    MaterialMulti.materialPasses[ i ].dispose();

                MaterialMulti.materialPasses = null;
            }


            for ( let i in this._materials )
                this._materials[ i ].dispose();

            this._materials = null;

            super.dispose();
        }



		/**
		* Gets the shader precision.
		* @returns {ShaderPrecision}
		*/
        get precision(): ShaderPrecision {
            // 0 = low precision, 1 = medium, 2 = high supported by this graphics card
            const precision: number = Capabilities.getSingleton().precision;
            let val: ShaderDefines = this._precision;

            if ( val === ShaderPrecision.HIGH && precision !== 2 ) {
                if ( precision === 1 )
                    val = ShaderPrecision.MEDIUM;
                else
                    val = ShaderPrecision.LOW;
            }
            if ( val === ShaderPrecision.MEDIUM && precision === 0 )
                val = ShaderPrecision.LOW;

            return val;
        }

		/**
		* Sets the shader precision.
		* @param {ShaderPrecision} val
		*/
        set precision( val: ShaderPrecision ) {
            this._precision = val;
            this.requiresBuild = true;

            const materials: { [ pass: number ]: PassMaterial; } = this._materials;
            for ( let i in materials )
                materials[ i ].precision = val;
        }


		/**
		* Sets if this material uses skinning. This will add/remove the appropriate shader uniforms.
		* @param {boolean} val
		*/
        set skinning( val: boolean ) {
            if ( !this._skinning && val ) {
                this.addAttribute( new AttributeVar( 'skinIndex', AttributeType.SKIN_INDEX ) );
                this.addAttribute( new AttributeVar( 'skinWeight', AttributeType.SKIN_WEIGHT ) );
                this.addUniform( new UniformVar( 'boneTexture', UniformType.TEXTURE ) );
                this.addUniform( new UniformVar( 'boneTextureWidth', UniformType.INT ) );
                this.addUniform( new UniformVar( 'boneTextureHeight', UniformType.INT ) );
                this.addDefine( ShaderDefines.SKINNING );

                if ( this._numInfluences === -1 )
                    this.numInfluences = 2;
            }
            else if ( this._skinning && !val ) {
                this.removeAttribute( AttributeType.SKIN_INDEX );
                this.removeAttribute( AttributeType.SKIN_WEIGHT );
                this.removeUniform( 'boneTexture' );
                this.removeUniform( 'boneTextureWidth' );
                this.removeUniform( 'boneTextureHeight' );
                this.removeDefine( ShaderDefines.SKINNING );
            }

            this._skinning = val;

            const materials: { [ pass: number ]: PassMaterial; } = this._materials;
            for ( let i in materials )
                materials[ i ].skinning = val;
        }

		/**
		* Gets if this material uses skinning
		* @returns {boolean}
		*/
        get skinning(): boolean { return this._skinning; }


		/**
		* Sets the number of bone influences that this material can handle. The default, if none is set, is 2. This cannot be greater than 4 and must
		* be an integer value.
		* @param {number} val
		*/
        set numInfluences( val: number ) {
            this.removeDefine( ShaderDefines.BONE_INFLUENCES_1 );
            this.removeDefine( ShaderDefines.BONE_INFLUENCES_2 );
            this.removeDefine( ShaderDefines.BONE_INFLUENCES_3 );
            this.removeDefine( ShaderDefines.BONE_INFLUENCES_4 );

            if ( val > 4 )
                throw new Error( 'You cannot have more than 4 influences' );

            if ( val === 1 )
                this.addDefine( ShaderDefines.BONE_INFLUENCES_1 );
            if ( val === 2 )
                this.addDefine( ShaderDefines.BONE_INFLUENCES_2 );
            if ( val === 3 )
                this.addDefine( ShaderDefines.BONE_INFLUENCES_3 );
            if ( val === 4 )
                this.addDefine( ShaderDefines.BONE_INFLUENCES_4 );

            this._numInfluences = val;
        }

		/**
		* Gets the number of bone influences that this material can handle.
		* @returns {number} val
		*/
        get numInfluences(): number { return this._numInfluences; }


		/**
		* Sets the blend mode of the material. Blending works on three variables - the source factor, destination factor and blend equation.
		* The source factor can be thought of as the current pixel and the destination is the one that's already in the frame buffer. Typically
		* the equation is to add. The add equation looks something like this:
		*
		* Rresult = Rs * Sr + Rd * Dr
		* Gresult = Gs * Sg + Gd * Dg
		* Bresult = Bs * Sb + Bd * Db
		* Aresult = As * Sa + Ad * Da
		*
		* The source factor is multiplied by the source value and added to the desination value times by its destination factor.
		* In trike there 3 pre-built blend modes. If you want to create your own, simply set this to custom and set the sourceFactor,
		* destinationFactor and blendEquation yourself.
		* @param {BlendMode} val
		*/
        set blendMode( val: BlendMode ) {
            if ( this._blendMode === val )
                return;

            if ( this._blendMode === BlendMode.PremultipliedAlpha )
                this.removeDefine( ShaderDefines.PREMULTIPLIED_ALPHA );

            this._blendMode = val;

            if ( val === BlendMode.Additive ) {
                this.sourceFactor = PixelFactor.SourceAlpha;
                this.destinationFactor = PixelFactor.One;
                this.blendEquation = BlendEquation.Add;
            }
            else if ( val === BlendMode.Subtractive ) {
                this.sourceFactor = PixelFactor.OneMinusSourceColor;
                this.destinationFactor = PixelFactor.Zero;
                this.blendEquation = BlendEquation.Add;
            }
            else if ( val === BlendMode.Multiplication ) {
                this.sourceFactor = PixelFactor.Zero;
                this.destinationFactor = PixelFactor.SourceColor
                this.blendEquation = BlendEquation.Add;
            }
            else if ( val === BlendMode.Normal ) {
                this.sourceFactor = PixelFactor.SourceAlpha;
                this.destinationFactor = PixelFactor.OneMinusSourceAlpha;
                this.blendEquation = BlendEquation.Add;
            }
            else if ( val === BlendMode.PremultipliedAlpha ) {
                this.sourceFactor = PixelFactor.One;
                this.destinationFactor = PixelFactor.OneMinusSourceAlpha;
                this.blendEquation = BlendEquation.Add;
                this.addDefine( ShaderDefines.PREMULTIPLIED_ALPHA );
            }
        }

		/**
		* Gets the current blend mode
		* @returns {BlendMode}
		*/
        get blendMode(): BlendMode { return this._blendMode; }

		/**
		* Gets the vertex shader program
		* @returns {WebGLShader}
		*/
        get vertexShader(): WebGLShader { return this._vertShader; }

		/**
		* Gets the fragment shader program
		* @returns {WebGLShader}
		*/
        get fragmentShader(): WebGLShader { return this._fragShader; }

		/**
		* Gets the glsl program
		* @returns {WebGLProgram}
		*/
        get program(): WebGLProgram { return this._program; }

		/**
		* Gets the status of the compilation
		* @returns {string}
		*/
        get compileStatus(): string { return this._compileStatus; }

		/**
		* Gets the sub materials by their PassType
		* @returns {[pass: number]: PassMaterial}
		*/
        get materials(): { [ pass: number ]: PassMaterial; } { return this._materials; }

		/**
		* Gets if this material is wireframe
		* @returns {boolean}
		*/
        get wireframe(): boolean { return this._wireframe; }

		/**
		* Sets if this material is wireframe
		* @param {boolean} val
		*/
        set wireframe( val: boolean ) {
            this._wireframe = val;

            const materials: { [ pass: number ]: PassMaterial; } = this._materials;
            for ( let i in materials )
                materials[ i ]._wireframe = val;
        }

		/**
		* Gets if this material is writing depth values
		* @returns {boolean}
		*/
        get depthWrite(): boolean { return this._depthWrite; }

		/**
		* Sets if this material is writing depth values
		* @param {boolean} val
		*/
        set depthWrite( val: boolean ) {
            this._depthWrite = val;

            const materials: { [ pass: number ]: PassMaterial; } = this._materials;
            for ( let i in materials )
                materials[ i ]._depthWrite = val;
        }

		/**
		* Gets if this material is reading depth values
		* @returns {boolean}
		*/
        get depthRead(): boolean { return this._depthRead; }

		/**
		* Sets if this material is reading depth values
		* @param {boolean} val
		*/
        set depthRead( val: boolean ) {
            this._depthRead = val;

            const materials: { [ pass: number ]: PassMaterial; } = this._materials;
            for ( let i in materials )
                materials[ i ]._depthRead = val;
        }

		/**
		* Gets material Cull format
		* @returns {CullFormat}
		*/
        get cullMode(): CullFormat { return this._cullMode; }

		/**
		* Sets material Cull format
		* @param {CullFormat} val
		*/
        set cullMode( val: CullFormat ) {
            this._cullMode = val;

            const materials: { [ pass: number ]: PassMaterial; } = this._materials;
            for ( let i in materials )
                materials[ i ].cullMode = val;
        }

		/**
		* Gets if this material is transparent
		* @param {boolean} val
		*/
        get transparent(): boolean { return this._transparent; }

		/**
		* Sets if this material is transparent
		* @param {boolean} val
		*/
        set transparent( val: boolean ) {
            this._transparent = val;

            const materials: { [ pass: number ]: PassMaterial; } = this._materials;
            for ( let i in materials )
                materials[ i ]._transparent = val;
        }

		/*
		* Checks the uniforms or attributes of the material after a potentially breaking change
		*/
        protected _validate() {
        }

		/**
		* Gets or sets the softening filtering method of the shadow map
		* @param val {ShadowSoftener} [Optional]
		* @returns {ShadowSoftener}
		*/
        shadowSoftener( val?: ShadowSoftener ): ShadowSoftener {
            if ( val === undefined ) return this._shadowType;

            this._shadowType = val;

            this.materials[ PassType.GBuffer ].removeDefine( ShaderDefines.SHADOW_FILTER_INTERPOLATED );
            this.materials[ PassType.GBuffer ].removeDefine( ShaderDefines.SHADOW_FILTER_PCF );
            this.materials[ PassType.GBuffer ].removeDefine( ShaderDefines.SHADOW_FILTER_PCF_SOFT );

            if ( val === ShadowSoftener.Interpolated )
                this.materials[ PassType.GBuffer ].addDefine( ShaderDefines.SHADOW_FILTER_INTERPOLATED );
            else if ( val === ShadowSoftener.PCF )
                this.materials[ PassType.GBuffer ].addDefine( ShaderDefines.SHADOW_FILTER_PCF );
            else if ( val === ShadowSoftener.PCFSoft )
                this.materials[ PassType.GBuffer ].addDefine( ShaderDefines.SHADOW_FILTER_PCF_SOFT );

            return val;
        }

		/**
		* Gets or sets the quality of the shadow mapping filtering system
		* @param val {ShadowQuality} [Optional]
		* @returns {ShadowQuality}
		*/
        shadowQuality( val?: ShadowQuality ): ShadowQuality {
            if ( val === undefined ) return this._shadowFilter;

            this._shadowFilter = val;
            if ( this._shadowFilter === ShadowQuality.High ) {
                this.materials[ PassType.GBuffer ].addDefine( ShaderDefines.SHADOW_TYPE_VSM );
                this.materials[ PassType.ShadowLightPass ].addDefine( ShaderDefines.SHADOW_TYPE_VSM );
                this.materials[ PassType.ShadowLightPass ].addDefine( ShaderDefines.STANDARD_DERIVATIVES );
                this.materials[ PassType.ShadowLightPass ].cullMode = CullFormat.Front;
            }
            else {
                this.materials[ PassType.GBuffer ].removeDefine( ShaderDefines.SHADOW_TYPE_VSM );
                this.materials[ PassType.ShadowLightPass ].removeDefine( ShaderDefines.SHADOW_TYPE_VSM );
                this.materials[ PassType.ShadowLightPass ].removeDefine( ShaderDefines.STANDARD_DERIVATIVES );
                this.materials[ PassType.ShadowLightPass ].cullMode = CullFormat.Back;
            }

            return val;
        }

		/**
		* Gets or sets or the number of shadows this material supports
		* @param val {number} [Optional]
		* @returns {number}
		*/
        maxNumShadows( val?: number ): number {
            if ( val === undefined ) return this._maxNumShadows;

            if ( val < 0 ) val = 0;
            if ( this._maxNumShadows === val ) return this._maxNumShadows;

            const gBuffer: PassMaterial = this.materials[ PassType.GBuffer ];
            gBuffer.removeDefine( '#define MAX_SHADOWS ' + this._maxNumShadows.toFixed( 0 ) );

            this._maxNumShadows = val;

            gBuffer.receivesShadows = false;
            gBuffer.removeDefine( ShaderDefines.SHADOW_MAPPING );
            gBuffer.removeUniform( 'shadowMap' );
            gBuffer.removeUniform( 'shadowMapSize' );
            gBuffer.removeUniform( 'shadowBias' );
            gBuffer.removeUniform( 'shadowDarkness' );
            gBuffer.removeUniform( 'shadowMatrix' );
            gBuffer.removeUniform( 'modelMatrix' );

            if ( val > 0 ) {
                const uTextures = new Array<Texture>( val );
                const uShadowSizes = new Array<number>( val );
                const uShadowBiases = new Array<number>( val );
                const uShadowDarknesses = new Array<number>( val );
                const uShadowMatrices = new UniformArray<Matrix4>( new Array<Matrix4>( val ), 16 );

                for ( let i = 0; i < val; i++ ) {
                    uTextures[ i ] = null;
                    uShadowSizes[ i ] = 0;
                    uShadowBiases[ i ] = 0;
                    uShadowDarknesses[ i ] = 0;
                    uShadowMatrices.values[ i ] = new Matrix4();
                }

                gBuffer.receivesShadows = true;
                gBuffer.addUniform( new UniformVar( 'shadowMap', UniformType.TEXTURE_ARRAY, uTextures ) );
                gBuffer.addUniform( new UniformVar( 'shadowMapSize', UniformType.FLOAT_ARRAY, uShadowSizes ) );
                gBuffer.addUniform( new UniformVar( 'shadowBias', UniformType.FLOAT_ARRAY, uShadowBiases ) );
                gBuffer.addUniform( new UniformVar( 'shadowDarkness', UniformType.FLOAT_ARRAY, uShadowDarknesses ) );
                gBuffer.addUniform( new UniformVar( 'modelMatrix', Trike.UniformType.MAT4 ) );
                gBuffer.addUniform( new UniformVar( 'shadowMatrix', UniformType.MAT4_ARRAY, uShadowMatrices ) );
                gBuffer.addDefine( ShaderDefines.SHADOW_MAPPING );
                gBuffer.addDefine( '#define MAX_SHADOWS ' + this._maxNumShadows.toFixed( 0 ) );

                this.shadowQuality( this._shadowFilter );
            }

            this._validate();
        }
    }
}