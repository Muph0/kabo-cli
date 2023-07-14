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
        name: "burned card"
        fromBurnDeck: AcceptCard
    } | {
        name: "regular card"
        fromRegularDeck: (c: Card) => UseCard
    }

    export type AcceptCard = ({
        name: "accept"
        replace: [CardId]
        revealed: (c: [Card]) => void
    } | {
        name: "accept"
        replace: [CardId, CardId]
        revealed: (c: [Card, Card], success: boolean) => void
    } | {
        name: "accept"
        replace: [CardId, CardId, CardId]
        revealed: (c: [Card, Card, Card], success: boolean) => void
    })
    export type Ability = Peek | Spy | Trade
    export type Peek = {
        name: "peek"
        cardId: CardId
        revealed: (c: Card) => void
    }
    export type Spy = {
        name: "spy"
        player: PlayerId
        cardId: CardId
        revealed: (c: Card) => void
    }
    export type Trade = {
        name: "trade"
        player: PlayerId
        myCardId: CardId
        theirCardId: CardId
    }
    export type DiscardCard = {
        name: "discard"
    }

    export function isAbility(c: string): boolean {
        return c in { peek: 0, spy: 0, trade: 0 }
    }

}