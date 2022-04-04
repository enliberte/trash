const isStraightLine = coordinates => {
    const [p0, p1, ...rest] = coordinates;
    const [x0, y0] = p0.split(' ').map(n => +n);
    const [x1, y1] = p1.split(' ').map(n => +n);
    const k = (y1 - y0) / (x1 - x0);
    const b = y1 - k * x1;
    return rest.every(p => {
        const [x, y] = p.split(' ').map(n => +n);
        return y === x * k + b;
    }) ? 'да' : 'нет'
}

console.log(isStraightLine(['-1 0', '0 1', '1 2', '2 3']))
console.log(isStraightLine(['-1 1', '0 2', '1 2', '2 3']))