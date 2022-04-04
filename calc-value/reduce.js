const a = [1, null, 2]

const b = a.map(n => n ? n * n : n).filter(n => !!n)

const c = a.reduce((result, n) => {
    if (n) {
        result.push(n * n)
    }
    return result
}, [])

const d = null + null

debugger