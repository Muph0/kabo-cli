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
export const ANSI = (text?: any) => new AnsiBuilder((text ?? "") + "")

class AnsiBuilder {
    constructor(
        private text: string,
    ) { }

    blk(text?: any) { this.text += sgr(30) + (text ?? ""); return this }
    red(text?: any) { this.text += sgr(31) + (text ?? ""); return this }
    grn(text?: any) { this.text += sgr(32) + (text ?? ""); return this }
    blu(text?: any) { this.text += sgr(34) + (text ?? ""); return this }
    ylw(text?: any) { this.text += sgr(33) + (text ?? ""); return this }
    mag(text?: any) { this.text += sgr(35) + (text ?? ""); return this }
    cya(text?: any) { this.text += sgr(36) + (text ?? ""); return this }
    whi(text?: any) { this.text += sgr(37) + (text ?? ""); return this }
    bold(text?: any) { this.text += sgr(1) + (text ?? ""); return this }
    rst(text?: any) { this.text += sgr(0) + (text ?? ""); return this }

    txt(text: any) { this.text += text; return this }

    up(amt = 1) { if (amt >= 1) this.text += code(Math.floor(amt), "A"); return this }
    down(amt = 1) { if (amt >= 1) this.text += code(Math.floor(amt), "B"); return this }

    right(amt = 1) { if (amt >= 1) this.text += code(Math.floor(amt), "C"); return this }
    left(amt = 1) { if (amt >= 1) this.text += code(Math.floor(amt), "D"); return this }

    log(): void { stdout.write(this.text + "\n") }
    write(): void { stdout.write(this.text) }
    writeLine(): void { stdout.write(this.text + "\n") }

    /**
     * Read a string from the user. On enter, reset color and move to next line.
     * @param prefill Default value of the input
     * @returns String put in by the user
     */
    readLine(prefill = ""): Promise<string> {
        return this.read(prefill).then(r => (ANSI().rst("\n").write(), r))
    }

    /**
     * Read a string from the user, keep the color and line.
     * @param prefill Default value of the input
     * @returns String put in by the user
     */
    read(prefill = ""): Promise<string> {
        this.write()

        return new Promise(done => {
            stdin.setRawMode(true)
            stdin.resume()
            stdin.setEncoding("utf-8")

            var value = prefill
            var cursor = value.length

            function ondata(c: string) {
                const oldCursor = cursor

                switch (c) {
                    case CTRL_C: ctrl_c_exit()
                    case ENTER: {
                        stdin.removeListener("data", ondata)
                        stdin.pause()
                        done(value)
                    } return
                    case BACKSPACE: if (value.length > 0) {
                        value = value.substring(0, cursor - 1) + value.substring(cursor)
                        cursor--
                    } break
                    default: if (c.charCodeAt(0) >= 32) {
                        value = value.substring(0, cursor) + c + value.substring(cursor)
                        cursor++
                    } break
                }

                ANSI().left(oldCursor) // move to start
                    .txt(value + " ") // print value
                    .left(value.length - cursor + 1) // move to new cursor
                    .write()
            }

            stdout.write(value)
            stdin.addListener("data", ondata)
        });
    }

    toString() {
        return this.text
    }
    [Symbol.toStringTag]() {
        return this.text
    }
}

export function getc(supressCtrlCTermination = false): Promise<string> {
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

