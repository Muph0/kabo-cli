import { ANSI } from "../ansi"
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
export function cardAbility(card: Card): Cmd.Ability["name"] | undefined {
    return {
        0: undefined,
        1: undefined,
        [CardPower.Peek]: 'peek' as 'peek',
        [CardPower.Spy]: 'spy' as 'spy',
        [CardPower.Trade]: 'trade' as 'trade',
    }[powers[card]]
}

export function cardString(c: Card): string {
    const out = ANSI("[").ylw(c).rst("]")
    const ability = cardAbility(c)
    if (ability) {
        out.gray(` (${ability.toUpperCase()})`).rst()
    }
    return out.toString()
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