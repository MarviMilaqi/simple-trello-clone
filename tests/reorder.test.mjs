import assert from "node:assert/strict";
import { reorder } from "../frontend/js/utils.js";

assert.deepEqual(reorder([1, 2, 3], 0, 3), [2, 3, 1]);
assert.deepEqual(reorder([1, 2, 3], 0, 2), [2, 1, 3]);
assert.deepEqual(reorder([1, 2, 3], 2, 0), [3, 1, 2]);
assert.deepEqual(reorder([1, 2, 3], 1, 0), [2, 1, 3]);
assert.deepEqual(reorder([1, 2, 3], 5, 1), [1, 2, 3]);

console.log("reorder tests passed");
