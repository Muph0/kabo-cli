import { stdin } from "process"
import { ANSI, ctrl_c_exit } from "./ansi"

export function getch(supressCtrlCTermination = false): Promise<string> {
    return new Promise(done => {
        stdin.setRawMode(true)
        stdin.resume()
        stdin.setEncoding("utf-8")

        function ondata(c: string) {
            if (!supressCtrlCTermination && c === ANSI.CTRL_C) ctrl_c_exit()
            stdin.removeListener("data", ondata)
            stdin.pause()
            done(c)
        }

        stdin.addListener("data", ondata)
    })
}

export async function menu(items: (string | object)[], selected: number = 0, eraseWhenDone = true): Promise<number> {
    if (items.length === 0) throw Error("Empty options in menu")

    const out = ANSI()
    const pos = await ANSI.getCursor()
    const size = await ANSI.getTermSize()

    pos[1] = Math.min(pos[1], size[1] - items.length - 1)

    try {
        while (true) {
            for (let i = 0; i < items.length; i++) {
                const it = items[i]

                if (i === selected) out.ylw("> ")
                else out.txt("  ")

                out.txt(it.toString()).rst().clrLineToEnd().endl()
            }

            out.flush()
            if (items.length === 1) return 0;
            const c = await getch()

            if (c === ANSI.UP) selected--
            if (c === ANSI.DOWN) selected++
            selected = (selected + items.length) % items.length
            const it = items[selected]

            if (c === ANSI.ENTER) {
                if (it instanceof MenuItem) {
                    if (it.onEnter()) return selected
                } else {
                    return selected
                }
            }
            out.setCursor(...pos)
        }
    } finally {
        if (eraseWhenDone) {
            ANSI().setCursor(...pos).clrBelow().flush()
        }
    }
}


export class MenuItem {
    constructor(
        private text_: string | ((m: MenuItem) => string),
        private enabled_: boolean | ((m: MenuItem) => boolean) = true,
    ) { }

    get enabled() {
        return typeof this.enabled_ === "function"
            ? this.enabled_(this) : this.enabled_
    }
    get text() {
        return typeof this.text_ === "function"
            ? this.text_(this) : this.text_
    }

    toString() {
        return this.enabled ? this.text : ANSI().gray(this.text).rst()
    }

    /**
     * Called on ENTER on this item
     * @returns true, if this item can be selected.
     */
    onEnter(): boolean {
        return this.enabled
    }
}

export class MenuCheckbox extends MenuItem {
    checked: boolean

    constructor(
        text_: string | ((m: MenuCheckbox) => string),
        enabled_: boolean | ((m: MenuCheckbox) => boolean) = true,
        startChecked: boolean = false,
    ) {
        super(text_ as any, enabled_ as any)
        this.checked = startChecked
    }

    override get text(): string {
        return (this.checked ? "X " : "- ") + super.text
    }

    override onEnter(): boolean {
        if (this.enabled) this.checked = !this.checked
        return false
    }
}

export class CardSelect {
    CARD_BACK = "[?]"

    cardsTotal: number
    maxSelected: number
    checkboxes: MenuCheckbox[]

    constructor(cardsTotal: number, maxSelected: number) {
        this.cardsTotal = cardsTotal
        this.maxSelected = maxSelected
        this.checkboxes = []
    }

    async doSelect(): Promise<number[]> {
        const checked = () => this.checkboxes.count(o => o.checked)
        const cardEnabled = (c: MenuCheckbox) => checked() < this.maxSelected || c.checked
        const okText = () => checked() > 0 ? "OK" : (this.maxSelected > 1 ? "Select at least one card" : "Select card")

        for (let i = 0; i < this.cardsTotal; i++) {
            this.checkboxes.push(new MenuCheckbox(this.CARD_BACK, cardEnabled))   
        }

        await menu([
            ...this.checkboxes,
            new MenuItem(okText, () => checked() > 0),
        ])

        const cardIds = this.checkboxes.map((o, i) => o.checked ? i : null).filterNot(null)
        return cardIds
    }
}