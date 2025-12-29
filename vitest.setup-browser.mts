// Set up WebSocket polyfill using the actual ws implementation
globalThis.WebSocket = require('ws');

// Ensure isSecureContext is true for browser tests
if (typeof globalThis.isSecureContext === 'undefined') {
    Object.defineProperty(globalThis, 'isSecureContext', {
        value: true,
        configurable: true,
    });
}
