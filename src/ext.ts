
// Array ext
declare global {
    interface Array<T> {
        lastOrNull(): T | undefined
        minBy(selector: (t: T) => number): T
        minBy(selector: (t: T) => string): T
        get indices(): Iterable<number>
        count(filter: (t: T) => boolean): number
        /** Filter out all values assignable to @param not */
        filterNot<U>(not: U): Exclude<T, U>[]
    }
}
Array.prototype.lastOrNull = function (i: number = 0) {
    return this[this.length - 1 - i]
}
Array.prototype.minBy = function (selector: (t: any) => number | string) {
    if (this.length === 0) throw new Error("Empty array")
    let best = this[0]
    let bestVal = selector(best)
    for (let i = 1; i < this.length; i++) {
        const it = this[i]
        const itVal = selector(it)
        if (itVal < bestVal) {
            bestVal = itVal
            best = it
        }
    }
    return best
}
Object.defineProperty(Array.prototype, "indices", {
    *get() {
        for (let i = 0; i < this.length; i++) yield i
    },
});
Array.prototype.count = function count(filter: (t: any) => boolean): number {
    let count = 0
    for (let v of this) {
        count += filter(v) ? 1 : 0
    }
    return count
}
Array.prototype.filterNot = function filterNot(value: any): any[] {
    const result = []
    for (let v of this) {
        if (v !== value) result.push(v)
    }
    return result
}

// Promise ext
declare global {
    interface PromiseConstructor {
        yield(): Promise<void>
        wait(millis: number): Promise<void>
    }
}
Promise.yield = () => new Promise(r => setImmediate(r))
Promise.wait = ms => new Promise(r => setTimeout(r, ms))

export = void 0