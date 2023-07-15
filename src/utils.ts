
export type Tuple<T, N extends number> =
    number extends N ? T[] : _TupleOf<T, N, []>

type _TupleOf<T, N extends number, R extends unknown[]> =
    R['length'] extends N
    ? R
    : _TupleOf<T, N, [T, ...R]>

export function Tuple<T, N extends number>(value: T, length: N): Tuple<T, N> {
    return new Array(length).fill(value) as any
}

import { stdin, stdout } from 'node:process'
import * as readline_lib from 'node:readline/promises';
export async function readLine(question: string = ""): Promise<string> {
    const rl = readline_lib.createInterface({ input: stdin, output: stdout })
    const res = await rl.question(question)
    rl.close()
    return res
}

export type Class<T> = new (...args: any) => T


export function range(to: number): Iterable<number>;
export function range(from: number, to: number): Iterable<number>;
export function* range(a: number, b?: number): Iterable<number> {
    const to = b ?? a
    const from = b !== undefined ? a : 0

    for (let i = from; i < to; i++) {
        yield i
    }
}

