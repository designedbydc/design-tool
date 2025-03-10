/**
 * Event Emitter
 * 
 * Simple implementation of the observer pattern.
 * Allows objects to subscribe to and emit events.
 */

export class EventEmitter {
    constructor() {
        this._events = new Map();
    }
    
    /**
     * Add an event listener
     * @param {string} event - Event name
     * @param {Function} callback - Event handler
     */
    on(event, callback) {
        if (!this._events.has(event)) {
            this._events.set(event, new Set());
        }
        this._events.get(event).add(callback);
    }
    
    /**
     * Remove an event listener
     * @param {string} event - Event name
     * @param {Function} callback - Event handler to remove
     */
    off(event, callback) {
        if (this._events.has(event)) {
            this._events.get(event).delete(callback);
        }
    }
    
    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {...*} args - Arguments to pass to handlers
     */
    emit(event, ...args) {
        if (this._events.has(event)) {
            for (const callback of this._events.get(event)) {
                try {
                    callback(...args);
                } catch (err) {
                    console.error(`Error in event handler for ${event}:`, err);
                }
            }
        }
    }
    
    /**
     * Remove all event listeners
     * @param {string} [event] - Optional event name to clear
     */
    removeAllListeners(event) {
        if (event) {
            this._events.delete(event);
        } else {
            this._events.clear();
        }
    }
} 