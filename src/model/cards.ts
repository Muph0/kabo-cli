import { Cmd } from "./commands"

export type Card = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13

function card(n: number): Card {
    return n as any
}
export function card_value(c: Card): number {
    return c as any
}

const enum CardPower {
    Normal, Reduced, Peek, Spy, Trade
}
const powers = [
    CardPower.Reduced,
    CardPower.Normal,
    CardPower.Normal,
    CardPower.Normal,
    CardPower.Normal,
    CardPower.Normal,
    CardPower.Normal,
    CardPower.Peek,
    CardPower.Peek,
    CardPower.Spy,
    CardPower.Spy,
    CardPower.Trade,
    CardPower.Trade,
    CardPower.Reduced,
]

export function cardCan(card: Card, ability: Cmd.Ability["name"]): boolean {
    return powers[card] === {
        peek: CardPower.Peek,
        spy: CardPower.Spy,
        trade: CardPower.Trade
    }[ability]
}


/** Shufle a new deck of cards */
export function newDeck(): Card[] {
    const result: Card[] = []

    for (let i = 0; i <= 13; i++) {
        const count = powers[i] === CardPower.Reduced ? 2 : 4
        for (let k = 0; k < count; k++) {
            result.push(card(i))
        }
    }

    result.sort((a, b) => Math.random() - 0.5)
    return result
}

export interface BurnDeck {
    topCard?: Card
}