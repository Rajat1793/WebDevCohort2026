function createOptimisedVersion(fn) {
  const cache = {}; //  Tiffin

  return function (...args) {
    const key = JSON.stringify(args);
    if (cache[key]) {
      console.log(`Returning from cache`, key);
      return cache[key];
    }

    const result = fn(...args);
    cache[key] = result;
    return result;
  };
}

function add(a, b) {
  const result = a + b; // 0.25cpu
  return result;
}

function sqaure(n) {
  return n * n;
}

const optimisedSquare = createOptimisedVersion(sqaure);

console.time('startCode');
optimisedSquare(12255555);
console.timeEnd('startCode');
console.time('startCode');
optimisedSquare(12255555);
console.timeEnd('startCode');
console.time('startCode');
optimisedSquare(12255555);
console.timeEnd('startCode');
console.time('startCode');
optimisedSquare(12255555);
console.timeEnd('startCode');
console.time('startCode');
optimisedSquare(12255555);
console.timeEnd('startCode');
