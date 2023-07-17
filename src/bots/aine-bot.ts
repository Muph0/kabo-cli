import { Card, BurnDeck, cardAbility } from "../model/cards";
import { Action, Cmd } from "../model/commands";
import { Player } from "../model/player"
import { Turn } from "../model/turn";

const MEDIAN_VALUE = 6

type CardSlot = Card | null

function sum(arr: number[]) { return arr.reduce(function (a, b) { return a + b }, 0) }

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
    async onPlayerTurn(turn: Turn): Promise<void> {

    }
    async turn(deck: BurnDeck): Promise<Cmd.TurnCommand> {
        if (!this.playerCount) {
            throw new Error('Not initialized')
        }
        const myCards = this.cards[this.myId]
        if (this.getEstimateSum(myCards) <= 8) {
            return { act: Action.Kabo }
        }
        if (deck.topCard && deck.topCard <= 3) {
            const [biggest, biggestIdx] = this.getEstimatedBiggestCardAndIdx(myCards)
            if (biggest >= MEDIAN_VALUE) {
                this.replaceCards(this.myId, [biggestIdx], deck.topCard)
                return {
                    act: Action.PickBurned,
                    next: {
                        act: Action.Accept,
                        replace: [biggestIdx]
                    }
                }
            }
        }
        return {
            act: Action.PickRegular,
            next: async (deckCard: Card) => {
                const unknownIdx = this.findUnknownCard(myCards)
                if (cardAbility(deckCard) === Action.Peek && unknownIdx) {
                    return Cmd.Peek({
                        act: Action.Peek,
                        cardId: unknownIdx,
                        revealed: (c) => this.replaceCards(this.myId, [unknownIdx], c),
                    })
                }
                return this.replaceBiggestWith(myCards, deckCard, true)
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
    findUnknownCard(cards: CardSlot[]): number | null {
        const unknownIdx = cards.map((card, i) => card ? null : i).filter(v => v !== null)
        return unknownIdx.length > 0 ? unknownIdx[0] : null
    }

    getKnownCards(cards: CardSlot[]): Card[] {
        return cards.filterNot(null)
    }

    replaceUnknownWithEstimate(cards: CardSlot[]): Card[] {
        return cards.map(cs => cs ? cs : MEDIAN_VALUE as Card)
    }

    async replaceBiggestWith(cards: CardSlot[], newCard: Card, allowDiscard: boolean): Promise<Cmd.UseCard> {
        const biggest = this.getBiggestCard(cards)
        if (allowDiscard && biggest <= newCard) {
            return { act: Action.Discard }
        }
        const biggestIdx = this.findAllOccurrences(cards, biggest)
        this.replaceCards(this.myId, biggestIdx, newCard)
        return {
            act: Action.Accept,
            replace: biggestIdx,
        }
    }

    getBiggestCard(cards: CardSlot[]): Card {
        return Math.max(...this.getKnownCards(cards)) as Card
    }

    getEstimatedBiggestCardAndIdx(cards: CardSlot[]): [Card, number] {
        const biggest = Math.max(...this.replaceUnknownWithEstimate(cards)) as Card
        const idx = cards.includes(biggest) ? cards.indexOf(biggest) : this.findUnknownCard(cards)
        if (idx === null) throw new Error('Bug with estimating cards')
        return [biggest, idx]
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

    getEstimateSum(cards: CardSlot[]): number {
        return sum(cards.map(card => card ? card : MEDIAN_VALUE))
    }

}