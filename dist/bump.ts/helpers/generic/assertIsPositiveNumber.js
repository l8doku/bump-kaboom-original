export default function assertIsPositiveNumber(value, name) {
    if (isNaN(value) || value <= 0)
        throw new Error(`"${name}" must be a positive integer, but was ${value} (${typeof value})`);
}
//# sourceMappingURL=assertIsPositiveNumber.js.map