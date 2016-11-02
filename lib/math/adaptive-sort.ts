namespace Trike {
	/**
	* A custom sorter based on the work done here: http://jsperf.com/sort-algorithms/28
	* This sorter is currently faster than the traditional sort function of arrays
	*/
    export class AdaptiveSort {
        private static merge( left, right, prop: any ) {
			/*
			* Given two non-empty ordered arrays (chains), returns a new
			* array containing an ordered union of the input chains.
			*/
            let left_len = left.length,
                right_len = right.length,
                left_val,
                right_val,
                result;

            right_val = right[ 0 ];
            left_val = left[ 0 ];

            if ( left[ left_len - 1 ][ prop ] <= ( right[ 0 ][ prop ] ) ) {
                result = left.concat( right );
            }
            else if ( right[ right_len - 1 ][ prop ] < ( left[ 0 ][ prop ] ) ) {
                result = right.concat( left );
            }
            else {
				/* By this point, we know that the left and the right
				* arrays overlap by at least one element and simple
				* concatenation will not suffice to merge them. */

                result = new Array( left_len + right_len );
                let k = 0, h = 0;
                while ( true ) {
                    if ( right_val[ prop ] < left_val[ prop ] ) {
                        result[ k + h ] = right_val;
                        if ( ++h < right_len ) {
                            right_val = right[ h ];
                        } else {
                            while ( k < left_len ) {
                                result[ k + h ] = left[ k++ ];
                            }
                            break;
                        }
                    } else {
                        result[ k + h ] = left_val;
                        if ( ++k < left_len ) {
                            left_val = left[ k ];
                        } else {
                            while ( h < right_len ) {
                                result[ k + h ] = right[ h++ ];
                            }
                            break;
                        }
                    }
                }
            }
            // setting array length to zero effectively removes the array from
            // memory (older versions of Firefox would leak unless these arrays
            // were reset).
            left.length = 0;
            right.length = 0;
            return result;
        }

        private static find_fchain( arr, offset, limit, prop: any ) {
			/*
			* Given an array and offset equal to indexOf(elA), find
			* the (indexOf(elZ) + 1) of an element elZ in the array,
			* such that all elements elA..elZ form a non-strict
			* forward-ordered chain.
			*/
            let tmp, succ;
            for ( tmp = arr[ offset ][ prop ];
                ++offset < limit && tmp <= ( succ = arr[ offset ][ prop ] );
                tmp = succ
            ) { }
            return offset;
        }

        private static find_strict_rchain( arr, offset, limit, prop: any ): number {
			/*
			* Given an array and offset equal to indexOf(elA), find
			* the (indexOf(elZ) + 1) of an element elZ in the array,
			* such that all elements elA..elZ form a strict
			* reverse-ordered chain.
			*/
            let tmp, succ;
            for ( tmp = arr[ offset ][ prop ];
                ++offset < limit && ( succ = arr[ offset ][ prop ] ) < tmp;
                tmp = succ
            ) { }
            return offset;
        }

        private static chain_unit( arr, prop: any ) {
            // Step 1: return an array of chain arrays
            // expecting data in reverse order
            let terminus,
                len = arr.length,
                tmp = [],
                f = AdaptiveSort.find_strict_rchain;

            for ( let k = 0; k < len; k = terminus ) {
                // try to find a chain (ordered sequence of at least
                // two elements) using a default function first:

                terminus = f( arr, k, len, prop );
                if ( terminus - k > 1 ) {
                    tmp.push(
                        ( f === AdaptiveSort.find_strict_rchain ) ?
                            arr.slice( k, terminus ).reverse() :
                            arr.slice( k, terminus )
                    );
                }
                else if ( f === AdaptiveSort.find_strict_rchain ) {
					/* searched for a reverse chain and found none:
					* switch default function to forward and look
					* for a forward chain at k + 1: */

                    tmp.push( arr.slice( k, ++terminus ) );
                    f = AdaptiveSort.find_fchain;
                }
                else {
					/* searched for a forward chain and found none:
					* switch default function to reverse and look
					* for a reverse chain at k + 1: */

                    tmp.push( arr.slice( k, ++terminus ).reverse() );
                    f = AdaptiveSort.find_strict_rchain;
                }
            }
            return tmp;
        }

        private static chain_join( tmp, prop: any ) {
            // Step 2: join all chains
            let j = tmp.length;
            if ( j < 1 ) { return tmp; }

            // note: we reduce the size of the array after each iteration,
            // which is not really necessary (could be done at once at the end).
            for ( ; j > 1; tmp.length = j ) {
                let k, lim = j - 2;
                // At this point, lim === tmp.length - 2, so tmp[k + 1]
                // is always defined for any k in [0, lim)
                for ( j = 0, k = 0; k < lim; k = j << 1 ) {
                    tmp[ j++ ] = AdaptiveSort.merge( tmp[ k ], tmp[ k + 1 ], prop );
                }
                // Last pair is special -- its treatment depends on the initial
                // parity of j, which is the same as the current parity of lim.
                tmp[ j++ ] = ( k > lim ) ? tmp[ k ] : AdaptiveSort.merge( tmp[ k ], tmp[ k + 1 ], prop );
            }
            const result = tmp.shift();
            return result;
        }

		/**
		* Sorts an array of objects. You need to specify the property of the object we are comparing.
		* For example [ {age: 5}, {age : 8} ]. In this case the prop would be 'age'
		*/
        static sort( arr, prop ) {
            /* jshint bitwise: false */
            /* jshint noempty: false */

            'use strict';
			/**
			* Sorts an array of integers using the AdaptiveSort algorithm.
			* @param {Array.<number>} items Array of items to be sorted.
			*/

			/*
			* Adaptive merge sort algorithm
			* Implementation: Eugene Scherba, 11/9/2010
			*
			* This is a stable sort algorithm, similar to merge sort except
			* that it takes advantage of partially ordered 'chains' (Donald
			* Knuth refers to these structures as 'runs'). Performance of this
			* algorithm is directly dependent on the amount of preexisting
			* partial ordering, however generally it is pretty good even on
			* completely random arrays.
			*
			* Time complexity: O(n) if array is already sorted,
			* O(n.log(n)) in a worst case which should be rare.
			* Space complexity: O(n) in worst case, usually around O(n/2).
			*/


            // immutable version -- store result in a separate location
            return AdaptiveSort.chain_join( AdaptiveSort.chain_unit( arr, prop ), prop );

            // mutable (standard) version -- store result in-place
            // var result = chain_join(chain_unit(arr));
            // for (var k = 0, len = arr.length; k < len; k++) {
            //    arr[k] = result[k];
            // }
            // result.length = 0;
            // return arr;
        }
    }
}