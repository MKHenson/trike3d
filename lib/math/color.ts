namespace Trike {
	/**
	* Color class that represents the typical RGB values of a color. This class does not manipulate an alpha value.
	*/
    export class Color {
		/**
		* The red component
		*/
        public r: number;

		/**
		* The green component
		*/
        public g: number;

		/**
		* The blue component
		*/
        public b: number;

		/**
		* The elements array which is passed as a color uniform
		*/
        public elements: Float32Array;

		/**
		* Creates an instance of the color class
		*/
        constructor( value?: Color | number | string ) {
            if ( value !== undefined ) this.set( value );
            this.elements = new Float32Array( 3 );
        }

		/**
		* Gets the elements array for use in buffers and uniforms
		* @returns {Float32Array}
		*/
        get getElements(): Float32Array {
            const elm = this.elements;
            elm[ 0 ] = this.r;
            elm[ 1 ] = this.g;
            elm[ 2 ] = this.b;
            return elm;
        }

		/**
		* Sets the color values of this color from either a hex number, rgb string, or source color
		* @param {any} value
		* @returns {Color}
		*/
        set( value: Color | number | string ): Color {
            if ( <Color>value instanceof Color ) {
                this.copy( <Color>value );
                return this;
            }

            switch ( typeof value ) {
                case 'number':
                    this.setHex( <number>value );
                    break;

                case 'string':
                    this.setStyle( <string>value );
                    break;
            }

            return this;
        }

		/**
		* Generates a random color
		* @returns {Color}
		*/
        randomColor(): Color {
            return this.setRGB( Math.random() * 255, Math.random() * 255, Math.random() * 255 );
        }

		/**
		* Sets the color values of this color from a hex
		* @param {number} hex
		* @returns {Color}
		*/
        setHex( hex: number ): Color {
            hex = Math.floor( hex );
            this.r = ( hex >> 16 & 255 ) / 255;
            this.g = ( hex >> 8 & 255 ) / 255;
            this.b = ( hex & 255 ) / 255;
            return this;
        }


		/**
		* Sets the color values of this color
		* @param {number} r
		* @param {number} g
		* @param {number} b
		* @returns {Color}
		*/
        setRGB( r: number, g: number, b: number ): Color {
            this.r = r;
            this.g = g;
            this.b = b;
            return this;
        }


		/**
		* Sets the hue, saturation and lightness of this color
		* @param {number} h
		* @param {number} s
		* @param {number} l
		* @returns {Color}
		*/
        setHSL( h: number, s: number, l: number ): Color {
            // h,s,l ranges are in 0.0 - 1.0

            if ( s === 0 ) {
                this.r = this.g = this.b = l;
            }
            else {
                const hue2rgb = function( p, q, t ) {
                    if ( t < 0 ) t += 1;
                    if ( t > 1 ) t -= 1;
                    if ( t < 1 / 6 ) return p + ( q - p ) * 6 * t;
                    if ( t < 1 / 2 ) return q;
                    if ( t < 2 / 3 ) return p + ( q - p ) * 6 * ( 2 / 3 - t );
                    return p;
                };

                const p = l <= 0.5 ? l * ( 1 + s ) : l + s - ( l * s );
                const q = ( 2 * l ) - p;

                this.r = hue2rgb( q, p, h + 1 / 3 );
                this.g = hue2rgb( q, p, h );
                this.b = hue2rgb( q, p, h - 1 / 3 );
            }
            return this;
        }

		/**
		* Parses a style string and assignes the values to this.
		* @param {string} style eg: rgb(255,255,255)
		* @returns {Color}
		*/
        setStyle( style: string ): Color {
            // rgb(255,0,0)
            if ( /^rgb\((\d+),(\d+),(\d+)\)$/i.test( style ) ) {
                const color = /^rgb\((\d+),(\d+),(\d+)\)$/i.exec( style );
                this.r = Math.min( 255, parseInt( color[ 1 ], 10 ) ) / 255;
                this.g = Math.min( 255, parseInt( color[ 2 ], 10 ) ) / 255;
                this.b = Math.min( 255, parseInt( color[ 3 ], 10 ) ) / 255;
                return this;
            }

            // rgb(100%,0%,0%)
            if ( /^rgb\((\d+)\%,(\d+)\%,(\d+)\%\)$/i.test( style ) ) {
                const color = /^rgb\((\d+)\%,(\d+)\%,(\d+)\%\)$/i.exec( style );
                this.r = Math.min( 100, parseInt( color[ 1 ], 10 ) ) / 100;
                this.g = Math.min( 100, parseInt( color[ 2 ], 10 ) ) / 100;
                this.b = Math.min( 100, parseInt( color[ 3 ], 10 ) ) / 100;
                return this;
            }

            // #ff0000
            if ( /^\#([0-9a-f]{6})$/i.test( style ) ) {
                const color = /^\#([0-9a-f]{6})$/i.exec( style );
                this.setHex( parseInt( color[ 1 ], 16 ) );
                return this;
            }

            // #f00
            if ( /^\#([0-9a-f])([0-9a-f])([0-9a-f])$/i.test( style ) ) {
                const color = /^\#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec( style );
                this.setHex( parseInt( color[ 1 ] + color[ 1 ] + color[ 2 ] + color[ 2 ] + color[ 3 ] + color[ 3 ], 16 ) );
                return this;
            }

            // red
            if ( /^(\w+)$/i.test( style ) ) {
                this.setHex( Color[ style ] );
                return this;
            }
        }

		/**
		* Copies the values of color to this
		* @returns {Color}
		*/
        copy( color: Color ): Color {
            this.r = color.r;
            this.g = color.g;
            this.b = color.b;
            return this;
        }

		/**
		* Copies the gama to linear values of color into this ( each component of color is squared and assigned to this )
		* @param {Color} color
		* @returns {Color}
		*/
        copyGammaToLinear( color: Color ): Color {
            this.r = color.r * color.r;
            this.g = color.g * color.g;
            this.b = color.b * color.b;
            return this;
        }

		/**
		* Copies the linear to gama values of color into this ( each component of color is square rooted and assigned to this )
		* @param {Color} color
		* @returns {Color}
		*/
        copyLinearToGamma( color: Color ): Color {
            this.r = Math.sqrt( color.r );
            this.g = Math.sqrt( color.g );
            this.b = Math.sqrt( color.b );
            return this;
        }

		/**
		* Converts the values of this color from gama to linear (each component is squared)
		* @returns {Color}
		*/
        convertGammaToLinear(): Color {
            const r = this.r, g = this.g, b = this.b;
            this.r = r * r;
            this.g = g * g;
            this.b = b * b;
            return this;
        }

		/**
		* Converts the values of this color from linear to gama (each component is square rooted)
		* @returns {Color}
		*/
        convertLinearToGamma(): Color {
            this.r = Math.sqrt( this.r );
            this.g = Math.sqrt( this.g );
            this.b = Math.sqrt( this.b );
            return this;
        }

		/**
		* Gets the hex value of this color as a number
		* @returns {number}
		*/
        getHex(): number {
            return ( this.r * 255 ) << 16 ^ ( this.g * 255 ) << 8 ^ ( this.b * 255 ) << 0;
        }

		/**
		* Gets the hex string of this color
		* @returns {string}
		*/
        getHexString(): string {
            return ( '000000' + this.getHex().toString( 16 ) ).slice( - 6 );
        }

		/**
		* Gets the Hue, Saturation and Lightness
		* @returns { h: number; s: number; l: number;}
		*/
        getHSL(): { h: number; s: number; l: number; } {
            const hsl = { h: 0, s: 0, l: 0 };

            // h,s,l ranges are in 0.0 - 1.0
            const r = this.r, g = this.g, b = this.b;
            const max = Math.max( r, g, b );
            const min = Math.min( r, g, b );
            let hue, saturation;
            const lightness = ( min + max ) / 2.0;

            if ( min === max ) {
                hue = 0;
                saturation = 0;
            }
            else {
                const delta = max - min;
                saturation = lightness <= 0.5 ? delta / ( max + min ) : delta / ( 2 - max - min );
                switch ( max ) {
                    case r: hue = ( g - b ) / delta + ( g < b ? 6 : 0 ); break;
                    case g: hue = ( b - r ) / delta + 2; break;
                    case b: hue = ( r - g ) / delta + 4; break;
                }

                hue /= 6;
            }

            hsl.h = hue;
            hsl.s = saturation;
            hsl.l = lightness;
            return hsl;
        }

		/**
		* Gets the color as an HTML style eg 'rgb(255,255,255)'
		* @returns {string}
		*/
        getStyle(): string {
            return 'rgb(' + ( ( this.r * 255 ) | 0 ) + ',' + ( ( this.g * 255 ) | 0 ) + ',' + ( ( this.b * 255 ) | 0 ) + ')';
        }


		/**
		* Offsets (adds to) the Hue Saturation and lightness of this colour
		* @param {number} h
		* @param {number} s
		* @param {number} l
		* @returns {Color}
		*/
        offsetHSL( h: number, s: number, l: number ): Color {
            const hsl = this.getHSL();
            hsl.h += h; hsl.s += s; hsl.l += l;
            this.setHSL( hsl.h, hsl.s, hsl.l );
            return this;
        }

		/**
		* Adds the color components to this
		* @param {Color} color
		* @returns {Color}
		*/
        add( color: Color ): Color {
            this.r += color.r;
            this.g += color.g;
            this.b += color.b;
            return this;
        }

		/**
		* Adds the two colors and assigns the values to this
		* @param {Color} color1
		* @param {Color} color2
		* @returns {Color}
		*/
        addColors( color1: Color, color2: Color ): Color {
            this.r = color1.r + color2.r;
            this.g = color1.g + color2.g;
            this.b = color1.b + color2.b;
            return this;
        }

		/**
		* Adds the values of the given color to this color
		* @param {Color} s
		* @returns {Color}
		*/
        addScalar( s: number ): Color {
            this.r += s;
            this.g += s;
            this.b += s;
            return this;
        }

		/**
		* Multiplies this color with given color
		* @param {Color} color
		* @returns {Color}
		*/
        multiply( color: Color ): Color {
            this.r *= color.r;
            this.g *= color.g;
            this.b *= color.b;
            return this;
        }

		/**
		* Multiplies this color by the given scalar
		* @param {number} s
		* @returns {Color}
		*/
        multiplyScalar( s: number ): Color {
            this.r *= s;
            this.g *= s;
            this.b *= s;
            return this;
        }

		/**
		* Interpolates this with the color parameter at weight w
		* @param {Color} color The color to interpolate to
		* @param {number} w The weight of the interpolation
		* @returns {Color}
		*/
        lerp( color: Color, w: number ): Color {
            this.r += ( color.r - this.r ) * w;
            this.g += ( color.g - this.g ) * w;
            this.b += ( color.b - this.b ) * w;
            return this;
        }

		/**
		* Gets a clone of this color
		* @returns {Color}
		*/
        clone(): Color {
            return new Color().setRGB( this.r, this.g, this.b );
        }

        static aliceblue( c: number = 0xF0F8FF ): Color { return new Color( c ); }
        static antiquewhite( c: number = 0xFAEBD7 ): Color { return new Color( c ); }
        static aqua( c: number = 0x00FFFF ): Color { return new Color( c ); }
        static aquamarine( c: number = 0x7FFFD4 ): Color { return new Color( c ); }
        static azure( c: number = 0xF0FFFF ): Color { return new Color( c ); }
        static beige( c: number = 0xF5F5DC ): Color { return new Color( c ); }
        static bisque( c: number = 0xFFE4C4 ): Color { return new Color( c ); }
        static black( c: number = 0x000000 ): Color { return new Color( c ); }
        static blanchedalmond( c: number = 0xFFEBCD ): Color { return new Color( c ); }
        static blue( c: number = 0x0000FF ): Color { return new Color( c ); }
        static blueviolet( c: number = 0x8A2BE2 ): Color { return new Color( c ); }
        static brown( c: number = 0xA52A2A ): Color { return new Color( c ); }
        static burlywood( c: number = 0xDEB887 ): Color { return new Color( c ); }
        static cadetblue( c: number = 0x5F9EA0 ): Color { return new Color( c ); }
        static chartreuse( c: number = 0x7FFF00 ): Color { return new Color( c ); }
        static chocolate( c: number = 0xD2691E ): Color { return new Color( c ); }
        static coral( c: number = 0xFF7F50 ): Color { return new Color( c ); }
        static cornflowerblue( c: number = 0x6495ED ): Color { return new Color( c ); }
        static cornsilk( c: number = 0xFFF8DC ): Color { return new Color( c ); }
        static crimson( c: number = 0xDC143C ): Color { return new Color( c ); }
        static cyan( c: number = 0x00FFFF ): Color { return new Color( c ); }
        static darkblue( c: number = 0x00008B ): Color { return new Color( c ); }
        static darkcyan( c: number = 0x008B8B ): Color { return new Color( c ); }
        static darkgoldenrod( c: number = 0xB8860B ): Color { return new Color( c ); }
        static darkgray( c: number = 0xA9A9A9 ): Color { return new Color( c ); }
        static darkgreen( c: number = 0x006400 ): Color { return new Color( c ); }
        static darkgrey( c: number = 0xA9A9A9 ): Color { return new Color( c ); }
        static darkkhaki( c: number = 0xBDB76B ): Color { return new Color( c ); }
        static darkmagenta( c: number = 0x8B008B ): Color { return new Color( c ); }
        static darkolivegreen( c: number = 0x556B2F ): Color { return new Color( c ); }
        static darkorange( c: number = 0xFF8C00 ): Color { return new Color( c ); }
        static darkorchid( c: number = 0x9932CC ): Color { return new Color( c ); }
        static darkred( c: number = 0x8B0000 ): Color { return new Color( c ); }
        static darksalmon( c: number = 0xE9967A ): Color { return new Color( c ); }
        static darkseagreen( c: number = 0x8FBC8F ): Color { return new Color( c ); }
        static darkslateblue( c: number = 0x483D8B ): Color { return new Color( c ); }
        static darkslategray( c: number = 0x2F4F4F ): Color { return new Color( c ); }
        static darkslategrey( c: number = 0x2F4F4F ): Color { return new Color( c ); }
        static darkturquoise( c: number = 0x00CED1 ): Color { return new Color( c ); }
        static darkviolet( c: number = 0x9400D3 ): Color { return new Color( c ); }
        static deeppink( c: number = 0xFF1493 ): Color { return new Color( c ); }
        static deepskyblue( c: number = 0x00BFFF ): Color { return new Color( c ); }
        static dimgray( c: number = 0x696969 ): Color { return new Color( c ); }
        static dimgrey( c: number = 0x696969 ): Color { return new Color( c ); }
        static dodgerblue( c: number = 0x1E90FF ): Color { return new Color( c ); }
        static firebrick( c: number = 0xB22222 ): Color { return new Color( c ); }
        static floralwhite( c: number = 0xFFFAF0 ): Color { return new Color( c ); }
        static forestgreen( c: number = 0x228B22 ): Color { return new Color( c ); }
        static fuchsia( c: number = 0xFF00FF ): Color { return new Color( c ); }
        static gainsboro( c: number = 0xDCDCDC ): Color { return new Color( c ); }
        static ghostwhite( c: number = 0xF8F8FF ): Color { return new Color( c ); }
        static gold( c: number = 0xFFD700 ): Color { return new Color( c ); }
        static goldenrod( c: number = 0xDAA520 ): Color { return new Color( c ); }
        static gray( c: number = 0x808080 ): Color { return new Color( c ); }
        static green( c: number = 0x008000 ): Color { return new Color( c ); }
        static greenyellow( c: number = 0xADFF2F ): Color { return new Color( c ); }
        static grey( c: number = 0x808080 ): Color { return new Color( c ); }
        static honeydew( c: number = 0xF0FFF0 ): Color { return new Color( c ); }
        static hotpink( c: number = 0xFF69B4 ): Color { return new Color( c ); }
        static indianred( c: number = 0xCD5C5C ): Color { return new Color( c ); }
        static indigo( c: number = 0x4B0082 ): Color { return new Color( c ); }
        static ivory( c: number = 0xFFFFF0 ): Color { return new Color( c ); }
        static khaki( c: number = 0xF0E68C ): Color { return new Color( c ); }
        static lavender( c: number = 0xE6E6FA ): Color { return new Color( c ); }
        static lavenderblush( c: number = 0xFFF0F5 ): Color { return new Color( c ); }
        static lawngreen( c: number = 0x7CFC00 ): Color { return new Color( c ); }
        static lemonchiffon( c: number = 0xFFFACD ): Color { return new Color( c ); }
        static lightblue( c: number = 0xADD8E6 ): Color { return new Color( c ); }
        static lightcoral( c: number = 0xF08080 ): Color { return new Color( c ); }
        static lightcyan( c: number = 0xE0FFFF ): Color { return new Color( c ); }
        static lightgoldenrodyellow( c: number = 0xFAFAD2 ): Color { return new Color( c ); }
        static lightgray( c: number = 0xD3D3D3 ): Color { return new Color( c ); }
        static lightgreen( c: number = 0x90EE90 ): Color { return new Color( c ); }
        static lightgrey( c: number = 0xD3D3D3 ): Color { return new Color( c ); }
        static lightpink( c: number = 0xFFB6C1 ): Color { return new Color( c ); }
        static lightsalmon( c: number = 0xFFA07A ): Color { return new Color( c ); }
        static lightseagreen( c: number = 0x20B2AA ): Color { return new Color( c ); }
        static lightskyblue( c: number = 0x87CEFA ): Color { return new Color( c ); }
        static lightslategray( c: number = 0x778899 ): Color { return new Color( c ); }
        static lightslategrey( c: number = 0x778899 ): Color { return new Color( c ); }
        static lightsteelblue( c: number = 0xB0C4DE ): Color { return new Color( c ); }
        static lightyellow( c: number = 0xFFFFE0 ): Color { return new Color( c ); }
        static lime( c: number = 0x00FF00 ): Color { return new Color( c ); }
        static limegreen( c: number = 0x32CD32 ): Color { return new Color( c ); }
        static linen( c: number = 0xFAF0E6 ): Color { return new Color( c ); }
        static magenta( c: number = 0xFF00FF ): Color { return new Color( c ); }
        static maroon( c: number = 0x800000 ): Color { return new Color( c ); }
        static mediumaquamarine( c: number = 0x66CDAA ): Color { return new Color( c ); }
        static mediumblue( c: number = 0x0000CD ): Color { return new Color( c ); }
        static mediumorchid( c: number = 0xBA55D3 ): Color { return new Color( c ); }
        static mediumpurple( c: number = 0x9370DB ): Color { return new Color( c ); }
        static mediumseagreen( c: number = 0x3CB371 ): Color { return new Color( c ); }
        static mediumslateblue( c: number = 0x7B68EE ): Color { return new Color( c ); }
        static mediumspringgreen( c: number = 0x00FA9A ): Color { return new Color( c ); }
        static mediumturquoise( c: number = 0x48D1CC ): Color { return new Color( c ); }
        static mediumvioletred( c: number = 0xC71585 ): Color { return new Color( c ); }
        static midnightblue( c: number = 0x191970 ): Color { return new Color( c ); }
        static mintcream( c: number = 0xF5FFFA ): Color { return new Color( c ); }
        static mistyrose( c: number = 0xFFE4E1 ): Color { return new Color( c ); }
        static moccasin( c: number = 0xFFE4B5 ): Color { return new Color( c ); }
        static navajowhite( c: number = 0xFFDEAD ): Color { return new Color( c ); }
        static navy( c: number = 0x000080 ): Color { return new Color( c ); }
        static oldlace( c: number = 0xFDF5E6 ): Color { return new Color( c ); }
        static olive( c: number = 0x808000 ): Color { return new Color( c ); }
        static olivedrab( c: number = 0x6B8E23 ): Color { return new Color( c ); }
        static orange( c: number = 0xFFA500 ): Color { return new Color( c ); }
        static orangered( c: number = 0xFF4500 ): Color { return new Color( c ); }
        static orchid( c: number = 0xDA70D6 ): Color { return new Color( c ); }
        static palegoldenrod( c: number = 0xEEE8AA ): Color { return new Color( c ); }
        static palegreen( c: number = 0x98FB98 ): Color { return new Color( c ); }
        static paleturquoise( c: number = 0xAFEEEE ): Color { return new Color( c ); }
        static palevioletred( c: number = 0xDB7093 ): Color { return new Color( c ); }
        static papayawhip( c: number = 0xFFEFD5 ): Color { return new Color( c ); }
        static peachpuff( c: number = 0xFFDAB9 ): Color { return new Color( c ); }
        static peru( c: number = 0xCD853F ): Color { return new Color( c ); }
        static pink( c: number = 0xFFC0CB ): Color { return new Color( c ); }
        static plum( c: number = 0xDDA0DD ): Color { return new Color( c ); }
        static powderblue( c: number = 0xB0E0E6 ): Color { return new Color( c ); }
        static purple( c: number = 0x800080 ): Color { return new Color( c ); }
        static red( c: number = 0xFF0000 ): Color { return new Color( c ); }
        static rosybrown( c: number = 0xBC8F8F ): Color { return new Color( c ); }
        static royalblue( c: number = 0x4169E1 ): Color { return new Color( c ); }
        static saddlebrown( c: number = 0x8B4513 ): Color { return new Color( c ); }
        static salmon( c: number = 0xFA8072 ): Color { return new Color( c ); }
        static sandybrown( c: number = 0xF4A460 ): Color { return new Color( c ); }
        static seagreen( c: number = 0x2E8B57 ): Color { return new Color( c ); }
        static seashell( c: number = 0xFFF5EE ): Color { return new Color( c ); }
        static sienna( c: number = 0xA0522D ): Color { return new Color( c ); }
        static silver( c: number = 0xC0C0C0 ): Color { return new Color( c ); }
        static skyblue( c: number = 0x87CEEB ): Color { return new Color( c ); }
        static slateblue( c: number = 0x6A5ACD ): Color { return new Color( c ); }
        static slategray( c: number = 0x708090 ): Color { return new Color( c ); }
        static slategrey( c: number = 0x708090 ): Color { return new Color( c ); }
        static snow( c: number = 0xFFFAFA ): Color { return new Color( c ); }
        static springgreen( c: number = 0x00FF7F ): Color { return new Color( c ); }
        static steelblue( c: number = 0x4682B4 ): Color { return new Color( c ); }
        static tan( c: number = 0xD2B48C ): Color { return new Color( c ); }
        static teal( c: number = 0x008080 ): Color { return new Color( c ); }
        static thistle( c: number = 0xD8BFD8 ): Color { return new Color( c ); }
        static tomato( c: number = 0xFF6347 ): Color { return new Color( c ); }
        static turquoise( c: number = 0x40E0D0 ): Color { return new Color( c ); }
        static violet( c: number = 0xEE82EE ): Color { return new Color( c ); }
        static wheat( c: number = 0xF5DEB3 ): Color { return new Color( c ); }
        static white( c: number = 0xFFFFFF ): Color { return new Color( c ); }
        static whitesmoke( c: number = 0xF5F5F5 ): Color { return new Color( c ); }
        static yellow( c: number = 0xFFFF00 ): Color { return new Color( c ); }
        static yellowgreen( c: number = 0x9ACD32 ): Color { return new Color( c ); }
    }
}