import { Action } from "./commands"
import { Card } from './cards'
import { Cmd } from './commands'
import { CardId, PlayerId } from './player'

export namespace Move {

    export type First = Kabo | PickCard
    export type Any = First | AcceptCard | UseAbility | DiscardCard

    export type PickCard = PickRegularCard | PickBurnedCard
    export type UseCard = AcceptCard | UseAbility | DiscardCard

    //0 Kabo
    export interface Kabo {
        act: Action.Kabo
        next?: undefined
    }

    //1 Pick a card
    export interface PickRegularCard {
        act: Action.PickRegular
        next: UseAbility | AcceptCard | DiscardCard
    }
    export interface PickBurnedCard {
        act: Action.PickBurned
        next: AcceptCard
        card: Card
    }

    //2 Use the card
    export interface AcceptCard {
        act: Action.Accept
        next?: undefined

        revealed: {
            ids: [CardId]
            cards: [Card]
            success: true
        } | {
            ids: [CardId, CardId]
            cards: [Card, Card]
            success: boolean
        } | {
            ids: [CardId, CardId, CardId]
            cards: [Card, Card, Card]
            success: boolean
        }
    }

    export type UseAbility = Peek | Spy | Trade
    export interface Peek extends DroppedCardLastMove {
        act: Action.Peek
        cardId: CardId
    }

    export interface Spy extends DroppedCardLastMove {
        act: Action.Spy
        player: PlayerId
        cardId: CardId
    }

    export interface Trade extends DroppedCardLastMove {
        act: Action.Trade
        player: PlayerId
        myCardId: CardId
        theirCardId: CardId
    }

    export interface DiscardCard
        extends Cmd.Discard, DroppedCardLastMove { }

    interface DroppedCardLastMove {
        next?: undefined
        card: Card
    }
}
