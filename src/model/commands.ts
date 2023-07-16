import { Card } from "./cards"
import { Move } from "./moves"
import { CardId, PlayerId } from "./player"

export const enum Action {
    Kabo, PickBurned, PickRegular, Accept, Peek, Spy, Trade, Discard
}
export namespace Action {
    export type Ability = Action.Peek | Action.Spy | Action.Trade
}

export namespace Cmd {


    export type TurnCommand = Kabo | Pick
    export type Any = Kabo | Pick | Accept | Ability
    export type UseCard = Accept | Discard | Ability

    export const Kabo = (cmd: Kabo) => cmd
    export interface Kabo {
        act: Action.Kabo
    }
    export const Pick = (cmd: Pick) => cmd
    export type Pick = {
        act: Action.PickBurned
        next: Accept
    } | {
        act: Action.PickRegular
        next: (c: Card) => Promise<UseCard>
    }

    export const Accept = (cmd: Accept) => cmd
    export interface Accept {
        act: Action.Accept
        replace: CardId[],
        // TODO: replace cards with partial hand, similar to Player.onRoundStart
        revealed?: (cards: Card[], success: boolean) => void
    }
    export type Ability = Peek | Spy | Trade
    export const Ability = (cmd: Ability) => cmd
    export const Peek = (cmd: Peek) => cmd
    export interface Peek {
        act: Action.Peek
        cardId: CardId
        revealed?: (c: Card) => void
    }
    export const Spy = (cmd: Spy) => cmd
    export interface Spy {
        act: Action.Spy
        player: PlayerId
        cardId: CardId
        revealed?: (c: Card) => void
    }
    export const Trade = (cmd: Trade) => cmd
    export interface Trade {
        act: Action.Trade
        player: PlayerId
        myCardId: CardId
        theirCardId: CardId
    }

    export const Discard = (cmd: Discard) => cmd
    export interface Discard {
        act: Action.Discard
    }

    const abilities = [Action.Peek, Action.Spy, Action.Trade]
    export function isAbility(c: Action): boolean {
        return abilities.includes(c)
    }
}