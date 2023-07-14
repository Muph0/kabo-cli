import { Declare } from "../listing";
import { BurnDeck, Card } from "../model/cards";
import { Cmd } from "../model/commands";
import { Player, PLAYER } from "../model/player";
import { Turn } from "../model/turn";

@Declare(PLAYER)
export class InteractivePlayer implements Player {
    onGameStart(id: number): void {
        throw new Error("Method not implemented.");
    }
    onRoundStart(hand: Card[]): void {
        throw new Error("Method not implemented.");
    }
    onPlayerTurn(turn: Turn): void {
        throw new Error("Method not implemented.");
    }
    turn(deck: BurnDeck): Promise<Cmd.TurnCommand> {
        throw new Error("Method not implemented.");
    }
}

