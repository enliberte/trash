function add(n, s = 0) {
    if (!n) {
        return s;
    }
    return a => add(a, s + n);
}

const a = add(1)(2)(3)(4)();

debugger