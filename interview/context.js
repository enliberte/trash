function f1() {
    console.log(this);
}

const o = {
    m1() {
        console.log(this);
    },
    m2: function () {
        console.log(this);
    },
    m3: () => {
        console.log(this);
    },
    m4: function () {
        const f = () => console.log(this);

        f();
    }
}

f1();
o.m1();
o.m2();
o.m3();
o.m4();

const foo = {
    bar: 'baz'
};

const bindedF1 = f1.bind(foo);
bindedF1();

const foo2 = {
    bar: 'baz2'
};
const bindedF2 = bindedF1.bind(foo2);
bindedF2();