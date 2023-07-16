import { Player } from "./model/player"
import { Round } from "./round"
import { ANSI } from "./ansi"
import { range } from "./utils"
import { DefaultReporter } from "./reporting/reporter"

export class Game {

    readonly players: Player[] = []

    readonly rounds: Round[] = []
    readonly score: number[]

    get firstRound() {
        return this.rounds.length === 1
    }
    get finished() {
        const scoreLimit = this.scoreLimit
        const roundLimit = this.roundLimit
        return (scoreLimit && this.score.some(s => s >= scoreLimit))
            || (roundLimit && this.rounds.length >= roundLimit)
    }

    constructor(
        playerCtors: (new () => Player)[],
        readonly scoreLimit?: number,
        readonly roundLimit?: number,
    ) {
        this.score = playerCtors.map(_ => 0)
        this.players = playerCtors.map(Ctor => new Ctor())

        if (!roundLimit && !scoreLimit)
            ANSI().ylw("WARNING").rst(": Inifinite game created!").flushLine()
    }

    private startPlayerId = 0
    async nextRound(): Promise<Round> {
        const reporter = new DefaultReporter()
        const round = new Round(this.startPlayerId, this.players, reporter)

        this.rounds.push(round)
        await reporter.onRoundStart(round)

        if (this.firstRound) {
            this.players.forEach((p, id) => p.onGameStart(id))
        }

        while (!round.finished) {
            await round.nextTurn()
        }

        for (let i of this.players.indices) {
            this.score[i] += round.score[i]
        }

        this.nextStartPlayer()
        return round
    }

    private nextStartPlayer() {
        this.startPlayerId++
        this.startPlayerId %= this.players.length
    }

}