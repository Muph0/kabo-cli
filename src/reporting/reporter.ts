import { PlayerId } from "../model/player";
import { Turn } from "../model/turn";

export interface GameReporter {

    onTurnStart(playerId: PlayerId): void
    onTurnEnd(turn: Turn): void

}