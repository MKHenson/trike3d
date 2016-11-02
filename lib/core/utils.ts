namespace Trike {
    export class Utils {
        static addLineNumbers( error: string ) {
            const chunks: Array<string> = error.split( '\n' );
            for ( let i = 0, il = chunks.length; i < il; i++ ) {
                // Chrome reports shader errors on lines
                // starting counting from 1
                chunks[ i ] = ( i + 1 ) + ': ' + chunks[ i ];
            }

            return chunks.join( '\n' );
        }

        static checkFlag( value: number, reference: number ) {
            return ( value & reference ) === reference;
        }

        static error( message: string ) {
            console.error( message );
        }

        static compilerError( message: string, sourceCode: string ) {
            console.error( message + '\r\n' + Utils.addLineNumbers( sourceCode ) );
        }
    }
}