import { ANSI } from "../ansi"
import { Action, Cmd } from "./commands"

export type Card = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13

function card(n: number): Card {
    return n as any
}

const abilities: {
    [C in Card]?: Action.Ability
} = {
    7: Action.Peek,
    8: Action.Peek,
    9: Action.Spy,
    10: Action.Spy,
    11: Action.Trade,
    12: Action.Trade,
}

const names = {
    [Action.Peek]: "Peek",
    [Action.Spy]: "Spy",
    [Action.Trade]: "Trade",
}

export function cardCan(card: Card, ability: Action.Ability): boolean {
    return cardAbility(card) === ability
}

export function cardAbility(card: Card): Action.Ability | undefined {
    return abilities[card]
}

export function abilityName(a: Action.Ability): string {
    return names[a]
}

export function cardString(c?: Card, withAbility = false): string {
    const out = ANSI("[").ylw(c ?? "?").rst("]")
    if (c === undefined) return out.toString()

    const ability = cardAbility(c)
    if (withAbility && ability) {
        out.gray(` (${abilityName(ability).toUpperCase()})`).rst()
    }
    return out.toString()
}

/** Shufle a new deck of cards */
export function newDeck(): Card[] {
    const result: Card[] = []

    for (let i = 0; i <= 13; i++) {
        const count = { 0: 2, 13: 2 }[i] ?? 4
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