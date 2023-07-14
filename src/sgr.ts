import { stdin, stdout } from "process"
import { readLine } from "./utils"


const code = (...codes: any) => `\x1b[${codes.join("")}`

const sgr = (...codes: number[]) => code(...codes, "m")

const UP = code("A")
const DOWN = code("B")
const RIGHT = code("C")
const LEFT = code("D")

const ENTER = "\r"
const BACKSPACE = "\b"
const CTRL_C = "\x03"

function ctrl_c_exit(): never {
    ANSI().red("^C").rst().writeLine()
    process.exit(3)
}

export type ANSI = AnsiBuilder
export const ANSI = Object.assign((text?: any) => new AnsiBuilder(text ? [text.toString()] : []), {
    getch,
    menu,
})

class AnsiBuilder {
    constructor(
        private readonly text: string[],
    ) { }

    blk(text?: any) { this.text.push(sgr(30), text ?? ""); return this }
    red(text?: any) { this.text.push(sgr(31), text ?? ""); return this }
    grn(text?: any) { this.text.push(sgr(32), text ?? ""); return this }
    blu(text?: any) { this.text.push(sgr(34), text ?? ""); return this }
    ylw(text?: any) { this.text.push(sgr(33), text ?? ""); return this }
    mag(text?: any) { this.text.push(sgr(35), text ?? ""); return this }
    cya(text?: any) { this.text.push(sgr(36), text ?? ""); return this }
    whi(text?: any) { this.text.push(sgr(37), text ?? ""); return this }
    bold(text?: any) { this.text.push(sgr(1), text ?? ""); return this }
    rst(text?: any) { this.text.push(sgr(0), text ?? ""); return this }

    txt(text: any) { this.text.push(`${text}`); return this }

    up(amt = 1) { if (amt >= 1) this.text.push(code(Math.floor(amt), "A")); return this }
    down(amt = 1) { if (amt >= 1) this.text.push(code(Math.floor(amt), "B")); return this }

    right(amt = 1) { if (amt >= 1) this.text.push(code(Math.floor(amt), "C")); return this }
    left(amt = 1) { if (amt >= 1) this.text.push(code(Math.floor(amt), "D")); return this }

    prevl(amt = 1) { this.txt("\r").up(amt); return this }
    endl(amt = 1) {
        if (amt === 1) this.txt("\n")
        else if (amt > 1) this.txt("\r").up(amt)
        return this
    }

    log() { this.writeLine(); return this }
    write() { stdout.write(this.toString()); this.clear(); return this }
    writeLine() { this.endl().write(); return this }

    clear() { this.text.splice(0, this.text.length); return this }
    clone() { return new AnsiBuilder([...this.text]) }

    /**
     * Read a string from the user. On enter, reset color and move to next line.
     * @param prefill Default value of the input
     * @returns String put in by the user
     */
    readLine(prefill?: string): Promise<string> {
        return this.read(prefill).then(r => (ANSI().rst("\n").write(), r))
    }

    /**
     * Read a string from the user, keep the color and line.
     * @param prefill Default value of the input
     * @returns String put in by the user
     */
    async read(prefill?: string): Promise<string> {
        this.write()

        var value = prefill ?? ""
        var cursor = value.length

        while (true) {
            const oldCursor = cursor
            const c = await getch(true)

            switch (c) {
                case CTRL_C: ctrl_c_exit()
                case ENTER: return value
                case LEFT: cursor--; break
                case RIGHT: cursor++; break
                case BACKSPACE: {
                    value = value.substring(0, cursor - 1) + value.substring(cursor)
                    cursor--
                } break
                default: if (c.charCodeAt(0) >= 32) {
                    value = value.substring(0, cursor) + c + value.substring(cursor)
                    cursor++
                } break
            }

            cursor = Math.max(0, Math.min(value.length, cursor))

            ANSI().left(oldCursor) // move to start
                .txt(value + " ") // print value
                .left(value.length - cursor + 1) // move to new cursor
                .write()
        }
    }


    toString(): string {
        return this.text.join("")
    }
    [Symbol.toStringTag]() : string {
        return this.toString()
    }
}

function getch(supressCtrlCTermination = false): Promise<string> {
    return new Promise(done => {
        stdin.setRawMode(true)
        stdin.resume()
        stdin.setEncoding("utf-8")

        function ondata(c: string) {
            if (!supressCtrlCTermination && c === CTRL_C) ctrl_c_exit()
            stdin.removeListener("data", ondata)
            stdin.pause()
            done(c)
        }

        stdin.addListener("data", ondata)
    })
}

async function menu(items: (string | ANSI)[], selected: number = 0): Promise<number> {
    const out = ANSI()
    while (true) {
        for (let i = 0; i < items.length; i++) {
            if (i === selected) out.ylw("> ")
            else out.txt("  ")

            out.rst(items[i].toString()).endl()
        }

        out.write()
        const c = await getch()

        if (c === UP) selected--
        if (c === DOWN) selected++
        if (c === ENTER) return selected

        selected = (selected + items.length) % items.length

        out.up(items.length)
    }
}