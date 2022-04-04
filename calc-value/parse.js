const ast1 = {
    operator: 'AND',
    left: {
        operator: 'AND',
        left: {
            operator: 'AND',
            left: 'A',
            right: 'B'
        },
        right: 'C'
    },
    right: 'D'
};

const ast2 = {
    operator: 'OR',
    left: {
        operator: 'OR',
        left: {
            operator: 'OR',
            left: 'A',
            right: 'B'
        },
        right: 'C'
    },
    right: 'D'
};

const ast3 = {
    operator: 'AND',
    left: {
        operator: 'AND',
        left: {
            operator: 'OR',
            left: 'A',
            right: 'B'
        },
        right: 'C'
    },
    right: 'D'
};

const processNode = node => {
    if (!node.operator) {
        return [node];
    }

    return [...processNode(node.left), ...processNode(node.right)];
}

const functions = {
    AND: 'all',
    OR: 'any'
}

const toFunction = operator => functions[operator];

const toConditionBuilderModel = ast => {
    let result = [];
    let lastOperator = null;
    let pointer = {};

    const processNode = (node, operator) => {

    }

    processNode(ast);

    return result;
};

const model1 = toConditionBuilderModel(ast1);
const model2 = toConditionBuilderModel(ast2);
const model3 = toConditionBuilderModel(ast3);

debugger