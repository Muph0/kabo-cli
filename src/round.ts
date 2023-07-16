import { ANSI } from "./ansi"
import { Card, abilityName, cardCan, newDeck } from "./model/cards"
import { Action, Cmd } from "./model/commands"
import { Move } from "./model/moves"
import { CardId, Player, PlayerId } from "./model/player"
import { Turn } from "./model/turn"
import { Reporter } from "./reporting/reporter"
import { Tuple } from "./utils"

const CARD_HAND_COUNT = 4
const START_PEEK_COUNT = 2
const KABO_LOSE_PENALTY = 10

type Hand = Card[]


export class Round {

    readonly hands: Hand[] = []

    private takeDeck: Card[]
    private burnDeck: Card[]

    private turns: Turn[] = []
    private kaboPlayerId: PlayerId | undefined
    private curPlayerId: PlayerId

    get curPlayer() { return this.players[this.curPlayerId] }
    get curHand(): Hand { return this.hands[this.curPlayerId] }

    get firstTurn() { return this.turns.length === 0 }
    get lastLap() { return this.kaboPlayerId !== undefined }
    get finished() { return this.kaboPlayerId === this.curPlayerId }

    private score_: number[] | undefined
    get score(): number[] {
        if (!this.score_) throw Error("Round is not finished")
        return this.score_
    }

    constructor(
        startingPlayer: PlayerId,
        readonly players: Player[],
        readonly reporter: Reporter,
    ) {
        this.takeDeck = newDeck()
        this.curPlayerId = startingPlayer
        this.burnDeck = []

        if (players.length * CARD_HAND_COUNT > this.takeDeck.length)
            throw Error("Too many players");

        for (let i = 0; i < players.length; i++) {
            const curPlayerCards = Tuple(0 as Card, CARD_HAND_COUNT)
            for (let j = 0; j < CARD_HAND_COUNT; j++) {
                curPlayerCards[j] = this.takeDeck.pop() as Card;
            }
            this.hands.push(curPlayerCards)
        }
    }

    async nextTurn(): Promise<Turn> {
        if (this.finished) throw new Error("Round is finished")
        if (this.firstTurn) this.broadcastStartingPeek()

        try {
            await this.reporter.onTurnStart(this.curPlayerId)

            const cmd = await this.curPlayer.turn({ topCard: this.burnDeck.lastOrNull() })
            const move = await this.handleTurnCommand(cmd)

            const turn = new Turn(this.curPlayerId, this.turns.length, move)
            this.turns.push(turn)
            await this.reporter.onTurnEnd(turn)
            return turn

        } catch (e) {
            throw e

        } finally {
            this.nextPlayer()

            if (this.finished) {
                const ids = this.hands.map((_, i) => i)
                const bestScore = ids.map(id => this.handScore(id)).minBy(x => x)
                var winners = ids.filter(id => this.handScore(id) === bestScore)

                if (winners.indexOf(this.kaboPlayerId!) >= 0) {
                    winners = winners.filter(w => w === this.kaboPlayerId)
                }

                this.score_ = ids.map(id => winners.indexOf(id) >= 0
                    ? 0 : this.handScore(id) + (id == this.kaboPlayerId ? KABO_LOSE_PENALTY : 0)
                )
            }
        }
    }

    private async handleTurnCommand(cmd: Cmd.TurnCommand): Promise<Move.First> {
        if (cmd.act === Action.Kabo) {
            await this.reporter.onKabo(cmd)
            return { act: Action.Kabo }
        }
        return this.handlePickCard(cmd)
    }
    private async handlePickCard(cmd: Cmd.Pick): Promise<Move.PickCard> {
        const burnDeck = cmd.act === Action.PickBurned

        const card = this.drawCard(burnDeck)
        if (burnDeck) {
            return {
                act: cmd.act,
                next: await this.handleAcceptCard(card, cmd.next),
                card,
            }
        }
        return {
            act: cmd.act,
            next: await this.handleUseCard(card, await cmd.next(card)),
        }
    }
    private handleUseCard(card: Card, cmd: Cmd.UseCard): Promise<Move.UseCard> {
        switch (cmd.act) {
            case Action.Accept: return this.handleAcceptCard(card, cmd)
            case Action.Discard: return this.handleDiscardCard(card, cmd)
        }
        return this.handleAbility(card, cmd)
    }
    private async handleAcceptCard(card: Card, cmd: Cmd.Accept): Promise<Move.AcceptCard> {
        if (cmd.act !== Action.Accept)
            throw new IllegalMove(`Only legal move is Action.Accept, not "${cmd.act}"`)
        if (cmd.replace.length < 1 || cmd.replace.length > 3)
            throw new IllegalMove(`Can't replace ${cmd.replace.length} cards`)

        const cards = cmd.replace.map(i => this.getCardChecked(this.curPlayerId, i))
        const success = cards.every(c => c === cards[0])
        cmd.revealed && cmd.revealed(cards, success)

        const ocludedHand = this.curHand.map((c, i) => cmd.replace.includes(i) ? c : undefined)
        await this.reporter.onAccept(cmd, ocludedHand, success)

        if (!success) {
            this.burnDeck.push(card)
            if (cards.length > 2) {
                const penalty = this.drawCard()
                this.curHand.push(penalty)
            }
        } else {
            this.burnDeck.push(...cards)
            this.curHand[cmd.replace[0]] = card
            for (let i = 1; i < cards.length; i++) {
                this.curHand.splice(cmd.replace[i], 1)
            }
        }

        return {
            act: Action.Accept,
            revealed: cards as any,
        }
    }
    private async handleAbility(card: Card, cmd: Cmd.Ability): Promise<Move.UseAbility> {
        if (!Cmd.isAbility(cmd.act))
            throw new IllegalMove(`Only legal move is an ability, not "${cmd.act}"`)
        if (!cardCan(card, cmd.act))
            throw new IllegalMove(`Card ${card} can't "${abilityName(cmd.act)}"`)

        switch (cmd.act) {
            case Action.Peek: {
                this.reporter.onPeek(cmd)
                // execute
                cmd.revealed && cmd.revealed(
                    this.getCardChecked(this.curPlayerId, cmd.cardId))
            } break;
            case Action.Spy: {
                // TODO:
                this.reporter.onSpy(cmd)
                // execute
                cmd.revealed && cmd.revealed(
                    this.getCardChecked(cmd.player, cmd.cardId))
            } break;
            case Action.Trade: {
                // TODO:
                this.reporter.onTrade(cmd)
                // execute
                const myCard = this.getCardChecked(this.curPlayerId, cmd.myCardId)
                const theirCard = this.getCardChecked(cmd.player, cmd.theirCardId)
                this.curHand[cmd.myCardId] = theirCard
                this.hands[cmd.player][cmd.theirCardId] = myCard
            } break;
        }

        const move = { ...cmd, revealed: undefined, card }
        return move
    }
    private async handleDiscardCard(card: Card, cmd: Cmd.Discard): Promise<Move.DiscardCard> {
        if (cmd.act !== Action.Discard)
            throw new IllegalMove(`Only legal move is Action.Discard, not "${cmd.act}"`)

        this.reporter.onDiscard(cmd, card)
        this.burnDeck.push(card)
        return { act: Action.Discard, card }
    }

    private getCardChecked(p: PlayerId, i: CardId): Card {
        if (p < 0 || p >= this.players.length)
            throw new IllegalMove(`No such player P${p} in this round.`)
        const hand = this.hands[p]
        if (i < 0 || i >= hand.length)
            throw new IllegalMove(`No card #${i} in hand P${p}${hand}`)
        return hand[i]
    }

    private broadcastStartingPeek() {
        for (let p = 0; p < this.players.length; p++) {
            this.players[p].onRoundStart(
                this.hands[0].length,
                this.hands[p].slice(0, START_PEEK_COUNT),
                this.players.length
            )
        }
    }

    private drawCard(burnDeck = false): Card {
        var card: Card | undefined

        if (burnDeck) {
            card = this.burnDeck.pop()
            if (card === undefined) throw new IllegalMove("Burn deck is empty")
        } else {
            this.ensureTakeDeckNotEmpty()
            card = this.takeDeck.pop()!
        }

        this.reporter.onDraw(burnDeck, card)
        return card
    }

    /** If the take deck empties out, use the burn deck and continue round. */
    private ensureTakeDeckNotEmpty() {
        if (this.takeDeck.length === 0) {
            // reshuffle the burn deck and use it as new take deck
            this.takeDeck = this.burnDeck.splice(0, this.burnDeck.length - 1)
            this.takeDeck.sort(() => Math.random() - .5)
        }
    }

    private nextPlayer() {
        this.curPlayerId++
        this.curPlayerId %= this.players.length
    }

    private handScore(id: PlayerId, withKaboPenalty = false) {
        return (this.hands[id] as number[]).reduce((a, b) => a + b)
    }
}

export class IllegalMove extends Error {
    constructor(message?: string) {
        super(message)
    }
}