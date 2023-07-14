
// Array ext
declare global {
    interface Array<T> {
        last(): T | undefined
    }
}
Array.prototype.last = function (i: number = 0) {
    return this[this.length - 1 - i]
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