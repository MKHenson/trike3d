namespace Trike {
    /**
	* The type of fog algorithm to use when drawing fog
	*/
    export enum FogType {
        None,
        Linear,
        Log,
        HeightBased
    }

	/**
	* Describes the tone mapping to use on the scene.
	* See:
	* http://alteredqualia.com/three/examples/webgl_deferred_postprocessing.html &
	* http://filmicgames.com/archives/75
	* http://www.slideshare.net/ozlael/hable-john-uncharted2-hdr-lighting
	*/
    export enum ToneMapper {
        None,
        Simple,
        Linear,
        Reinhard,
        Filmic,
        Uncharted
    }

	/**
	* The quality of shadow filtering
	*/
    export enum ShadowQuality {
        Low,
        High
    }

	/**
	* Describes the type of shadow mapping filters to use
	*/
    export enum ShadowSoftener {
        None,
        Interpolated,
        PCF,
        PCFSoft
    }

	/**
	* The method used to sample the chrome texture
	*/
    export enum ChromeDirection {
        Reflective,
        Refractive
    }

    /**
	* The method used to combine the chromal colors
	*/
    export enum ChromeCombination {
        Mix,
        Multiply
    }

	/**
	* The method used to combine the mirror samplers with other material colors
	*/
    export enum MirrorMethod {
        Mix,
        Multiply
    }

	/**
	* The method used to combine the refraction samplers with other material colors
	*/
    export enum RefractionMethod {
        Mix,
        Multiply
    }

	/**
	* Describes each the different passes the renderer uses when drawing the scene.
	*/
    export enum PassType {
        // Colors,
        GBuffer,
        GBuffer2,
        PointsTextureMap,
        PointsNormalMap,
        Skybox,
        Composition,
        Texture,
        ScreenQuad,
        Albedo,
        Lights,
        EditorPass,
        TerrainAlbedo,
        ShadowLightPass,
        // ShadowLightSoftness,
        ShadowPass
    }

    export enum SpriteLightingModel {
        Basic,
        Phong
    }

	/**
	* Describes the type of uniform
	*/
    export enum UniformType {
        TEXTURE,
        TEXTURE_CUBE,
        FLOAT,
        FLOAT2,
        FLOAT3,
        FLOAT4,
        QUAT,
        INT,
        COLOR3,
        MAT3,
        MAT4,
        TEXTURE_ARRAY,
        INT_ARRAY,
        MAT3_ARRAY,
        MAT4_ARRAY,
        FLOAT_ARRAY,
        FLOAT2_ARRAY,
        FLOAT3_ARRAY,
        FLOAT4_ARRAY
    }

	/**
	* Describes the attribute type
	*/
    export enum AttributeType {
        POSITION,
        COLOR,
        TANGENT,
        UV,
        UV2,
        NORMAL,
        SCREEN_CORNER_INDEX,
        SKIN_INDEX,
        SKIN_WEIGHT,
        SCALE,
        ALPHA,
        ROTATION,
        SURFACE,
        CUSTOM_1,
        CUSTOM_2,
        CUSTOM_3,
        CUSTOM_4,
        CUSTOM_5
    }


	/**
	* Describes the floating point precision to be used in the shaders
	*/
    export class ShaderPrecision {
        static HIGH = 'highp';
        static MEDIUM = 'mediump';
        static LOW = 'lowp';
    }

	/*
	* Describes how many components there are for each pixel.

	* See http://books.google.co.uk/books?id=3c-jmWkLNwUC&pg=PA80&lpg=PA80&dq=Int16Array+gl&source=bl&ots=z-tp2x2DAd&sig=2YW_MZ5s8HysyJIhIwTmVjc7QpU&hl=en&sa=X&ei=OSgcVKrpHcmxggSYmYJY&ved=0CCkQ6AEwAQ#v=onepage&q=Int16Array%20gl&f=false
	* PG 181

	*	Base Internal Format    red     green   blue    alpha   luminance
    *    --------------------    ---     -----   ----    -----   ---------
    *    ALPHA                                           A
    *    LUMINANCE                                               R
    *    LUMINANCE_ALPHA                                 A       R
    *    RGB                     R       G       B
    *    RGBA                    R       G       B       A
	*/
    export enum TextureFormat {
        AlphaFormat,
        RGBFormat,
        RGBAFormat,
        DepthStencil,
        DepthComponent,
        LuminanceFormat,
        LuminanceAlphaFormat
    }


	/**
	* Describes how the texture should be mapped
	*/
    export enum TextureMapping {
        UVMapping,
        ReflectionMapping
    }


	/**
	* Describes how the texture should be wrapped around a polygon when it reaches the edge of the texture
	*/
    export enum TextureWrapping {
        RepeatWrapping,
        ClampToEdgeWrapping,
        MirroredRepeatWrapping
    }

	/**
	* Describes how the texture should be filtered with distance
	*/
    export enum TextureFilter {
        Nearest,
        NearestMipMap,
        NearestMipMapLinear,
        Linear,
        LinearMipMap,
        LinearMipMapNearest
    }


	/**
	* These macros are used to control which parts of a shader are used.
	*/
    export class ShaderDefines {
        // Set on materials that expect gl_POINTS
        static POINT_VERTS = '#define POINT_VERTS';

        static ATTR_ROTATION = '#define ATTR_ROTATION';
        static ATTR_SIZE = '#define ATTR_SIZE';
        static ATTR_ALPHA = '#define ATTR_ALPHA';
        static ATTR_POSITION = '#define ATTR_POSITION';
        static ATTR_COLOR = '#define ATTR_COLOR';
        static ATTR_UV = '#define ATTR_UV';
        static ATTR_NORMAL = '#define ATTR_NORMAL';

        static ANIMATED = '#define ANIMATED';
        static PREMULTIPLIED_ALPHA = '#define PREMULTIPLIED_ALPHA';
        static ALPHA_TEST = '#define ALPHATEST';
        static DOUBLE_SIDED = '#define DOUBLE_SIDED';
        static BUMP_MAP = '#define USE_BUMPMAP';
        static GAMA_INPUT = '#define GAMA_INPUT';
        static BUMP_MAP_TILES = '#define USE_BUMPMAP_TILES';
        static STANDARD_DERIVATIVES = '#define STANDARD_DERIVATIVES';
        static QUAD_LIGHTING = '#define QUAD_LIGHTING';
        static USE_ENV_MAP = '#define USE_ENV_MAP';
        static REFLECTION_MAP = '#define REFLECTION_MAP';
        static REFRACTION_MAP = '#define REFRACTION_MAP';
        static SHADOW_MAPPING = '#define SHADOW_MAPPING';
        static SHADOW_TYPE_VSM = '#define SHADOW_TYPE_VSM';
        static EDITOR_PASS = '#define EDITOR_PASS';

        static SHADOW_FILTER_INTERPOLATED = '#define SHADOW_FILTER_INTERPOLATED';
        static SHADOW_FILTER_PCF = '#define SHADOW_FILTER_PCF';
        static SHADOW_FILTER_PCF_SOFT = '#define SHADOW_FILTER_PCF_SOFT';

        static DASHED = '#define DASH';
        static SPECULAR_MAP = '#define USE_SPECULARMAP';
        static TRANSLUCENCY_MAP = '#define TRANSLUCENCY_MAP';
        static TRANSLUCENCY_ENABLED = '#define TRANSLUCENCY_ENABLED';

        static FORWARD_NORMAL = '#define FORWARD_NORMAL';

        static PASS_GBUFFER2 = '#define PASS_GBUFFER2';
        static PASS_GBUFFER = '#define PASS_GBUFFER';
        static PASS_POINT_MAP = '#define PASS_POINT_MAP';
        static PASS_POINT_NORMAL = '#define PASS_POINT_NORMAL';
        static PASS_SHADOW = '#define PASS_SHADOW';
        static PASS_SHADOW_SOFTNESS = '#define PASS_SHADOW_SOFTNESS';

        static BONE_INFLUENCES_1 = '#define BONE_INFLUENCES 1';
        static BONE_INFLUENCES_2 = '#define BONE_INFLUENCES 2';
        static BONE_INFLUENCES_3 = '#define BONE_INFLUENCES 3';
        static BONE_INFLUENCES_4 = '#define BONE_INFLUENCES 4';

        static SKINNING = '#define USE_SKINNING';
        static USE_MAP = '#define USE_MAP';
        static USE_HEIGHTFIELD = '#define USE_HEIGHTFIELD';
        static DAY_MAP = '#define DAY_MAP';
        static NIGHT_MAP = '#define NIGHT_MAP';

        // Terrain
        static BRUSHMODE = '#define BRUSHMODE';
        static TERRAIN_TEX_SPLAT = '#define TERRAIN_TEX_SPLAT';
        static TERRAIN_TEX_BASE = '#define TERRAIN_TEX_BASE';
        static TERRAIN_TEX_DIFF1 = '#define TERRAIN_TEX_DIFF1';
        static TERRAIN_TEX_DIFF2 = '#define TERRAIN_TEX_DIFF2';
        static TERRAIN_TEX_DIFF3 = '#define TERRAIN_TEX_DIFF3';
        static TERRAIN_TEX_DIFF4 = '#define TERRAIN_TEX_DIFF4';
        static TERRAIN_TEX_COLORS = '#define TERRAIN_TEX_COLORS';
        static TERRAIN_TEX_LIGHTMAP = '#define TERRAIN_TEX_LIGHTMAP';
    }

    export enum TerrainTextureType {
        Specular,
        Splat,
        Base,
        Rocks,
        Diffuse1,
        Diffuse2,
        Diffuse3,
        Diffuse4,
        Colors,
        Lightmap,
        Heightmap
    }


	/**
	* Describes how much space each component takes up in memory
	*/
    export enum TextureType {
        UnsignedByteType,
        UnsignedShort4444Type,
        UnsignedShort5551Type,
        UnsignedShort565Type,
        ByteType,
        ShortType,
        UnsignedShortType,
        IntType,
        UnsignedIntType,
        FloatType,
        HalfFloatType,
        UNSIGNED_INT_24_8_WEBGL

    }


	/**
	* Describes how polygons are drawn by the renderer. Back is the default, which means vertices are drawn counter clockwise
	*/
    export enum CullFormat {
        None,
        Front,
        Back,
        FrontAndBack
    }


	/**
	* Describes how to draw Lin Geometry
	*/
    export enum LineMode {
        HeadToTail,
        HeadToTailClosed,
        Pairs
    }


	/**
	* Describes how renderer should draw the geometry
	*/
    export enum DrawMode {

        /** draws each vertex as a single pixel dot...so if there are 24 vertices, you get 24 dots. */
        Points,

        /** connects each pair of vertices by a straight line, so 24 vertices produces 12 separate lines. */
        Lines,

        /** connects each vertex to the next by a straight line, so 24 vertices produces 23 lines that are all connected end-to-end. */
        LineStrip,

        /** LINELOOP is like LINESTRIP except that the last vertex is connected back to the first, so 24 vertices produces 24 straight lines - looping back to the start. */
        LineLoop,

        /** connects each group of three consecutive vertices to make a triangle - so 24 vertices produces 8 separate triangles. */
        Triangles,

        /** TriangleStrip is a little harder to get your head around...let's letter our 24 vertices 'A' through 'X'. This produces N-2 triangles where N is the number of vertices...the first triangle connects vertices A,B,C, the remaining triangles are each formed from the previous two vertices of the last triangle...(swapped over to keep the triangle facing the same way) plus one new vertex, so the second triangle is C,B,D, the third is C,D,E, the fourth is E,D,F...all the way through to the 22nd triangle which is made from W,V,X. This sounds messy but imagine that you are drawing something like a long, winding ribbon - with vertices A,C,E,G down one side of the ribbon and B,D,F,H down the otherside. You'll need to sketch this one on some paper to get the hang of it. */
        TriangleStrip,

        /** TriangleFan - similar in concept to the TriangleStrip but now we start with triangle A,B,C, then A,C,D, then A,D,E...and so on until A,W,X. The result looks like a ladies' fan. */
        TriangleFan
    }

	/**
	* Defines the pixel factor in blending equations. There are two factors to consider - the source and destination.
	* Think of the source as the one that we're drawing right now,
	* and the destination fragment is the one that's already in the frame buffer.
	*
	* Typically the equation looks something like this:
	* Rresult = Rs * Sr + Rd * Dr
	* Gresult = Gs * Sg + Gd * Dg
	* Bresult = Bs * Sb + Bd * Db
	* Aresult = As * Sa + Ad * Da

	* Where Rs, Gs, Bs and As are the source factor and Sr, Sg, Sb, and Sa are the actual source values. Same can be said for the destination.
	* The above is using the add equation, but you can use other equations.
	*/
    export enum PixelFactor {
        DestinationColor,
        OneMinusDestinationColor,
        SourceAlphaSaturate,
        Zero,
        One,
        SourceColor,
        OneMinusSourceColor,
        SourceAlpha,
        OneMinusSourceAlpha,
        DestinationAlpha,
        OneMinusDestinationAlpha,
        ConstantColor,
        OneMinusConstantColor,
        ConstantAlpha,
        OneMinusConstantAlpha
    }

	/**
	* Determines the blending equation to use for calculating blended values. The most common is Add.
	*/
    export enum BlendEquation {
        Add,
        Subtract,
        ReverseSubtract
    }

	/**
	* Determines the type of blending we do on a material. By default this is set to none. There are 3 modes to choose from that are
	* customly built. Alternatively you can use custom and define your own pixel factors and blend equation.
	*/
    export enum BlendMode {
        Normal,
        Additive,
        Subtractive,
        Multiplication,
        PremultipliedAlpha,
        Custom,
        None
    }

	/**
	* Converts a Trike enum to its webgl equivalent
	*/
    export function getGLParam( e: number, gl: WebGLRenderingContext ): number {
        switch ( e ) {
            /** Draw mode */
            case DrawMode.Points:
                return gl.POINTS;
            case DrawMode.Lines:
                return gl.LINES;
            case DrawMode.LineStrip:
                return gl.LINE_STRIP;
            case DrawMode.LineLoop:
                return gl.LINE_LOOP;
            case DrawMode.Triangles:
                return gl.TRIANGLES;
            case DrawMode.TriangleStrip:
                return gl.TRIANGLE_STRIP;
            case DrawMode.TriangleFan:
                return gl.TRIANGLE_FAN;

            /** Texture format */
            case TextureFormat.AlphaFormat:
                return gl.ALPHA;
            case TextureFormat.RGBFormat:
                return gl.RGB;
            case TextureFormat.RGBAFormat:
                return gl.RGBA;
            case TextureFormat.LuminanceFormat:
                return gl.LUMINANCE;
            case TextureFormat.LuminanceAlphaFormat:
                return gl.LUMINANCE_ALPHA;
            case TextureFormat.DepthStencil:
                return gl.DEPTH_STENCIL;
            case TextureFormat.DepthComponent:
                return gl.DEPTH_COMPONENT;

            /** Texture type */
            case TextureType.ByteType:
                return gl.BYTE;
            case TextureType.ShortType:
                return gl.SHORT;
            case TextureType.UnsignedShortType:
                return gl.UNSIGNED_SHORT;
            case TextureType.IntType:
                return gl.INT;
            case TextureType.UnsignedIntType:
                return gl.UNSIGNED_INT;
            case TextureType.FloatType:
                return gl.FLOAT;
            case TextureType.HalfFloatType:
                if ( !Capabilities.getSingleton().glExtensionTextureHalfFloat )
                    return gl.FLOAT;

                return 0x8D61;
            case TextureType.UNSIGNED_INT_24_8_WEBGL:
                return 0x84FA;
            case TextureType.UnsignedByteType:
                return gl.UNSIGNED_BYTE;
            case TextureType.UnsignedShort4444Type:
                return gl.UNSIGNED_SHORT_4_4_4_4;
            case TextureType.UnsignedShort5551Type:
                return gl.UNSIGNED_SHORT_5_5_5_1;
            case TextureType.UnsignedShort565Type:
                return gl.UNSIGNED_SHORT_5_6_5;

            /** Texture filtering */
            case TextureFilter.Nearest:
                return gl.NEAREST;
            case TextureFilter.NearestMipMap:
                return gl.NEAREST_MIPMAP_NEAREST;
            case TextureFilter.NearestMipMapLinear:
                return gl.NEAREST_MIPMAP_LINEAR;
            case TextureFilter.Linear:
                return gl.LINEAR;
            case TextureFilter.LinearMipMapNearest:
                return gl.LINEAR_MIPMAP_NEAREST;
            case TextureFilter.LinearMipMap:
                return gl.LINEAR_MIPMAP_LINEAR;

            /** Texture Repeating */
            case TextureWrapping.RepeatWrapping:
                return gl.REPEAT;
            case TextureWrapping.ClampToEdgeWrapping:
                return gl.CLAMP_TO_EDGE;
            case TextureWrapping.MirroredRepeatWrapping:
                return gl.MIRRORED_REPEAT;

            /** Culling */
            case CullFormat.Back:
                return gl.BACK;
            case CullFormat.Front:
                return gl.FRONT;
            case CullFormat.FrontAndBack:
                return gl.FRONT_AND_BACK;

            /** Pixel modes */
            case PixelFactor.DestinationColor:
                return gl.DST_COLOR;
            case PixelFactor.OneMinusDestinationColor:
                return gl.ONE_MINUS_DST_COLOR;
            case PixelFactor.SourceAlphaSaturate:
                return gl.SRC_ALPHA_SATURATE;
            case PixelFactor.Zero:
                return gl.ZERO;
            case PixelFactor.One:
                return gl.ONE;
            case PixelFactor.SourceColor:
                return gl.SRC_COLOR;
            case PixelFactor.OneMinusSourceColor:
                return gl.ONE_MINUS_SRC_COLOR;
            case PixelFactor.One:
                return gl.ONE;
            case PixelFactor.SourceAlpha:
                return gl.SRC_ALPHA;
            case PixelFactor.OneMinusSourceAlpha:
                return gl.ONE_MINUS_SRC_ALPHA;
            case PixelFactor.DestinationAlpha:
                return gl.DST_ALPHA;
            case PixelFactor.OneMinusDestinationAlpha:
                return gl.ONE_MINUS_DST_ALPHA;
            case PixelFactor.ConstantColor:
                return gl.CONSTANT_COLOR;
            case PixelFactor.OneMinusConstantColor:
                return gl.ONE_MINUS_CONSTANT_COLOR;
            case PixelFactor.ConstantAlpha:
                return gl.CONSTANT_ALPHA;
            case PixelFactor.OneMinusConstantAlpha:
                return gl.ONE_MINUS_CONSTANT_ALPHA;

            /** Blend equation */
            case BlendEquation.Add:
                return gl.FUNC_ADD;
            case BlendEquation.Subtract:
                return gl.FUNC_SUBTRACT;
            case BlendEquation.ReverseSubtract:
                return gl.FUNC_REVERSE_SUBTRACT;
        }

        return -1;
    }
}