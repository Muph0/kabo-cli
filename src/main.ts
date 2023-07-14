import { stdout } from "process"
import "./ext"
import { ANSI } from "./sgr"


(async function main() {

    ANSI("Welcome to ").red("kabo").rst("!").log()

    const x = await ANSI("Test: ").ylw().read()
    ANSI(" = " + x).rst().writeLine()

    var i = 0
    do {
        i = await ANSI.menu([
            "Ahoj",
            "Jak",
            ANSI("se ").grn("máš").rst("?"),
            "Konec",
        ])
    } while (i !== 3);

})()



