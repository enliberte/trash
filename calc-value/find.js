const data = {
    id: 1,
    children: [
        {
            id: 2,
            children: [
                {
                    id: 3
                },
                {
                    id: 4
                }
            ]
        },
        {
            id: 5,
            children: [
                {
                    id: 6
                },
                {
                    id: 7
                }
            ]
        }
    ]
}

const find = (node, id) => {
    if (node.id === id) {
        return node;
    }

    if (node.children) {
        for (let child of node.children) {
            const foundNode = find(child, id);
            if (foundNode) {
                return foundNode;
            }
        }
    }
}

const a = find(data, 7);
a.value = 'test';
debugger