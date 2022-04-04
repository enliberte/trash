const PI = 3.14159;

const len = (warehouse1, warehouse2) => {
    const [x1, y1] = warehouse1.split(' ').map(n => +n);
    const [x2, y2] = warehouse2.split(' ').map(n => +n);

    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
};

const getNearest = (warehouse, warehouses) => {
    let nearest = null;
    let l = Infinity;
    for (let i = 0; i < warehouses.length; i++) {
        const currentWarehouse = warehouses[i];
        if (currentWarehouse === warehouse) {
            continue;
        }
        const cl = len(warehouse, currentWarehouse);
        if (cl < l) {
            l = cl;
            nearest = currentWarehouse;
        }
    }
    return {nearest, l};
}

const calculateDeliveryZone = warehouses => {
    const lens = warehouses.map(warehouse => ({warehouse, n: getNearest(warehouse, warehouses)})).sort((warehouse1, warehouse2) => warehouse2.n.l - warehouse1.n.l);
    const {warehouse: warehouse1, n: {l: r1}} = lens[0];
    const {warehouse: warehouse2, n: {l: r2}} = lens[1];

    const l = len(warehouse1, warehouse2);
    const sr = r1 + r2;
    if (l < sr) {
        const maxR = Math.max(r1, r2);
        const minR = l - maxR;
        return (PI * maxR ** 2 + PI * minR ** 2).toFixed(4);
    }
    return (PI * r1 ** 2 + PI * r2 ** 2).toFixed(4);
}

console.log(calculateDeliveryZone(['2 2', '-1 1', '6 5', '-1 4', '9 4.9', '-1 0', '-1 3', '9 3.9']))