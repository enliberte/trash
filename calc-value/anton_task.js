console.log("first")

setImmediate(() => {
    console.log('imm')
})

setTimeout(() => {
    console.log("third")
}, 0)

new Promise((res) => {
    console.log("fourth")
    res("fifth")
}).then(console.log).then(() => {
    console.log("sixth")
})

process.nextTick(() => { console.log('tick') })

console.log("second")