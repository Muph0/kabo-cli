import deepcopy from 'deepcopy';
import { Card } from './cards';
import { Action } from "./commands";
import { Move } from './moves';
import { PlayerId } from './player';


export class Turn {

    constructor(
        /** Player whose turn it is */
        readonly player: PlayerId,
        /** Zero-based index of the turn in the round */
        readonly index: number,
        readonly move: Move.First,
    ) { }

    /**
     * @returns Iterable of moves in this turn, in the order they were played.
     */
    *moves(): Iterable<Move.Any> {
        let move = this.move as Move.Any | undefined
        while (move !== undefined) {
            yield move
            move = move.next
        }
    }

    /**
     * Utility function to get cards that were put on the burn deck in this turn
     * @returns Burnt cards in the order they were burnt. (top of deck is last)
     */
    burntCards(): Card[] {
        for (let move of this.moves()) {
            switch (move.act) {
                case Action.Peek:
                case Action.Spy:
                case Action.Trade:
                case Action.Discard: return [move.card]
                case Action.Accept: return move.revealed.success
                    ? [...move.revealed.cards] : []
            }
        }
        return []
    }

    clone(): Turn {
        return new Turn(this.player, this.index, deepcopy(this.move))
    }
}
