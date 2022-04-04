const getPerformanceOrder = dogs => {
    const ascendants = {};
    let current;
    for (let i = 0; i < dogs.length; i++) {
        const dogNum = i + 1;
        if (!current && !dogs[i]) {
            current = dogNum;
            continue;
        }
        for (let dog of dogs[i].split(' ')) {
            if (!ascendants[dog]) {
                ascendants[dog] = [];
            }
            ascendants[dog].push(dogNum)
        }
    }
    const result = [current];
    const visited = new Set(result);

    while (visited.size !== dogs.length) {
        const parents = ascendants[current];
        for (let par of parents) {
            const descentants = dogs[par - 1].split(' ').map(n => +n);
            if (descentants.every(dog => visited.has(dog))) {
                visited.add(par);
                current = par;
                result.unshift(par);
                break;
            }
        }
    }

    return result;
}

console.log(getPerformanceOrder(['', '1 3', '1']))
console.log(getPerformanceOrder(['', '4 5 1', '1', '5 3', '3', '2 4']))