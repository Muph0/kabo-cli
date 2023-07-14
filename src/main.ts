import { readLine } from "./utils"

declare global {
    interface PromiseConstructor {
        yield(): Promise<void>
        wait(millis: number): Promise<void>
    }
}
Promise.yield = () => new Promise(r => setImmediate(r))
Promise.wait = ms => new Promise(r => setTimeout(r, ms))


function f1() {
    console.log("f1")
}

async function f2() {
    console.log("f2")
}

async function f3() {
    await Promise.yield()
    console.log("f3")
}
async function f4() {
    await Promise.wait(1000)
    console.log("f4")
}

f1()
const x = f2()
f3()
f4()

console.log("done")



