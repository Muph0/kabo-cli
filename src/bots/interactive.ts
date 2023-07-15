import { ANSI } from "../ansi";
import { Declare } from "../listing";
import { BurnDeck, Card, cardAbility, cardString } from "../model/cards";
import { Cmd } from "../model/commands";
import { Player, PLAYER } from "../model/player";
import { Turn } from "../model/turn";
import { menu, MenuCheckbox, MenuItem } from "../ui";

const CARD_BACK = "[?]"

@Declare(PLAYER)
export class InteractivePlayer implements Player {
    private id = 0
    private cards: (Card | null)[] = []
    private firstTurnOfRound = false

    onGameStart(id: number): void {
        this.id = id
    }

    onRoundStart(cards: number, peek: Card[]): void {
        this.cards = peek.concat(new Array(cards - peek.length).fill(null))
        this.firstTurnOfRound = true
    }

    onPlayerTurn(turn: Turn): void { }

    async turn(deck: BurnDeck): Promise<Cmd.TurnCommand> {
        const out = ANSI()
        if (this.firstTurnOfRound) {
            out.txt("Dealt cards:")
            for (let c of this.cards) {
                out.txt(" ").txt(c === null ? CARD_BACK : cardString(c))
            }
            out.flushLine()
        }
        this.firstTurnOfRound = false

        const top = deck.topCard
        console.log("Burn deck:", top !== undefined ? cardString(top) : "-empty-")

        const sel = await menu([
            "Take a card",
            new MenuItem("Take a card from the burn deck", !!top),
            "Kabo",
        ])

        if (sel === 0) {
            return {
                name: "regular",
                next: c => this.decideOnCardUse(c)
            }
        } else if (sel === 1) {
            return {
                name: "burned",
                next: await this.decideOnAcceptCard(top!),
            }
        } else {
            return { name: "kabo" }
        }
    }

    private async decideOnCardUse(c: Card): Promise<Cmd.UseCard> {
        console.log("Got card", cardString(c, true), "what now?")

        const ability = cardAbility(c)?.toUpperCase()
        const sel = await menu([
            "Accept card and replace one or more of my cards with it",
            new MenuItem("Use ability " + (ability ?? ""), ability !== undefined),
            "Discard card to the burn deck",
        ])

        if (sel === 0) {
            return this.decideOnAcceptCard(c)
        } else if (sel === 1) {
            return { name: "discard" }
        } else {
            return { name: "discard" }
        }
    }

    private async decideOnAcceptCard(c: Card): Promise<Cmd.AcceptCard> {

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

        return {
            name: "accept",
            replace: cardIds,
            revealed(cards, success) {
                console.log("Revealed cards:", cards.map(c => cardString(c)).join(", "))
            },
        }
    }

}

