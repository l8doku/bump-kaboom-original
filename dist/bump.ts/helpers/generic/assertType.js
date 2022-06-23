export default function assertType(desiredType, value, name) {
    if (typeof value !== desiredType)
        throw new Error(`"${name}" must be a ${desiredType}, but was a ${value} (${typeof value})`);
}
//# sourceMappingURL=assertType.js.map