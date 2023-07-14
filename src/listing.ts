

export function createKey<T>(name: string): Key<T> {
    return Object.freeze({
        name,
        __phantom: undefined as T
    })
}

export type Key<T> = {
    readonly name: string,
    readonly __phantom: T,
}

const listing = new Map<any, any[]>();
export function Declare<T>(key: Key<T>) {
    return (target: T) => {
        const array = listing.get(key) ?? []
        array.push(target)
        listing.set(key, array)
    }
}

export function getDeclared<T>(key: T): T[] {
    return listing.get(key) ?? []
}