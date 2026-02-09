// Helper function to check if a string looks like a large integer (BigInt candidate)
// Excludes date strings and other non-BigInt numeric strings
const isBigIntCandidate = (str: string): boolean => {
  // Only convert strings that:
  // 1. Are purely numeric (no decimals, no scientific notation)
  // 2. Are longer than 10 digits (suggests it might be a large count)
  // 3. Don't look like ISO dates or timestamps
  if (!/^\d+$/.test(str)) return false;
  if (str.length <= 10) return false; // Regular numbers, not BigInt

  // Exclude Unix timestamps (13 digits for milliseconds)
  // We want to keep view counts as BigInt but not timestamps
  const num = Number(str);
  if (num > 1000000000000 && num < 9999999999999) {
    // This range is likely a timestamp in milliseconds (year 2001-2286)
    return false;
  }

  return true;
};

// Helper function to recursively convert string representations of BigInt back to numbers
// Only converts strings that look like large integers (view counts, like counts, etc.)
export const convertBigIntStringsToNumbers = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    // Convert BigInt candidates back to regular numbers
    if (isBigIntCandidate(obj)) {
      return Number(obj);
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(convertBigIntStringsToNumbers);
  }

  if (typeof obj === 'object') {
    const converted: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        converted[key] = convertBigIntStringsToNumbers(obj[key]);
      }
    }
    return converted;
  }

  return obj;
};

export default convertBigIntStringsToNumbers;
