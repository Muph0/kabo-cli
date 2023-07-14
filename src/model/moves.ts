import { Card } from './cards'
import { Cmd } from './commands'
import { CardId } from './player'


export namespace Move {

    export type First = Kabo | PickCard
    export type Any = First | AcceptCard | UseAbility | DiscardCard

    export type PickCard = PickRegularCard | PickBurnedCard
    export type UseCard = AcceptCard | UseAbility | DiscardCard

    //0 Kabo
    export interface Kabo {
        name: "kabo"
        next?: undefined
    }

    //1 Pick a card
    export interface PickRegularCard {
        name: "pick"
        fromBurnDeck: false
        next: UseAbility | AcceptCard | DiscardCard
    }
    export interface PickBurnedCard {
        name: "pick"
        fromBurnDeck: true
        next: AcceptCard

        card: Card
    }

    //2 Use the card
    export interface AcceptCard {
        name: "accept"
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

    export type Ability = Omit<Cmd.Peek, "revealed">
        | Omit<Cmd.Spy, "revealed">
        | Cmd.Trade

    export interface UseAbility {
        name: "ability"
        next?: undefined

        ability: Ability
        card: Card
    }

    export interface DiscardCard {
        name: "discard"
        next?: undefined

        card: Card
    }
}
