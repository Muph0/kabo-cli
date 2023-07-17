import { ANSI } from "./ansi"
import { AineBot } from "./bots/aine-bot"
import { InteractivePlayer } from "./bots/interactive"
import "./ext"
import { Game } from "./game"
import { Player } from "./model/player"
import { menu } from "./ui"

function atLeast(n: number) {
    return (i: number) => (i >= n) || `Must be at least ${n}`
}

(async function main() {

    ANSI().clrScreen().setCursor(0,0).txt("Welcome to ").cya("KABO").rst("!").flushLine()

    const playerCount = await ANSI("Enter the number of players: ").readLineInt(atLeast(2))
    const players: (new () => Player)[] = []

    var sel = 0
    for (let i = 1; i <= playerCount; i++) {
        const header = ANSI("Select player ").ylw(i).rst(":")
        header.clone().flushLine()

        const options = [InteractivePlayer, AineBot]
        sel = await menu(options.map(p => p.name), sel)
        const player = options[sel]

        ANSI().prevl().txt(header, " ", player.name).flushLine()
        players.push(player)
    }

    const game = new Game(players, 100)

    while (!game.finished) {
        await game.nextRound()
    }

})()



