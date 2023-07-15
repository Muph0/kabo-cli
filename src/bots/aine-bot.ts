import { Card, BurnDeck } from "../model/cards";
import { Cmd } from "../model/commands";
import { Player } from "../model/player"
import { Turn } from "../model/turn";

type CardSlot = Card | null

export class AineBot implements Player {
    myId: number | null
    playerCount: number | null
    cards: CardSlot[][]

    constructor() {
        this.myId = null
        this.playerCount = null
        this.cards = []
    }
    onGameStart(id: number): void {
        this.myId = id
    }
    onRoundStart(cards: number, peek: Card[], playerCount: number): void {
        this.playerCount = playerCount
        this.cards = []
        for (let i = 0; i < playerCount; i++) {
            const curCards: CardSlot[] = []
            if (i === this.myId) {
                curCards.push(...peek)
                for (let i = 0; i < cards - peek.length; i++) {
                    curCards.push(null)
                }
            } else {
                for (let i = 0; i < cards; i++) {
                    curCards.push(null)
                }
            }
            this.cards.push(curCards)
        }
    }
    onPlayerTurn(turn: Turn): void {

    }
    turn(deck: BurnDeck): Promise<Cmd.TurnCommand> {
        if (!this.myId || !this.playerCount) {
            throw new Error('Not initialized')
        }
        const myCards = this.cards[this.myId]
        if (deck.topCard && deck.topCard <= 3) {

        }
        throw new Error("Not implemented")
    }

    getCard(playerId: number, cardId: number): CardSlot {
        return this.cards[playerId][cardId]
    }

    setCard(playerId: number, cardId: number, card: CardSlot) {
        this.cards[playerId][cardId] = card
    }

    /**
     * Returns the index of the first unknown card of the player
     * or null if all are known
     * */
    findUnknownCard(playerId: number): number | null {
        const playerCards = this.cards[playerId]
        const unknownIdx = playerCards.map((card, i) => card ? null : i).filter(v => v !== null)
        return unknownIdx.length > 0 ? unknownIdx[0] : null
    }

    getKnownCards(cards: CardSlot[]): Card[] {
        return cards.filterNot(null)
    }

    async replaceBiggestWith(cards: CardSlot[], newCard: Card): Promise<Cmd.UseCard> {
        const biggest = Math.max(...this.getKnownCards(cards)) as Card
        if (biggest <= newCard) {
            return { name: "discard" }
        }
        const biggestIdx = this.findAllOcurrences(cards, biggest)

        return {
            name: "accept",
            replace: biggestIdx,
        }

    }

    replaceCards(replaceIdx: number[], newCard: CardSlot) {

    }

    findAllOcurrences(cards: CardSlot[], card: Card): number[] {
        const result = []
        for (let cur of cards) {
            if (cur === card) {
                result.push(card)
            }
        }
        return result
    }
}