const root = {
    name: "Root",
    rv: 1000,
    children: [
        {
            name: "Cat1",
            rv: 300,
            children: [
                {
                    name: "Cat1/Sub1",
                    rv: 200
                },
                {
                    name: "Cat1/Sub2",
                    rv: 200
                },
            ]
        },
        {
            name: "Cat2",
            rv: 300,
            children: [
                {
                    name: "Cat2/Sub1",
                    rv: 200
                },
                {
                    name: "Cat2/Sub2",
                    rv: 200
                },
                {
                    name: "Cat2/Direct",
                    rv: 100
                },
            ]
        },
        {
            name: "Cat3",
            rv: 300
        },
        {
            name: "Cat4",
            rv: 300
        }
    ]
}

const processTree = (node, parent={children: [node], v: 1}, sum=node.rv, value=1) => {
    const v = node.rv / sum * value;
    if (!node.children) {
        return {...node, v}
    }
    const s = node.children.reduce((acc, c) => acc + c.rv, 0);
    return {...node, children: node.children.map(child => processTree(child, node, s, v)), v: 0}
}

const newTree = processTree(root)
debugger