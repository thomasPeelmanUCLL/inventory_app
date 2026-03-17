export function asMoney(v: string | number): string {
    if (typeof v === 'number') return v.toFixed(2);
    return v;
}

export function asPercent(v: string | number): string {
    if (typeof v === 'number') return `${v.toFixed(2)}%`;
    return `${v}%`;
}
