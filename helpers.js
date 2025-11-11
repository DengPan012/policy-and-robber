
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}


function complement(full, subset) {
  const set = new Set(subset);
  return full.filter(x => !set.has(x));
}



function sample(arr, size = 1, replace = false, rng = Math.random) {
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error("sample: arr must be non-empty array");
  }
  if (!Number.isInteger(size) || size < 1) {
    throw new Error("sample: size must be integer >= 1");
  }
  if (!replace && size > arr.length) {
    throw new Error("sample: size > arr.length when replace=false");
  }

  if (replace) {
    const out = new Array(size);
    for (let i = 0; i < size; i++) {
      out[i] = arr[Math.floor(rng() * arr.length)];
    }
    return size === 1 ? out[0] : out;
  } else {
    // without replacement: partial Fisher–Yates (efficient for size <= arr.length)
    const pool = arr.slice();
    const n = pool.length;
    for (let i = 0; i < size; i++) {
      const j = i + Math.floor(rng() * (n - i));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const result = pool.slice(0, size);
    return size === 1 ? result[0] : result;
  }
}


function checkDistance(loc1, loc2, gridRow) {
  const dx = (loc1 % gridRow) - (loc2 % gridRow);
  const dy = Math.floor(loc1 / gridRow) - Math.floor(loc2 / gridRow);
  return Math.abs(dx) + Math.abs(dy);
}



// permute(arr, size=arr.length, all=true)
// returns an array of permutations (order matters) of length `size` without replacement.
function permute(arr, size = arr.length, all = true) {
  if (!all) throw new Error("This implementation supports order-dependent permutations (all=true).");
  if (size < 1 || size > arr.length) return [];
  const res = [];
  const used = new Array(arr.length).fill(false);
  const buffer = new Array(size);

  (function backtrack(depth) {
    if (depth === size) {
      res.push(buffer.slice());
      return;
    }
    for (let i = 0; i < arr.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      buffer[depth] = arr[i];
      backtrack(depth + 1);
      used[i] = false;
    }
  })(0);

  return res;
}



module.exports = {
  shuffle,
  complement,
  sample,
  checkDistance,
  permute
};