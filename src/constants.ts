export const REVISION = '103dev';
export const MOUSE = { LEFT: 0, MIDDLE: 1, RIGHT: 2 };
export const CullFaceNone = 0;
export const CullFaceBack = 1;
export const CullFaceFront = 2;
export const CullFaceFrontBack = 3;
export const FrontFaceDirectionCW = 0;
export const FrontFaceDirectionCCW = 1;
export const BasicShadowMap = 0;
export const PCFShadowMap = 1;
export const PCFSoftShadowMap = 2;
export const FrontSide = 0;
export const BackSide = 1;
export const DoubleSide = 2;
export const FlatShading = 1;
export const SmoothShading = 2;
export enum ColorSource {
  NoColors = 0,
  FaceColors = 1,
  VertexColors = 2
}
export enum BlendMode {
  NoBlending = 0,
  NormalBlending = 1,
  AdditiveBlending = 2,
  SubtractiveBlending = 3,
  MultiplyBlending = 4,
  CustomBlending = 5
}
export const AddEquation = 100;
export const SubtractEquation = 101;
export const ReverseSubtractEquation = 102;
export const MinEquation = 103;
export const MaxEquation = 104;
export const ZeroFactor = 200;
export const OneFactor = 201;
export const SrcColorFactor = 202;
export const OneMinusSrcColorFactor = 203;
export const SrcAlphaFactor = 204;
export const OneMinusSrcAlphaFactor = 205;
export const DstAlphaFactor = 206;
export const OneMinusDstAlphaFactor = 207;
export const DstColorFactor = 208;
export const OneMinusDstColorFactor = 209;
export const SrcAlphaSaturateFactor = 210;
export const NeverDepth = 0;
export const AlwaysDepth = 1;
export const LessDepth = 2;
export const LessEqualDepth = 3;
export const EqualDepth = 4;
export const GreaterEqualDepth = 5;
export const GreaterDepth = 6;
export const NotEqualDepth = 7;

export enum OperationType {
  MultiplyOperation = 0,
  MixOperation = 1,
  AddOperation = 2
}
export const NoToneMapping = 0;
export const LinearToneMapping = 1;
export const ReinhardToneMapping = 2;
export const Uncharted2ToneMapping = 3;
export const CineonToneMapping = 4;
export const ACESFilmicToneMapping = 5;
export enum MappingType {
  UVMapping = 300,
  CubeReflectionMapping = 301,
  CubeRefractionMapping = 302,
  EquirectangularReflectionMapping = 303,
  EquirectangularRefractionMapping = 304,
  SphericalReflectionMapping = 305,
  CubeUVReflectionMapping = 306,
  CubeUVRefractionMapping = 307
}
export enum WrappingType {
  RepeatWrapping = 1000,
  ClampToEdgeWrapping = 1001,
  MirroredRepeatWrapping = 1002
}
export enum FilterType {
  NearestFilter = 1003,
  NearestMipMapNearestFilter = 1004,
  NearestMipMapLinearFilter = 1005,
  LinearFilter = 1006,
  LinearMipMapNearestFilter = 1007,
  LinearMipMapLinearFilter = 1008
}
export enum TexelType {
  UnsignedByteType = 1009,
  ByteType = 1010,
  ShortType = 1011,
  UnsignedShortType = 1012,
  IntType = 1013,
  UnsignedIntType = 1014,
  FloatType = 1015,
  HalfFloatType = 1016,
  UnsignedShort4444Type = 1017,
  UnsignedShort5551Type = 1018,
  UnsignedShort565Type = 1019,
  UnsignedInt248Type = 1020
}
export enum FormatType {
  AlphaFormat = 1021,
  RGBFormat = 1022,
  RGBAFormat = 1023,
  LuminanceFormat = 1024,
  LuminanceAlphaFormat = 1025,
  RGBEFormat = RGBAFormat,
  DepthFormat = 1026,
  DepthStencilFormat = 1027,
  RedFormat = 1028,
  RGB_S3TC_DXT1_Format = 33776,
  RGBA_S3TC_DXT1_Format = 33777,
  RGBA_S3TC_DXT3_Format = 33778,
  RGBA_S3TC_DXT5_Format = 33779,
  RGB_PVRTC_4BPPV1_Format = 35840,
  RGB_PVRTC_2BPPV1_Format = 35841,
  RGBA_PVRTC_4BPPV1_Format = 35842,
  RGBA_PVRTC_2BPPV1_Format = 35843,
  RGB_ETC1_Format = 36196,
  RGBA_ASTC_4x4_Format = 37808,
  RGBA_ASTC_5x4_Format = 37809,
  RGBA_ASTC_5x5_Format = 37810,
  RGBA_ASTC_6x5_Format = 37811,
  RGBA_ASTC_6x6_Format = 37812,
  RGBA_ASTC_8x5_Format = 37813,
  RGBA_ASTC_8x6_Format = 37814,
  RGBA_ASTC_8x8_Format = 37815,
  RGBA_ASTC_10x5_Format = 37816,
  RGBA_ASTC_10x6_Format = 37817,
  RGBA_ASTC_10x8_Format = 37818,
  RGBA_ASTC_10x10_Format = 37819,
  RGBA_ASTC_12x10_Format = 37820,
  RGBA_ASTC_12x12_Format = 37821
}
export const LoopOnce = 2200;
export const LoopRepeat = 2201;
export const LoopPingPong = 2202;
export const InterpolateDiscrete = 2300;
export const InterpolateLinear = 2301;
export const InterpolateSmooth = 2302;
export const ZeroCurvatureEnding = 2400;
export const ZeroSlopeEnding = 2401;
export const WrapAroundEnding = 2402;
export const TrianglesDrawMode = 0;
export const TriangleStripDrawMode = 1;
export const TriangleFanDrawMode = 2;
export enum EncodingType {
  LinearEncoding = 3000,
  sRGBEncoding = 3001,
  GammaEncoding = 3007,
  RGBEEncoding = 3002,
  LogLuvEncoding = 3003,
  RGBM7Encoding = 3004,
  RGBM16Encoding = 3005,
  RGBDEncoding = 3006
}
export enum DepthPackingType {
  BasicDepthPacking = 3200,
  RGBADepthPacking = 3201
}
export enum NormalSpaceType {
  TangentSpaceNormalMap = 0,
  ObjectSpaceNormalMap = 1
}
