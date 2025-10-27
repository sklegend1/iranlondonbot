"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = sleep;
/**
 * small sleep helper
 */
function sleep(ms) {
    return new Promise((res) => setTimeout(res, ms));
}
