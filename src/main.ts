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

    ANSI("Welcome to ").cya("KABO").rst("!").log()

    const playerCount = await ANSI("Enter the number of players: ").readLineInt(atLeast(2))
    const players: (new() => Player)[] = []

    for (let i = 1; i <= playerCount; i++) {
        ANSI("Select player ").ylw(i).rst(":").log()

        const options = [InteractivePlayer, AineBot]
        const s = await menu(options.map(p => p.name))

        players.push(options[s])
    }

    ANSI().gray(`Selected players: [${players.map(p => p.name).join(", ")}]`).rst().log()

    const game = new Game(players, 100)

    while (!game.finished) {
        await game.nextRound()
    }

})()



