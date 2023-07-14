
export type Tuple<T, N extends number> =
    number extends N ? T[] : _TupleOf<T, N, []>

type _TupleOf<T, N extends number, R extends unknown[]> =
    R['length'] extends N
    ? R
    : _TupleOf<T, N, [T, ...R]>

export function Tuple<T, N extends number>(value: T, length: N): Tuple<T, N> {
    return new Array(length).fill(value) as any
}


declare global {
    interface Array<T> {
        last(): T | undefined
    }
}
Array.prototype.last = function (i: number = 0) {
    return this[this.length - 1 - i]
}

import { stdin, stdout } from 'node:process'
import * as readline_lib from 'node:readline/promises';
export async function readLine(question: string = ""): Promise<string> {
    const rl = readline_lib.createInterface({ input: stdin, output: stdout })
    const res = await rl.question(question)
    rl.close()
    return res
}