const oldTree = {
    id: 1,
    children: [
        {
            id: 2,
            children: [
                {
                    id: 3,
                    children: [
                        {
                            id: 5,
                            children: [
                                {
                                    id: 7
                                }
                            ]
                        },
                    ]
                },
                {
                    id: 4,
                }
            ]
        }
    ]
}

const flat = new Map([
    [1, {}],
    [2, {}],
    [3, {}],
    [4, {}],
    [5, {}],
    [7, {}]
])

const newTree = {
    id: 2,
    children: [
        {
            id: 3,
            children: [
                {
                    id: 5
                },
            ]
        },
        {
            id: 4,
            children: [
                {
                    id: 6
                }
            ]
        }
    ]
}

const findParent = (node, id) => {
    if (!node.children) {
        return;
    }

    if (node.children.find(child => child.id === id)) {
        return node;
    }

    for (const child of node.children) {
        const found = findParent(child, id);
        if (found) {
            return found;
        }
    }
}

const updateIfRequired = (parent, node, flat) => {
    if (!flat.has(node.id)) {
        flat.set(node.id, {});

        if (!parent.children) {
            parent.children = [];
        }
        parent.children.push(node);
    }


    if (!node.children) {
        return;
    }

    const nodeParent = parent.children.find(child => child.id === node.id);

    node.children.forEach(child => updateIfRequired(nodeParent, child, flat));
}

const merge = (oldTree, newTree, flat) => {
    const oldTreeNodeParent = findParent(oldTree, newTree.id);
    if (oldTreeNodeParent) {
        updateIfRequired(oldTreeNodeParent, newTree, flat);
    }
}

merge(oldTree, newTree, flat);

debugger