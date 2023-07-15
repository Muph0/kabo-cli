import { Card, BurnDeck, cardAbility } from "../model/cards";
import { Cmd } from "../model/commands";
import { Player } from "../model/player"
import { Turn } from "../model/turn";

type CardSlot = Card | null

function sum (arr: number[]) { return  arr.reduce(function (a, b) {return a + b}, 0) }

export class AineBot implements Player {
    myId: number
    playerCount: number | null
    cards: CardSlot[][]

    constructor() {
        this.myId = -1
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
    async turn(deck: BurnDeck): Promise<Cmd.TurnCommand> {
        if (!this.playerCount) {
            throw new Error('Not initialized')
        }
        const myCards = this.cards[this.myId]
        if (sum(this.getKnownCards(myCards)) <= 8) {
            return { name: "kabo" }
        }
        // if (deck.topCard && deck.topCard <= 3) {

        // }
        return {
            name: "regular",
            next: async (deckCard: Card) => {
                const unknownIdx = this.findUnknownCard(this.myId)
                if (cardAbility(deckCard) === "peek" && unknownIdx) {
                    return {
                        name: "peek",
                        cardId: unknownIdx,
                        revealed: (c) => this.replaceCards(this.myId, [unknownIdx], c)
                    }
                }
                return this.replaceBiggestWith(myCards, deckCard)
            }
        }
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
        const biggestIdx = this.findAllOccurrences(cards, biggest)
        this.replaceCards(this.myId!, biggestIdx, newCard)
        return {
            name: "accept",
            replace: biggestIdx,
        }
    }

    replaceCards(playerId: number, replaceIdx: number[], newCard: CardSlot) {
        const minIdx = Math.min(...replaceIdx)
        const playerCards = this.cards[playerId]
        playerCards[minIdx] = newCard
        if (replaceIdx.length > 1) {
            const squishedCards: CardSlot[] = []
            for (let i = 0; i < playerCards.length; i++) {
                if (i !== minIdx && replaceIdx.includes(i)) {
                    continue
                }
                squishedCards.push(playerCards[i])
            }
            this.cards[playerId] = squishedCards
        }
        this.cards[playerId] = playerCards
    }

    findAllOccurrences(cards: CardSlot[], card: Card): number[] {
        const result = []
        for (let i = 0; i < cards.length; i++) {
            const cur = cards[i];
            if (cur === card) {
                result.push(i)
            }
        }
        return result
    }
}