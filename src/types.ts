type TupleStringArray = [string, string, string][];

export function isTupleStringArray(value: any): value is TupleStringArray {
    return Array.isArray(value) && value.every(item => Array.isArray(item) && item.length === 3 && typeof item[0] === 'string' && typeof item[1] === 'string' && typeof item[2] === 'string');
}
