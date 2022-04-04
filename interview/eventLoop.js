setTimeout(() => console.log('setTimeout'), 0);

const f1 = async () => {
    console.log('f1');
}

const f2 = async () => {
    await f1();
    console.log('f2');
}

const f3 = async () => {
    await f2();
    console.log('f3');
}

const p1 = new Promise(res => {
    console.log('promise callback');
    res();
});

const p2 = p1.then(() => console.log('p1 then 1')).then(() => console.log('p1 then 2'));
p2.then(() => console.log('p2 then'));

const p3 = f3();
p3.then(() => console.log('p3 then'));

console.log('sync');