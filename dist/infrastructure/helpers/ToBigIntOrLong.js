"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toBigIntOrLong = toBigIntOrLong;
const long_1 = __importDefault(require("long"));
/**
 * Convert value to BigInt or Long depending on environment.
 * Try JS BigInt first, otherwise return Long.fromString.
 *
 * Many TL constructors accept either BigInt or Long depending on gramjs version,
 * so this helper attempts to produce a compatible numeric type.
 */
function toBigIntOrLong(value) {
    if (value === undefined || value === null)
        return 0n;
    // if already bigint
    if (typeof value === "bigint")
        return value;
    // if already Long
    if (long_1.default.isLong && long_1.default.isLong(value))
        return value;
    // try BigInt
    try {
        // if it's a string like "12345678901234567890"
        if (typeof value === "string")
            return BigInt(value);
        if (typeof value === "number") {
            // numbers beyond Number.MAX_SAFE_INTEGER will lose precision, but BigInt(number) still works
            return BigInt(value);
        }
    }
    catch (e) {
        // fallthrough to Long
    }
    // fallback: use Long (string-safe)
    try {
        return long_1.default.fromString(String(value), true); // unsigned? accessHash might be unsigned -> true
    }
    catch (e) {
        // last resort: try Long.fromNumber
        return long_1.default.fromNumber(Number(value));
    }
}
