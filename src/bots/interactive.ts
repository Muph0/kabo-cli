import { ANSI } from "../ansi";
import { Declare } from "../listing";
import { BurnDeck, Card, abilityName, cardAbility, cardString } from "../model/cards";
import { Action, Cmd } from "../model/commands";
import { Player, PLAYER } from "../model/player";
import { Turn } from "../model/turn";
import { menu, MenuCheckbox, MenuItem } from "../ui";

const CARD_BACK = "[?]"

@Declare(PLAYER)
export class InteractivePlayer implements Player {
    private id = 0
    private cards: (Card | undefined)[] = []
    private firstTurnOfRound = false

    onGameStart(id: number): void {
        this.id = id
    }

    onRoundStart(cards: number, peek: Card[]): void {
        this.cards = peek.concat(new Array(cards - peek.length).fill(undefined))
        this.firstTurnOfRound = true
    }

    async onPlayerTurn(turn: Turn): Promise<void> {
        if (turn.player === this.id) {
            await ANSI("Your turn is over.").readLine()
        }
    }

    async turn(deck: BurnDeck): Promise<Cmd.TurnCommand> {
        const out = ANSI()
        if (this.firstTurnOfRound) {
            out.txt("Dealt cards:")
            for (let c of this.cards) {
                out.txt(" ", cardString(c))
            }
        } else {
            out.txt("Your cards: ")
            for (let c of this.cards) {
                out.txt(" ", cardString())
            }
        }
        out.flushLine()
        //this.firstTurnOfRound = false

        const top = deck.topCard
        console.log("Burn deck:", top !== undefined ? cardString(top) : "-empty-")

        const sel = await menu([
            "Draw a card",
            new MenuItem("Draw from the burn deck", !!top),
            "Kabo",
        ])

        if (sel === 0) {
            return {
                act: Action.PickRegular,
                next: c => this.decideOnCardUse(c)
            }
        } else if (sel === 1) {
            return {
                act: Action.PickBurned,
                next: await this.decideOnAcceptCard(top!),
            }
        } else {
            return { act: Action.Kabo }
        }
    }

    private async decideOnCardUse(c: Card): Promise<Cmd.UseCard> {
        console.log("Got card", cardString(c, true), "what now?")

        const ability = cardAbility(c)
        const name = ability ? abilityName(ability) : ""
        const sel = await menu([
            "Accept card ",
            new MenuItem("Use ability " + name, ability !== undefined),
            "Discard card",
        ])

        if (sel === 0) {
            return this.decideOnAcceptCard(c)
        } else if (sel === 1) {
            return { act: Action.Discard }
        } else {
            return { act: Action.Discard }
        }
    }

    private async decideOnAcceptCard(c: Card): Promise<Cmd.Accept> {

        const opts: MenuCheckbox[] = [];
        const checked = () => opts.count(o => o.checked)
        const cardEnabled = (c: MenuCheckbox) => checked() < 3 || c.checked
        const okText = () => checked() > 0 ? "OK" : "Select at least one card"

        opts.push(...this.cards.map(c => new MenuCheckbox(CARD_BACK, cardEnabled)))

        await menu([
            ...opts,
            new MenuItem(okText, () => checked() > 0),
        ])

        const cardIds = opts.map((o, i) => o.checked ? i : null).filterNot(null)

        return Cmd.Accept({
            act: Action.Accept,
            replace: cardIds,
            revealed(cards, success) {
                console.log("Revealed cards:", cards.map(c => cardString(c)).join(", "))
            },
        })
    }
}

