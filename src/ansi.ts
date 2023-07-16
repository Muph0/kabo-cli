import { stdout } from "process"
import { getch } from "./ui"


const code = (...codes: any) => `\x1b[${codes.join("")}`

const sgr = (...codes: number[]) => code(...codes, "m")

const UP = code("A")
const DOWN = code("B")
const RIGHT = code("C")
const LEFT = code("D")

const ENTER = "\r"
const BACKSPACE = "\b"
const CTRL_C = "\x03"
const DEL = code("3~")

export function ctrl_c_exit(): never {
    ANSI().red("^C").rst().flushLine()
    process.exit(3)
}

export type ANSI = AnsiBuilder
export const ANSI = Object.assign((text?: any) => new AnsiBuilder(text ? [text.toString()] : []), {
    sgr, code,
    UP, DOWN, RIGHT, LEFT, ENTER, BACKSPACE, CTRL_C, DEL,
    cursor,
})

type Validator = (s: string) => boolean | string

class AnsiBuilder {
    constructor(
        private readonly text: string[],
    ) { }

    blk(...text: any[]) { this.txt(sgr(30), ...text); return this }
    red(...text: any[]) { this.txt(sgr(31), ...text); return this }
    grn(...text: any[]) { this.txt(sgr(32), ...text); return this }
    blu(...text: any[]) { this.txt(sgr(34), ...text); return this }
    ylw(...text: any[]) { this.txt(sgr(33), ...text); return this }
    mag(...text: any[]) { this.txt(sgr(35), ...text); return this }
    cya(...text: any[]) { this.txt(sgr(36), ...text); return this }
    whi(...text: any[]) { this.txt(sgr(37), ...text); return this }
    bold(...text: any[]) { this.txt(sgr(1), ...text); return this }
    gray(...text: any[]) { this.txt(sgr(90), ...text); return this }
    rst(...text: any[]) { this.txt(sgr(0), ...text); return this }

    txt(...text: any[]) { this.text.push(...text); return this }

    up(amt = 1) { if (amt >= 1) this.txt(code(Math.max(0, Math.floor(amt)), "A")); return this }
    down(amt = 1) { if (amt >= 1) this.txt(code(Math.max(0, Math.floor(amt)), "B")); return this }

    right(amt = 1) { if (amt >= 1) this.txt(code(Math.max(0, Math.floor(amt)), "C")); return this }
    left(amt = 1) { if (amt >= 1) this.txt(code(Math.max(0, Math.floor(amt)), "D")); return this }

    /** Jump to begining of previous line */
    prevl(amt = 1) { this.txt("\r").up(amt); return this }
    /** Jump to begining of next line */
    endl(amt = 1) {
        if (amt === 1) this.txt("\n")
        else if (amt > 1) this.txt("\r").up(amt)
        return this
    }
    cret() { this.txt("\r"); return this }

    flushLine() { this.endl().flush(); return this }
    flush() { stdout.write(this.toString()); this.clear(); return this }

    clrLineToEnd() { this.txt(code("0K")); return this }
    clrLineToStart() { this.txt(code("1K")); return this }
    clrLine() { this.txt(code("2K")); return this }

    /** Clear from cursor to the end of the screen */
    clrBelow() { this.txt(code("0J")); return this }
    /** Clear from beginning of the screen to cursor */
    clrAbove() { this.txt(code("1J")); return this }
    /** Clear entire screen */
    clrScreen() { this.txt(code("2J")); return this }

    /** Move cursor to position */
    cursor(x: number, y: number) {
        this.txt(code(Math.floor(y + 1), ";", Math.floor(x + 1), "H"))
        return this
    }

    clear() { this.text.splice(0, this.text.length); return this }
    clone() { return new AnsiBuilder([...this.text]) }

    /**
     * Read a string from the user. On enter, reset color and move to next line.
     * @param prefill Default value of the input
     * @returns String put in by the user
     */
    readLine(validator?: Validator, prefill?: string): Promise<string> {
        return this.read(validator, prefill)
            .then(r => (ANSI().rst("\n").flush(), r))
    }

    /**
     * Read a string from the user, keep the color and line.
     * @param prefill Default value of the input
     * @returns String put in by the user
     */
    async read(validator?: Validator, prefill?: string): Promise<string> {

        var value = prefill ?? ""
        var cursor = value.length
        this.txt(value).flush()

        while (true) {
            const oldCursor = cursor
            const c = await getch(true)

            switch (c) {
                case CTRL_C: ctrl_c_exit()
                case ENTER: {
                    if (!validator || validator(value) === true)
                        return value
                } break
                case LEFT: cursor--; break
                case RIGHT: cursor++; break
                case BACKSPACE: {
                    value = value.substring(0, cursor - 1) + value.substring(cursor)
                    cursor--
                } break
                case DEL: {
                    value = value.substring(0, cursor) + value.substring(cursor + 1)
                } break
                default: if (c.charCodeAt(0) >= 32) {
                    value = value.substring(0, cursor) + c + value.substring(cursor)
                    cursor++
                } break
            }

            cursor = Math.max(0, Math.min(value.length, cursor))
            var status = !validator || validator(value)

            const out = ANSI()
                .left(oldCursor) // move to start
                .txt(value).clrLineToEnd() // print value
                .left(value.length - cursor) // move to new cursor

            if (status !== true) {
                status = `  ${status || "Invalid"}`
                out.red(status).rst().left(status.length)
            }

            out.flush()
        }
    }

    readLineInt(validator?: (n: number) => boolean | string, prefill?: number) {
        return this.readInt(validator, prefill).then(x => (stdout.write("\n"), x))
    }
    readInt(validator?: (n: number) => boolean | string, prefill?: number) {
        return this.read(s => {
            const num = Number.parseInt(s)
            return (!Number.isNaN(num) && (!validator || validator(num)))
                || "Invalid integer"
        }, prefill?.toString()).then(s => Number.parseInt(s))
    }

    readLineNumber(validator?: (n: number) => boolean | string, prefill?: number) {
        return this.readNumber(validator, prefill).then(x => (stdout.write("\n"), x))
    }
    readNumber(validator?: (n: number) => boolean | string, prefill?: number,) {
        return this.read(s => {
            const num = Number.parseFloat(s)
            return (!Number.isNaN(num) && (!validator || validator(num)))
                || "Invalid number"
        }, prefill?.toString()).then(s => Number.parseFloat(s))
    }

    toString(): string {
        return this.text.join("")
    }
    [Symbol.toStringTag](): string {
        return this.toString()
    }
}

const ANSI_CURSOR = /^\x1b\[(\d+);(\d+)R$/
async function cursor(): Promise<{ x: number, y: number }> {
    stdout.write(code("6n"))
    const ch = await getch()

    const match = ANSI_CURSOR.exec(ch)
    if (!match) throw Error("ANSI cursor is broken")
    return {
        x: Number.parseInt(match[1]),
        y: Number.parseInt(match[2]),
    }
}
