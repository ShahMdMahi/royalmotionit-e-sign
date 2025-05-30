/**
 * Polyfill for Promise.withResolvers()
 * This method is not supported in all browsers, especially older mobile browsers
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers
 */

// Only add polyfill if Promise.withResolvers doesn't exist
if (typeof Promise.withResolvers === 'undefined') {
  Promise.withResolvers = function<T>() {
    let resolve: (value: T | PromiseLike<T>) => void;
    let reject: (reason?: any) => void;
    
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    
    return { promise, resolve: resolve!, reject: reject! };
  };
}

export {};
