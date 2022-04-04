import {a, b} from './module';
import {f} from "./anotherModule";

const mutate = (a, b) => {
    a.p = 2;
    b = 2;
}

mutate(a, b);
f();