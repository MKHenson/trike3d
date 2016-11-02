// namespace Trike {
//     export class FBO extends Object3D {
//         private static planeGeom: GeometryPlane;
//         private static camera: CameraOrthographic;
//         private static planeCount: number = 0;

//         private _material: MaterialMulti;

//         constructor() {
//             super();

//             if ( FBO.planeCount === 0 ) {
//                 FBO.planeGeom = new GeometryPlane( 2, 2, 1, 1 );
//                 FBO.camera = new CameraOrthographic( -1, 1, 1, - 1, 0, 1 );
//             }

//             FBO.planeCount++;
//         }

//         // render( renderer: Renderer, target: THREE.WebGLRenderTarget = this.renderTarget, forceClear: boolean = false )
//         // {

//         // }

// 		/**
// 		* Clean up
// 		*/
//         dispose( disposeMaterial: boolean = true ) {
//             FBO.planeCount--;
//             if ( FBO.planeCount === 0 ) {
//                 FBO.planeGeom.dispose();
//                 FBO.planeGeom = null;
//             }

//             super.dispose();
//         }
//     }
// }