
import Long from "long";

/**
 * Convert value to BigInt or Long depending on environment.
 * Try JS BigInt first, otherwise return Long.fromString.
 *
 * Many TL constructors accept either BigInt or Long depending on gramjs version,
 * so this helper attempts to produce a compatible numeric type.
 */
export function toBigIntOrLong(value: any): any {
    if (value === undefined || value === null) return 0n;
    // if already bigint
    if (typeof value === "bigint") return value;
    // if already Long
    if (Long.isLong && Long.isLong(value)) return value;
    // try BigInt
    try {
      // if it's a string like "12345678901234567890"
      if (typeof value === "string") return BigInt(value);
      if (typeof value === "number") {
        // numbers beyond Number.MAX_SAFE_INTEGER will lose precision, but BigInt(number) still works
        return BigInt(value);
      }
    } catch (e) {
      // fallthrough to Long
    }
    // fallback: use Long (string-safe)
    try {
      return Long.fromString(String(value), true); // unsigned? accessHash might be unsigned -> true
    } catch (e) {
      // last resort: try Long.fromNumber
      return Long.fromNumber(Number(value));
    }
  }
  