function TreeNode(value, left, right) {
    this.value = value;
    this.left = left || null;
    this.right = right || null;
};

const calculateSum = node => {
    if (!node) {
        return 0;
    }
    return node.value + calculateSum(node.left) + calculateSum(node.right);
};

const insertIfRequired = (tree, currentDepth, depth) => {
    if (currentDepth === depth - 1) {
        const left = tree.left;
        const right = tree.right;
        tree.left = new TreeNode(calculateSum(left), left);
        tree.right = new TreeNode(calculateSum(right), null, right);
    } else {
        insertIfRequired(tree.left, currentDepth + 1, depth);
        insertIfRequired(tree.right, currentDepth + 1, depth);
    }
}

const insertRow = (tree, depth) => {
    if (depth === 1) {
        return new TreeNode(calculateSum(tree), tree);
    }

    insertIfRequired(tree, 1, depth);
    return tree;
};

const initialTree = new TreeNode(
    5,
    new TreeNode(
        7,
        new TreeNode(3),
        new TreeNode(3)
    ),
    new TreeNode(
        1,
        new TreeNode(8)
    )
);

const resultTree = insertRow(initialTree, 2);

debugger