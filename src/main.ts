import { stdout } from "process"
import "./ext"
import { ANSI, getc } from "./sgr"


(async function main() {

    ANSI("Welcome to ").red("kabo").rst("!").log()

    const x = await ANSI("Test: ").ylw().read()
    ANSI(" = " + x).rst().writeLine()

    while(true) {
        const c = await getc()
        stdout.write(c)
    }

})()



