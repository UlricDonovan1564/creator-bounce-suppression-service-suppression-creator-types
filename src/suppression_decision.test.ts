import assert from "node:assert/strict";
import { decideDelivery } from "./creator_delivery.js";

assert.equal(decideDelivery(true), "suppressed");
assert.equal(decideDelivery(false), "send");
console.log("suppression decision test passed");
