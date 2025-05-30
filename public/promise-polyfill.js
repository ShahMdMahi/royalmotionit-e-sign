/**
 * Global polyfill for Promise.withResolvers
 * Add this script to the document head to ensure compatibility across all browsers
 */
(function() {
  'use strict';
  
  // Check if Promise.withResolvers is already available
  if (typeof Promise !== 'undefined' && typeof Promise.withResolvers === 'undefined') {
    Promise.withResolvers = function() {
      var resolve, reject;
      var promise = new Promise(function(res, rej) {
        resolve = res;
        reject = rej;
      });
      
      return {
        promise: promise,
        resolve: resolve,
        reject: reject
      };
    };
    
    // Log that polyfill was applied (can be removed in production)
    if (typeof console !== 'undefined' && console.log) {
      console.log('Promise.withResolvers polyfill applied');
    }
  }
})();
