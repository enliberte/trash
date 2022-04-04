// 1
class BaseComponent1 {
    constructor(initialState) {
        this.setState(initialState);
    }

    setState(state) {
        this.state = state;
        this.render();
    }

    render() {
        console.log(`rendered with ${JSON.stringify(this.state)}`);
    }
}

class Input1 extends BaseComponent1 {
    focus() {
        this.setState({...this.state, focused: true});
    }

    unfocus() {
        this.setState({...this.state, focused: false});
    }
}

const input1 = new Input1({a: 1});
input1.focus();
input1.unfocus();




// 2
class BaseComponent2 {
    constructor(initialState) {
        this.state = initialState;
    }

    render() {
        console.log(`rendered with ${JSON.stringify(this.state)}`);
    }
}

class Input2 extends BaseComponent2 {
    focus() {
        this.state.focused = true;
    }

    unfocus() {
        this.state.focused = false;
    }
}

const input2 = new Input2({a: 1});
input2.focus();
input2.unfocus();