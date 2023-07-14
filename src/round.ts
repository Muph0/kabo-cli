import { Card, cardCan, newDeck } from "./model/cards"
import { Cmd } from "./model/commands"
import { Move } from "./model/moves"
import { CardId, Player, PlayerId } from "./model/player"
import { Turn } from "./model/turn"
import { Tuple } from "./utils"

const CARD_HAND_COUNT = 4
const START_PEEK_COUNT = 2

type Hand = Card[]

export class GameRound {

    private hands: Hand[] = []

    private takeDeck: Card[]
    private burnDeck: Card[]

    private turns: Turn[] = []
    private kaboPlayerId: PlayerId | undefined
    private curPlayerId: PlayerId

    private get curPlayer() { return this.players[this.curPlayerId] }
    private get curHand(): Hand { return this.hands[this.curPlayerId] }

    get firstTurn() { return this.turns.length === 0 }
    get lastLap() { return this.kaboPlayerId !== undefined }
    get finished() { return this.kaboPlayerId === this.curPlayerId }

    constructor(
        startingPlayer: PlayerId,
        readonly players: Player[],
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

    async nextTurn(): Promise<Turn | IllegalMove> {
        if (this.finished) throw new Error("Round is finished")
        if (this.firstTurn) this.broadcastStartingPeek()

        try {
            const cmd = await this.curPlayer.turn({ topCard: this.burnDeck.last() })
            const move = this.handleTurnCommand(cmd)

            const turn = new Turn(this.curPlayerId, this.turns.length, move)
            this.turns.push(turn)
            return turn

        } catch (e) {
            if (e instanceof IllegalMove)
                return e
            throw e

        } finally {
            this.nextPlayer()
        }
    }

    private handleTurnCommand(cmd: Cmd.TurnCommand): Move.First {
        return cmd.name === "kabo"
            ? { name: "kabo" }
            : this.handlePickCard(cmd)
    }
    private handlePickCard(cmd: Cmd.PickCard): Move.PickCard {
        if (cmd.name === "burned card") {
            const topCard = this.burnDeck.last()
            if (topCard === undefined) throw new IllegalMove("Burn deck is empty")
            return {
                name: "pick",
                fromBurnDeck: true,
                next: this.handleAcceptCard(topCard, cmd.fromBurnDeck),
                card: topCard,
            }
        }
        const card = this.takeCard()
        return {
            name: "pick",
            fromBurnDeck: false,
            next: this.handleUseCard(card, cmd.fromRegularDeck(card)),
        }
    }
    private handleUseCard(card: Card, cmd: Cmd.UseCard): Move.UseCard {
        switch (cmd.name) {
            case "accept": return this.handleAcceptCard(card, cmd)
            case "discard": return this.handleDiscardCard(card, cmd)
        }
        return this.handleAbility(card, cmd)
    }
    private handleAcceptCard(card: Card, cmd: Cmd.AcceptCard): Move.AcceptCard {
        if (cmd.name !== "accept")
            throw new IllegalMove(`Only legal move is "accept", not "${cmd.name}"`)
        if (cmd.replace.length < 1 || cmd.replace.length > 3)
            throw new IllegalMove(`Can't replace ${cmd.replace.length} cards`)

        const cards = cmd.replace.map(i => this.handleSpyPeek(this.curPlayerId, i))
        const success = cards.every(c => c === cards[0])
        cmd.revealed(cards as any, success)

        return {
            name: "accept",
            revealed: cards as any,
        }
    }
    private handleAbility(card: Card, cmd: Cmd.Ability): Move.UseAbility {
        if (!Cmd.isAbility(cmd.name))
            throw new IllegalMove(`Only legal move is an ability, not "${cmd.name}"`)
        if (!cardCan(card, cmd.name))
            throw new IllegalMove(`Card ${card} can't "${cmd.name}"`)

        const ability = { ...cmd, revealed: undefined }
        delete ability.revealed

        switch (cmd.name) {
            case "peek": {
                cmd.revealed(this.handleSpyPeek(this.curPlayerId, cmd.cardId))
            } break;
            case "spy": {
                cmd.revealed(this.handleSpyPeek(cmd.player, cmd.cardId))
            } break;
            case "trade": {
                const myCard = this.handleSpyPeek(this.curPlayerId, cmd.myCardId)
                const theirCard = this.handleSpyPeek(cmd.player, cmd.theirCardId)
                this.curHand[cmd.myCardId] = theirCard
                this.hands[cmd.player][cmd.theirCardId] = myCard
            } break;
        }
        return { name: "ability", card, ability }
    }
    private handleSpyPeek(p: PlayerId, i: CardId): Card {
        if (p < 0 || p >= this.players.length)
            throw new IllegalMove(`No such player P${p} in this round.`)
        const hand = this.hands[p]
        if (i < 0 || i >= hand.length)
            throw new IllegalMove(`No card #${i} in hand P${p}${hand}`)
        return hand[i]
    }
    private handleDiscardCard(card: Card, cmd: Cmd.DiscardCard): Move.DiscardCard {
        if (cmd.name !== "discard")
            throw new IllegalMove(`Only legal move is "discard", not "${cmd.name}"`)
        this.burnDeck.push(card)
        return { name: "discard", card }
    }

    private broadcastStartingPeek() {
        for (let p = 0; p < this.players.length; p++) {
            this.players[p].onRoundStart(this.hands[p].slice(0, START_PEEK_COUNT))
        }
    }

    private takeCard(): Card {
        this.ensureTakeDeckNotEmpty()
        return this.takeDeck.pop()!
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
}

export class IllegalMove extends Error {
    constructor(message?: string) {
        super(message)
    }
}