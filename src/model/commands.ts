import { Card } from "./cards"
import { CardId, PlayerId } from "./player"

export namespace Cmd {

    export type TurnCommand = Kabo | PickCard
    export type Any = Kabo | PickCard | AcceptCard | Ability
    export type UseCard = AcceptCard | DiscardCard | Ability

    export interface Kabo {
        name: "kabo"
    }
    export type PickCard = {
        name: "burned"
        next: AcceptCard
    } | {
        name: "regular"
        next: (c: Card) => Promise<UseCard>
    }

    export interface AcceptCard {
        name: "accept"
        replace: CardId[],
        revealed?: (cards: Card[], success: boolean) => void
    }
    export type Ability = Peek | Spy | Trade
    export interface Peek {
        name: "peek"
        cardId: CardId
        revealed: (c: Card) => void
    }
    export interface Spy {
        name: "spy"
        player: PlayerId
        cardId: CardId
        revealed: (c: Card) => void
    }
    export interface Trade {
        name: "trade"
        player: PlayerId
        myCardId: CardId
        theirCardId: CardId
    }
    export interface DiscardCard {
        name: "discard"
    }

    export function isAbility(c: string): boolean {
        return c in { peek: 0, spy: 0, trade: 0 }
    }

}