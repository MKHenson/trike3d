namespace Trike {

    export type TypedCallback<T extends string, Y> = ( type: T, event: Y, sender?: EventDispatcher ) => void;

    /**
     * Internal class only used internally by the {EventDispatcher}
     */
    export class EventListener<T extends string, Y> {
        type: T;
        func: TypedCallback<T, Y>;
        context: any;

        constructor( type: T, func: TypedCallback<T, Y>, context?: any ) {
            this.type = type;
            this.func = func;
            this.context = context;
        }
    }

    /**
     * A simple class that allows for the adding, removing and dispatching of events.
     */
    export class EventDispatcher {
        protected _listeners: Array<EventListener<string, any>>;
        public disposed: boolean;

        constructor() {
            this._listeners = [];
            this.disposed = false;
        }


        /**
         * Returns the list of event listeners that are currently attached to this dispatcher.
         */
        get listeners(): Array<EventListener<string, any>> {
            return this._listeners;
        }

        /**
         * Adds a new listener to the dispatcher class.
         * @param type The event type we are sending
         * @param func The callback function
         * @param context [Optional] The context to call with
         */
        on<T extends string, Y>( type: T, func: TypedCallback<T, Y>, context?: any ) {
            if ( !func )
                throw new Error( 'You cannot have an undefined function.' );

            this._listeners.push( new EventListener( type, func, context ) );
        }

        /**
         * Adds a new listener to the dispatcher class.
         * @param type The event type we are sending
         * @param func The callback function
         * @param context [Optional] The context to call with
         */
        off<T extends string, Y>( type: T, func: TypedCallback<T, Y>, context?: any ) {
            const listeners = this.listeners;

            if ( !listeners )
                return;

            if ( !func )
                throw new Error( 'You cannot have an undefined function.' );

            for ( let i = 0, li = listeners.length; i < li; i++ ) {
                const l = listeners[ i ];
                if ( l.type === type && l.func === func && l.context === context ) {
                    listeners.splice( i, 1 );
                    return;
                }
            }
        }

        /**
         * Sends a message to all listeners based on the eventType provided.
         * @param type The event type we are sending
         * @param data [Optional] The data to send with the emission
         */
        emit<T extends string, Y>( type: T, data?: Y | null ): any {
            if ( this._listeners.length === 0 )
                return null;

            let listeners = this._listeners;
            let toRet: any = null;
            for ( let listener of listeners! ) {
                if ( listener.type === type ) {
                    if ( !listener.func )
                        throw new Error( `A listener was added for ${type}, but the function is not defined.` );

                    toRet = listener.func.call( listener.context || this, type, data, this );
                }
            }

            return toRet;
        }

        /**
         * This will cleanup the component by nullifying all its variables and clearing up all memory.
         */
        dispose(): void {
            this._listeners.splice( 0, this._listeners.length );
            this.disposed = true;
        }
    }
}