import { ANSI } from "../ansi";
import { Card, cardString } from "../model/cards";
import { Action, Cmd } from "../model/commands";
import { CardId, PlayerId } from "../model/player";
import { Turn } from "../model/turn";
import { Round } from "../round";

export interface Reporter {

    onRoundStart(round: Round): Promise<void>
    onTurnStart(playerId: PlayerId): Promise<void>
    onKabo(cmd: Cmd.Kabo): Promise<void>
    onDraw(burnDeck: boolean, card: Card): Promise<void>
    onAccept(cmd: Cmd.Accept, hand: (Card | undefined)[], success: boolean): Promise<void>
    onPeek(cmd: Cmd.Peek): Promise<void>
    onSpy(cmd: Cmd.Spy): Promise<void>
    onTrade(cmd: Cmd.Trade): Promise<void>
    onDiscard(cmd: Cmd.Discard, card: Card): Promise<void>
    onTurnEnd(turn: Turn): Promise<void>

}

export class DefaultReporter implements Reporter {

    private playerId: PlayerId = 0
    private round?: Round
    private get playerName() { return `P${this.playerId}` }
    private player(...args: any[]) { return ANSI().cya(this.playerName).rst(...args) }

    async onRoundStart(round: Round) {
        ANSI().grn(" ==== ROUND START ====").rst().flushLine()
        this.round = round
    }
    async onTurnStart(playerId: number): Promise<void> {
        this.playerId = playerId
        ANSI("Next turn: ").grn(this.playerName).rst().flushLine()
    }
    async onKabo(cmd: Cmd.Kabo): Promise<void> {
        this.player(": KABO!").flushLine()
    }
    async onDraw(burnDeck: boolean): Promise<void> {
        const deckName = burnDeck ? "burn" : "regular"
        this.player(` draws a card from the ${deckName} deck.`).flushLine()
    }
    async onAccept(cmd: Cmd.Accept, hand: (Card | undefined)[], success: boolean): Promise<void> {
        const first = hand.findIndex(c => c !== undefined)
        const cards = hand.map((c, i) => (i === first ? ">" : "") + cardString(c)).join(" ")
        if (success) {
            this.player(` takes ${cardString()} replacing ${cards}`).flushLine()
        } else {
            this.player(` attepts to replace ${cards} but fails.`).flushLine()
        }
    }
    async onPeek(cmd: Cmd.Peek): Promise<void> {
        const hand = this.round!.curHand
        const cards = this.markCard(hand, cmd.cardId)
        this.player(` peeks on ${cards}`).flushLine()
    }
    async onSpy(cmd: Cmd.Spy): Promise<void> {
        const hand = this.round!.hands[cmd.player]
        const cards = this.markCard(hand, cmd.cardId)
        this.player(` spies on P${cmd.player}'s ${cards}`).flushLine()
    }
    async onTrade(cmd: Cmd.Trade): Promise<void> {
        const myCards = this.markCard(this.round!.curHand, cmd.myCardId)
        const targetCards = this.markCard(this.round!.hands[cmd.player], cmd.theirCardId)
        this.player(` trades their card ${myCards}`).endl()
            .txt(`with P${cmd.player}'s card ${targetCards}`)

    }
    async onDiscard(cmd: Cmd.Discard, card: Card): Promise<void> {
        this.player(` discards ${cardString(card)} to the burn deck`)
    }
    async onTurnEnd(turn: Turn): Promise<void> {

    }

    private markCard(hand: Card[], id: CardId, show = false): string {
        return hand.map((c, i) => (i === id ? ">" : "") + cardString(show ? c : undefined)).join(" ")
    }
}