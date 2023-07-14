import { createKey } from "../listing"
import { Class } from "../utils"
import { BurnDeck, Card } from "./cards"
import { Cmd } from "./commands"
import { Turn } from "./turn"

/** Player position at the table */
export type PlayerId = number

/** Card position in player's hand */
export type CardId = number

export const PLAYER = createKey<new() => Player>("player")
export interface Player {

    /**
     * Called on the start of a game
     * @param id Id of this player for the game
     */
    onGameStart(id: PlayerId): void

    /**
     * Called on the start of every round.
     * @param hand First cards of player's hand that they can see
     */
    onRoundStart(hand: Card[]): void

    /**
     * Called when any player finishes a turn, including this player.
     * @param turn The turn that was just finished.
     */
    onPlayerTurn(turn: Turn): void

    /**
     * Called when its this player's turn.
     * @param deck Peek of the visible deck on the table
     * @returns Command representing the action they want to do.
     */
    turn(deck: BurnDeck): Promise<Cmd.TurnCommand>
}
