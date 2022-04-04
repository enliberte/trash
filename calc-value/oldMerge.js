import cloneDeep from 'lodash.clonedeep'

const PARENT_SIZE_VALUE = 1;

const PARENT_COLOR_VALUE = 0;

const SIZE_VALUE = 'sizeValue';

const COLOR_VALUE = 'colorValue';

const ROOT_TEXT = 'root_text';

const ROOT_HIERARCHY_KEY = 'root_hierarchy-key';

const ROOT_RECORD_ID = 'root_record_id';

const getFromValues = (values, propName) => values.find(value => propName in value)?.[propName];

const getChildrenSum = ({node, values}) =>
    node.subHeaders.reduce((sum, {valueIndex}) => {
    const rowValue = values[valueIndex];
    return sum + (getFromValues(rowValue, SIZE_VALUE));
}, 0);

const getProcessedNode = ({
    rawNode,
    parent,
    values,
    parentSum,
    parentCalculatedSizeValue,
    column
}) => {
    const rowValues = values[rawNode.valueIndex];
    const recordId = getFromValues(rowValues, 'recordId');
    const sizeValue = getFromValues(rowValues, SIZE_VALUE);

    if (!sizeValue) {
        return null;
    }

    const colorValue = getFromValues(rowValues, COLOR_VALUE);

    const calculatedSizeValue = (sizeValue / parentSum) * parentCalculatedSizeValue;

    const baseNode = {
        text: rawNode.text,
        value: calculatedSizeValue,
        sizeValue,
        colorValue,
        recordId,
        hasChildren: !!rawNode.hasChildren,
        row: {
            headerId: rawNode.headerId,
            text: '',
            cellType: rawNode.cellType,
            displayType: rawNode.displayType,
        },
        column: {
            headerId: column?.headerId ?? '',
            text: '',
            cellType: column?.cellType ?? 'Empty',
            displayType: column?.displayType ?? 'line',
        },
        hierarchyKey: rawNode.hierarchyKey,
        expandCollapseId: rawNode.expandCollapseId,
        calculatedSizeValue,
        parent
    };

    if (!rawNode.hasChildren || !rawNode.subHeaders?.length) {
        return baseNode;
    }

    const nodeChildrenSum = getChildrenSum({node: rawNode, values});

    if (!nodeChildrenSum) {
        return {...baseNode, hasChildren: false};
    }

    const children = rawNode.subHeaders?.reduce((children, child) => {
        const node = getProcessedNode({
            rawNode: child,
            parent: baseNode,
            values,
            parentSum: nodeChildrenSum,
            parentCalculatedSizeValue: calculatedSizeValue,
            column,
        });

        if (node) {
            children.push(node);
        }

        return children;
    }, []);

    return {
        ...baseNode,
        value: 0,
        children
    };
};

export const toD3CompatibleModel = ({data, expandedNode}) => {
    const {values, rows, cols} = data;

    if (!rows?.length || !cols?.length) {
        return null;
    }

    const valueIndex = values.length;
    const column = cols.find(({values}) => !!values?.[SIZE_VALUE]);
    const resultRoot = {
        cellType: 'Empty',
        displayType: 'line',
        headerId: '',
        valueIndex,
        text: expandedNode?.text ?? ROOT_TEXT,
        hasChildren: !!rows.length,
        subHeaders: rows,
        hierarchyKey: expandedNode?.hierarchyKey ?? ROOT_HIERARCHY_KEY
    };
    const rootValue = [
        {recordId: expandedNode?.recordId ?? ROOT_RECORD_ID},
        {sizeValue: PARENT_SIZE_VALUE},
        {colorValue: PARENT_COLOR_VALUE},
    ];

    return getProcessedNode({
        rawNode: resultRoot,
        parent: expandedNode?.parent ?? null,
        values: [...values, rootValue],
        parentSum: PARENT_SIZE_VALUE,
        parentCalculatedSizeValue: expandedNode?.calculatedSizeValue ?? PARENT_SIZE_VALUE,
        column,
    });
};


export const findNode = (node, key) => {
    if (!node) {
        return;
    }

    if (node.hierarchyKey === key) {
        return node;
    }

    if (node.hasChildren && node.children) {
        for (const child of node.children) {
            const foundNode = findNode(child, key);
            if (foundNode) {
                return foundNode;
            }
        }
    }
}

const updateIfRequired = ({oldNode, newNode}) => {
    if (!oldNode?.hasChildren) {
        return;
    }

    if (!oldNode.children && newNode.children) {
        oldNode.value = 0;
        oldNode.children = newNode.children;
        return;
    }

    oldNode.hasChildren = newNode.hasChildren;

    newNode.children?.forEach(child => updateIfRequired({
        oldNode: findNode(oldNode, child.hierarchyKey),
        newNode: child
    }));
}

export const merge = ({initialNode, data, expandedNode}) => {
    const start = Date.now();

    const d3Model = toD3CompatibleModel({data, expandedNode});

    if (!d3Model) {
        return initialNode;
    }

    if (!initialNode) {
        return d3Model;
    }

    if (!expandedNode) {
        return d3Model;
    }

    const clonedInitialNode = cloneDeep(initialNode);
    updateIfRequired({
        oldNode: findNode(clonedInitialNode, expandedNode.hierarchyKey),
        newNode: d3Model
    });

    const finish = Date.now();

    console.log(finish - start)

    return clonedInitialNode;



}


const initialNode = {
    "text": "root_text",
    "value": 0,
    "sizeValue": 1,
    "colorValue": 0,
    "recordId": "root_record_id",
    "hasChildren": true,
    "row": {
        "headerId": "",
        "text": "",
        "cellType": "Empty",
        "displayType": "line"
    },
    "column": {
        "headerId": "sizeValue",
        "text": "",
        "cellType": "Empty",
        "displayType": "nested"
    },
    "hierarchyKey": "root_hierarchy_key",
    "calculatedSizeValue": 1,
    "parent": null,
    "children": [
        {
            "text": "North America",
            "value": 0,
            "sizeValue": 48.306306306306304,
            "colorValue": 2,
            "recordId": "183",
            "hasChildren": true,
            "row": {
                "headerId": "24",
                "text": "",
                "cellType": "ListRow",
                "displayType": "line"
            },
            "column": {
                "headerId": "sizeValue",
                "text": "",
                "cellType": "Empty",
                "displayType": "nested"
            },
            "hierarchyKey": "[\"183\"]",
            "expandCollapseId": "24_[\"183\"]",
            "calculatedSizeValue": 0.4864374489703347,
            "parent": {
                "text": "root_text",
                "value": 1,
                "sizeValue": 1,
                "colorValue": 0,
                "recordId": "root_record_id",
                "hasChildren": true,
                "row": {
                    "headerId": "",
                    "text": "",
                    "cellType": "Empty",
                    "displayType": "line"
                },
                "column": {
                    "headerId": "sizeValue",
                    "text": "",
                    "cellType": "Empty",
                    "displayType": "nested"
                },
                "hierarchyKey": "root_hierarchy_key",
                "calculatedSizeValue": 1,
                "parent": null
            },
            "children": [
                {
                    "text": "US East SaaS",
                    "value": 0,
                    "sizeValue": 47.595238095238095,
                    "colorValue": 2,
                    "recordId": "184",
                    "hasChildren": true,
                    "row": {
                        "headerId": "24",
                        "text": "",
                        "cellType": "ListRow",
                        "displayType": "line"
                    },
                    "column": {
                        "headerId": "sizeValue",
                        "text": "",
                        "cellType": "Empty",
                        "displayType": "nested"
                    },
                    "hierarchyKey": "[\"184\"]",
                    "expandCollapseId": "24_[\"184\"]",
                    "calculatedSizeValue": 0.11838575251306273,
                    "parent": {
                        "text": "North America",
                        "value": 0.4864374489703347,
                        "sizeValue": 48.306306306306304,
                        "colorValue": 2,
                        "recordId": "183",
                        "hasChildren": true,
                        "row": {
                            "headerId": "24",
                            "text": "",
                            "cellType": "ListRow",
                            "displayType": "line"
                        },
                        "column": {
                            "headerId": "sizeValue",
                            "text": "",
                            "cellType": "Empty",
                            "displayType": "nested"
                        },
                        "hierarchyKey": "[\"183\"]",
                        "expandCollapseId": "24_[\"183\"]",
                        "calculatedSizeValue": 0.4864374489703347,
                        "parent": {
                            "text": "root_text",
                            "value": 1,
                            "sizeValue": 1,
                            "colorValue": 0,
                            "recordId": "root_record_id",
                            "hasChildren": true,
                            "row": {
                                "headerId": "",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "line"
                            },
                            "column": {
                                "headerId": "sizeValue",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "nested"
                            },
                            "hierarchyKey": "root_hierarchy_key",
                            "calculatedSizeValue": 1,
                            "parent": null
                        }
                    },
                    "children": [
                        {
                            "text": "Beck Gaines",
                            "value": 0.010810225477927805,
                            "sizeValue": 36.6,
                            "colorValue": 2,
                            "recordId": "186",
                            "hasChildren": true,
                            "row": {
                                "headerId": "24",
                                "text": "",
                                "cellType": "ListRow",
                                "displayType": "line"
                            },
                            "column": {
                                "headerId": "sizeValue",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "nested"
                            },
                            "hierarchyKey": "[\"186\"]",
                            "expandCollapseId": "24_[\"186\"]",
                            "calculatedSizeValue": 0.010810225477927805,
                            "parent": {
                                "text": "US East SaaS",
                                "value": 0.11838575251306273,
                                "sizeValue": 47.595238095238095,
                                "colorValue": 2,
                                "recordId": "184",
                                "hasChildren": true,
                                "row": {
                                    "headerId": "24",
                                    "text": "",
                                    "cellType": "ListRow",
                                    "displayType": "line"
                                },
                                "column": {
                                    "headerId": "sizeValue",
                                    "text": "",
                                    "cellType": "Empty",
                                    "displayType": "nested"
                                },
                                "hierarchyKey": "[\"184\"]",
                                "expandCollapseId": "24_[\"184\"]",
                                "calculatedSizeValue": 0.11838575251306273,
                                "parent": {
                                    "text": "North America",
                                    "value": 0.4864374489703347,
                                    "sizeValue": 48.306306306306304,
                                    "colorValue": 2,
                                    "recordId": "183",
                                    "hasChildren": true,
                                    "row": {
                                        "headerId": "24",
                                        "text": "",
                                        "cellType": "ListRow",
                                        "displayType": "line"
                                    },
                                    "column": {
                                        "headerId": "sizeValue",
                                        "text": "",
                                        "cellType": "Empty",
                                        "displayType": "nested"
                                    },
                                    "hierarchyKey": "[\"183\"]",
                                    "expandCollapseId": "24_[\"183\"]",
                                    "calculatedSizeValue": 0.4864374489703347,
                                    "parent": {
                                        "text": "root_text",
                                        "value": 1,
                                        "sizeValue": 1,
                                        "colorValue": 0,
                                        "recordId": "root_record_id",
                                        "hasChildren": true,
                                        "row": {
                                            "headerId": "",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "line"
                                        },
                                        "column": {
                                            "headerId": "sizeValue",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "nested"
                                        },
                                        "hierarchyKey": "root_hierarchy_key",
                                        "calculatedSizeValue": 1,
                                        "parent": null
                                    }
                                }
                            }
                        },
                        {
                            "text": "Courtney Richard",
                            "value": 0.02052761395398859,
                            "sizeValue": 69.5,
                            "colorValue": 2,
                            "recordId": "187",
                            "hasChildren": true,
                            "row": {
                                "headerId": "24",
                                "text": "",
                                "cellType": "ListRow",
                                "displayType": "line"
                            },
                            "column": {
                                "headerId": "sizeValue",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "nested"
                            },
                            "hierarchyKey": "[\"187\"]",
                            "expandCollapseId": "24_[\"187\"]",
                            "calculatedSizeValue": 0.02052761395398859,
                            "parent": {
                                "text": "US East SaaS",
                                "value": 0.11838575251306273,
                                "sizeValue": 47.595238095238095,
                                "colorValue": 2,
                                "recordId": "184",
                                "hasChildren": true,
                                "row": {
                                    "headerId": "24",
                                    "text": "",
                                    "cellType": "ListRow",
                                    "displayType": "line"
                                },
                                "column": {
                                    "headerId": "sizeValue",
                                    "text": "",
                                    "cellType": "Empty",
                                    "displayType": "nested"
                                },
                                "hierarchyKey": "[\"184\"]",
                                "expandCollapseId": "24_[\"184\"]",
                                "calculatedSizeValue": 0.11838575251306273,
                                "parent": {
                                    "text": "North America",
                                    "value": 0.4864374489703347,
                                    "sizeValue": 48.306306306306304,
                                    "colorValue": 2,
                                    "recordId": "183",
                                    "hasChildren": true,
                                    "row": {
                                        "headerId": "24",
                                        "text": "",
                                        "cellType": "ListRow",
                                        "displayType": "line"
                                    },
                                    "column": {
                                        "headerId": "sizeValue",
                                        "text": "",
                                        "cellType": "Empty",
                                        "displayType": "nested"
                                    },
                                    "hierarchyKey": "[\"183\"]",
                                    "expandCollapseId": "24_[\"183\"]",
                                    "calculatedSizeValue": 0.4864374489703347,
                                    "parent": {
                                        "text": "root_text",
                                        "value": 1,
                                        "sizeValue": 1,
                                        "colorValue": 0,
                                        "recordId": "root_record_id",
                                        "hasChildren": true,
                                        "row": {
                                            "headerId": "",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "line"
                                        },
                                        "column": {
                                            "headerId": "sizeValue",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "nested"
                                        },
                                        "hierarchyKey": "root_hierarchy_key",
                                        "calculatedSizeValue": 1,
                                        "parent": null
                                    }
                                }
                            }
                        },
                        {
                            "text": "Cynthia Ramsey",
                            "value": 0.026877883018891536,
                            "sizeValue": 91,
                            "colorValue": 2,
                            "recordId": "188",
                            "hasChildren": true,
                            "row": {
                                "headerId": "24",
                                "text": "",
                                "cellType": "ListRow",
                                "displayType": "line"
                            },
                            "column": {
                                "headerId": "sizeValue",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "nested"
                            },
                            "hierarchyKey": "[\"188\"]",
                            "expandCollapseId": "24_[\"188\"]",
                            "calculatedSizeValue": 0.026877883018891536,
                            "parent": {
                                "text": "US East SaaS",
                                "value": 0.11838575251306273,
                                "sizeValue": 47.595238095238095,
                                "colorValue": 2,
                                "recordId": "184",
                                "hasChildren": true,
                                "row": {
                                    "headerId": "24",
                                    "text": "",
                                    "cellType": "ListRow",
                                    "displayType": "line"
                                },
                                "column": {
                                    "headerId": "sizeValue",
                                    "text": "",
                                    "cellType": "Empty",
                                    "displayType": "nested"
                                },
                                "hierarchyKey": "[\"184\"]",
                                "expandCollapseId": "24_[\"184\"]",
                                "calculatedSizeValue": 0.11838575251306273,
                                "parent": {
                                    "text": "North America",
                                    "value": 0.4864374489703347,
                                    "sizeValue": 48.306306306306304,
                                    "colorValue": 2,
                                    "recordId": "183",
                                    "hasChildren": true,
                                    "row": {
                                        "headerId": "24",
                                        "text": "",
                                        "cellType": "ListRow",
                                        "displayType": "line"
                                    },
                                    "column": {
                                        "headerId": "sizeValue",
                                        "text": "",
                                        "cellType": "Empty",
                                        "displayType": "nested"
                                    },
                                    "hierarchyKey": "[\"183\"]",
                                    "expandCollapseId": "24_[\"183\"]",
                                    "calculatedSizeValue": 0.4864374489703347,
                                    "parent": {
                                        "text": "root_text",
                                        "value": 1,
                                        "sizeValue": 1,
                                        "colorValue": 0,
                                        "recordId": "root_record_id",
                                        "hasChildren": true,
                                        "row": {
                                            "headerId": "",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "line"
                                        },
                                        "column": {
                                            "headerId": "sizeValue",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "nested"
                                        },
                                        "hierarchyKey": "root_hierarchy_key",
                                        "calculatedSizeValue": 1,
                                        "parent": null
                                    }
                                }
                            }
                        },
                        {
                            "text": "Donald Clinton",
                            "value": 0.004430420277839264,
                            "sizeValue": 15,
                            "colorValue": 2,
                            "recordId": "185",
                            "hasChildren": true,
                            "row": {
                                "headerId": "24",
                                "text": "",
                                "cellType": "ListRow",
                                "displayType": "line"
                            },
                            "column": {
                                "headerId": "sizeValue",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "nested"
                            },
                            "hierarchyKey": "[\"185\"]",
                            "expandCollapseId": "24_[\"185\"]",
                            "calculatedSizeValue": 0.004430420277839264,
                            "parent": {
                                "text": "US East SaaS",
                                "value": 0.11838575251306273,
                                "sizeValue": 47.595238095238095,
                                "colorValue": 2,
                                "recordId": "184",
                                "hasChildren": true,
                                "row": {
                                    "headerId": "24",
                                    "text": "",
                                    "cellType": "ListRow",
                                    "displayType": "line"
                                },
                                "column": {
                                    "headerId": "sizeValue",
                                    "text": "",
                                    "cellType": "Empty",
                                    "displayType": "nested"
                                },
                                "hierarchyKey": "[\"184\"]",
                                "expandCollapseId": "24_[\"184\"]",
                                "calculatedSizeValue": 0.11838575251306273,
                                "parent": {
                                    "text": "North America",
                                    "value": 0.4864374489703347,
                                    "sizeValue": 48.306306306306304,
                                    "colorValue": 2,
                                    "recordId": "183",
                                    "hasChildren": true,
                                    "row": {
                                        "headerId": "24",
                                        "text": "",
                                        "cellType": "ListRow",
                                        "displayType": "line"
                                    },
                                    "column": {
                                        "headerId": "sizeValue",
                                        "text": "",
                                        "cellType": "Empty",
                                        "displayType": "nested"
                                    },
                                    "hierarchyKey": "[\"183\"]",
                                    "expandCollapseId": "24_[\"183\"]",
                                    "calculatedSizeValue": 0.4864374489703347,
                                    "parent": {
                                        "text": "root_text",
                                        "value": 1,
                                        "sizeValue": 1,
                                        "colorValue": 0,
                                        "recordId": "root_record_id",
                                        "hasChildren": true,
                                        "row": {
                                            "headerId": "",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "line"
                                        },
                                        "column": {
                                            "headerId": "sizeValue",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "nested"
                                        },
                                        "hierarchyKey": "root_hierarchy_key",
                                        "calculatedSizeValue": 1,
                                        "parent": null
                                    }
                                }
                            }
                        },
                        {
                            "text": "George Hayes",
                            "value": 0.012198423831650772,
                            "sizeValue": 41.3,
                            "colorValue": 2,
                            "recordId": "189",
                            "hasChildren": true,
                            "row": {
                                "headerId": "24",
                                "text": "",
                                "cellType": "ListRow",
                                "displayType": "line"
                            },
                            "column": {
                                "headerId": "sizeValue",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "nested"
                            },
                            "hierarchyKey": "[\"189\"]",
                            "expandCollapseId": "24_[\"189\"]",
                            "calculatedSizeValue": 0.012198423831650772,
                            "parent": {
                                "text": "US East SaaS",
                                "value": 0.11838575251306273,
                                "sizeValue": 47.595238095238095,
                                "colorValue": 2,
                                "recordId": "184",
                                "hasChildren": true,
                                "row": {
                                    "headerId": "24",
                                    "text": "",
                                    "cellType": "ListRow",
                                    "displayType": "line"
                                },
                                "column": {
                                    "headerId": "sizeValue",
                                    "text": "",
                                    "cellType": "Empty",
                                    "displayType": "nested"
                                },
                                "hierarchyKey": "[\"184\"]",
                                "expandCollapseId": "24_[\"184\"]",
                                "calculatedSizeValue": 0.11838575251306273,
                                "parent": {
                                    "text": "North America",
                                    "value": 0.4864374489703347,
                                    "sizeValue": 48.306306306306304,
                                    "colorValue": 2,
                                    "recordId": "183",
                                    "hasChildren": true,
                                    "row": {
                                        "headerId": "24",
                                        "text": "",
                                        "cellType": "ListRow",
                                        "displayType": "line"
                                    },
                                    "column": {
                                        "headerId": "sizeValue",
                                        "text": "",
                                        "cellType": "Empty",
                                        "displayType": "nested"
                                    },
                                    "hierarchyKey": "[\"183\"]",
                                    "expandCollapseId": "24_[\"183\"]",
                                    "calculatedSizeValue": 0.4864374489703347,
                                    "parent": {
                                        "text": "root_text",
                                        "value": 1,
                                        "sizeValue": 1,
                                        "colorValue": 0,
                                        "recordId": "root_record_id",
                                        "hasChildren": true,
                                        "row": {
                                            "headerId": "",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "line"
                                        },
                                        "column": {
                                            "headerId": "sizeValue",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "nested"
                                        },
                                        "hierarchyKey": "root_hierarchy_key",
                                        "calculatedSizeValue": 1,
                                        "parent": null
                                    }
                                }
                            }
                        },
                        {
                            "text": "Nero McKnight",
                            "value": 0.016171034014113312,
                            "sizeValue": 54.75,
                            "colorValue": 2,
                            "recordId": "190",
                            "hasChildren": true,
                            "row": {
                                "headerId": "24",
                                "text": "",
                                "cellType": "ListRow",
                                "displayType": "line"
                            },
                            "column": {
                                "headerId": "sizeValue",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "nested"
                            },
                            "hierarchyKey": "[\"190\"]",
                            "expandCollapseId": "24_[\"190\"]",
                            "calculatedSizeValue": 0.016171034014113312,
                            "parent": {
                                "text": "US East SaaS",
                                "value": 0.11838575251306273,
                                "sizeValue": 47.595238095238095,
                                "colorValue": 2,
                                "recordId": "184",
                                "hasChildren": true,
                                "row": {
                                    "headerId": "24",
                                    "text": "",
                                    "cellType": "ListRow",
                                    "displayType": "line"
                                },
                                "column": {
                                    "headerId": "sizeValue",
                                    "text": "",
                                    "cellType": "Empty",
                                    "displayType": "nested"
                                },
                                "hierarchyKey": "[\"184\"]",
                                "expandCollapseId": "24_[\"184\"]",
                                "calculatedSizeValue": 0.11838575251306273,
                                "parent": {
                                    "text": "North America",
                                    "value": 0.4864374489703347,
                                    "sizeValue": 48.306306306306304,
                                    "colorValue": 2,
                                    "recordId": "183",
                                    "hasChildren": true,
                                    "row": {
                                        "headerId": "24",
                                        "text": "",
                                        "cellType": "ListRow",
                                        "displayType": "line"
                                    },
                                    "column": {
                                        "headerId": "sizeValue",
                                        "text": "",
                                        "cellType": "Empty",
                                        "displayType": "nested"
                                    },
                                    "hierarchyKey": "[\"183\"]",
                                    "expandCollapseId": "24_[\"183\"]",
                                    "calculatedSizeValue": 0.4864374489703347,
                                    "parent": {
                                        "text": "root_text",
                                        "value": 1,
                                        "sizeValue": 1,
                                        "colorValue": 0,
                                        "recordId": "root_record_id",
                                        "hasChildren": true,
                                        "row": {
                                            "headerId": "",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "line"
                                        },
                                        "column": {
                                            "headerId": "sizeValue",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "nested"
                                        },
                                        "hierarchyKey": "root_hierarchy_key",
                                        "calculatedSizeValue": 1,
                                        "parent": null
                                    }
                                }
                            }
                        },
                        {
                            "text": "Veronica Good",
                            "value": 0.01407889110513366,
                            "sizeValue": 47.666666666666664,
                            "colorValue": 2,
                            "recordId": "191",
                            "hasChildren": true,
                            "row": {
                                "headerId": "24",
                                "text": "",
                                "cellType": "ListRow",
                                "displayType": "line"
                            },
                            "column": {
                                "headerId": "sizeValue",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "nested"
                            },
                            "hierarchyKey": "[\"191\"]",
                            "expandCollapseId": "24_[\"191\"]",
                            "calculatedSizeValue": 0.01407889110513366,
                            "parent": {
                                "text": "US East SaaS",
                                "value": 0.11838575251306273,
                                "sizeValue": 47.595238095238095,
                                "colorValue": 2,
                                "recordId": "184",
                                "hasChildren": true,
                                "row": {
                                    "headerId": "24",
                                    "text": "",
                                    "cellType": "ListRow",
                                    "displayType": "line"
                                },
                                "column": {
                                    "headerId": "sizeValue",
                                    "text": "",
                                    "cellType": "Empty",
                                    "displayType": "nested"
                                },
                                "hierarchyKey": "[\"184\"]",
                                "expandCollapseId": "24_[\"184\"]",
                                "calculatedSizeValue": 0.11838575251306273,
                                "parent": {
                                    "text": "North America",
                                    "value": 0.4864374489703347,
                                    "sizeValue": 48.306306306306304,
                                    "colorValue": 2,
                                    "recordId": "183",
                                    "hasChildren": true,
                                    "row": {
                                        "headerId": "24",
                                        "text": "",
                                        "cellType": "ListRow",
                                        "displayType": "line"
                                    },
                                    "column": {
                                        "headerId": "sizeValue",
                                        "text": "",
                                        "cellType": "Empty",
                                        "displayType": "nested"
                                    },
                                    "hierarchyKey": "[\"183\"]",
                                    "expandCollapseId": "24_[\"183\"]",
                                    "calculatedSizeValue": 0.4864374489703347,
                                    "parent": {
                                        "text": "root_text",
                                        "value": 1,
                                        "sizeValue": 1,
                                        "colorValue": 0,
                                        "recordId": "root_record_id",
                                        "hasChildren": true,
                                        "row": {
                                            "headerId": "",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "line"
                                        },
                                        "column": {
                                            "headerId": "sizeValue",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "nested"
                                        },
                                        "hierarchyKey": "root_hierarchy_key",
                                        "calculatedSizeValue": 1,
                                        "parent": null
                                    }
                                }
                            }
                        },
                        {
                            "text": "Wylie Haney",
                            "value": 0.013291260833517792,
                            "sizeValue": 45,
                            "colorValue": 2,
                            "recordId": "192",
                            "hasChildren": true,
                            "row": {
                                "headerId": "24",
                                "text": "",
                                "cellType": "ListRow",
                                "displayType": "line"
                            },
                            "column": {
                                "headerId": "sizeValue",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "nested"
                            },
                            "hierarchyKey": "[\"192\"]",
                            "expandCollapseId": "24_[\"192\"]",
                            "calculatedSizeValue": 0.013291260833517792,
                            "parent": {
                                "text": "US East SaaS",
                                "value": 0.11838575251306273,
                                "sizeValue": 47.595238095238095,
                                "colorValue": 2,
                                "recordId": "184",
                                "hasChildren": true,
                                "row": {
                                    "headerId": "24",
                                    "text": "",
                                    "cellType": "ListRow",
                                    "displayType": "line"
                                },
                                "column": {
                                    "headerId": "sizeValue",
                                    "text": "",
                                    "cellType": "Empty",
                                    "displayType": "nested"
                                },
                                "hierarchyKey": "[\"184\"]",
                                "expandCollapseId": "24_[\"184\"]",
                                "calculatedSizeValue": 0.11838575251306273,
                                "parent": {
                                    "text": "North America",
                                    "value": 0.4864374489703347,
                                    "sizeValue": 48.306306306306304,
                                    "colorValue": 2,
                                    "recordId": "183",
                                    "hasChildren": true,
                                    "row": {
                                        "headerId": "24",
                                        "text": "",
                                        "cellType": "ListRow",
                                        "displayType": "line"
                                    },
                                    "column": {
                                        "headerId": "sizeValue",
                                        "text": "",
                                        "cellType": "Empty",
                                        "displayType": "nested"
                                    },
                                    "hierarchyKey": "[\"183\"]",
                                    "expandCollapseId": "24_[\"183\"]",
                                    "calculatedSizeValue": 0.4864374489703347,
                                    "parent": {
                                        "text": "root_text",
                                        "value": 1,
                                        "sizeValue": 1,
                                        "colorValue": 0,
                                        "recordId": "root_record_id",
                                        "hasChildren": true,
                                        "row": {
                                            "headerId": "",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "line"
                                        },
                                        "column": {
                                            "headerId": "sizeValue",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "nested"
                                        },
                                        "hierarchyKey": "root_hierarchy_key",
                                        "calculatedSizeValue": 1,
                                        "parent": null
                                    }
                                }
                            }
                        }
                    ]
                },
                {
                    "text": "US OnPremise",
                    "value": 0,
                    "sizeValue": 52.30434782608695,
                    "colorValue": 2,
                    "recordId": "193",
                    "hasChildren": true,
                    "row": {
                        "headerId": "24",
                        "text": "",
                        "cellType": "ListRow",
                        "displayType": "line"
                    },
                    "column": {
                        "headerId": "sizeValue",
                        "text": "",
                        "cellType": "Empty",
                        "displayType": "nested"
                    },
                    "hierarchyKey": "[\"193\"]",
                    "expandCollapseId": "24_[\"193\"]",
                    "calculatedSizeValue": 0.13009893058431404,
                    "parent": {
                        "text": "North America",
                        "value": 0.4864374489703347,
                        "sizeValue": 48.306306306306304,
                        "colorValue": 2,
                        "recordId": "183",
                        "hasChildren": true,
                        "row": {
                            "headerId": "24",
                            "text": "",
                            "cellType": "ListRow",
                            "displayType": "line"
                        },
                        "column": {
                            "headerId": "sizeValue",
                            "text": "",
                            "cellType": "Empty",
                            "displayType": "nested"
                        },
                        "hierarchyKey": "[\"183\"]",
                        "expandCollapseId": "24_[\"183\"]",
                        "calculatedSizeValue": 0.4864374489703347,
                        "parent": {
                            "text": "root_text",
                            "value": 1,
                            "sizeValue": 1,
                            "colorValue": 0,
                            "recordId": "root_record_id",
                            "hasChildren": true,
                            "row": {
                                "headerId": "",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "line"
                            },
                            "column": {
                                "headerId": "sizeValue",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "nested"
                            },
                            "hierarchyKey": "root_hierarchy_key",
                            "calculatedSizeValue": 1,
                            "parent": null
                        }
                    },
                    "children": [
                        {
                            "text": "Elizabeth Lopez",
                            "value": 0.03515711026287931,
                            "sizeValue": 57,
                            "colorValue": 2,
                            "recordId": "195",
                            "hasChildren": true,
                            "row": {
                                "headerId": "24",
                                "text": "",
                                "cellType": "ListRow",
                                "displayType": "line"
                            },
                            "column": {
                                "headerId": "sizeValue",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "nested"
                            },
                            "hierarchyKey": "[\"195\"]",
                            "expandCollapseId": "24_[\"195\"]",
                            "calculatedSizeValue": 0.03515711026287931,
                            "parent": {
                                "text": "US OnPremise",
                                "value": 0.13009893058431404,
                                "sizeValue": 52.30434782608695,
                                "colorValue": 2,
                                "recordId": "193",
                                "hasChildren": true,
                                "row": {
                                    "headerId": "24",
                                    "text": "",
                                    "cellType": "ListRow",
                                    "displayType": "line"
                                },
                                "column": {
                                    "headerId": "sizeValue",
                                    "text": "",
                                    "cellType": "Empty",
                                    "displayType": "nested"
                                },
                                "hierarchyKey": "[\"193\"]",
                                "expandCollapseId": "24_[\"193\"]",
                                "calculatedSizeValue": 0.13009893058431404,
                                "parent": {
                                    "text": "North America",
                                    "value": 0.4864374489703347,
                                    "sizeValue": 48.306306306306304,
                                    "colorValue": 2,
                                    "recordId": "183",
                                    "hasChildren": true,
                                    "row": {
                                        "headerId": "24",
                                        "text": "",
                                        "cellType": "ListRow",
                                        "displayType": "line"
                                    },
                                    "column": {
                                        "headerId": "sizeValue",
                                        "text": "",
                                        "cellType": "Empty",
                                        "displayType": "nested"
                                    },
                                    "hierarchyKey": "[\"183\"]",
                                    "expandCollapseId": "24_[\"183\"]",
                                    "calculatedSizeValue": 0.4864374489703347,
                                    "parent": {
                                        "text": "root_text",
                                        "value": 1,
                                        "sizeValue": 1,
                                        "colorValue": 0,
                                        "recordId": "root_record_id",
                                        "hasChildren": true,
                                        "row": {
                                            "headerId": "",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "line"
                                        },
                                        "column": {
                                            "headerId": "sizeValue",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "nested"
                                        },
                                        "hierarchyKey": "root_hierarchy_key",
                                        "calculatedSizeValue": 1,
                                        "parent": null
                                    }
                                }
                            }
                        },
                        {
                            "text": "Idona Fleming",
                            "value": 0.031147966110094828,
                            "sizeValue": 50.5,
                            "colorValue": 2,
                            "recordId": "196",
                            "hasChildren": true,
                            "row": {
                                "headerId": "24",
                                "text": "",
                                "cellType": "ListRow",
                                "displayType": "line"
                            },
                            "column": {
                                "headerId": "sizeValue",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "nested"
                            },
                            "hierarchyKey": "[\"196\"]",
                            "expandCollapseId": "24_[\"196\"]",
                            "calculatedSizeValue": 0.031147966110094828,
                            "parent": {
                                "text": "US OnPremise",
                                "value": 0.13009893058431404,
                                "sizeValue": 52.30434782608695,
                                "colorValue": 2,
                                "recordId": "193",
                                "hasChildren": true,
                                "row": {
                                    "headerId": "24",
                                    "text": "",
                                    "cellType": "ListRow",
                                    "displayType": "line"
                                },
                                "column": {
                                    "headerId": "sizeValue",
                                    "text": "",
                                    "cellType": "Empty",
                                    "displayType": "nested"
                                },
                                "hierarchyKey": "[\"193\"]",
                                "expandCollapseId": "24_[\"193\"]",
                                "calculatedSizeValue": 0.13009893058431404,
                                "parent": {
                                    "text": "North America",
                                    "value": 0.4864374489703347,
                                    "sizeValue": 48.306306306306304,
                                    "colorValue": 2,
                                    "recordId": "183",
                                    "hasChildren": true,
                                    "row": {
                                        "headerId": "24",
                                        "text": "",
                                        "cellType": "ListRow",
                                        "displayType": "line"
                                    },
                                    "column": {
                                        "headerId": "sizeValue",
                                        "text": "",
                                        "cellType": "Empty",
                                        "displayType": "nested"
                                    },
                                    "hierarchyKey": "[\"183\"]",
                                    "expandCollapseId": "24_[\"183\"]",
                                    "calculatedSizeValue": 0.4864374489703347,
                                    "parent": {
                                        "text": "root_text",
                                        "value": 1,
                                        "sizeValue": 1,
                                        "colorValue": 0,
                                        "recordId": "root_record_id",
                                        "hasChildren": true,
                                        "row": {
                                            "headerId": "",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "line"
                                        },
                                        "column": {
                                            "headerId": "sizeValue",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "nested"
                                        },
                                        "hierarchyKey": "root_hierarchy_key",
                                        "calculatedSizeValue": 1,
                                        "parent": null
                                    }
                                }
                            }
                        },
                        {
                            "text": "Minerva Stuart",
                            "value": 0.038505406478391624,
                            "sizeValue": 62.42857142857143,
                            "colorValue": 2,
                            "recordId": "197",
                            "hasChildren": true,
                            "row": {
                                "headerId": "24",
                                "text": "",
                                "cellType": "ListRow",
                                "displayType": "line"
                            },
                            "column": {
                                "headerId": "sizeValue",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "nested"
                            },
                            "hierarchyKey": "[\"197\"]",
                            "expandCollapseId": "24_[\"197\"]",
                            "calculatedSizeValue": 0.038505406478391624,
                            "parent": {
                                "text": "US OnPremise",
                                "value": 0.13009893058431404,
                                "sizeValue": 52.30434782608695,
                                "colorValue": 2,
                                "recordId": "193",
                                "hasChildren": true,
                                "row": {
                                    "headerId": "24",
                                    "text": "",
                                    "cellType": "ListRow",
                                    "displayType": "line"
                                },
                                "column": {
                                    "headerId": "sizeValue",
                                    "text": "",
                                    "cellType": "Empty",
                                    "displayType": "nested"
                                },
                                "hierarchyKey": "[\"193\"]",
                                "expandCollapseId": "24_[\"193\"]",
                                "calculatedSizeValue": 0.13009893058431404,
                                "parent": {
                                    "text": "North America",
                                    "value": 0.4864374489703347,
                                    "sizeValue": 48.306306306306304,
                                    "colorValue": 2,
                                    "recordId": "183",
                                    "hasChildren": true,
                                    "row": {
                                        "headerId": "24",
                                        "text": "",
                                        "cellType": "ListRow",
                                        "displayType": "line"
                                    },
                                    "column": {
                                        "headerId": "sizeValue",
                                        "text": "",
                                        "cellType": "Empty",
                                        "displayType": "nested"
                                    },
                                    "hierarchyKey": "[\"183\"]",
                                    "expandCollapseId": "24_[\"183\"]",
                                    "calculatedSizeValue": 0.4864374489703347,
                                    "parent": {
                                        "text": "root_text",
                                        "value": 1,
                                        "sizeValue": 1,
                                        "colorValue": 0,
                                        "recordId": "root_record_id",
                                        "hasChildren": true,
                                        "row": {
                                            "headerId": "",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "line"
                                        },
                                        "column": {
                                            "headerId": "sizeValue",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "nested"
                                        },
                                        "hierarchyKey": "root_hierarchy_key",
                                        "calculatedSizeValue": 1,
                                        "parent": null
                                    }
                                }
                            }
                        },
                        {
                            "text": "Rowan Guerra",
                            "value": 0.025288447732948274,
                            "sizeValue": 41,
                            "colorValue": 2,
                            "recordId": "198",
                            "hasChildren": true,
                            "row": {
                                "headerId": "24",
                                "text": "",
                                "cellType": "ListRow",
                                "displayType": "line"
                            },
                            "column": {
                                "headerId": "sizeValue",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "nested"
                            },
                            "hierarchyKey": "[\"198\"]",
                            "expandCollapseId": "24_[\"198\"]",
                            "calculatedSizeValue": 0.025288447732948274,
                            "parent": {
                                "text": "US OnPremise",
                                "value": 0.13009893058431404,
                                "sizeValue": 52.30434782608695,
                                "colorValue": 2,
                                "recordId": "193",
                                "hasChildren": true,
                                "row": {
                                    "headerId": "24",
                                    "text": "",
                                    "cellType": "ListRow",
                                    "displayType": "line"
                                },
                                "column": {
                                    "headerId": "sizeValue",
                                    "text": "",
                                    "cellType": "Empty",
                                    "displayType": "nested"
                                },
                                "hierarchyKey": "[\"193\"]",
                                "expandCollapseId": "24_[\"193\"]",
                                "calculatedSizeValue": 0.13009893058431404,
                                "parent": {
                                    "text": "North America",
                                    "value": 0.4864374489703347,
                                    "sizeValue": 48.306306306306304,
                                    "colorValue": 2,
                                    "recordId": "183",
                                    "hasChildren": true,
                                    "row": {
                                        "headerId": "24",
                                        "text": "",
                                        "cellType": "ListRow",
                                        "displayType": "line"
                                    },
                                    "column": {
                                        "headerId": "sizeValue",
                                        "text": "",
                                        "cellType": "Empty",
                                        "displayType": "nested"
                                    },
                                    "hierarchyKey": "[\"183\"]",
                                    "expandCollapseId": "24_[\"183\"]",
                                    "calculatedSizeValue": 0.4864374489703347,
                                    "parent": {
                                        "text": "root_text",
                                        "value": 1,
                                        "sizeValue": 1,
                                        "colorValue": 0,
                                        "recordId": "root_record_id",
                                        "hasChildren": true,
                                        "row": {
                                            "headerId": "",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "line"
                                        },
                                        "column": {
                                            "headerId": "sizeValue",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "nested"
                                        },
                                        "hierarchyKey": "root_hierarchy_key",
                                        "calculatedSizeValue": 1,
                                        "parent": null
                                    }
                                }
                            }
                        }
                    ]
                },
                {
                    "text": "US Private Cloud",
                    "value": 0,
                    "sizeValue": 54.55,
                    "colorValue": 2,
                    "recordId": "199",
                    "hasChildren": true,
                    "row": {
                        "headerId": "24",
                        "text": "",
                        "cellType": "ListRow",
                        "displayType": "line"
                    },
                    "column": {
                        "headerId": "sizeValue",
                        "text": "",
                        "cellType": "Empty",
                        "displayType": "nested"
                    },
                    "hierarchyKey": "[\"199\"]",
                    "expandCollapseId": "24_[\"199\"]",
                    "calculatedSizeValue": 0.13568464111189496,
                    "parent": {
                        "text": "North America",
                        "value": 0.4864374489703347,
                        "sizeValue": 48.306306306306304,
                        "colorValue": 2,
                        "recordId": "183",
                        "hasChildren": true,
                        "row": {
                            "headerId": "24",
                            "text": "",
                            "cellType": "ListRow",
                            "displayType": "line"
                        },
                        "column": {
                            "headerId": "sizeValue",
                            "text": "",
                            "cellType": "Empty",
                            "displayType": "nested"
                        },
                        "hierarchyKey": "[\"183\"]",
                        "expandCollapseId": "24_[\"183\"]",
                        "calculatedSizeValue": 0.4864374489703347,
                        "parent": {
                            "text": "root_text",
                            "value": 1,
                            "sizeValue": 1,
                            "colorValue": 0,
                            "recordId": "root_record_id",
                            "hasChildren": true,
                            "row": {
                                "headerId": "",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "line"
                            },
                            "column": {
                                "headerId": "sizeValue",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "nested"
                            },
                            "hierarchyKey": "root_hierarchy_key",
                            "calculatedSizeValue": 1,
                            "parent": null
                        }
                    },
                    "children": [
                        {
                            "text": "Iona Underwood",
                            "value": 0.06854397323365233,
                            "sizeValue": 55.285714285714285,
                            "colorValue": 2,
                            "recordId": "200",
                            "hasChildren": true,
                            "row": {
                                "headerId": "24",
                                "text": "",
                                "cellType": "ListRow",
                                "displayType": "line"
                            },
                            "column": {
                                "headerId": "sizeValue",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "nested"
                            },
                            "hierarchyKey": "[\"200\"]",
                            "expandCollapseId": "24_[\"200\"]",
                            "calculatedSizeValue": 0.06854397323365233,
                            "parent": {
                                "text": "US Private Cloud",
                                "value": 0.13568464111189496,
                                "sizeValue": 54.55,
                                "colorValue": 2,
                                "recordId": "199",
                                "hasChildren": true,
                                "row": {
                                    "headerId": "24",
                                    "text": "",
                                    "cellType": "ListRow",
                                    "displayType": "line"
                                },
                                "column": {
                                    "headerId": "sizeValue",
                                    "text": "",
                                    "cellType": "Empty",
                                    "displayType": "nested"
                                },
                                "hierarchyKey": "[\"199\"]",
                                "expandCollapseId": "24_[\"199\"]",
                                "calculatedSizeValue": 0.13568464111189496,
                                "parent": {
                                    "text": "North America",
                                    "value": 0.4864374489703347,
                                    "sizeValue": 48.306306306306304,
                                    "colorValue": 2,
                                    "recordId": "183",
                                    "hasChildren": true,
                                    "row": {
                                        "headerId": "24",
                                        "text": "",
                                        "cellType": "ListRow",
                                        "displayType": "line"
                                    },
                                    "column": {
                                        "headerId": "sizeValue",
                                        "text": "",
                                        "cellType": "Empty",
                                        "displayType": "nested"
                                    },
                                    "hierarchyKey": "[\"183\"]",
                                    "expandCollapseId": "24_[\"183\"]",
                                    "calculatedSizeValue": 0.4864374489703347,
                                    "parent": {
                                        "text": "root_text",
                                        "value": 1,
                                        "sizeValue": 1,
                                        "colorValue": 0,
                                        "recordId": "root_record_id",
                                        "hasChildren": true,
                                        "row": {
                                            "headerId": "",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "line"
                                        },
                                        "column": {
                                            "headerId": "sizeValue",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "nested"
                                        },
                                        "hierarchyKey": "root_hierarchy_key",
                                        "calculatedSizeValue": 1,
                                        "parent": null
                                    }
                                }
                            }
                        },
                        {
                            "text": "Nora Calhoun",
                            "value": 0.06714066787824263,
                            "sizeValue": 54.15384615384615,
                            "colorValue": 2,
                            "recordId": "201",
                            "hasChildren": true,
                            "row": {
                                "headerId": "24",
                                "text": "",
                                "cellType": "ListRow",
                                "displayType": "line"
                            },
                            "column": {
                                "headerId": "sizeValue",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "nested"
                            },
                            "hierarchyKey": "[\"201\"]",
                            "expandCollapseId": "24_[\"201\"]",
                            "calculatedSizeValue": 0.06714066787824263,
                            "parent": {
                                "text": "US Private Cloud",
                                "value": 0.13568464111189496,
                                "sizeValue": 54.55,
                                "colorValue": 2,
                                "recordId": "199",
                                "hasChildren": true,
                                "row": {
                                    "headerId": "24",
                                    "text": "",
                                    "cellType": "ListRow",
                                    "displayType": "line"
                                },
                                "column": {
                                    "headerId": "sizeValue",
                                    "text": "",
                                    "cellType": "Empty",
                                    "displayType": "nested"
                                },
                                "hierarchyKey": "[\"199\"]",
                                "expandCollapseId": "24_[\"199\"]",
                                "calculatedSizeValue": 0.13568464111189496,
                                "parent": {
                                    "text": "North America",
                                    "value": 0.4864374489703347,
                                    "sizeValue": 48.306306306306304,
                                    "colorValue": 2,
                                    "recordId": "183",
                                    "hasChildren": true,
                                    "row": {
                                        "headerId": "24",
                                        "text": "",
                                        "cellType": "ListRow",
                                        "displayType": "line"
                                    },
                                    "column": {
                                        "headerId": "sizeValue",
                                        "text": "",
                                        "cellType": "Empty",
                                        "displayType": "nested"
                                    },
                                    "hierarchyKey": "[\"183\"]",
                                    "expandCollapseId": "24_[\"183\"]",
                                    "calculatedSizeValue": 0.4864374489703347,
                                    "parent": {
                                        "text": "root_text",
                                        "value": 1,
                                        "sizeValue": 1,
                                        "colorValue": 0,
                                        "recordId": "root_record_id",
                                        "hasChildren": true,
                                        "row": {
                                            "headerId": "",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "line"
                                        },
                                        "column": {
                                            "headerId": "sizeValue",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "nested"
                                        },
                                        "hierarchyKey": "root_hierarchy_key",
                                        "calculatedSizeValue": 1,
                                        "parent": null
                                    }
                                }
                            }
                        }
                    ]
                },
                {
                    "text": "US West SaaS",
                    "value": 0,
                    "sizeValue": 41.11538461538461,
                    "colorValue": 2,
                    "recordId": "202",
                    "hasChildren": true,
                    "row": {
                        "headerId": "24",
                        "text": "",
                        "cellType": "ListRow",
                        "displayType": "line"
                    },
                    "column": {
                        "headerId": "sizeValue",
                        "text": "",
                        "cellType": "Empty",
                        "displayType": "nested"
                    },
                    "hierarchyKey": "[\"202\"]",
                    "expandCollapseId": "24_[\"202\"]",
                    "calculatedSizeValue": 0.10226812476106303,
                    "parent": {
                        "text": "North America",
                        "value": 0.4864374489703347,
                        "sizeValue": 48.306306306306304,
                        "colorValue": 2,
                        "recordId": "183",
                        "hasChildren": true,
                        "row": {
                            "headerId": "24",
                            "text": "",
                            "cellType": "ListRow",
                            "displayType": "line"
                        },
                        "column": {
                            "headerId": "sizeValue",
                            "text": "",
                            "cellType": "Empty",
                            "displayType": "nested"
                        },
                        "hierarchyKey": "[\"183\"]",
                        "expandCollapseId": "24_[\"183\"]",
                        "calculatedSizeValue": 0.4864374489703347,
                        "parent": {
                            "text": "root_text",
                            "value": 1,
                            "sizeValue": 1,
                            "colorValue": 0,
                            "recordId": "root_record_id",
                            "hasChildren": true,
                            "row": {
                                "headerId": "",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "line"
                            },
                            "column": {
                                "headerId": "sizeValue",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "nested"
                            },
                            "hierarchyKey": "root_hierarchy_key",
                            "calculatedSizeValue": 1,
                            "parent": null
                        }
                    },
                    "children": [
                        {
                            "text": "Ella Carroll",
                            "value": 0.032963438697999524,
                            "sizeValue": 39.5,
                            "colorValue": 2,
                            "recordId": "204",
                            "hasChildren": true,
                            "row": {
                                "headerId": "24",
                                "text": "",
                                "cellType": "ListRow",
                                "displayType": "line"
                            },
                            "column": {
                                "headerId": "sizeValue",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "nested"
                            },
                            "hierarchyKey": "[\"204\"]",
                            "expandCollapseId": "24_[\"204\"]",
                            "calculatedSizeValue": 0.032963438697999524,
                            "parent": {
                                "text": "US West SaaS",
                                "value": 0.10226812476106303,
                                "sizeValue": 41.11538461538461,
                                "colorValue": 2,
                                "recordId": "202",
                                "hasChildren": true,
                                "row": {
                                    "headerId": "24",
                                    "text": "",
                                    "cellType": "ListRow",
                                    "displayType": "line"
                                },
                                "column": {
                                    "headerId": "sizeValue",
                                    "text": "",
                                    "cellType": "Empty",
                                    "displayType": "nested"
                                },
                                "hierarchyKey": "[\"202\"]",
                                "expandCollapseId": "24_[\"202\"]",
                                "calculatedSizeValue": 0.10226812476106303,
                                "parent": {
                                    "text": "North America",
                                    "value": 0.4864374489703347,
                                    "sizeValue": 48.306306306306304,
                                    "colorValue": 2,
                                    "recordId": "183",
                                    "hasChildren": true,
                                    "row": {
                                        "headerId": "24",
                                        "text": "",
                                        "cellType": "ListRow",
                                        "displayType": "line"
                                    },
                                    "column": {
                                        "headerId": "sizeValue",
                                        "text": "",
                                        "cellType": "Empty",
                                        "displayType": "nested"
                                    },
                                    "hierarchyKey": "[\"183\"]",
                                    "expandCollapseId": "24_[\"183\"]",
                                    "calculatedSizeValue": 0.4864374489703347,
                                    "parent": {
                                        "text": "root_text",
                                        "value": 1,
                                        "sizeValue": 1,
                                        "colorValue": 0,
                                        "recordId": "root_record_id",
                                        "hasChildren": true,
                                        "row": {
                                            "headerId": "",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "line"
                                        },
                                        "column": {
                                            "headerId": "sizeValue",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "nested"
                                        },
                                        "hierarchyKey": "root_hierarchy_key",
                                        "calculatedSizeValue": 1,
                                        "parent": null
                                    }
                                }
                            }
                        },
                        {
                            "text": "Rigel Buckley",
                            "value": 0.03866597450651421,
                            "sizeValue": 46.333333333333336,
                            "colorValue": 2,
                            "recordId": "206",
                            "hasChildren": true,
                            "row": {
                                "headerId": "24",
                                "text": "",
                                "cellType": "ListRow",
                                "displayType": "line"
                            },
                            "column": {
                                "headerId": "sizeValue",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "nested"
                            },
                            "hierarchyKey": "[\"206\"]",
                            "expandCollapseId": "24_[\"206\"]",
                            "calculatedSizeValue": 0.03866597450651421,
                            "parent": {
                                "text": "US West SaaS",
                                "value": 0.10226812476106303,
                                "sizeValue": 41.11538461538461,
                                "colorValue": 2,
                                "recordId": "202",
                                "hasChildren": true,
                                "row": {
                                    "headerId": "24",
                                    "text": "",
                                    "cellType": "ListRow",
                                    "displayType": "line"
                                },
                                "column": {
                                    "headerId": "sizeValue",
                                    "text": "",
                                    "cellType": "Empty",
                                    "displayType": "nested"
                                },
                                "hierarchyKey": "[\"202\"]",
                                "expandCollapseId": "24_[\"202\"]",
                                "calculatedSizeValue": 0.10226812476106303,
                                "parent": {
                                    "text": "North America",
                                    "value": 0.4864374489703347,
                                    "sizeValue": 48.306306306306304,
                                    "colorValue": 2,
                                    "recordId": "183",
                                    "hasChildren": true,
                                    "row": {
                                        "headerId": "24",
                                        "text": "",
                                        "cellType": "ListRow",
                                        "displayType": "line"
                                    },
                                    "column": {
                                        "headerId": "sizeValue",
                                        "text": "",
                                        "cellType": "Empty",
                                        "displayType": "nested"
                                    },
                                    "hierarchyKey": "[\"183\"]",
                                    "expandCollapseId": "24_[\"183\"]",
                                    "calculatedSizeValue": 0.4864374489703347,
                                    "parent": {
                                        "text": "root_text",
                                        "value": 1,
                                        "sizeValue": 1,
                                        "colorValue": 0,
                                        "recordId": "root_record_id",
                                        "hasChildren": true,
                                        "row": {
                                            "headerId": "",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "line"
                                        },
                                        "column": {
                                            "headerId": "sizeValue",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "nested"
                                        },
                                        "hierarchyKey": "root_hierarchy_key",
                                        "calculatedSizeValue": 1,
                                        "parent": null
                                    }
                                }
                            }
                        },
                        {
                            "text": "Zeph Mosley",
                            "value": 0.030638711556549285,
                            "sizeValue": 36.714285714285715,
                            "colorValue": 2,
                            "recordId": "207",
                            "hasChildren": true,
                            "row": {
                                "headerId": "24",
                                "text": "",
                                "cellType": "ListRow",
                                "displayType": "line"
                            },
                            "column": {
                                "headerId": "sizeValue",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "nested"
                            },
                            "hierarchyKey": "[\"207\"]",
                            "expandCollapseId": "24_[\"207\"]",
                            "calculatedSizeValue": 0.030638711556549285,
                            "parent": {
                                "text": "US West SaaS",
                                "value": 0.10226812476106303,
                                "sizeValue": 41.11538461538461,
                                "colorValue": 2,
                                "recordId": "202",
                                "hasChildren": true,
                                "row": {
                                    "headerId": "24",
                                    "text": "",
                                    "cellType": "ListRow",
                                    "displayType": "line"
                                },
                                "column": {
                                    "headerId": "sizeValue",
                                    "text": "",
                                    "cellType": "Empty",
                                    "displayType": "nested"
                                },
                                "hierarchyKey": "[\"202\"]",
                                "expandCollapseId": "24_[\"202\"]",
                                "calculatedSizeValue": 0.10226812476106303,
                                "parent": {
                                    "text": "North America",
                                    "value": 0.4864374489703347,
                                    "sizeValue": 48.306306306306304,
                                    "colorValue": 2,
                                    "recordId": "183",
                                    "hasChildren": true,
                                    "row": {
                                        "headerId": "24",
                                        "text": "",
                                        "cellType": "ListRow",
                                        "displayType": "line"
                                    },
                                    "column": {
                                        "headerId": "sizeValue",
                                        "text": "",
                                        "cellType": "Empty",
                                        "displayType": "nested"
                                    },
                                    "hierarchyKey": "[\"183\"]",
                                    "expandCollapseId": "24_[\"183\"]",
                                    "calculatedSizeValue": 0.4864374489703347,
                                    "parent": {
                                        "text": "root_text",
                                        "value": 1,
                                        "sizeValue": 1,
                                        "colorValue": 0,
                                        "recordId": "root_record_id",
                                        "hasChildren": true,
                                        "row": {
                                            "headerId": "",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "line"
                                        },
                                        "column": {
                                            "headerId": "sizeValue",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "nested"
                                        },
                                        "hierarchyKey": "root_hierarchy_key",
                                        "calculatedSizeValue": 1,
                                        "parent": null
                                    }
                                }
                            }
                        }
                    ]
                }
            ]
        },
        {
            "text": "Rest of World",
            "value": 0,
            "sizeValue": 51,
            "colorValue": 2,
            "recordId": "208",
            "hasChildren": true,
            "row": {
                "headerId": "24",
                "text": "",
                "cellType": "ListRow",
                "displayType": "line"
            },
            "column": {
                "headerId": "sizeValue",
                "text": "",
                "cellType": "Empty",
                "displayType": "nested"
            },
            "hierarchyKey": "[\"208\"]",
            "expandCollapseId": "24_[\"208\"]",
            "calculatedSizeValue": 0.5135625510296652,
            "parent": {
                "text": "root_text",
                "value": 1,
                "sizeValue": 1,
                "colorValue": 0,
                "recordId": "root_record_id",
                "hasChildren": true,
                "row": {
                    "headerId": "",
                    "text": "",
                    "cellType": "Empty",
                    "displayType": "line"
                },
                "column": {
                    "headerId": "sizeValue",
                    "text": "",
                    "cellType": "Empty",
                    "displayType": "nested"
                },
                "hierarchyKey": "root_hierarchy_key",
                "calculatedSizeValue": 1,
                "parent": null
            },
            "children": [
                {
                    "text": "Asia  Private Cloud",
                    "value": 0,
                    "sizeValue": 50.59090909090909,
                    "colorValue": 2,
                    "recordId": "209",
                    "hasChildren": true,
                    "row": {
                        "headerId": "24",
                        "text": "",
                        "cellType": "ListRow",
                        "displayType": "line"
                    },
                    "column": {
                        "headerId": "sizeValue",
                        "text": "",
                        "cellType": "Empty",
                        "displayType": "nested"
                    },
                    "hierarchyKey": "[\"209\"]",
                    "expandCollapseId": "24_[\"209\"]",
                    "calculatedSizeValue": 0.16063517899942753,
                    "parent": {
                        "text": "Rest of World",
                        "value": 0.5135625510296652,
                        "sizeValue": 51,
                        "colorValue": 2,
                        "recordId": "208",
                        "hasChildren": true,
                        "row": {
                            "headerId": "24",
                            "text": "",
                            "cellType": "ListRow",
                            "displayType": "line"
                        },
                        "column": {
                            "headerId": "sizeValue",
                            "text": "",
                            "cellType": "Empty",
                            "displayType": "nested"
                        },
                        "hierarchyKey": "[\"208\"]",
                        "expandCollapseId": "24_[\"208\"]",
                        "calculatedSizeValue": 0.5135625510296652,
                        "parent": {
                            "text": "root_text",
                            "value": 1,
                            "sizeValue": 1,
                            "colorValue": 0,
                            "recordId": "root_record_id",
                            "hasChildren": true,
                            "row": {
                                "headerId": "",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "line"
                            },
                            "column": {
                                "headerId": "sizeValue",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "nested"
                            },
                            "hierarchyKey": "root_hierarchy_key",
                            "calculatedSizeValue": 1,
                            "parent": null
                        }
                    },
                    "children": [
                        {
                            "text": "Bernard Harrell",
                            "value": 0.06174554262281054,
                            "sizeValue": 59.25,
                            "colorValue": 2,
                            "recordId": "210",
                            "hasChildren": true,
                            "row": {
                                "headerId": "24",
                                "text": "",
                                "cellType": "ListRow",
                                "displayType": "line"
                            },
                            "column": {
                                "headerId": "sizeValue",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "nested"
                            },
                            "hierarchyKey": "[\"210\"]",
                            "expandCollapseId": "24_[\"210\"]",
                            "calculatedSizeValue": 0.06174554262281054,
                            "parent": {
                                "text": "Asia  Private Cloud",
                                "value": 0.16063517899942753,
                                "sizeValue": 50.59090909090909,
                                "colorValue": 2,
                                "recordId": "209",
                                "hasChildren": true,
                                "row": {
                                    "headerId": "24",
                                    "text": "",
                                    "cellType": "ListRow",
                                    "displayType": "line"
                                },
                                "column": {
                                    "headerId": "sizeValue",
                                    "text": "",
                                    "cellType": "Empty",
                                    "displayType": "nested"
                                },
                                "hierarchyKey": "[\"209\"]",
                                "expandCollapseId": "24_[\"209\"]",
                                "calculatedSizeValue": 0.16063517899942753,
                                "parent": {
                                    "text": "Rest of World",
                                    "value": 0.5135625510296652,
                                    "sizeValue": 51,
                                    "colorValue": 2,
                                    "recordId": "208",
                                    "hasChildren": true,
                                    "row": {
                                        "headerId": "24",
                                        "text": "",
                                        "cellType": "ListRow",
                                        "displayType": "line"
                                    },
                                    "column": {
                                        "headerId": "sizeValue",
                                        "text": "",
                                        "cellType": "Empty",
                                        "displayType": "nested"
                                    },
                                    "hierarchyKey": "[\"208\"]",
                                    "expandCollapseId": "24_[\"208\"]",
                                    "calculatedSizeValue": 0.5135625510296652,
                                    "parent": {
                                        "text": "root_text",
                                        "value": 1,
                                        "sizeValue": 1,
                                        "colorValue": 0,
                                        "recordId": "root_record_id",
                                        "hasChildren": true,
                                        "row": {
                                            "headerId": "",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "line"
                                        },
                                        "column": {
                                            "headerId": "sizeValue",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "nested"
                                        },
                                        "hierarchyKey": "root_hierarchy_key",
                                        "calculatedSizeValue": 1,
                                        "parent": null
                                    }
                                }
                            }
                        },
                        {
                            "text": "Daria Lang",
                            "value": 0.055381173853370755,
                            "sizeValue": 53.142857142857146,
                            "colorValue": 2,
                            "recordId": "211",
                            "hasChildren": true,
                            "row": {
                                "headerId": "24",
                                "text": "",
                                "cellType": "ListRow",
                                "displayType": "line"
                            },
                            "column": {
                                "headerId": "sizeValue",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "nested"
                            },
                            "hierarchyKey": "[\"211\"]",
                            "expandCollapseId": "24_[\"211\"]",
                            "calculatedSizeValue": 0.055381173853370755,
                            "parent": {
                                "text": "Asia  Private Cloud",
                                "value": 0.16063517899942753,
                                "sizeValue": 50.59090909090909,
                                "colorValue": 2,
                                "recordId": "209",
                                "hasChildren": true,
                                "row": {
                                    "headerId": "24",
                                    "text": "",
                                    "cellType": "ListRow",
                                    "displayType": "line"
                                },
                                "column": {
                                    "headerId": "sizeValue",
                                    "text": "",
                                    "cellType": "Empty",
                                    "displayType": "nested"
                                },
                                "hierarchyKey": "[\"209\"]",
                                "expandCollapseId": "24_[\"209\"]",
                                "calculatedSizeValue": 0.16063517899942753,
                                "parent": {
                                    "text": "Rest of World",
                                    "value": 0.5135625510296652,
                                    "sizeValue": 51,
                                    "colorValue": 2,
                                    "recordId": "208",
                                    "hasChildren": true,
                                    "row": {
                                        "headerId": "24",
                                        "text": "",
                                        "cellType": "ListRow",
                                        "displayType": "line"
                                    },
                                    "column": {
                                        "headerId": "sizeValue",
                                        "text": "",
                                        "cellType": "Empty",
                                        "displayType": "nested"
                                    },
                                    "hierarchyKey": "[\"208\"]",
                                    "expandCollapseId": "24_[\"208\"]",
                                    "calculatedSizeValue": 0.5135625510296652,
                                    "parent": {
                                        "text": "root_text",
                                        "value": 1,
                                        "sizeValue": 1,
                                        "colorValue": 0,
                                        "recordId": "root_record_id",
                                        "hasChildren": true,
                                        "row": {
                                            "headerId": "",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "line"
                                        },
                                        "column": {
                                            "headerId": "sizeValue",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "nested"
                                        },
                                        "hierarchyKey": "root_hierarchy_key",
                                        "calculatedSizeValue": 1,
                                        "parent": null
                                    }
                                }
                            }
                        },
                        {
                            "text": "Phoebe Pugh",
                            "value": 0.04350846252324624,
                            "sizeValue": 41.75,
                            "colorValue": 2,
                            "recordId": "212",
                            "hasChildren": true,
                            "row": {
                                "headerId": "24",
                                "text": "",
                                "cellType": "ListRow",
                                "displayType": "line"
                            },
                            "column": {
                                "headerId": "sizeValue",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "nested"
                            },
                            "hierarchyKey": "[\"212\"]",
                            "expandCollapseId": "24_[\"212\"]",
                            "calculatedSizeValue": 0.04350846252324624,
                            "parent": {
                                "text": "Asia  Private Cloud",
                                "value": 0.16063517899942753,
                                "sizeValue": 50.59090909090909,
                                "colorValue": 2,
                                "recordId": "209",
                                "hasChildren": true,
                                "row": {
                                    "headerId": "24",
                                    "text": "",
                                    "cellType": "ListRow",
                                    "displayType": "line"
                                },
                                "column": {
                                    "headerId": "sizeValue",
                                    "text": "",
                                    "cellType": "Empty",
                                    "displayType": "nested"
                                },
                                "hierarchyKey": "[\"209\"]",
                                "expandCollapseId": "24_[\"209\"]",
                                "calculatedSizeValue": 0.16063517899942753,
                                "parent": {
                                    "text": "Rest of World",
                                    "value": 0.5135625510296652,
                                    "sizeValue": 51,
                                    "colorValue": 2,
                                    "recordId": "208",
                                    "hasChildren": true,
                                    "row": {
                                        "headerId": "24",
                                        "text": "",
                                        "cellType": "ListRow",
                                        "displayType": "line"
                                    },
                                    "column": {
                                        "headerId": "sizeValue",
                                        "text": "",
                                        "cellType": "Empty",
                                        "displayType": "nested"
                                    },
                                    "hierarchyKey": "[\"208\"]",
                                    "expandCollapseId": "24_[\"208\"]",
                                    "calculatedSizeValue": 0.5135625510296652,
                                    "parent": {
                                        "text": "root_text",
                                        "value": 1,
                                        "sizeValue": 1,
                                        "colorValue": 0,
                                        "recordId": "root_record_id",
                                        "hasChildren": true,
                                        "row": {
                                            "headerId": "",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "line"
                                        },
                                        "column": {
                                            "headerId": "sizeValue",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "nested"
                                        },
                                        "hierarchyKey": "root_hierarchy_key",
                                        "calculatedSizeValue": 1,
                                        "parent": null
                                    }
                                }
                            }
                        }
                    ]
                },
                {
                    "text": "EMEA OnPremise",
                    "value": 0,
                    "sizeValue": 49.53658536585366,
                    "colorValue": 2,
                    "recordId": "213",
                    "hasChildren": true,
                    "row": {
                        "headerId": "24",
                        "text": "",
                        "cellType": "ListRow",
                        "displayType": "line"
                    },
                    "column": {
                        "headerId": "sizeValue",
                        "text": "",
                        "cellType": "Empty",
                        "displayType": "nested"
                    },
                    "hierarchyKey": "[\"213\"]",
                    "expandCollapseId": "24_[\"213\"]",
                    "calculatedSizeValue": 0.1572875127222059,
                    "parent": {
                        "text": "Rest of World",
                        "value": 0.5135625510296652,
                        "sizeValue": 51,
                        "colorValue": 2,
                        "recordId": "208",
                        "hasChildren": true,
                        "row": {
                            "headerId": "24",
                            "text": "",
                            "cellType": "ListRow",
                            "displayType": "line"
                        },
                        "column": {
                            "headerId": "sizeValue",
                            "text": "",
                            "cellType": "Empty",
                            "displayType": "nested"
                        },
                        "hierarchyKey": "[\"208\"]",
                        "expandCollapseId": "24_[\"208\"]",
                        "calculatedSizeValue": 0.5135625510296652,
                        "parent": {
                            "text": "root_text",
                            "value": 1,
                            "sizeValue": 1,
                            "colorValue": 0,
                            "recordId": "root_record_id",
                            "hasChildren": true,
                            "row": {
                                "headerId": "",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "line"
                            },
                            "column": {
                                "headerId": "sizeValue",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "nested"
                            },
                            "hierarchyKey": "root_hierarchy_key",
                            "calculatedSizeValue": 1,
                            "parent": null
                        }
                    },
                    "children": [
                        {
                            "text": "Akeem Glass",
                            "value": 0.027925606936112703,
                            "sizeValue": 52.55882352941177,
                            "colorValue": 2,
                            "recordId": "214",
                            "hasChildren": true,
                            "row": {
                                "headerId": "24",
                                "text": "",
                                "cellType": "ListRow",
                                "displayType": "line"
                            },
                            "column": {
                                "headerId": "sizeValue",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "nested"
                            },
                            "hierarchyKey": "[\"214\"]",
                            "expandCollapseId": "24_[\"214\"]",
                            "calculatedSizeValue": 0.027925606936112703,
                            "parent": {
                                "text": "EMEA OnPremise",
                                "value": 0.1572875127222059,
                                "sizeValue": 49.53658536585366,
                                "colorValue": 2,
                                "recordId": "213",
                                "hasChildren": true,
                                "row": {
                                    "headerId": "24",
                                    "text": "",
                                    "cellType": "ListRow",
                                    "displayType": "line"
                                },
                                "column": {
                                    "headerId": "sizeValue",
                                    "text": "",
                                    "cellType": "Empty",
                                    "displayType": "nested"
                                },
                                "hierarchyKey": "[\"213\"]",
                                "expandCollapseId": "24_[\"213\"]",
                                "calculatedSizeValue": 0.1572875127222059,
                                "parent": {
                                    "text": "Rest of World",
                                    "value": 0.5135625510296652,
                                    "sizeValue": 51,
                                    "colorValue": 2,
                                    "recordId": "208",
                                    "hasChildren": true,
                                    "row": {
                                        "headerId": "24",
                                        "text": "",
                                        "cellType": "ListRow",
                                        "displayType": "line"
                                    },
                                    "column": {
                                        "headerId": "sizeValue",
                                        "text": "",
                                        "cellType": "Empty",
                                        "displayType": "nested"
                                    },
                                    "hierarchyKey": "[\"208\"]",
                                    "expandCollapseId": "24_[\"208\"]",
                                    "calculatedSizeValue": 0.5135625510296652,
                                    "parent": {
                                        "text": "root_text",
                                        "value": 1,
                                        "sizeValue": 1,
                                        "colorValue": 0,
                                        "recordId": "root_record_id",
                                        "hasChildren": true,
                                        "row": {
                                            "headerId": "",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "line"
                                        },
                                        "column": {
                                            "headerId": "sizeValue",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "nested"
                                        },
                                        "hierarchyKey": "root_hierarchy_key",
                                        "calculatedSizeValue": 1,
                                        "parent": null
                                    }
                                }
                            }
                        },
                        {
                            "text": "Bell Meyers",
                            "value": 0.0010626420098800583,
                            "sizeValue": 2,
                            "colorValue": 2,
                            "recordId": "215",
                            "hasChildren": true,
                            "row": {
                                "headerId": "24",
                                "text": "",
                                "cellType": "ListRow",
                                "displayType": "line"
                            },
                            "column": {
                                "headerId": "sizeValue",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "nested"
                            },
                            "hierarchyKey": "[\"215\"]",
                            "expandCollapseId": "24_[\"215\"]",
                            "calculatedSizeValue": 0.0010626420098800583,
                            "parent": {
                                "text": "EMEA OnPremise",
                                "value": 0.1572875127222059,
                                "sizeValue": 49.53658536585366,
                                "colorValue": 2,
                                "recordId": "213",
                                "hasChildren": true,
                                "row": {
                                    "headerId": "24",
                                    "text": "",
                                    "cellType": "ListRow",
                                    "displayType": "line"
                                },
                                "column": {
                                    "headerId": "sizeValue",
                                    "text": "",
                                    "cellType": "Empty",
                                    "displayType": "nested"
                                },
                                "hierarchyKey": "[\"213\"]",
                                "expandCollapseId": "24_[\"213\"]",
                                "calculatedSizeValue": 0.1572875127222059,
                                "parent": {
                                    "text": "Rest of World",
                                    "value": 0.5135625510296652,
                                    "sizeValue": 51,
                                    "colorValue": 2,
                                    "recordId": "208",
                                    "hasChildren": true,
                                    "row": {
                                        "headerId": "24",
                                        "text": "",
                                        "cellType": "ListRow",
                                        "displayType": "line"
                                    },
                                    "column": {
                                        "headerId": "sizeValue",
                                        "text": "",
                                        "cellType": "Empty",
                                        "displayType": "nested"
                                    },
                                    "hierarchyKey": "[\"208\"]",
                                    "expandCollapseId": "24_[\"208\"]",
                                    "calculatedSizeValue": 0.5135625510296652,
                                    "parent": {
                                        "text": "root_text",
                                        "value": 1,
                                        "sizeValue": 1,
                                        "colorValue": 0,
                                        "recordId": "root_record_id",
                                        "hasChildren": true,
                                        "row": {
                                            "headerId": "",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "line"
                                        },
                                        "column": {
                                            "headerId": "sizeValue",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "nested"
                                        },
                                        "hierarchyKey": "root_hierarchy_key",
                                        "calculatedSizeValue": 1,
                                        "parent": null
                                    }
                                }
                            }
                        },
                        {
                            "text": "Keiko Gomez",
                            "value": 0.02526726556825916,
                            "sizeValue": 47.55555555555556,
                            "colorValue": 2,
                            "recordId": "216",
                            "hasChildren": true,
                            "row": {
                                "headerId": "24",
                                "text": "",
                                "cellType": "ListRow",
                                "displayType": "line"
                            },
                            "column": {
                                "headerId": "sizeValue",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "nested"
                            },
                            "hierarchyKey": "[\"216\"]",
                            "expandCollapseId": "24_[\"216\"]",
                            "calculatedSizeValue": 0.02526726556825916,
                            "parent": {
                                "text": "EMEA OnPremise",
                                "value": 0.1572875127222059,
                                "sizeValue": 49.53658536585366,
                                "colorValue": 2,
                                "recordId": "213",
                                "hasChildren": true,
                                "row": {
                                    "headerId": "24",
                                    "text": "",
                                    "cellType": "ListRow",
                                    "displayType": "line"
                                },
                                "column": {
                                    "headerId": "sizeValue",
                                    "text": "",
                                    "cellType": "Empty",
                                    "displayType": "nested"
                                },
                                "hierarchyKey": "[\"213\"]",
                                "expandCollapseId": "24_[\"213\"]",
                                "calculatedSizeValue": 0.1572875127222059,
                                "parent": {
                                    "text": "Rest of World",
                                    "value": 0.5135625510296652,
                                    "sizeValue": 51,
                                    "colorValue": 2,
                                    "recordId": "208",
                                    "hasChildren": true,
                                    "row": {
                                        "headerId": "24",
                                        "text": "",
                                        "cellType": "ListRow",
                                        "displayType": "line"
                                    },
                                    "column": {
                                        "headerId": "sizeValue",
                                        "text": "",
                                        "cellType": "Empty",
                                        "displayType": "nested"
                                    },
                                    "hierarchyKey": "[\"208\"]",
                                    "expandCollapseId": "24_[\"208\"]",
                                    "calculatedSizeValue": 0.5135625510296652,
                                    "parent": {
                                        "text": "root_text",
                                        "value": 1,
                                        "sizeValue": 1,
                                        "colorValue": 0,
                                        "recordId": "root_record_id",
                                        "hasChildren": true,
                                        "row": {
                                            "headerId": "",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "line"
                                        },
                                        "column": {
                                            "headerId": "sizeValue",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "nested"
                                        },
                                        "hierarchyKey": "root_hierarchy_key",
                                        "calculatedSizeValue": 1,
                                        "parent": null
                                    }
                                }
                            }
                        },
                        {
                            "text": "Oren Whitfield",
                            "value": 0.027230201503176493,
                            "sizeValue": 51.25,
                            "colorValue": 2,
                            "recordId": "217",
                            "hasChildren": true,
                            "row": {
                                "headerId": "24",
                                "text": "",
                                "cellType": "ListRow",
                                "displayType": "line"
                            },
                            "column": {
                                "headerId": "sizeValue",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "nested"
                            },
                            "hierarchyKey": "[\"217\"]",
                            "expandCollapseId": "24_[\"217\"]",
                            "calculatedSizeValue": 0.027230201503176493,
                            "parent": {
                                "text": "EMEA OnPremise",
                                "value": 0.1572875127222059,
                                "sizeValue": 49.53658536585366,
                                "colorValue": 2,
                                "recordId": "213",
                                "hasChildren": true,
                                "row": {
                                    "headerId": "24",
                                    "text": "",
                                    "cellType": "ListRow",
                                    "displayType": "line"
                                },
                                "column": {
                                    "headerId": "sizeValue",
                                    "text": "",
                                    "cellType": "Empty",
                                    "displayType": "nested"
                                },
                                "hierarchyKey": "[\"213\"]",
                                "expandCollapseId": "24_[\"213\"]",
                                "calculatedSizeValue": 0.1572875127222059,
                                "parent": {
                                    "text": "Rest of World",
                                    "value": 0.5135625510296652,
                                    "sizeValue": 51,
                                    "colorValue": 2,
                                    "recordId": "208",
                                    "hasChildren": true,
                                    "row": {
                                        "headerId": "24",
                                        "text": "",
                                        "cellType": "ListRow",
                                        "displayType": "line"
                                    },
                                    "column": {
                                        "headerId": "sizeValue",
                                        "text": "",
                                        "cellType": "Empty",
                                        "displayType": "nested"
                                    },
                                    "hierarchyKey": "[\"208\"]",
                                    "expandCollapseId": "24_[\"208\"]",
                                    "calculatedSizeValue": 0.5135625510296652,
                                    "parent": {
                                        "text": "root_text",
                                        "value": 1,
                                        "sizeValue": 1,
                                        "colorValue": 0,
                                        "recordId": "root_record_id",
                                        "hasChildren": true,
                                        "row": {
                                            "headerId": "",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "line"
                                        },
                                        "column": {
                                            "headerId": "sizeValue",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "nested"
                                        },
                                        "hierarchyKey": "root_hierarchy_key",
                                        "calculatedSizeValue": 1,
                                        "parent": null
                                    }
                                }
                            }
                        },
                        {
                            "text": "Pandora Booker",
                            "value": 0.020013091186074427,
                            "sizeValue": 37.666666666666664,
                            "colorValue": 2,
                            "recordId": "218",
                            "hasChildren": true,
                            "row": {
                                "headerId": "24",
                                "text": "",
                                "cellType": "ListRow",
                                "displayType": "line"
                            },
                            "column": {
                                "headerId": "sizeValue",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "nested"
                            },
                            "hierarchyKey": "[\"218\"]",
                            "expandCollapseId": "24_[\"218\"]",
                            "calculatedSizeValue": 0.020013091186074427,
                            "parent": {
                                "text": "EMEA OnPremise",
                                "value": 0.1572875127222059,
                                "sizeValue": 49.53658536585366,
                                "colorValue": 2,
                                "recordId": "213",
                                "hasChildren": true,
                                "row": {
                                    "headerId": "24",
                                    "text": "",
                                    "cellType": "ListRow",
                                    "displayType": "line"
                                },
                                "column": {
                                    "headerId": "sizeValue",
                                    "text": "",
                                    "cellType": "Empty",
                                    "displayType": "nested"
                                },
                                "hierarchyKey": "[\"213\"]",
                                "expandCollapseId": "24_[\"213\"]",
                                "calculatedSizeValue": 0.1572875127222059,
                                "parent": {
                                    "text": "Rest of World",
                                    "value": 0.5135625510296652,
                                    "sizeValue": 51,
                                    "colorValue": 2,
                                    "recordId": "208",
                                    "hasChildren": true,
                                    "row": {
                                        "headerId": "24",
                                        "text": "",
                                        "cellType": "ListRow",
                                        "displayType": "line"
                                    },
                                    "column": {
                                        "headerId": "sizeValue",
                                        "text": "",
                                        "cellType": "Empty",
                                        "displayType": "nested"
                                    },
                                    "hierarchyKey": "[\"208\"]",
                                    "expandCollapseId": "24_[\"208\"]",
                                    "calculatedSizeValue": 0.5135625510296652,
                                    "parent": {
                                        "text": "root_text",
                                        "value": 1,
                                        "sizeValue": 1,
                                        "colorValue": 0,
                                        "recordId": "root_record_id",
                                        "hasChildren": true,
                                        "row": {
                                            "headerId": "",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "line"
                                        },
                                        "column": {
                                            "headerId": "sizeValue",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "nested"
                                        },
                                        "hierarchyKey": "root_hierarchy_key",
                                        "calculatedSizeValue": 1,
                                        "parent": null
                                    }
                                }
                            }
                        },
                        {
                            "text": "Sophia Sweeney",
                            "value": 0.03187926029640174,
                            "sizeValue": 60,
                            "colorValue": 2,
                            "recordId": "219",
                            "hasChildren": true,
                            "row": {
                                "headerId": "24",
                                "text": "",
                                "cellType": "ListRow",
                                "displayType": "line"
                            },
                            "column": {
                                "headerId": "sizeValue",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "nested"
                            },
                            "hierarchyKey": "[\"219\"]",
                            "expandCollapseId": "24_[\"219\"]",
                            "calculatedSizeValue": 0.03187926029640174,
                            "parent": {
                                "text": "EMEA OnPremise",
                                "value": 0.1572875127222059,
                                "sizeValue": 49.53658536585366,
                                "colorValue": 2,
                                "recordId": "213",
                                "hasChildren": true,
                                "row": {
                                    "headerId": "24",
                                    "text": "",
                                    "cellType": "ListRow",
                                    "displayType": "line"
                                },
                                "column": {
                                    "headerId": "sizeValue",
                                    "text": "",
                                    "cellType": "Empty",
                                    "displayType": "nested"
                                },
                                "hierarchyKey": "[\"213\"]",
                                "expandCollapseId": "24_[\"213\"]",
                                "calculatedSizeValue": 0.1572875127222059,
                                "parent": {
                                    "text": "Rest of World",
                                    "value": 0.5135625510296652,
                                    "sizeValue": 51,
                                    "colorValue": 2,
                                    "recordId": "208",
                                    "hasChildren": true,
                                    "row": {
                                        "headerId": "24",
                                        "text": "",
                                        "cellType": "ListRow",
                                        "displayType": "line"
                                    },
                                    "column": {
                                        "headerId": "sizeValue",
                                        "text": "",
                                        "cellType": "Empty",
                                        "displayType": "nested"
                                    },
                                    "hierarchyKey": "[\"208\"]",
                                    "expandCollapseId": "24_[\"208\"]",
                                    "calculatedSizeValue": 0.5135625510296652,
                                    "parent": {
                                        "text": "root_text",
                                        "value": 1,
                                        "sizeValue": 1,
                                        "colorValue": 0,
                                        "recordId": "root_record_id",
                                        "hasChildren": true,
                                        "row": {
                                            "headerId": "",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "line"
                                        },
                                        "column": {
                                            "headerId": "sizeValue",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "nested"
                                        },
                                        "hierarchyKey": "root_hierarchy_key",
                                        "calculatedSizeValue": 1,
                                        "parent": null
                                    }
                                }
                            }
                        },
                        {
                            "text": "Timon White",
                            "value": 0.023909445222301307,
                            "sizeValue": 45,
                            "colorValue": 2,
                            "recordId": "220",
                            "hasChildren": true,
                            "row": {
                                "headerId": "24",
                                "text": "",
                                "cellType": "ListRow",
                                "displayType": "line"
                            },
                            "column": {
                                "headerId": "sizeValue",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "nested"
                            },
                            "hierarchyKey": "[\"220\"]",
                            "expandCollapseId": "24_[\"220\"]",
                            "calculatedSizeValue": 0.023909445222301307,
                            "parent": {
                                "text": "EMEA OnPremise",
                                "value": 0.1572875127222059,
                                "sizeValue": 49.53658536585366,
                                "colorValue": 2,
                                "recordId": "213",
                                "hasChildren": true,
                                "row": {
                                    "headerId": "24",
                                    "text": "",
                                    "cellType": "ListRow",
                                    "displayType": "line"
                                },
                                "column": {
                                    "headerId": "sizeValue",
                                    "text": "",
                                    "cellType": "Empty",
                                    "displayType": "nested"
                                },
                                "hierarchyKey": "[\"213\"]",
                                "expandCollapseId": "24_[\"213\"]",
                                "calculatedSizeValue": 0.1572875127222059,
                                "parent": {
                                    "text": "Rest of World",
                                    "value": 0.5135625510296652,
                                    "sizeValue": 51,
                                    "colorValue": 2,
                                    "recordId": "208",
                                    "hasChildren": true,
                                    "row": {
                                        "headerId": "24",
                                        "text": "",
                                        "cellType": "ListRow",
                                        "displayType": "line"
                                    },
                                    "column": {
                                        "headerId": "sizeValue",
                                        "text": "",
                                        "cellType": "Empty",
                                        "displayType": "nested"
                                    },
                                    "hierarchyKey": "[\"208\"]",
                                    "expandCollapseId": "24_[\"208\"]",
                                    "calculatedSizeValue": 0.5135625510296652,
                                    "parent": {
                                        "text": "root_text",
                                        "value": 1,
                                        "sizeValue": 1,
                                        "colorValue": 0,
                                        "recordId": "root_record_id",
                                        "hasChildren": true,
                                        "row": {
                                            "headerId": "",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "line"
                                        },
                                        "column": {
                                            "headerId": "sizeValue",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "nested"
                                        },
                                        "hierarchyKey": "root_hierarchy_key",
                                        "calculatedSizeValue": 1,
                                        "parent": null
                                    }
                                }
                            }
                        }
                    ]
                },
                {
                    "text": "EMEA SaaS",
                    "value": 0,
                    "sizeValue": 61.61538461538461,
                    "colorValue": 2,
                    "recordId": "221",
                    "hasChildren": true,
                    "row": {
                        "headerId": "24",
                        "text": "",
                        "cellType": "ListRow",
                        "displayType": "line"
                    },
                    "column": {
                        "headerId": "sizeValue",
                        "text": "",
                        "cellType": "Empty",
                        "displayType": "nested"
                    },
                    "hierarchyKey": "[\"221\"]",
                    "expandCollapseId": "24_[\"221\"]",
                    "calculatedSizeValue": 0.1956398593080318,
                    "parent": {
                        "text": "Rest of World",
                        "value": 0.5135625510296652,
                        "sizeValue": 51,
                        "colorValue": 2,
                        "recordId": "208",
                        "hasChildren": true,
                        "row": {
                            "headerId": "24",
                            "text": "",
                            "cellType": "ListRow",
                            "displayType": "line"
                        },
                        "column": {
                            "headerId": "sizeValue",
                            "text": "",
                            "cellType": "Empty",
                            "displayType": "nested"
                        },
                        "hierarchyKey": "[\"208\"]",
                        "expandCollapseId": "24_[\"208\"]",
                        "calculatedSizeValue": 0.5135625510296652,
                        "parent": {
                            "text": "root_text",
                            "value": 1,
                            "sizeValue": 1,
                            "colorValue": 0,
                            "recordId": "root_record_id",
                            "hasChildren": true,
                            "row": {
                                "headerId": "",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "line"
                            },
                            "column": {
                                "headerId": "sizeValue",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "nested"
                            },
                            "hierarchyKey": "root_hierarchy_key",
                            "calculatedSizeValue": 1,
                            "parent": null
                        }
                    },
                    "children": [
                        {
                            "text": "Ciara Coffey",
                            "value": 0.02349004362546206,
                            "sizeValue": 49.6,
                            "colorValue": 2,
                            "recordId": "222",
                            "hasChildren": true,
                            "row": {
                                "headerId": "24",
                                "text": "",
                                "cellType": "ListRow",
                                "displayType": "line"
                            },
                            "column": {
                                "headerId": "sizeValue",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "nested"
                            },
                            "hierarchyKey": "[\"222\"]",
                            "expandCollapseId": "24_[\"222\"]",
                            "calculatedSizeValue": 0.02349004362546206,
                            "parent": {
                                "text": "EMEA SaaS",
                                "value": 0.1956398593080318,
                                "sizeValue": 61.61538461538461,
                                "colorValue": 2,
                                "recordId": "221",
                                "hasChildren": true,
                                "row": {
                                    "headerId": "24",
                                    "text": "",
                                    "cellType": "ListRow",
                                    "displayType": "line"
                                },
                                "column": {
                                    "headerId": "sizeValue",
                                    "text": "",
                                    "cellType": "Empty",
                                    "displayType": "nested"
                                },
                                "hierarchyKey": "[\"221\"]",
                                "expandCollapseId": "24_[\"221\"]",
                                "calculatedSizeValue": 0.1956398593080318,
                                "parent": {
                                    "text": "Rest of World",
                                    "value": 0.5135625510296652,
                                    "sizeValue": 51,
                                    "colorValue": 2,
                                    "recordId": "208",
                                    "hasChildren": true,
                                    "row": {
                                        "headerId": "24",
                                        "text": "",
                                        "cellType": "ListRow",
                                        "displayType": "line"
                                    },
                                    "column": {
                                        "headerId": "sizeValue",
                                        "text": "",
                                        "cellType": "Empty",
                                        "displayType": "nested"
                                    },
                                    "hierarchyKey": "[\"208\"]",
                                    "expandCollapseId": "24_[\"208\"]",
                                    "calculatedSizeValue": 0.5135625510296652,
                                    "parent": {
                                        "text": "root_text",
                                        "value": 1,
                                        "sizeValue": 1,
                                        "colorValue": 0,
                                        "recordId": "root_record_id",
                                        "hasChildren": true,
                                        "row": {
                                            "headerId": "",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "line"
                                        },
                                        "column": {
                                            "headerId": "sizeValue",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "nested"
                                        },
                                        "hierarchyKey": "root_hierarchy_key",
                                        "calculatedSizeValue": 1,
                                        "parent": null
                                    }
                                }
                            }
                        },
                        {
                            "text": "Colt Ayers",
                            "value": 0.03836075672706506,
                            "sizeValue": 81,
                            "colorValue": 2,
                            "recordId": "223",
                            "hasChildren": true,
                            "row": {
                                "headerId": "24",
                                "text": "",
                                "cellType": "ListRow",
                                "displayType": "line"
                            },
                            "column": {
                                "headerId": "sizeValue",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "nested"
                            },
                            "hierarchyKey": "[\"223\"]",
                            "expandCollapseId": "24_[\"223\"]",
                            "calculatedSizeValue": 0.03836075672706506,
                            "parent": {
                                "text": "EMEA SaaS",
                                "value": 0.1956398593080318,
                                "sizeValue": 61.61538461538461,
                                "colorValue": 2,
                                "recordId": "221",
                                "hasChildren": true,
                                "row": {
                                    "headerId": "24",
                                    "text": "",
                                    "cellType": "ListRow",
                                    "displayType": "line"
                                },
                                "column": {
                                    "headerId": "sizeValue",
                                    "text": "",
                                    "cellType": "Empty",
                                    "displayType": "nested"
                                },
                                "hierarchyKey": "[\"221\"]",
                                "expandCollapseId": "24_[\"221\"]",
                                "calculatedSizeValue": 0.1956398593080318,
                                "parent": {
                                    "text": "Rest of World",
                                    "value": 0.5135625510296652,
                                    "sizeValue": 51,
                                    "colorValue": 2,
                                    "recordId": "208",
                                    "hasChildren": true,
                                    "row": {
                                        "headerId": "24",
                                        "text": "",
                                        "cellType": "ListRow",
                                        "displayType": "line"
                                    },
                                    "column": {
                                        "headerId": "sizeValue",
                                        "text": "",
                                        "cellType": "Empty",
                                        "displayType": "nested"
                                    },
                                    "hierarchyKey": "[\"208\"]",
                                    "expandCollapseId": "24_[\"208\"]",
                                    "calculatedSizeValue": 0.5135625510296652,
                                    "parent": {
                                        "text": "root_text",
                                        "value": 1,
                                        "sizeValue": 1,
                                        "colorValue": 0,
                                        "recordId": "root_record_id",
                                        "hasChildren": true,
                                        "row": {
                                            "headerId": "",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "line"
                                        },
                                        "column": {
                                            "headerId": "sizeValue",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "nested"
                                        },
                                        "hierarchyKey": "root_hierarchy_key",
                                        "calculatedSizeValue": 1,
                                        "parent": null
                                    }
                                }
                            }
                        },
                        {
                            "text": "Heidi Sandoval",
                            "value": 0.025337043023431857,
                            "sizeValue": 53.5,
                            "colorValue": 2,
                            "recordId": "224",
                            "hasChildren": true,
                            "row": {
                                "headerId": "24",
                                "text": "",
                                "cellType": "ListRow",
                                "displayType": "line"
                            },
                            "column": {
                                "headerId": "sizeValue",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "nested"
                            },
                            "hierarchyKey": "[\"224\"]",
                            "expandCollapseId": "24_[\"224\"]",
                            "calculatedSizeValue": 0.025337043023431857,
                            "parent": {
                                "text": "EMEA SaaS",
                                "value": 0.1956398593080318,
                                "sizeValue": 61.61538461538461,
                                "colorValue": 2,
                                "recordId": "221",
                                "hasChildren": true,
                                "row": {
                                    "headerId": "24",
                                    "text": "",
                                    "cellType": "ListRow",
                                    "displayType": "line"
                                },
                                "column": {
                                    "headerId": "sizeValue",
                                    "text": "",
                                    "cellType": "Empty",
                                    "displayType": "nested"
                                },
                                "hierarchyKey": "[\"221\"]",
                                "expandCollapseId": "24_[\"221\"]",
                                "calculatedSizeValue": 0.1956398593080318,
                                "parent": {
                                    "text": "Rest of World",
                                    "value": 0.5135625510296652,
                                    "sizeValue": 51,
                                    "colorValue": 2,
                                    "recordId": "208",
                                    "hasChildren": true,
                                    "row": {
                                        "headerId": "24",
                                        "text": "",
                                        "cellType": "ListRow",
                                        "displayType": "line"
                                    },
                                    "column": {
                                        "headerId": "sizeValue",
                                        "text": "",
                                        "cellType": "Empty",
                                        "displayType": "nested"
                                    },
                                    "hierarchyKey": "[\"208\"]",
                                    "expandCollapseId": "24_[\"208\"]",
                                    "calculatedSizeValue": 0.5135625510296652,
                                    "parent": {
                                        "text": "root_text",
                                        "value": 1,
                                        "sizeValue": 1,
                                        "colorValue": 0,
                                        "recordId": "root_record_id",
                                        "hasChildren": true,
                                        "row": {
                                            "headerId": "",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "line"
                                        },
                                        "column": {
                                            "headerId": "sizeValue",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "nested"
                                        },
                                        "hierarchyKey": "root_hierarchy_key",
                                        "calculatedSizeValue": 1,
                                        "parent": null
                                    }
                                }
                            }
                        },
                        {
                            "text": "Omar Barker",
                            "value": 0.04167588385162623,
                            "sizeValue": 88,
                            "colorValue": 2,
                            "recordId": "225",
                            "hasChildren": true,
                            "row": {
                                "headerId": "24",
                                "text": "",
                                "cellType": "ListRow",
                                "displayType": "line"
                            },
                            "column": {
                                "headerId": "sizeValue",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "nested"
                            },
                            "hierarchyKey": "[\"225\"]",
                            "expandCollapseId": "24_[\"225\"]",
                            "calculatedSizeValue": 0.04167588385162623,
                            "parent": {
                                "text": "EMEA SaaS",
                                "value": 0.1956398593080318,
                                "sizeValue": 61.61538461538461,
                                "colorValue": 2,
                                "recordId": "221",
                                "hasChildren": true,
                                "row": {
                                    "headerId": "24",
                                    "text": "",
                                    "cellType": "ListRow",
                                    "displayType": "line"
                                },
                                "column": {
                                    "headerId": "sizeValue",
                                    "text": "",
                                    "cellType": "Empty",
                                    "displayType": "nested"
                                },
                                "hierarchyKey": "[\"221\"]",
                                "expandCollapseId": "24_[\"221\"]",
                                "calculatedSizeValue": 0.1956398593080318,
                                "parent": {
                                    "text": "Rest of World",
                                    "value": 0.5135625510296652,
                                    "sizeValue": 51,
                                    "colorValue": 2,
                                    "recordId": "208",
                                    "hasChildren": true,
                                    "row": {
                                        "headerId": "24",
                                        "text": "",
                                        "cellType": "ListRow",
                                        "displayType": "line"
                                    },
                                    "column": {
                                        "headerId": "sizeValue",
                                        "text": "",
                                        "cellType": "Empty",
                                        "displayType": "nested"
                                    },
                                    "hierarchyKey": "[\"208\"]",
                                    "expandCollapseId": "24_[\"208\"]",
                                    "calculatedSizeValue": 0.5135625510296652,
                                    "parent": {
                                        "text": "root_text",
                                        "value": 1,
                                        "sizeValue": 1,
                                        "colorValue": 0,
                                        "recordId": "root_record_id",
                                        "hasChildren": true,
                                        "row": {
                                            "headerId": "",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "line"
                                        },
                                        "column": {
                                            "headerId": "sizeValue",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "nested"
                                        },
                                        "hierarchyKey": "root_hierarchy_key",
                                        "calculatedSizeValue": 1,
                                        "parent": null
                                    }
                                }
                            }
                        },
                        {
                            "text": "Solomon Moody",
                            "value": 0.03220409206716573,
                            "sizeValue": 68,
                            "colorValue": 2,
                            "recordId": "226",
                            "hasChildren": true,
                            "row": {
                                "headerId": "24",
                                "text": "",
                                "cellType": "ListRow",
                                "displayType": "line"
                            },
                            "column": {
                                "headerId": "sizeValue",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "nested"
                            },
                            "hierarchyKey": "[\"226\"]",
                            "expandCollapseId": "24_[\"226\"]",
                            "calculatedSizeValue": 0.03220409206716573,
                            "parent": {
                                "text": "EMEA SaaS",
                                "value": 0.1956398593080318,
                                "sizeValue": 61.61538461538461,
                                "colorValue": 2,
                                "recordId": "221",
                                "hasChildren": true,
                                "row": {
                                    "headerId": "24",
                                    "text": "",
                                    "cellType": "ListRow",
                                    "displayType": "line"
                                },
                                "column": {
                                    "headerId": "sizeValue",
                                    "text": "",
                                    "cellType": "Empty",
                                    "displayType": "nested"
                                },
                                "hierarchyKey": "[\"221\"]",
                                "expandCollapseId": "24_[\"221\"]",
                                "calculatedSizeValue": 0.1956398593080318,
                                "parent": {
                                    "text": "Rest of World",
                                    "value": 0.5135625510296652,
                                    "sizeValue": 51,
                                    "colorValue": 2,
                                    "recordId": "208",
                                    "hasChildren": true,
                                    "row": {
                                        "headerId": "24",
                                        "text": "",
                                        "cellType": "ListRow",
                                        "displayType": "line"
                                    },
                                    "column": {
                                        "headerId": "sizeValue",
                                        "text": "",
                                        "cellType": "Empty",
                                        "displayType": "nested"
                                    },
                                    "hierarchyKey": "[\"208\"]",
                                    "expandCollapseId": "24_[\"208\"]",
                                    "calculatedSizeValue": 0.5135625510296652,
                                    "parent": {
                                        "text": "root_text",
                                        "value": 1,
                                        "sizeValue": 1,
                                        "colorValue": 0,
                                        "recordId": "root_record_id",
                                        "hasChildren": true,
                                        "row": {
                                            "headerId": "",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "line"
                                        },
                                        "column": {
                                            "headerId": "sizeValue",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "nested"
                                        },
                                        "hierarchyKey": "root_hierarchy_key",
                                        "calculatedSizeValue": 1,
                                        "parent": null
                                    }
                                }
                            }
                        },
                        {
                            "text": "Travis Snow",
                            "value": 0.03457204001328085,
                            "sizeValue": 73,
                            "colorValue": 2,
                            "recordId": "227",
                            "hasChildren": true,
                            "row": {
                                "headerId": "24",
                                "text": "",
                                "cellType": "ListRow",
                                "displayType": "line"
                            },
                            "column": {
                                "headerId": "sizeValue",
                                "text": "",
                                "cellType": "Empty",
                                "displayType": "nested"
                            },
                            "hierarchyKey": "[\"227\"]",
                            "expandCollapseId": "24_[\"227\"]",
                            "calculatedSizeValue": 0.03457204001328085,
                            "parent": {
                                "text": "EMEA SaaS",
                                "value": 0.1956398593080318,
                                "sizeValue": 61.61538461538461,
                                "colorValue": 2,
                                "recordId": "221",
                                "hasChildren": true,
                                "row": {
                                    "headerId": "24",
                                    "text": "",
                                    "cellType": "ListRow",
                                    "displayType": "line"
                                },
                                "column": {
                                    "headerId": "sizeValue",
                                    "text": "",
                                    "cellType": "Empty",
                                    "displayType": "nested"
                                },
                                "hierarchyKey": "[\"221\"]",
                                "expandCollapseId": "24_[\"221\"]",
                                "calculatedSizeValue": 0.1956398593080318,
                                "parent": {
                                    "text": "Rest of World",
                                    "value": 0.5135625510296652,
                                    "sizeValue": 51,
                                    "colorValue": 2,
                                    "recordId": "208",
                                    "hasChildren": true,
                                    "row": {
                                        "headerId": "24",
                                        "text": "",
                                        "cellType": "ListRow",
                                        "displayType": "line"
                                    },
                                    "column": {
                                        "headerId": "sizeValue",
                                        "text": "",
                                        "cellType": "Empty",
                                        "displayType": "nested"
                                    },
                                    "hierarchyKey": "[\"208\"]",
                                    "expandCollapseId": "24_[\"208\"]",
                                    "calculatedSizeValue": 0.5135625510296652,
                                    "parent": {
                                        "text": "root_text",
                                        "value": 1,
                                        "sizeValue": 1,
                                        "colorValue": 0,
                                        "recordId": "root_record_id",
                                        "hasChildren": true,
                                        "row": {
                                            "headerId": "",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "line"
                                        },
                                        "column": {
                                            "headerId": "sizeValue",
                                            "text": "",
                                            "cellType": "Empty",
                                            "displayType": "nested"
                                        },
                                        "hierarchyKey": "root_hierarchy_key",
                                        "calculatedSizeValue": 1,
                                        "parent": null
                                    }
                                }
                            }
                        }
                    ]
                }
            ]
        }
    ]
}

const data = {
    "values": [
        [
            {
                "listLabel": "Aenean Incorporated",
                "isLeaf": true,
                "recordId": "80",
                "parentRecordId": "207"
            },
            {
                "sizeValue": 20.5
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Blandit At Nisi LLC",
                "isLeaf": true,
                "recordId": "70",
                "parentRecordId": "204"
            },
            {
                "sizeValue": 83
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Donald Clinton",
                "isLeaf": false,
                "recordId": "203",
                "parentRecordId": "202"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Dui Inc",
                "isLeaf": true,
                "recordId": "71",
                "parentRecordId": "204"
            },
            {
                "sizeValue": 47
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Eagles Inc",
                "isLeaf": true,
                "recordId": "81",
                "parentRecordId": "207"
            },
            {
                "sizeValue": 44
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Ella Carroll",
                "isLeaf": false,
                "recordId": "204",
                "parentRecordId": "202"
            },
            {
                "sizeValue": 39.5
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Et Malesuada Company",
                "isLeaf": true,
                "recordId": "75",
                "parentRecordId": "206"
            },
            {
                "sizeValue": 35
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Ligula Eu Ltd",
                "isLeaf": true,
                "recordId": "76",
                "parentRecordId": "206"
            },
            {
                "sizeValue": 57
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Mauris Magna Duis LLP",
                "isLeaf": true,
                "recordId": "77",
                "parentRecordId": "206"
            },
            {
                "sizeValue": 5
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Neque Sed Eget Inc.",
                "isLeaf": true,
                "recordId": "72",
                "parentRecordId": "204"
            },
            {
                "sizeValue": 36.5
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Nulla Inc",
                "isLeaf": true,
                "recordId": "69",
                "parentRecordId": "203"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Oscar Soto",
                "isLeaf": false,
                "recordId": "205",
                "parentRecordId": "202"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Pede Ltd",
                "isLeaf": true,
                "recordId": "74",
                "parentRecordId": "205"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Rigel Buckley",
                "isLeaf": false,
                "recordId": "206",
                "parentRecordId": "202"
            },
            {
                "sizeValue": 46.333333333333336
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Sed Inc",
                "isLeaf": true,
                "recordId": "78",
                "parentRecordId": "206"
            },
            {
                "sizeValue": 43.666666666666664
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Ut Consulting",
                "isLeaf": true,
                "recordId": "73",
                "parentRecordId": "204"
            },
            {
                "sizeValue": 34.8
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Ut Inc",
                "isLeaf": true,
                "recordId": "79",
                "parentRecordId": "206"
            },
            {
                "sizeValue": 86
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Zeph Mosley",
                "isLeaf": false,
                "recordId": "207",
                "parentRecordId": "202"
            },
            {
                "sizeValue": 36.714285714285715
            },
            {
                "colorValue": 2
            }
        ]
    ],
    "cols": [
        {
            "headerId": "sizeValue",
            "text": "",
            "cellType": "Empty",
            "displayType": "nested",
            "values": {
                "sizeValue": {
                    "text": "q7",
                    "valueType": "real"
                }
            },
            "valueIndex": 1,
            "sortingIndex": 0
        },
        {
            "headerId": "colorValue",
            "text": "",
            "cellType": "Empty",
            "displayType": "nested",
            "values": {
                "colorValue": {
                    "valueType": "int"
                }
            },
            "valueIndex": 2,
            "sortingIndex": 0
        }
    ],
    "rows": [
        {
            "headerId": "24",
            "text": "Donald Clinton",
            "hasChildren": true,
            "value": "Donald Clinton",
            "cellType": "ListRow",
            "displayType": "line",
            "key": [
                {
                    "variable": "id",
                    "type": "text",
                    "value": "203"
                }
            ],
            "hierarchyKey": "[\"203\"]",
            "expandCollapseId": "24_[\"203\"]",
            "valueIndex": 2,
            "headerLabelKey": "24",
            "subHeaders": [
                {
                    "headerId": "24",
                    "text": "Nulla Inc",
                    "hasChildren": false,
                    "value": "Nulla Inc",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "69"
                        }
                    ],
                    "hierarchyKey": "[\"69\"]",
                    "expandCollapseId": "24_[\"69\"]",
                    "valueIndex": 10,
                    "headerLabelKey": "24"
                }
            ]
        },
        {
            "headerId": "24",
            "text": "Ella Carroll",
            "hasChildren": true,
            "value": "Ella Carroll",
            "cellType": "ListRow",
            "displayType": "line",
            "key": [
                {
                    "variable": "id",
                    "type": "text",
                    "value": "204"
                }
            ],
            "hierarchyKey": "[\"204\"]",
            "expandCollapseId": "24_[\"204\"]",
            "valueIndex": 5,
            "headerLabelKey": "24",
            "subHeaders": [
                {
                    "headerId": "24",
                    "text": "Blandit At Nisi LLC",
                    "hasChildren": false,
                    "value": "Blandit At Nisi LLC",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "70"
                        }
                    ],
                    "hierarchyKey": "[\"70\"]",
                    "expandCollapseId": "24_[\"70\"]",
                    "valueIndex": 1,
                    "headerLabelKey": "24"
                },
                {
                    "headerId": "24",
                    "text": "Dui Inc",
                    "hasChildren": false,
                    "value": "Dui Inc",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "71"
                        }
                    ],
                    "hierarchyKey": "[\"71\"]",
                    "expandCollapseId": "24_[\"71\"]",
                    "valueIndex": 3,
                    "headerLabelKey": "24"
                },
                {
                    "headerId": "24",
                    "text": "Neque Sed Eget Inc.",
                    "hasChildren": false,
                    "value": "Neque Sed Eget Inc.",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "72"
                        }
                    ],
                    "hierarchyKey": "[\"72\"]",
                    "expandCollapseId": "24_[\"72\"]",
                    "valueIndex": 9,
                    "headerLabelKey": "24"
                },
                {
                    "headerId": "24",
                    "text": "Ut Consulting",
                    "hasChildren": false,
                    "value": "Ut Consulting",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "73"
                        }
                    ],
                    "hierarchyKey": "[\"73\"]",
                    "expandCollapseId": "24_[\"73\"]",
                    "valueIndex": 15,
                    "headerLabelKey": "24"
                }
            ]
        },
        {
            "headerId": "24",
            "text": "Oscar Soto",
            "hasChildren": true,
            "value": "Oscar Soto",
            "cellType": "ListRow",
            "displayType": "line",
            "key": [
                {
                    "variable": "id",
                    "type": "text",
                    "value": "205"
                }
            ],
            "hierarchyKey": "[\"205\"]",
            "expandCollapseId": "24_[\"205\"]",
            "valueIndex": 11,
            "headerLabelKey": "24",
            "subHeaders": [
                {
                    "headerId": "24",
                    "text": "Pede Ltd",
                    "hasChildren": false,
                    "value": "Pede Ltd",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "74"
                        }
                    ],
                    "hierarchyKey": "[\"74\"]",
                    "expandCollapseId": "24_[\"74\"]",
                    "valueIndex": 12,
                    "headerLabelKey": "24"
                }
            ]
        },
        {
            "headerId": "24",
            "text": "Rigel Buckley",
            "hasChildren": true,
            "value": "Rigel Buckley",
            "cellType": "ListRow",
            "displayType": "line",
            "key": [
                {
                    "variable": "id",
                    "type": "text",
                    "value": "206"
                }
            ],
            "hierarchyKey": "[\"206\"]",
            "expandCollapseId": "24_[\"206\"]",
            "valueIndex": 13,
            "headerLabelKey": "24",
            "subHeaders": [
                {
                    "headerId": "24",
                    "text": "Et Malesuada Company",
                    "hasChildren": false,
                    "value": "Et Malesuada Company",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "75"
                        }
                    ],
                    "hierarchyKey": "[\"75\"]",
                    "expandCollapseId": "24_[\"75\"]",
                    "valueIndex": 6,
                    "headerLabelKey": "24"
                },
                {
                    "headerId": "24",
                    "text": "Ligula Eu Ltd",
                    "hasChildren": false,
                    "value": "Ligula Eu Ltd",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "76"
                        }
                    ],
                    "hierarchyKey": "[\"76\"]",
                    "expandCollapseId": "24_[\"76\"]",
                    "valueIndex": 7,
                    "headerLabelKey": "24"
                },
                {
                    "headerId": "24",
                    "text": "Mauris Magna Duis LLP",
                    "hasChildren": false,
                    "value": "Mauris Magna Duis LLP",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "77"
                        }
                    ],
                    "hierarchyKey": "[\"77\"]",
                    "expandCollapseId": "24_[\"77\"]",
                    "valueIndex": 8,
                    "headerLabelKey": "24"
                },
                {
                    "headerId": "24",
                    "text": "Sed Inc",
                    "hasChildren": false,
                    "value": "Sed Inc",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "78"
                        }
                    ],
                    "hierarchyKey": "[\"78\"]",
                    "expandCollapseId": "24_[\"78\"]",
                    "valueIndex": 14,
                    "headerLabelKey": "24"
                },
                {
                    "headerId": "24",
                    "text": "Ut Inc",
                    "hasChildren": false,
                    "value": "Ut Inc",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "79"
                        }
                    ],
                    "hierarchyKey": "[\"79\"]",
                    "expandCollapseId": "24_[\"79\"]",
                    "valueIndex": 16,
                    "headerLabelKey": "24"
                }
            ]
        },
        {
            "headerId": "24",
            "text": "Zeph Mosley",
            "hasChildren": true,
            "value": "Zeph Mosley",
            "cellType": "ListRow",
            "displayType": "line",
            "key": [
                {
                    "variable": "id",
                    "type": "text",
                    "value": "207"
                }
            ],
            "hierarchyKey": "[\"207\"]",
            "expandCollapseId": "24_[\"207\"]",
            "valueIndex": 17,
            "headerLabelKey": "24",
            "subHeaders": [
                {
                    "headerId": "24",
                    "text": "Aenean Incorporated",
                    "hasChildren": false,
                    "value": "Aenean Incorporated",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "80"
                        }
                    ],
                    "hierarchyKey": "[\"80\"]",
                    "expandCollapseId": "24_[\"80\"]",
                    "valueIndex": 0,
                    "headerLabelKey": "24"
                },
                {
                    "headerId": "24",
                    "text": "Eagles Inc",
                    "hasChildren": false,
                    "value": "Eagles Inc",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "81"
                        }
                    ],
                    "hierarchyKey": "[\"81\"]",
                    "expandCollapseId": "24_[\"81\"]",
                    "valueIndex": 4,
                    "headerLabelKey": "24"
                }
            ]
        }
    ],
    "navigateFilterDictionary": {},
    "headerLabelDictionary": {
        "24": "Self-Ref Hierarchy"
    },
    "headerCellDictionary": {
        "24": {
            "__serviceColumn__": "__hierarchyFields__24__",
            "sizeValue": "sizeValue",
            "colorValue": "colorValue"
        }
    },
    "expandedKeys": {
        "24": {
            "[\"203\"]": {
                "isExpanded": true
            },
            "[\"204\"]": {
                "isExpanded": true
            },
            "[\"205\"]": {
                "isExpanded": true
            },
            "[\"206\"]": {
                "isExpanded": true
            },
            "[\"207\"]": {
                "isExpanded": true
            }
        }
    },
    "chartCellRangeDictionary": {},
    "chartCellRangeInfo": {}
}

const expandedNode = {
    "text": "US West SaaS",
    "value": 0,
    "sizeValue": 41.11538461538461,
    "colorValue": 2,
    "recordId": "202",
    "hasChildren": true,
    "row": {
        "headerId": "24",
        "text": "",
        "cellType": "ListRow",
        "displayType": "line"
    },
    "column": {
        "headerId": "sizeValue",
        "text": "",
        "cellType": "Empty",
        "displayType": "nested"
    },
    "hierarchyKey": "[\"202\"]",
    "expandCollapseId": "24_[\"202\"]",
    "calculatedSizeValue": 0.10226812476106303,
    "parent": {
        "text": "North America",
        "value": 0.4864374489703347,
        "sizeValue": 48.306306306306304,
        "colorValue": 2,
        "recordId": "183",
        "hasChildren": true,
        "row": {
            "headerId": "24",
            "text": "",
            "cellType": "ListRow",
            "displayType": "line"
        },
        "column": {
            "headerId": "sizeValue",
            "text": "",
            "cellType": "Empty",
            "displayType": "nested"
        },
        "hierarchyKey": "[\"183\"]",
        "expandCollapseId": "24_[\"183\"]",
        "calculatedSizeValue": 0.4864374489703347,
        "parent": {
            "text": "root_text",
            "value": 1,
            "sizeValue": 1,
            "colorValue": 0,
            "recordId": "root_record_id",
            "hasChildren": true,
            "row": {
                "headerId": "",
                "text": "",
                "cellType": "Empty",
                "displayType": "line"
            },
            "column": {
                "headerId": "sizeValue",
                "text": "",
                "cellType": "Empty",
                "displayType": "nested"
            },
            "hierarchyKey": "root_hierarchy_key",
            "calculatedSizeValue": 1,
            "parent": null
        }
    },
    "children": [
        {
            "text": "Ella Carroll",
            "value": 0.032963438697999524,
            "sizeValue": 39.5,
            "colorValue": 2,
            "recordId": "204",
            "hasChildren": true,
            "row": {
                "headerId": "24",
                "text": "",
                "cellType": "ListRow",
                "displayType": "line"
            },
            "column": {
                "headerId": "sizeValue",
                "text": "",
                "cellType": "Empty",
                "displayType": "nested"
            },
            "hierarchyKey": "[\"204\"]",
            "expandCollapseId": "24_[\"204\"]",
            "calculatedSizeValue": 0.032963438697999524,
            "parent": {
                "text": "US West SaaS",
                "value": 0.10226812476106303,
                "sizeValue": 41.11538461538461,
                "colorValue": 2,
                "recordId": "202",
                "hasChildren": true,
                "row": {
                    "headerId": "24",
                    "text": "",
                    "cellType": "ListRow",
                    "displayType": "line"
                },
                "column": {
                    "headerId": "sizeValue",
                    "text": "",
                    "cellType": "Empty",
                    "displayType": "nested"
                },
                "hierarchyKey": "[\"202\"]",
                "expandCollapseId": "24_[\"202\"]",
                "calculatedSizeValue": 0.10226812476106303,
                "parent": {
                    "text": "North America",
                    "value": 0.4864374489703347,
                    "sizeValue": 48.306306306306304,
                    "colorValue": 2,
                    "recordId": "183",
                    "hasChildren": true,
                    "row": {
                        "headerId": "24",
                        "text": "",
                        "cellType": "ListRow",
                        "displayType": "line"
                    },
                    "column": {
                        "headerId": "sizeValue",
                        "text": "",
                        "cellType": "Empty",
                        "displayType": "nested"
                    },
                    "hierarchyKey": "[\"183\"]",
                    "expandCollapseId": "24_[\"183\"]",
                    "calculatedSizeValue": 0.4864374489703347,
                    "parent": {
                        "text": "root_text",
                        "value": 1,
                        "sizeValue": 1,
                        "colorValue": 0,
                        "recordId": "root_record_id",
                        "hasChildren": true,
                        "row": {
                            "headerId": "",
                            "text": "",
                            "cellType": "Empty",
                            "displayType": "line"
                        },
                        "column": {
                            "headerId": "sizeValue",
                            "text": "",
                            "cellType": "Empty",
                            "displayType": "nested"
                        },
                        "hierarchyKey": "root_hierarchy_key",
                        "calculatedSizeValue": 1,
                        "parent": null
                    }
                }
            }
        },
        {
            "text": "Rigel Buckley",
            "value": 0.03866597450651421,
            "sizeValue": 46.333333333333336,
            "colorValue": 2,
            "recordId": "206",
            "hasChildren": true,
            "row": {
                "headerId": "24",
                "text": "",
                "cellType": "ListRow",
                "displayType": "line"
            },
            "column": {
                "headerId": "sizeValue",
                "text": "",
                "cellType": "Empty",
                "displayType": "nested"
            },
            "hierarchyKey": "[\"206\"]",
            "expandCollapseId": "24_[\"206\"]",
            "calculatedSizeValue": 0.03866597450651421,
            "parent": {
                "text": "US West SaaS",
                "value": 0.10226812476106303,
                "sizeValue": 41.11538461538461,
                "colorValue": 2,
                "recordId": "202",
                "hasChildren": true,
                "row": {
                    "headerId": "24",
                    "text": "",
                    "cellType": "ListRow",
                    "displayType": "line"
                },
                "column": {
                    "headerId": "sizeValue",
                    "text": "",
                    "cellType": "Empty",
                    "displayType": "nested"
                },
                "hierarchyKey": "[\"202\"]",
                "expandCollapseId": "24_[\"202\"]",
                "calculatedSizeValue": 0.10226812476106303,
                "parent": {
                    "text": "North America",
                    "value": 0.4864374489703347,
                    "sizeValue": 48.306306306306304,
                    "colorValue": 2,
                    "recordId": "183",
                    "hasChildren": true,
                    "row": {
                        "headerId": "24",
                        "text": "",
                        "cellType": "ListRow",
                        "displayType": "line"
                    },
                    "column": {
                        "headerId": "sizeValue",
                        "text": "",
                        "cellType": "Empty",
                        "displayType": "nested"
                    },
                    "hierarchyKey": "[\"183\"]",
                    "expandCollapseId": "24_[\"183\"]",
                    "calculatedSizeValue": 0.4864374489703347,
                    "parent": {
                        "text": "root_text",
                        "value": 1,
                        "sizeValue": 1,
                        "colorValue": 0,
                        "recordId": "root_record_id",
                        "hasChildren": true,
                        "row": {
                            "headerId": "",
                            "text": "",
                            "cellType": "Empty",
                            "displayType": "line"
                        },
                        "column": {
                            "headerId": "sizeValue",
                            "text": "",
                            "cellType": "Empty",
                            "displayType": "nested"
                        },
                        "hierarchyKey": "root_hierarchy_key",
                        "calculatedSizeValue": 1,
                        "parent": null
                    }
                }
            }
        },
        {
            "text": "Zeph Mosley",
            "value": 0.030638711556549285,
            "sizeValue": 36.714285714285715,
            "colorValue": 2,
            "recordId": "207",
            "hasChildren": true,
            "row": {
                "headerId": "24",
                "text": "",
                "cellType": "ListRow",
                "displayType": "line"
            },
            "column": {
                "headerId": "sizeValue",
                "text": "",
                "cellType": "Empty",
                "displayType": "nested"
            },
            "hierarchyKey": "[\"207\"]",
            "expandCollapseId": "24_[\"207\"]",
            "calculatedSizeValue": 0.030638711556549285,
            "parent": {
                "text": "US West SaaS",
                "value": 0.10226812476106303,
                "sizeValue": 41.11538461538461,
                "colorValue": 2,
                "recordId": "202",
                "hasChildren": true,
                "row": {
                    "headerId": "24",
                    "text": "",
                    "cellType": "ListRow",
                    "displayType": "line"
                },
                "column": {
                    "headerId": "sizeValue",
                    "text": "",
                    "cellType": "Empty",
                    "displayType": "nested"
                },
                "hierarchyKey": "[\"202\"]",
                "expandCollapseId": "24_[\"202\"]",
                "calculatedSizeValue": 0.10226812476106303,
                "parent": {
                    "text": "North America",
                    "value": 0.4864374489703347,
                    "sizeValue": 48.306306306306304,
                    "colorValue": 2,
                    "recordId": "183",
                    "hasChildren": true,
                    "row": {
                        "headerId": "24",
                        "text": "",
                        "cellType": "ListRow",
                        "displayType": "line"
                    },
                    "column": {
                        "headerId": "sizeValue",
                        "text": "",
                        "cellType": "Empty",
                        "displayType": "nested"
                    },
                    "hierarchyKey": "[\"183\"]",
                    "expandCollapseId": "24_[\"183\"]",
                    "calculatedSizeValue": 0.4864374489703347,
                    "parent": {
                        "text": "root_text",
                        "value": 1,
                        "sizeValue": 1,
                        "colorValue": 0,
                        "recordId": "root_record_id",
                        "hasChildren": true,
                        "row": {
                            "headerId": "",
                            "text": "",
                            "cellType": "Empty",
                            "displayType": "line"
                        },
                        "column": {
                            "headerId": "sizeValue",
                            "text": "",
                            "cellType": "Empty",
                            "displayType": "nested"
                        },
                        "hierarchyKey": "root_hierarchy_key",
                        "calculatedSizeValue": 1,
                        "parent": null
                    }
                }
            }
        }
    ]
}

const date2 = {
    "values": [
        [
            {
                "listLabel": "Ac Turpis Foundation",
                "isLeaf": true,
                "recordId": "27",
                "parentRecordId": "192"
            },
            {
                "sizeValue": 1
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Aenean Incorporated",
                "isLeaf": true,
                "recordId": "80",
                "parentRecordId": "207"
            },
            {
                "sizeValue": 20.5
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Aliquam Inc",
                "isLeaf": true,
                "recordId": "42",
                "parentRecordId": "197"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Amet Dapibus Industries",
                "isLeaf": true,
                "recordId": "35",
                "parentRecordId": "196"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Arcu Ac Orci Incorporated",
                "isLeaf": true,
                "recordId": "36",
                "parentRecordId": "196"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Beck Gaines",
                "isLeaf": false,
                "recordId": "186",
                "parentRecordId": "184"
            },
            {
                "sizeValue": 36.6
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Blandit At Nisi LLC",
                "isLeaf": true,
                "recordId": "70",
                "parentRecordId": "204"
            },
            {
                "sizeValue": 83
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Company Amber",
                "isLeaf": true,
                "recordId": "60",
                "parentRecordId": "201"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Company Aqua",
                "isLeaf": true,
                "recordId": "61",
                "parentRecordId": "201"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Company Blue",
                "isLeaf": true,
                "recordId": "62",
                "parentRecordId": "201"
            },
            {
                "sizeValue": 73.5
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Company Brown",
                "isLeaf": true,
                "recordId": "11",
                "parentRecordId": "189"
            },
            {
                "sizeValue": 70
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Company Green",
                "isLeaf": true,
                "recordId": "63",
                "parentRecordId": "201"
            },
            {
                "sizeValue": 22.666666666666668
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Company Magenta",
                "isLeaf": true,
                "recordId": "64",
                "parentRecordId": "201"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Company Maroorn",
                "isLeaf": true,
                "recordId": "12",
                "parentRecordId": "189"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Company Pink",
                "isLeaf": true,
                "recordId": "65",
                "parentRecordId": "201"
            },
            {
                "sizeValue": 39
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Company Red",
                "isLeaf": true,
                "recordId": "66",
                "parentRecordId": "201"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Company Yellow",
                "isLeaf": true,
                "recordId": "67",
                "parentRecordId": "201"
            },
            {
                "sizeValue": 81.5
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Consequat Auctor Nunc LLC",
                "isLeaf": true,
                "recordId": "2",
                "parentRecordId": "186"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Consequat Inc",
                "isLeaf": true,
                "recordId": "50",
                "parentRecordId": "198"
            },
            {
                "sizeValue": 28.666666666666668
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Courtney Richard",
                "isLeaf": false,
                "recordId": "187",
                "parentRecordId": "184"
            },
            {
                "sizeValue": 69.5
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Cras Sed Incorporated",
                "isLeaf": true,
                "recordId": "10",
                "parentRecordId": "188"
            },
            {
                "sizeValue": 93
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Cursus Ltd",
                "isLeaf": true,
                "recordId": "13",
                "parentRecordId": "189"
            },
            {
                "sizeValue": 47.333333333333336
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Cursus Vestibulum Ltd",
                "isLeaf": true,
                "recordId": "3",
                "parentRecordId": "186"
            },
            {
                "sizeValue": 4
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Cynthia Ramsey",
                "isLeaf": false,
                "recordId": "188",
                "parentRecordId": "184"
            },
            {
                "sizeValue": 91
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Dapibus Ligula Aliquam Associates",
                "isLeaf": true,
                "recordId": "32",
                "parentRecordId": "195"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Dolor Inc",
                "isLeaf": true,
                "recordId": "4",
                "parentRecordId": "186"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Donald Clinton",
                "isLeaf": false,
                "recordId": "185",
                "parentRecordId": "184"
            },
            {
                "sizeValue": 15
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Donald Clinton",
                "isLeaf": false,
                "recordId": "194",
                "parentRecordId": "193"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Donald Clinton",
                "isLeaf": false,
                "recordId": "203",
                "parentRecordId": "202"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Donec Luctus Aliquet Limited",
                "isLeaf": true,
                "recordId": "24",
                "parentRecordId": "191"
            },
            {
                "sizeValue": 58
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Dui In Sodales Corporation",
                "isLeaf": true,
                "recordId": "28",
                "parentRecordId": "192"
            },
            {
                "sizeValue": 42
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Dui Inc",
                "isLeaf": true,
                "recordId": "71",
                "parentRecordId": "204"
            },
            {
                "sizeValue": 47
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Eagles Inc",
                "isLeaf": true,
                "recordId": "81",
                "parentRecordId": "207"
            },
            {
                "sizeValue": 44
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Egestas Inc",
                "isLeaf": true,
                "recordId": "31",
                "parentRecordId": "194"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Elit Inc",
                "isLeaf": true,
                "recordId": "33",
                "parentRecordId": "195"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Elizabeth Lopez",
                "isLeaf": false,
                "recordId": "195",
                "parentRecordId": "193"
            },
            {
                "sizeValue": 57
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Ella Carroll",
                "isLeaf": false,
                "recordId": "204",
                "parentRecordId": "202"
            },
            {
                "sizeValue": 39.5
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Enim Suspendisse Aliquet Consulting",
                "isLeaf": true,
                "recordId": "14",
                "parentRecordId": "189"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Erat Inc",
                "isLeaf": true,
                "recordId": "29",
                "parentRecordId": "192"
            },
            {
                "sizeValue": 89
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Erat LLC",
                "isLeaf": true,
                "recordId": "51",
                "parentRecordId": "198"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Et Malesuada Company",
                "isLeaf": true,
                "recordId": "75",
                "parentRecordId": "206"
            },
            {
                "sizeValue": 35
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Etiam Inc",
                "isLeaf": true,
                "recordId": "52",
                "parentRecordId": "198"
            },
            {
                "sizeValue": 71
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Fusce Inc",
                "isLeaf": true,
                "recordId": "37",
                "parentRecordId": "196"
            },
            {
                "sizeValue": 7
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "George Hayes",
                "isLeaf": false,
                "recordId": "189",
                "parentRecordId": "184"
            },
            {
                "sizeValue": 41.3
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Idona Fleming",
                "isLeaf": false,
                "recordId": "196",
                "parentRecordId": "193"
            },
            {
                "sizeValue": 50.5
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Iona Underwood",
                "isLeaf": false,
                "recordId": "200",
                "parentRecordId": "199"
            },
            {
                "sizeValue": 55.285714285714285
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Laoreet Company",
                "isLeaf": true,
                "recordId": "23",
                "parentRecordId": "190"
            },
            {
                "sizeValue": 54.75
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Lectus Consulting",
                "isLeaf": true,
                "recordId": "5",
                "parentRecordId": "186"
            },
            {
                "sizeValue": 33
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Ligula Eu Ltd",
                "isLeaf": true,
                "recordId": "76",
                "parentRecordId": "206"
            },
            {
                "sizeValue": 57
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Lobortis Corp.",
                "isLeaf": true,
                "recordId": "15",
                "parentRecordId": "189"
            },
            {
                "sizeValue": 26
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Luctus Inc",
                "isLeaf": true,
                "recordId": "6",
                "parentRecordId": "186"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Magna Inc",
                "isLeaf": true,
                "recordId": "43",
                "parentRecordId": "197"
            },
            {
                "sizeValue": 88
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Mauris Inc",
                "isLeaf": true,
                "recordId": "56",
                "parentRecordId": "200"
            },
            {
                "sizeValue": 13
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Mauris Magna Duis LLP",
                "isLeaf": true,
                "recordId": "77",
                "parentRecordId": "206"
            },
            {
                "sizeValue": 5
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Minerva Stuart",
                "isLeaf": false,
                "recordId": "197",
                "parentRecordId": "193"
            },
            {
                "sizeValue": 62.42857142857143
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Mollis Inc",
                "isLeaf": true,
                "recordId": "16",
                "parentRecordId": "189"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Montes Inc",
                "isLeaf": true,
                "recordId": "17",
                "parentRecordId": "189"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Mullet Inc",
                "isLeaf": true,
                "recordId": "57",
                "parentRecordId": "200"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Nascetur Associates",
                "isLeaf": true,
                "recordId": "44",
                "parentRecordId": "197"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Nec Inc",
                "isLeaf": true,
                "recordId": "1",
                "parentRecordId": "185"
            },
            {
                "sizeValue": 15
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Neque Sed Eget Inc.",
                "isLeaf": true,
                "recordId": "72",
                "parentRecordId": "204"
            },
            {
                "sizeValue": 36.5
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Nero McKnight",
                "isLeaf": false,
                "recordId": "190",
                "parentRecordId": "184"
            },
            {
                "sizeValue": 54.75
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Nibh Inc",
                "isLeaf": true,
                "recordId": "38",
                "parentRecordId": "196"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Nisi Mauris Nulla LLC",
                "isLeaf": true,
                "recordId": "68",
                "parentRecordId": "201"
            },
            {
                "sizeValue": 57.4
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Non Inc",
                "isLeaf": true,
                "recordId": "30",
                "parentRecordId": "192"
            },
            {
                "sizeValue": 51
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Nora Calhoun",
                "isLeaf": false,
                "recordId": "201",
                "parentRecordId": "199"
            },
            {
                "sizeValue": 54.15384615384615
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Nulla Inc",
                "isLeaf": true,
                "recordId": "69",
                "parentRecordId": "203"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Nulla Tincidunt Neque LLC",
                "isLeaf": true,
                "recordId": "53",
                "parentRecordId": "198"
            },
            {
                "sizeValue": 7
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Nunc Inc",
                "isLeaf": true,
                "recordId": "39",
                "parentRecordId": "196"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Orca Inc",
                "isLeaf": true,
                "recordId": "45",
                "parentRecordId": "197"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Oscar Soto",
                "isLeaf": false,
                "recordId": "205",
                "parentRecordId": "202"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Pede Ltd",
                "isLeaf": true,
                "recordId": "74",
                "parentRecordId": "205"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Pellentesque Inc",
                "isLeaf": true,
                "recordId": "25",
                "parentRecordId": "191"
            },
            {
                "sizeValue": 51.333333333333336
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Praesent Luctus Curabitur Company",
                "isLeaf": true,
                "recordId": "40",
                "parentRecordId": "196"
            },
            {
                "sizeValue": 80
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Quisque Ornare Industries",
                "isLeaf": true,
                "recordId": "46",
                "parentRecordId": "197"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Rigel Buckley",
                "isLeaf": false,
                "recordId": "206",
                "parentRecordId": "202"
            },
            {
                "sizeValue": 46.333333333333336
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Rowan Guerra",
                "isLeaf": false,
                "recordId": "198",
                "parentRecordId": "193"
            },
            {
                "sizeValue": 41
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Sagittis Corporation",
                "isLeaf": true,
                "recordId": "26",
                "parentRecordId": "191"
            },
            {
                "sizeValue": 16
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Sed Associates",
                "isLeaf": true,
                "recordId": "58",
                "parentRecordId": "200"
            },
            {
                "sizeValue": 74
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Sed Inc",
                "isLeaf": true,
                "recordId": "78",
                "parentRecordId": "206"
            },
            {
                "sizeValue": 43.666666666666664
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Semper Corporation",
                "isLeaf": true,
                "recordId": "9",
                "parentRecordId": "187"
            },
            {
                "sizeValue": 69.5
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Semper Inc",
                "isLeaf": true,
                "recordId": "59",
                "parentRecordId": "200"
            },
            {
                "sizeValue": 60
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Senectus Corporation",
                "isLeaf": true,
                "recordId": "47",
                "parentRecordId": "197"
            },
            {
                "sizeValue": 42
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "SERE Inc",
                "isLeaf": true,
                "recordId": "18",
                "parentRecordId": "189"
            },
            {
                "sizeValue": 9
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Sociis Natoque Penatibus Associates",
                "isLeaf": true,
                "recordId": "41",
                "parentRecordId": "196"
            },
            {
                "sizeValue": 35
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Sollicitudin Inc",
                "isLeaf": true,
                "recordId": "34",
                "parentRecordId": "195"
            },
            {
                "sizeValue": 57
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Suscription Inc",
                "isLeaf": true,
                "recordId": "48",
                "parentRecordId": "197"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "System Inc",
                "isLeaf": true,
                "recordId": "54",
                "parentRecordId": "198"
            },
            {
                "sizeValue": 28.666666666666668
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Tincidunt Inc",
                "isLeaf": true,
                "recordId": "19",
                "parentRecordId": "189"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Tristique Limited",
                "isLeaf": true,
                "recordId": "20",
                "parentRecordId": "189"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "US East SaaS",
                "isLeaf": false,
                "recordId": "184",
                "parentRecordId": "183"
            },
            {
                "sizeValue": 47.595238095238095
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "US OnPremise",
                "isLeaf": false,
                "recordId": "193",
                "parentRecordId": "183"
            },
            {
                "sizeValue": 52.30434782608695
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "US Private Cloud",
                "isLeaf": false,
                "recordId": "199",
                "parentRecordId": "183"
            },
            {
                "sizeValue": 54.55
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "US West SaaS",
                "isLeaf": false,
                "recordId": "202",
                "parentRecordId": "183"
            },
            {
                "sizeValue": 41.11538461538461
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Ut Consulting",
                "isLeaf": true,
                "recordId": "73",
                "parentRecordId": "204"
            },
            {
                "sizeValue": 34.8
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Ut Inc",
                "isLeaf": true,
                "recordId": "79",
                "parentRecordId": "206"
            },
            {
                "sizeValue": 86
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Varius Inc",
                "isLeaf": true,
                "recordId": "7",
                "parentRecordId": "186"
            },
            {
                "sizeValue": 58
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Vel Mauris LLP",
                "isLeaf": true,
                "recordId": "21",
                "parentRecordId": "189"
            },
            {
                "sizeValue": 38
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Velocity Inc",
                "isLeaf": true,
                "recordId": "55",
                "parentRecordId": "198"
            },
            {
                "sizeValue": 89
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "VelumInc",
                "isLeaf": true,
                "recordId": "22",
                "parentRecordId": "189"
            },
            {
                "sizeValue": 42.666666666666664
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Veronica Good",
                "isLeaf": false,
                "recordId": "191",
                "parentRecordId": "184"
            },
            {
                "sizeValue": 47.666666666666664
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Vitae Inc",
                "isLeaf": true,
                "recordId": "49",
                "parentRecordId": "197"
            },
            {
                "sizeValue": 61.333333333333336
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Vivamus Molestie Dapibus LLP",
                "isLeaf": true,
                "recordId": "8",
                "parentRecordId": "186"
            },
            {
                "sizeValue": 17.5
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Wylie Haney",
                "isLeaf": false,
                "recordId": "192",
                "parentRecordId": "184"
            },
            {
                "sizeValue": 45
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Zeph Mosley",
                "isLeaf": false,
                "recordId": "207",
                "parentRecordId": "202"
            },
            {
                "sizeValue": 36.714285714285715
            },
            {
                "colorValue": 2
            }
        ]
    ],
    "cols": [
        {
            "headerId": "sizeValue",
            "text": "",
            "cellType": "Empty",
            "displayType": "nested",
            "values": {
                "sizeValue": {
                    "text": "q7",
                    "valueType": "real"
                }
            },
            "valueIndex": 1,
            "sortingIndex": 0
        },
        {
            "headerId": "colorValue",
            "text": "",
            "cellType": "Empty",
            "displayType": "nested",
            "values": {
                "colorValue": {
                    "valueType": "int"
                }
            },
            "valueIndex": 2,
            "sortingIndex": 0
        }
    ],
    "rows": [
        {
            "headerId": "24",
            "text": "US East SaaS",
            "hasChildren": true,
            "value": "US East SaaS",
            "cellType": "ListRow",
            "displayType": "line",
            "key": [
                {
                    "variable": "id",
                    "type": "text",
                    "value": "184"
                }
            ],
            "hierarchyKey": "[\"184\"]",
            "expandCollapseId": "24_[\"184\"]",
            "valueIndex": 90,
            "headerLabelKey": "24",
            "subHeaders": [
                {
                    "headerId": "24",
                    "text": "Beck Gaines",
                    "hasChildren": true,
                    "value": "Beck Gaines",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "186"
                        }
                    ],
                    "hierarchyKey": "[\"186\"]",
                    "expandCollapseId": "24_[\"186\"]",
                    "valueIndex": 5,
                    "headerLabelKey": "24",
                    "subHeaders": [
                        {
                            "headerId": "24",
                            "text": "Consequat Auctor Nunc LLC",
                            "hasChildren": false,
                            "value": "Consequat Auctor Nunc LLC",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "2"
                                }
                            ],
                            "hierarchyKey": "[\"2\"]",
                            "expandCollapseId": "24_[\"2\"]",
                            "valueIndex": 17,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Cursus Vestibulum Ltd",
                            "hasChildren": false,
                            "value": "Cursus Vestibulum Ltd",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "3"
                                }
                            ],
                            "hierarchyKey": "[\"3\"]",
                            "expandCollapseId": "24_[\"3\"]",
                            "valueIndex": 22,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Dolor Inc",
                            "hasChildren": false,
                            "value": "Dolor Inc",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "4"
                                }
                            ],
                            "hierarchyKey": "[\"4\"]",
                            "expandCollapseId": "24_[\"4\"]",
                            "valueIndex": 25,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Lectus Consulting",
                            "hasChildren": false,
                            "value": "Lectus Consulting",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "5"
                                }
                            ],
                            "hierarchyKey": "[\"5\"]",
                            "expandCollapseId": "24_[\"5\"]",
                            "valueIndex": 47,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Luctus Inc",
                            "hasChildren": false,
                            "value": "Luctus Inc",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "6"
                                }
                            ],
                            "hierarchyKey": "[\"6\"]",
                            "expandCollapseId": "24_[\"6\"]",
                            "valueIndex": 50,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Varius Inc",
                            "hasChildren": false,
                            "value": "Varius Inc",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "7"
                                }
                            ],
                            "hierarchyKey": "[\"7\"]",
                            "expandCollapseId": "24_[\"7\"]",
                            "valueIndex": 96,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Vivamus Molestie Dapibus LLP",
                            "hasChildren": false,
                            "value": "Vivamus Molestie Dapibus LLP",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "8"
                                }
                            ],
                            "hierarchyKey": "[\"8\"]",
                            "expandCollapseId": "24_[\"8\"]",
                            "valueIndex": 102,
                            "headerLabelKey": "24"
                        }
                    ]
                },
                {
                    "headerId": "24",
                    "text": "Courtney Richard",
                    "hasChildren": true,
                    "value": "Courtney Richard",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "187"
                        }
                    ],
                    "hierarchyKey": "[\"187\"]",
                    "expandCollapseId": "24_[\"187\"]",
                    "valueIndex": 19,
                    "headerLabelKey": "24",
                    "subHeaders": [
                        {
                            "headerId": "24",
                            "text": "Semper Corporation",
                            "hasChildren": false,
                            "value": "Semper Corporation",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "9"
                                }
                            ],
                            "hierarchyKey": "[\"9\"]",
                            "expandCollapseId": "24_[\"9\"]",
                            "valueIndex": 80,
                            "headerLabelKey": "24"
                        }
                    ]
                },
                {
                    "headerId": "24",
                    "text": "Cynthia Ramsey",
                    "hasChildren": true,
                    "value": "Cynthia Ramsey",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "188"
                        }
                    ],
                    "hierarchyKey": "[\"188\"]",
                    "expandCollapseId": "24_[\"188\"]",
                    "valueIndex": 23,
                    "headerLabelKey": "24",
                    "subHeaders": [
                        {
                            "headerId": "24",
                            "text": "Cras Sed Incorporated",
                            "hasChildren": false,
                            "value": "Cras Sed Incorporated",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "10"
                                }
                            ],
                            "hierarchyKey": "[\"10\"]",
                            "expandCollapseId": "24_[\"10\"]",
                            "valueIndex": 20,
                            "headerLabelKey": "24"
                        }
                    ]
                },
                {
                    "headerId": "24",
                    "text": "Donald Clinton",
                    "hasChildren": true,
                    "value": "Donald Clinton",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "185"
                        }
                    ],
                    "hierarchyKey": "[\"185\"]",
                    "expandCollapseId": "24_[\"185\"]",
                    "valueIndex": 26,
                    "headerLabelKey": "24",
                    "subHeaders": [
                        {
                            "headerId": "24",
                            "text": "Nec Inc",
                            "hasChildren": false,
                            "value": "Nec Inc",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "1"
                                }
                            ],
                            "hierarchyKey": "[\"1\"]",
                            "expandCollapseId": "24_[\"1\"]",
                            "valueIndex": 59,
                            "headerLabelKey": "24"
                        }
                    ]
                },
                {
                    "headerId": "24",
                    "text": "George Hayes",
                    "hasChildren": true,
                    "value": "George Hayes",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "189"
                        }
                    ],
                    "hierarchyKey": "[\"189\"]",
                    "expandCollapseId": "24_[\"189\"]",
                    "valueIndex": 43,
                    "headerLabelKey": "24",
                    "subHeaders": [
                        {
                            "headerId": "24",
                            "text": "Company Brown",
                            "hasChildren": false,
                            "value": "Company Brown",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "11"
                                }
                            ],
                            "hierarchyKey": "[\"11\"]",
                            "expandCollapseId": "24_[\"11\"]",
                            "valueIndex": 10,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Company Maroorn",
                            "hasChildren": false,
                            "value": "Company Maroorn",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "12"
                                }
                            ],
                            "hierarchyKey": "[\"12\"]",
                            "expandCollapseId": "24_[\"12\"]",
                            "valueIndex": 13,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Cursus Ltd",
                            "hasChildren": false,
                            "value": "Cursus Ltd",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "13"
                                }
                            ],
                            "hierarchyKey": "[\"13\"]",
                            "expandCollapseId": "24_[\"13\"]",
                            "valueIndex": 21,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Enim Suspendisse Aliquet Consulting",
                            "hasChildren": false,
                            "value": "Enim Suspendisse Aliquet Consulting",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "14"
                                }
                            ],
                            "hierarchyKey": "[\"14\"]",
                            "expandCollapseId": "24_[\"14\"]",
                            "valueIndex": 37,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Lobortis Corp.",
                            "hasChildren": false,
                            "value": "Lobortis Corp.",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "15"
                                }
                            ],
                            "hierarchyKey": "[\"15\"]",
                            "expandCollapseId": "24_[\"15\"]",
                            "valueIndex": 49,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Mollis Inc",
                            "hasChildren": false,
                            "value": "Mollis Inc",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "16"
                                }
                            ],
                            "hierarchyKey": "[\"16\"]",
                            "expandCollapseId": "24_[\"16\"]",
                            "valueIndex": 55,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Montes Inc",
                            "hasChildren": false,
                            "value": "Montes Inc",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "17"
                                }
                            ],
                            "hierarchyKey": "[\"17\"]",
                            "expandCollapseId": "24_[\"17\"]",
                            "valueIndex": 56,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "SERE Inc",
                            "hasChildren": false,
                            "value": "SERE Inc",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "18"
                                }
                            ],
                            "hierarchyKey": "[\"18\"]",
                            "expandCollapseId": "24_[\"18\"]",
                            "valueIndex": 83,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Tincidunt Inc",
                            "hasChildren": false,
                            "value": "Tincidunt Inc",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "19"
                                }
                            ],
                            "hierarchyKey": "[\"19\"]",
                            "expandCollapseId": "24_[\"19\"]",
                            "valueIndex": 88,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Tristique Limited",
                            "hasChildren": false,
                            "value": "Tristique Limited",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "20"
                                }
                            ],
                            "hierarchyKey": "[\"20\"]",
                            "expandCollapseId": "24_[\"20\"]",
                            "valueIndex": 89,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Vel Mauris LLP",
                            "hasChildren": false,
                            "value": "Vel Mauris LLP",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "21"
                                }
                            ],
                            "hierarchyKey": "[\"21\"]",
                            "expandCollapseId": "24_[\"21\"]",
                            "valueIndex": 97,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "VelumInc",
                            "hasChildren": false,
                            "value": "VelumInc",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "22"
                                }
                            ],
                            "hierarchyKey": "[\"22\"]",
                            "expandCollapseId": "24_[\"22\"]",
                            "valueIndex": 99,
                            "headerLabelKey": "24"
                        }
                    ]
                },
                {
                    "headerId": "24",
                    "text": "Nero McKnight",
                    "hasChildren": true,
                    "value": "Nero McKnight",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "190"
                        }
                    ],
                    "hierarchyKey": "[\"190\"]",
                    "expandCollapseId": "24_[\"190\"]",
                    "valueIndex": 61,
                    "headerLabelKey": "24",
                    "subHeaders": [
                        {
                            "headerId": "24",
                            "text": "Laoreet Company",
                            "hasChildren": false,
                            "value": "Laoreet Company",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "23"
                                }
                            ],
                            "hierarchyKey": "[\"23\"]",
                            "expandCollapseId": "24_[\"23\"]",
                            "valueIndex": 46,
                            "headerLabelKey": "24"
                        }
                    ]
                },
                {
                    "headerId": "24",
                    "text": "Veronica Good",
                    "hasChildren": true,
                    "value": "Veronica Good",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "191"
                        }
                    ],
                    "hierarchyKey": "[\"191\"]",
                    "expandCollapseId": "24_[\"191\"]",
                    "valueIndex": 100,
                    "headerLabelKey": "24",
                    "subHeaders": [
                        {
                            "headerId": "24",
                            "text": "Donec Luctus Aliquet Limited",
                            "hasChildren": false,
                            "value": "Donec Luctus Aliquet Limited",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "24"
                                }
                            ],
                            "hierarchyKey": "[\"24\"]",
                            "expandCollapseId": "24_[\"24\"]",
                            "valueIndex": 29,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Pellentesque Inc",
                            "hasChildren": false,
                            "value": "Pellentesque Inc",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "25"
                                }
                            ],
                            "hierarchyKey": "[\"25\"]",
                            "expandCollapseId": "24_[\"25\"]",
                            "valueIndex": 72,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Sagittis Corporation",
                            "hasChildren": false,
                            "value": "Sagittis Corporation",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "26"
                                }
                            ],
                            "hierarchyKey": "[\"26\"]",
                            "expandCollapseId": "24_[\"26\"]",
                            "valueIndex": 77,
                            "headerLabelKey": "24"
                        }
                    ]
                },
                {
                    "headerId": "24",
                    "text": "Wylie Haney",
                    "hasChildren": true,
                    "value": "Wylie Haney",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "192"
                        }
                    ],
                    "hierarchyKey": "[\"192\"]",
                    "expandCollapseId": "24_[\"192\"]",
                    "valueIndex": 103,
                    "headerLabelKey": "24",
                    "subHeaders": [
                        {
                            "headerId": "24",
                            "text": "Ac Turpis Foundation",
                            "hasChildren": false,
                            "value": "Ac Turpis Foundation",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "27"
                                }
                            ],
                            "hierarchyKey": "[\"27\"]",
                            "expandCollapseId": "24_[\"27\"]",
                            "valueIndex": 0,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Dui In Sodales Corporation",
                            "hasChildren": false,
                            "value": "Dui In Sodales Corporation",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "28"
                                }
                            ],
                            "hierarchyKey": "[\"28\"]",
                            "expandCollapseId": "24_[\"28\"]",
                            "valueIndex": 30,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Erat Inc",
                            "hasChildren": false,
                            "value": "Erat Inc",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "29"
                                }
                            ],
                            "hierarchyKey": "[\"29\"]",
                            "expandCollapseId": "24_[\"29\"]",
                            "valueIndex": 38,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Non Inc",
                            "hasChildren": false,
                            "value": "Non Inc",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "30"
                                }
                            ],
                            "hierarchyKey": "[\"30\"]",
                            "expandCollapseId": "24_[\"30\"]",
                            "valueIndex": 64,
                            "headerLabelKey": "24"
                        }
                    ]
                }
            ]
        },
        {
            "headerId": "24",
            "text": "US OnPremise",
            "hasChildren": true,
            "value": "US OnPremise",
            "cellType": "ListRow",
            "displayType": "line",
            "key": [
                {
                    "variable": "id",
                    "type": "text",
                    "value": "193"
                }
            ],
            "hierarchyKey": "[\"193\"]",
            "expandCollapseId": "24_[\"193\"]",
            "valueIndex": 91,
            "headerLabelKey": "24",
            "subHeaders": [
                {
                    "headerId": "24",
                    "text": "Donald Clinton",
                    "hasChildren": true,
                    "value": "Donald Clinton",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "194"
                        }
                    ],
                    "hierarchyKey": "[\"194\"]",
                    "expandCollapseId": "24_[\"194\"]",
                    "valueIndex": 27,
                    "headerLabelKey": "24",
                    "subHeaders": [
                        {
                            "headerId": "24",
                            "text": "Egestas Inc",
                            "hasChildren": false,
                            "value": "Egestas Inc",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "31"
                                }
                            ],
                            "hierarchyKey": "[\"31\"]",
                            "expandCollapseId": "24_[\"31\"]",
                            "valueIndex": 33,
                            "headerLabelKey": "24"
                        }
                    ]
                },
                {
                    "headerId": "24",
                    "text": "Elizabeth Lopez",
                    "hasChildren": true,
                    "value": "Elizabeth Lopez",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "195"
                        }
                    ],
                    "hierarchyKey": "[\"195\"]",
                    "expandCollapseId": "24_[\"195\"]",
                    "valueIndex": 35,
                    "headerLabelKey": "24",
                    "subHeaders": [
                        {
                            "headerId": "24",
                            "text": "Dapibus Ligula Aliquam Associates",
                            "hasChildren": false,
                            "value": "Dapibus Ligula Aliquam Associates",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "32"
                                }
                            ],
                            "hierarchyKey": "[\"32\"]",
                            "expandCollapseId": "24_[\"32\"]",
                            "valueIndex": 24,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Elit Inc",
                            "hasChildren": false,
                            "value": "Elit Inc",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "33"
                                }
                            ],
                            "hierarchyKey": "[\"33\"]",
                            "expandCollapseId": "24_[\"33\"]",
                            "valueIndex": 34,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Sollicitudin Inc",
                            "hasChildren": false,
                            "value": "Sollicitudin Inc",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "34"
                                }
                            ],
                            "hierarchyKey": "[\"34\"]",
                            "expandCollapseId": "24_[\"34\"]",
                            "valueIndex": 85,
                            "headerLabelKey": "24"
                        }
                    ]
                },
                {
                    "headerId": "24",
                    "text": "Idona Fleming",
                    "hasChildren": true,
                    "value": "Idona Fleming",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "196"
                        }
                    ],
                    "hierarchyKey": "[\"196\"]",
                    "expandCollapseId": "24_[\"196\"]",
                    "valueIndex": 44,
                    "headerLabelKey": "24",
                    "subHeaders": [
                        {
                            "headerId": "24",
                            "text": "Amet Dapibus Industries",
                            "hasChildren": false,
                            "value": "Amet Dapibus Industries",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "35"
                                }
                            ],
                            "hierarchyKey": "[\"35\"]",
                            "expandCollapseId": "24_[\"35\"]",
                            "valueIndex": 3,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Arcu Ac Orci Incorporated",
                            "hasChildren": false,
                            "value": "Arcu Ac Orci Incorporated",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "36"
                                }
                            ],
                            "hierarchyKey": "[\"36\"]",
                            "expandCollapseId": "24_[\"36\"]",
                            "valueIndex": 4,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Fusce Inc",
                            "hasChildren": false,
                            "value": "Fusce Inc",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "37"
                                }
                            ],
                            "hierarchyKey": "[\"37\"]",
                            "expandCollapseId": "24_[\"37\"]",
                            "valueIndex": 42,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Nibh Inc",
                            "hasChildren": false,
                            "value": "Nibh Inc",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "38"
                                }
                            ],
                            "hierarchyKey": "[\"38\"]",
                            "expandCollapseId": "24_[\"38\"]",
                            "valueIndex": 62,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Nunc Inc",
                            "hasChildren": false,
                            "value": "Nunc Inc",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "39"
                                }
                            ],
                            "hierarchyKey": "[\"39\"]",
                            "expandCollapseId": "24_[\"39\"]",
                            "valueIndex": 68,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Praesent Luctus Curabitur Company",
                            "hasChildren": false,
                            "value": "Praesent Luctus Curabitur Company",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "40"
                                }
                            ],
                            "hierarchyKey": "[\"40\"]",
                            "expandCollapseId": "24_[\"40\"]",
                            "valueIndex": 73,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Sociis Natoque Penatibus Associates",
                            "hasChildren": false,
                            "value": "Sociis Natoque Penatibus Associates",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "41"
                                }
                            ],
                            "hierarchyKey": "[\"41\"]",
                            "expandCollapseId": "24_[\"41\"]",
                            "valueIndex": 84,
                            "headerLabelKey": "24"
                        }
                    ]
                },
                {
                    "headerId": "24",
                    "text": "Minerva Stuart",
                    "hasChildren": true,
                    "value": "Minerva Stuart",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "197"
                        }
                    ],
                    "hierarchyKey": "[\"197\"]",
                    "expandCollapseId": "24_[\"197\"]",
                    "valueIndex": 54,
                    "headerLabelKey": "24",
                    "subHeaders": [
                        {
                            "headerId": "24",
                            "text": "Aliquam Inc",
                            "hasChildren": false,
                            "value": "Aliquam Inc",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "42"
                                }
                            ],
                            "hierarchyKey": "[\"42\"]",
                            "expandCollapseId": "24_[\"42\"]",
                            "valueIndex": 2,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Magna Inc",
                            "hasChildren": false,
                            "value": "Magna Inc",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "43"
                                }
                            ],
                            "hierarchyKey": "[\"43\"]",
                            "expandCollapseId": "24_[\"43\"]",
                            "valueIndex": 51,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Nascetur Associates",
                            "hasChildren": false,
                            "value": "Nascetur Associates",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "44"
                                }
                            ],
                            "hierarchyKey": "[\"44\"]",
                            "expandCollapseId": "24_[\"44\"]",
                            "valueIndex": 58,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Orca Inc",
                            "hasChildren": false,
                            "value": "Orca Inc",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "45"
                                }
                            ],
                            "hierarchyKey": "[\"45\"]",
                            "expandCollapseId": "24_[\"45\"]",
                            "valueIndex": 69,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Quisque Ornare Industries",
                            "hasChildren": false,
                            "value": "Quisque Ornare Industries",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "46"
                                }
                            ],
                            "hierarchyKey": "[\"46\"]",
                            "expandCollapseId": "24_[\"46\"]",
                            "valueIndex": 74,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Senectus Corporation",
                            "hasChildren": false,
                            "value": "Senectus Corporation",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "47"
                                }
                            ],
                            "hierarchyKey": "[\"47\"]",
                            "expandCollapseId": "24_[\"47\"]",
                            "valueIndex": 82,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Suscription Inc",
                            "hasChildren": false,
                            "value": "Suscription Inc",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "48"
                                }
                            ],
                            "hierarchyKey": "[\"48\"]",
                            "expandCollapseId": "24_[\"48\"]",
                            "valueIndex": 86,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Vitae Inc",
                            "hasChildren": false,
                            "value": "Vitae Inc",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "49"
                                }
                            ],
                            "hierarchyKey": "[\"49\"]",
                            "expandCollapseId": "24_[\"49\"]",
                            "valueIndex": 101,
                            "headerLabelKey": "24"
                        }
                    ]
                },
                {
                    "headerId": "24",
                    "text": "Rowan Guerra",
                    "hasChildren": true,
                    "value": "Rowan Guerra",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "198"
                        }
                    ],
                    "hierarchyKey": "[\"198\"]",
                    "expandCollapseId": "24_[\"198\"]",
                    "valueIndex": 76,
                    "headerLabelKey": "24",
                    "subHeaders": [
                        {
                            "headerId": "24",
                            "text": "Consequat Inc",
                            "hasChildren": false,
                            "value": "Consequat Inc",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "50"
                                }
                            ],
                            "hierarchyKey": "[\"50\"]",
                            "expandCollapseId": "24_[\"50\"]",
                            "valueIndex": 18,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Erat LLC",
                            "hasChildren": false,
                            "value": "Erat LLC",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "51"
                                }
                            ],
                            "hierarchyKey": "[\"51\"]",
                            "expandCollapseId": "24_[\"51\"]",
                            "valueIndex": 39,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Etiam Inc",
                            "hasChildren": false,
                            "value": "Etiam Inc",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "52"
                                }
                            ],
                            "hierarchyKey": "[\"52\"]",
                            "expandCollapseId": "24_[\"52\"]",
                            "valueIndex": 41,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Nulla Tincidunt Neque LLC",
                            "hasChildren": false,
                            "value": "Nulla Tincidunt Neque LLC",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "53"
                                }
                            ],
                            "hierarchyKey": "[\"53\"]",
                            "expandCollapseId": "24_[\"53\"]",
                            "valueIndex": 67,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "System Inc",
                            "hasChildren": false,
                            "value": "System Inc",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "54"
                                }
                            ],
                            "hierarchyKey": "[\"54\"]",
                            "expandCollapseId": "24_[\"54\"]",
                            "valueIndex": 87,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Velocity Inc",
                            "hasChildren": false,
                            "value": "Velocity Inc",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "55"
                                }
                            ],
                            "hierarchyKey": "[\"55\"]",
                            "expandCollapseId": "24_[\"55\"]",
                            "valueIndex": 98,
                            "headerLabelKey": "24"
                        }
                    ]
                }
            ]
        },
        {
            "headerId": "24",
            "text": "US Private Cloud",
            "hasChildren": true,
            "value": "US Private Cloud",
            "cellType": "ListRow",
            "displayType": "line",
            "key": [
                {
                    "variable": "id",
                    "type": "text",
                    "value": "199"
                }
            ],
            "hierarchyKey": "[\"199\"]",
            "expandCollapseId": "24_[\"199\"]",
            "valueIndex": 92,
            "headerLabelKey": "24",
            "subHeaders": [
                {
                    "headerId": "24",
                    "text": "Iona Underwood",
                    "hasChildren": true,
                    "value": "Iona Underwood",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "200"
                        }
                    ],
                    "hierarchyKey": "[\"200\"]",
                    "expandCollapseId": "24_[\"200\"]",
                    "valueIndex": 45,
                    "headerLabelKey": "24",
                    "subHeaders": [
                        {
                            "headerId": "24",
                            "text": "Mauris Inc",
                            "hasChildren": false,
                            "value": "Mauris Inc",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "56"
                                }
                            ],
                            "hierarchyKey": "[\"56\"]",
                            "expandCollapseId": "24_[\"56\"]",
                            "valueIndex": 52,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Mullet Inc",
                            "hasChildren": false,
                            "value": "Mullet Inc",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "57"
                                }
                            ],
                            "hierarchyKey": "[\"57\"]",
                            "expandCollapseId": "24_[\"57\"]",
                            "valueIndex": 57,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Sed Associates",
                            "hasChildren": false,
                            "value": "Sed Associates",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "58"
                                }
                            ],
                            "hierarchyKey": "[\"58\"]",
                            "expandCollapseId": "24_[\"58\"]",
                            "valueIndex": 78,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Semper Inc",
                            "hasChildren": false,
                            "value": "Semper Inc",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "59"
                                }
                            ],
                            "hierarchyKey": "[\"59\"]",
                            "expandCollapseId": "24_[\"59\"]",
                            "valueIndex": 81,
                            "headerLabelKey": "24"
                        }
                    ]
                },
                {
                    "headerId": "24",
                    "text": "Nora Calhoun",
                    "hasChildren": true,
                    "value": "Nora Calhoun",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "201"
                        }
                    ],
                    "hierarchyKey": "[\"201\"]",
                    "expandCollapseId": "24_[\"201\"]",
                    "valueIndex": 65,
                    "headerLabelKey": "24",
                    "subHeaders": [
                        {
                            "headerId": "24",
                            "text": "Company Amber",
                            "hasChildren": false,
                            "value": "Company Amber",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "60"
                                }
                            ],
                            "hierarchyKey": "[\"60\"]",
                            "expandCollapseId": "24_[\"60\"]",
                            "valueIndex": 7,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Company Aqua",
                            "hasChildren": false,
                            "value": "Company Aqua",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "61"
                                }
                            ],
                            "hierarchyKey": "[\"61\"]",
                            "expandCollapseId": "24_[\"61\"]",
                            "valueIndex": 8,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Company Blue",
                            "hasChildren": false,
                            "value": "Company Blue",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "62"
                                }
                            ],
                            "hierarchyKey": "[\"62\"]",
                            "expandCollapseId": "24_[\"62\"]",
                            "valueIndex": 9,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Company Green",
                            "hasChildren": false,
                            "value": "Company Green",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "63"
                                }
                            ],
                            "hierarchyKey": "[\"63\"]",
                            "expandCollapseId": "24_[\"63\"]",
                            "valueIndex": 11,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Company Magenta",
                            "hasChildren": false,
                            "value": "Company Magenta",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "64"
                                }
                            ],
                            "hierarchyKey": "[\"64\"]",
                            "expandCollapseId": "24_[\"64\"]",
                            "valueIndex": 12,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Company Pink",
                            "hasChildren": false,
                            "value": "Company Pink",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "65"
                                }
                            ],
                            "hierarchyKey": "[\"65\"]",
                            "expandCollapseId": "24_[\"65\"]",
                            "valueIndex": 14,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Company Red",
                            "hasChildren": false,
                            "value": "Company Red",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "66"
                                }
                            ],
                            "hierarchyKey": "[\"66\"]",
                            "expandCollapseId": "24_[\"66\"]",
                            "valueIndex": 15,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Company Yellow",
                            "hasChildren": false,
                            "value": "Company Yellow",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "67"
                                }
                            ],
                            "hierarchyKey": "[\"67\"]",
                            "expandCollapseId": "24_[\"67\"]",
                            "valueIndex": 16,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Nisi Mauris Nulla LLC",
                            "hasChildren": false,
                            "value": "Nisi Mauris Nulla LLC",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "68"
                                }
                            ],
                            "hierarchyKey": "[\"68\"]",
                            "expandCollapseId": "24_[\"68\"]",
                            "valueIndex": 63,
                            "headerLabelKey": "24"
                        }
                    ]
                }
            ]
        },
        {
            "headerId": "24",
            "text": "US West SaaS",
            "hasChildren": true,
            "value": "US West SaaS",
            "cellType": "ListRow",
            "displayType": "line",
            "key": [
                {
                    "variable": "id",
                    "type": "text",
                    "value": "202"
                }
            ],
            "hierarchyKey": "[\"202\"]",
            "expandCollapseId": "24_[\"202\"]",
            "valueIndex": 93,
            "headerLabelKey": "24",
            "subHeaders": [
                {
                    "headerId": "24",
                    "text": "Donald Clinton",
                    "hasChildren": true,
                    "value": "Donald Clinton",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "203"
                        }
                    ],
                    "hierarchyKey": "[\"203\"]",
                    "expandCollapseId": "24_[\"203\"]",
                    "valueIndex": 28,
                    "headerLabelKey": "24",
                    "subHeaders": [
                        {
                            "headerId": "24",
                            "text": "Nulla Inc",
                            "hasChildren": false,
                            "value": "Nulla Inc",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "69"
                                }
                            ],
                            "hierarchyKey": "[\"69\"]",
                            "expandCollapseId": "24_[\"69\"]",
                            "valueIndex": 66,
                            "headerLabelKey": "24"
                        }
                    ]
                },
                {
                    "headerId": "24",
                    "text": "Ella Carroll",
                    "hasChildren": true,
                    "value": "Ella Carroll",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "204"
                        }
                    ],
                    "hierarchyKey": "[\"204\"]",
                    "expandCollapseId": "24_[\"204\"]",
                    "valueIndex": 36,
                    "headerLabelKey": "24",
                    "subHeaders": [
                        {
                            "headerId": "24",
                            "text": "Blandit At Nisi LLC",
                            "hasChildren": false,
                            "value": "Blandit At Nisi LLC",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "70"
                                }
                            ],
                            "hierarchyKey": "[\"70\"]",
                            "expandCollapseId": "24_[\"70\"]",
                            "valueIndex": 6,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Dui Inc",
                            "hasChildren": false,
                            "value": "Dui Inc",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "71"
                                }
                            ],
                            "hierarchyKey": "[\"71\"]",
                            "expandCollapseId": "24_[\"71\"]",
                            "valueIndex": 31,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Neque Sed Eget Inc.",
                            "hasChildren": false,
                            "value": "Neque Sed Eget Inc.",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "72"
                                }
                            ],
                            "hierarchyKey": "[\"72\"]",
                            "expandCollapseId": "24_[\"72\"]",
                            "valueIndex": 60,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Ut Consulting",
                            "hasChildren": false,
                            "value": "Ut Consulting",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "73"
                                }
                            ],
                            "hierarchyKey": "[\"73\"]",
                            "expandCollapseId": "24_[\"73\"]",
                            "valueIndex": 94,
                            "headerLabelKey": "24"
                        }
                    ]
                },
                {
                    "headerId": "24",
                    "text": "Oscar Soto",
                    "hasChildren": true,
                    "value": "Oscar Soto",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "205"
                        }
                    ],
                    "hierarchyKey": "[\"205\"]",
                    "expandCollapseId": "24_[\"205\"]",
                    "valueIndex": 70,
                    "headerLabelKey": "24",
                    "subHeaders": [
                        {
                            "headerId": "24",
                            "text": "Pede Ltd",
                            "hasChildren": false,
                            "value": "Pede Ltd",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "74"
                                }
                            ],
                            "hierarchyKey": "[\"74\"]",
                            "expandCollapseId": "24_[\"74\"]",
                            "valueIndex": 71,
                            "headerLabelKey": "24"
                        }
                    ]
                },
                {
                    "headerId": "24",
                    "text": "Rigel Buckley",
                    "hasChildren": true,
                    "value": "Rigel Buckley",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "206"
                        }
                    ],
                    "hierarchyKey": "[\"206\"]",
                    "expandCollapseId": "24_[\"206\"]",
                    "valueIndex": 75,
                    "headerLabelKey": "24",
                    "subHeaders": [
                        {
                            "headerId": "24",
                            "text": "Et Malesuada Company",
                            "hasChildren": false,
                            "value": "Et Malesuada Company",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "75"
                                }
                            ],
                            "hierarchyKey": "[\"75\"]",
                            "expandCollapseId": "24_[\"75\"]",
                            "valueIndex": 40,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Ligula Eu Ltd",
                            "hasChildren": false,
                            "value": "Ligula Eu Ltd",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "76"
                                }
                            ],
                            "hierarchyKey": "[\"76\"]",
                            "expandCollapseId": "24_[\"76\"]",
                            "valueIndex": 48,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Mauris Magna Duis LLP",
                            "hasChildren": false,
                            "value": "Mauris Magna Duis LLP",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "77"
                                }
                            ],
                            "hierarchyKey": "[\"77\"]",
                            "expandCollapseId": "24_[\"77\"]",
                            "valueIndex": 53,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Sed Inc",
                            "hasChildren": false,
                            "value": "Sed Inc",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "78"
                                }
                            ],
                            "hierarchyKey": "[\"78\"]",
                            "expandCollapseId": "24_[\"78\"]",
                            "valueIndex": 79,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Ut Inc",
                            "hasChildren": false,
                            "value": "Ut Inc",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "79"
                                }
                            ],
                            "hierarchyKey": "[\"79\"]",
                            "expandCollapseId": "24_[\"79\"]",
                            "valueIndex": 95,
                            "headerLabelKey": "24"
                        }
                    ]
                },
                {
                    "headerId": "24",
                    "text": "Zeph Mosley",
                    "hasChildren": true,
                    "value": "Zeph Mosley",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "207"
                        }
                    ],
                    "hierarchyKey": "[\"207\"]",
                    "expandCollapseId": "24_[\"207\"]",
                    "valueIndex": 104,
                    "headerLabelKey": "24",
                    "subHeaders": [
                        {
                            "headerId": "24",
                            "text": "Aenean Incorporated",
                            "hasChildren": false,
                            "value": "Aenean Incorporated",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "80"
                                }
                            ],
                            "hierarchyKey": "[\"80\"]",
                            "expandCollapseId": "24_[\"80\"]",
                            "valueIndex": 1,
                            "headerLabelKey": "24"
                        },
                        {
                            "headerId": "24",
                            "text": "Eagles Inc",
                            "hasChildren": false,
                            "value": "Eagles Inc",
                            "cellType": "ListRow",
                            "displayType": "line",
                            "key": [
                                {
                                    "variable": "id",
                                    "type": "text",
                                    "value": "81"
                                }
                            ],
                            "hierarchyKey": "[\"81\"]",
                            "expandCollapseId": "24_[\"81\"]",
                            "valueIndex": 32,
                            "headerLabelKey": "24"
                        }
                    ]
                }
            ]
        }
    ],
    "navigateFilterDictionary": {},
    "headerLabelDictionary": {
        "24": "Self-Ref Hierarchy"
    },
    "headerCellDictionary": {
        "24": {
            "__serviceColumn__": "__hierarchyFields__24__",
            "sizeValue": "sizeValue",
            "colorValue": "colorValue"
        }
    },
    "expandedKeys": {
        "24": {
            "[\"184\"]": {
                "isExpanded": true,
                "children": {
                    "[\"186\"]": {
                        "isExpanded": true
                    },
                    "[\"187\"]": {
                        "isExpanded": true
                    },
                    "[\"188\"]": {
                        "isExpanded": true
                    },
                    "[\"185\"]": {
                        "isExpanded": true
                    },
                    "[\"189\"]": {
                        "isExpanded": true
                    },
                    "[\"190\"]": {
                        "isExpanded": true
                    },
                    "[\"191\"]": {
                        "isExpanded": true
                    },
                    "[\"192\"]": {
                        "isExpanded": true
                    }
                }
            },
            "[\"193\"]": {
                "isExpanded": true,
                "children": {
                    "[\"194\"]": {
                        "isExpanded": true
                    },
                    "[\"195\"]": {
                        "isExpanded": true
                    },
                    "[\"196\"]": {
                        "isExpanded": true
                    },
                    "[\"197\"]": {
                        "isExpanded": true
                    },
                    "[\"198\"]": {
                        "isExpanded": true
                    }
                }
            },
            "[\"199\"]": {
                "isExpanded": true,
                "children": {
                    "[\"200\"]": {
                        "isExpanded": true
                    },
                    "[\"201\"]": {
                        "isExpanded": true
                    }
                }
            },
            "[\"202\"]": {
                "isExpanded": true,
                "children": {
                    "[\"203\"]": {
                        "isExpanded": true
                    },
                    "[\"204\"]": {
                        "isExpanded": true
                    },
                    "[\"205\"]": {
                        "isExpanded": true
                    },
                    "[\"206\"]": {
                        "isExpanded": true
                    },
                    "[\"207\"]": {
                        "isExpanded": true
                    }
                }
            }
        }
    },
    "chartCellRangeDictionary": {},
    "chartCellRangeInfo": {}
}

const data3 = {
    "values": [
        [
            {
                "listLabel": "Ac Inc",
                "isLeaf": true,
                "recordId": "175",
                "parentRecordId": "227"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Amet Inc",
                "isLeaf": true,
                "recordId": "167",
                "parentRecordId": "226"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Ciara Coffey",
                "isLeaf": false,
                "recordId": "222",
                "parentRecordId": "221"
            },
            {
                "sizeValue": 49.6
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Colt Ayers",
                "isLeaf": false,
                "recordId": "223",
                "parentRecordId": "221"
            },
            {
                "sizeValue": 81
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Company Orange",
                "isLeaf": true,
                "recordId": "168",
                "parentRecordId": "226"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Company Pomegrante",
                "isLeaf": true,
                "recordId": "169",
                "parentRecordId": "226"
            },
            {
                "sizeValue": 41
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Convallis Industries",
                "isLeaf": true,
                "recordId": "170",
                "parentRecordId": "226"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Donec At Arcu Incorporated",
                "isLeaf": true,
                "recordId": "162",
                "parentRecordId": "224"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Donec Foundation",
                "isLeaf": true,
                "recordId": "157",
                "parentRecordId": "222"
            },
            {
                "sizeValue": 65
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Donec Nibh Quisque Limited",
                "isLeaf": true,
                "recordId": "159",
                "parentRecordId": "223"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Eget Metus Eu Consulting",
                "isLeaf": true,
                "recordId": "166",
                "parentRecordId": "225"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Enim Corp.",
                "isLeaf": true,
                "recordId": "163",
                "parentRecordId": "224"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Enim Inc",
                "isLeaf": true,
                "recordId": "171",
                "parentRecordId": "226"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Enim Non Consulting",
                "isLeaf": true,
                "recordId": "172",
                "parentRecordId": "226"
            },
            {
                "sizeValue": 88
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Heidi Sandoval",
                "isLeaf": false,
                "recordId": "224",
                "parentRecordId": "221"
            },
            {
                "sizeValue": 53.5
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Interdum Inc",
                "isLeaf": true,
                "recordId": "176",
                "parentRecordId": "227"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Lectus Inc",
                "isLeaf": true,
                "recordId": "158",
                "parentRecordId": "222"
            },
            {
                "sizeValue": 16
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Magnis Foundation",
                "isLeaf": true,
                "recordId": "164",
                "parentRecordId": "224"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Montes Corp.",
                "isLeaf": true,
                "recordId": "177",
                "parentRecordId": "227"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Nullam Consulting",
                "isLeaf": true,
                "recordId": "178",
                "parentRecordId": "227"
            },
            {
                "sizeValue": 73
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Nunc Associates",
                "isLeaf": true,
                "recordId": "179",
                "parentRecordId": "227"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Omar Barker",
                "isLeaf": false,
                "recordId": "225",
                "parentRecordId": "221"
            },
            {
                "sizeValue": 88
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Proin Associates",
                "isLeaf": true,
                "recordId": "180",
                "parentRecordId": "227"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Proin Inc",
                "isLeaf": true,
                "recordId": "181",
                "parentRecordId": "227"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Quisque Industries",
                "isLeaf": true,
                "recordId": "160",
                "parentRecordId": "223"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Reservation Inc",
                "isLeaf": true,
                "recordId": "182",
                "parentRecordId": "227"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Risus Inc",
                "isLeaf": true,
                "recordId": "173",
                "parentRecordId": "226"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Solomon Moody",
                "isLeaf": false,
                "recordId": "226",
                "parentRecordId": "221"
            },
            {
                "sizeValue": 68
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Travis Snow",
                "isLeaf": false,
                "recordId": "227",
                "parentRecordId": "221"
            },
            {
                "sizeValue": 73
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Ullacooper Inc",
                "isLeaf": true,
                "recordId": "174",
                "parentRecordId": "226"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Ultrices Inc",
                "isLeaf": true,
                "recordId": "161",
                "parentRecordId": "223"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ],
        [
            {
                "listLabel": "Vulputate Incorporated",
                "isLeaf": true,
                "recordId": "165",
                "parentRecordId": "224"
            },
            {
                "sizeValue": null
            },
            {
                "colorValue": 2
            }
        ]
    ],
    "cols": [
        {
            "headerId": "sizeValue",
            "text": "",
            "cellType": "Empty",
            "displayType": "nested",
            "values": {
                "sizeValue": {
                    "text": "q7",
                    "valueType": "real"
                }
            },
            "valueIndex": 1,
            "sortingIndex": 0
        },
        {
            "headerId": "colorValue",
            "text": "",
            "cellType": "Empty",
            "displayType": "nested",
            "values": {
                "colorValue": {
                    "valueType": "int"
                }
            },
            "valueIndex": 2,
            "sortingIndex": 0
        }
    ],
    "rows": [
        {
            "headerId": "24",
            "text": "Ciara Coffey",
            "hasChildren": true,
            "value": "Ciara Coffey",
            "cellType": "ListRow",
            "displayType": "line",
            "key": [
                {
                    "variable": "id",
                    "type": "text",
                    "value": "222"
                }
            ],
            "hierarchyKey": "[\"222\"]",
            "expandCollapseId": "24_[\"222\"]",
            "valueIndex": 2,
            "headerLabelKey": "24",
            "subHeaders": [
                {
                    "headerId": "24",
                    "text": "Donec Foundation",
                    "hasChildren": false,
                    "value": "Donec Foundation",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "157"
                        }
                    ],
                    "hierarchyKey": "[\"157\"]",
                    "expandCollapseId": "24_[\"157\"]",
                    "valueIndex": 8,
                    "headerLabelKey": "24"
                },
                {
                    "headerId": "24",
                    "text": "Lectus Inc",
                    "hasChildren": false,
                    "value": "Lectus Inc",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "158"
                        }
                    ],
                    "hierarchyKey": "[\"158\"]",
                    "expandCollapseId": "24_[\"158\"]",
                    "valueIndex": 16,
                    "headerLabelKey": "24"
                }
            ]
        },
        {
            "headerId": "24",
            "text": "Colt Ayers",
            "hasChildren": true,
            "value": "Colt Ayers",
            "cellType": "ListRow",
            "displayType": "line",
            "key": [
                {
                    "variable": "id",
                    "type": "text",
                    "value": "223"
                }
            ],
            "hierarchyKey": "[\"223\"]",
            "expandCollapseId": "24_[\"223\"]",
            "valueIndex": 3,
            "headerLabelKey": "24",
            "subHeaders": [
                {
                    "headerId": "24",
                    "text": "Donec Nibh Quisque Limited",
                    "hasChildren": false,
                    "value": "Donec Nibh Quisque Limited",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "159"
                        }
                    ],
                    "hierarchyKey": "[\"159\"]",
                    "expandCollapseId": "24_[\"159\"]",
                    "valueIndex": 9,
                    "headerLabelKey": "24"
                },
                {
                    "headerId": "24",
                    "text": "Quisque Industries",
                    "hasChildren": false,
                    "value": "Quisque Industries",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "160"
                        }
                    ],
                    "hierarchyKey": "[\"160\"]",
                    "expandCollapseId": "24_[\"160\"]",
                    "valueIndex": 24,
                    "headerLabelKey": "24"
                },
                {
                    "headerId": "24",
                    "text": "Ultrices Inc",
                    "hasChildren": false,
                    "value": "Ultrices Inc",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "161"
                        }
                    ],
                    "hierarchyKey": "[\"161\"]",
                    "expandCollapseId": "24_[\"161\"]",
                    "valueIndex": 30,
                    "headerLabelKey": "24"
                }
            ]
        },
        {
            "headerId": "24",
            "text": "Heidi Sandoval",
            "hasChildren": true,
            "value": "Heidi Sandoval",
            "cellType": "ListRow",
            "displayType": "line",
            "key": [
                {
                    "variable": "id",
                    "type": "text",
                    "value": "224"
                }
            ],
            "hierarchyKey": "[\"224\"]",
            "expandCollapseId": "24_[\"224\"]",
            "valueIndex": 14,
            "headerLabelKey": "24",
            "subHeaders": [
                {
                    "headerId": "24",
                    "text": "Donec At Arcu Incorporated",
                    "hasChildren": false,
                    "value": "Donec At Arcu Incorporated",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "162"
                        }
                    ],
                    "hierarchyKey": "[\"162\"]",
                    "expandCollapseId": "24_[\"162\"]",
                    "valueIndex": 7,
                    "headerLabelKey": "24"
                },
                {
                    "headerId": "24",
                    "text": "Enim Corp.",
                    "hasChildren": false,
                    "value": "Enim Corp.",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "163"
                        }
                    ],
                    "hierarchyKey": "[\"163\"]",
                    "expandCollapseId": "24_[\"163\"]",
                    "valueIndex": 11,
                    "headerLabelKey": "24"
                },
                {
                    "headerId": "24",
                    "text": "Magnis Foundation",
                    "hasChildren": false,
                    "value": "Magnis Foundation",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "164"
                        }
                    ],
                    "hierarchyKey": "[\"164\"]",
                    "expandCollapseId": "24_[\"164\"]",
                    "valueIndex": 17,
                    "headerLabelKey": "24"
                },
                {
                    "headerId": "24",
                    "text": "Vulputate Incorporated",
                    "hasChildren": false,
                    "value": "Vulputate Incorporated",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "165"
                        }
                    ],
                    "hierarchyKey": "[\"165\"]",
                    "expandCollapseId": "24_[\"165\"]",
                    "valueIndex": 31,
                    "headerLabelKey": "24"
                }
            ]
        },
        {
            "headerId": "24",
            "text": "Omar Barker",
            "hasChildren": true,
            "value": "Omar Barker",
            "cellType": "ListRow",
            "displayType": "line",
            "key": [
                {
                    "variable": "id",
                    "type": "text",
                    "value": "225"
                }
            ],
            "hierarchyKey": "[\"225\"]",
            "expandCollapseId": "24_[\"225\"]",
            "valueIndex": 21,
            "headerLabelKey": "24",
            "subHeaders": [
                {
                    "headerId": "24",
                    "text": "Eget Metus Eu Consulting",
                    "hasChildren": false,
                    "value": "Eget Metus Eu Consulting",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "166"
                        }
                    ],
                    "hierarchyKey": "[\"166\"]",
                    "expandCollapseId": "24_[\"166\"]",
                    "valueIndex": 10,
                    "headerLabelKey": "24"
                }
            ]
        },
        {
            "headerId": "24",
            "text": "Solomon Moody",
            "hasChildren": true,
            "value": "Solomon Moody",
            "cellType": "ListRow",
            "displayType": "line",
            "key": [
                {
                    "variable": "id",
                    "type": "text",
                    "value": "226"
                }
            ],
            "hierarchyKey": "[\"226\"]",
            "expandCollapseId": "24_[\"226\"]",
            "valueIndex": 27,
            "headerLabelKey": "24",
            "subHeaders": [
                {
                    "headerId": "24",
                    "text": "Amet Inc",
                    "hasChildren": false,
                    "value": "Amet Inc",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "167"
                        }
                    ],
                    "hierarchyKey": "[\"167\"]",
                    "expandCollapseId": "24_[\"167\"]",
                    "valueIndex": 1,
                    "headerLabelKey": "24"
                },
                {
                    "headerId": "24",
                    "text": "Company Orange",
                    "hasChildren": false,
                    "value": "Company Orange",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "168"
                        }
                    ],
                    "hierarchyKey": "[\"168\"]",
                    "expandCollapseId": "24_[\"168\"]",
                    "valueIndex": 4,
                    "headerLabelKey": "24"
                },
                {
                    "headerId": "24",
                    "text": "Company Pomegrante",
                    "hasChildren": false,
                    "value": "Company Pomegrante",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "169"
                        }
                    ],
                    "hierarchyKey": "[\"169\"]",
                    "expandCollapseId": "24_[\"169\"]",
                    "valueIndex": 5,
                    "headerLabelKey": "24"
                },
                {
                    "headerId": "24",
                    "text": "Convallis Industries",
                    "hasChildren": false,
                    "value": "Convallis Industries",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "170"
                        }
                    ],
                    "hierarchyKey": "[\"170\"]",
                    "expandCollapseId": "24_[\"170\"]",
                    "valueIndex": 6,
                    "headerLabelKey": "24"
                },
                {
                    "headerId": "24",
                    "text": "Enim Inc",
                    "hasChildren": false,
                    "value": "Enim Inc",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "171"
                        }
                    ],
                    "hierarchyKey": "[\"171\"]",
                    "expandCollapseId": "24_[\"171\"]",
                    "valueIndex": 12,
                    "headerLabelKey": "24"
                },
                {
                    "headerId": "24",
                    "text": "Enim Non Consulting",
                    "hasChildren": false,
                    "value": "Enim Non Consulting",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "172"
                        }
                    ],
                    "hierarchyKey": "[\"172\"]",
                    "expandCollapseId": "24_[\"172\"]",
                    "valueIndex": 13,
                    "headerLabelKey": "24"
                },
                {
                    "headerId": "24",
                    "text": "Risus Inc",
                    "hasChildren": false,
                    "value": "Risus Inc",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "173"
                        }
                    ],
                    "hierarchyKey": "[\"173\"]",
                    "expandCollapseId": "24_[\"173\"]",
                    "valueIndex": 26,
                    "headerLabelKey": "24"
                },
                {
                    "headerId": "24",
                    "text": "Ullacooper Inc",
                    "hasChildren": false,
                    "value": "Ullacooper Inc",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "174"
                        }
                    ],
                    "hierarchyKey": "[\"174\"]",
                    "expandCollapseId": "24_[\"174\"]",
                    "valueIndex": 29,
                    "headerLabelKey": "24"
                }
            ]
        },
        {
            "headerId": "24",
            "text": "Travis Snow",
            "hasChildren": true,
            "value": "Travis Snow",
            "cellType": "ListRow",
            "displayType": "line",
            "key": [
                {
                    "variable": "id",
                    "type": "text",
                    "value": "227"
                }
            ],
            "hierarchyKey": "[\"227\"]",
            "expandCollapseId": "24_[\"227\"]",
            "valueIndex": 28,
            "headerLabelKey": "24",
            "subHeaders": [
                {
                    "headerId": "24",
                    "text": "Ac Inc",
                    "hasChildren": false,
                    "value": "Ac Inc",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "175"
                        }
                    ],
                    "hierarchyKey": "[\"175\"]",
                    "expandCollapseId": "24_[\"175\"]",
                    "valueIndex": 0,
                    "headerLabelKey": "24"
                },
                {
                    "headerId": "24",
                    "text": "Interdum Inc",
                    "hasChildren": false,
                    "value": "Interdum Inc",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "176"
                        }
                    ],
                    "hierarchyKey": "[\"176\"]",
                    "expandCollapseId": "24_[\"176\"]",
                    "valueIndex": 15,
                    "headerLabelKey": "24"
                },
                {
                    "headerId": "24",
                    "text": "Montes Corp.",
                    "hasChildren": false,
                    "value": "Montes Corp.",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "177"
                        }
                    ],
                    "hierarchyKey": "[\"177\"]",
                    "expandCollapseId": "24_[\"177\"]",
                    "valueIndex": 18,
                    "headerLabelKey": "24"
                },
                {
                    "headerId": "24",
                    "text": "Nullam Consulting",
                    "hasChildren": false,
                    "value": "Nullam Consulting",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "178"
                        }
                    ],
                    "hierarchyKey": "[\"178\"]",
                    "expandCollapseId": "24_[\"178\"]",
                    "valueIndex": 19,
                    "headerLabelKey": "24"
                },
                {
                    "headerId": "24",
                    "text": "Nunc Associates",
                    "hasChildren": false,
                    "value": "Nunc Associates",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "179"
                        }
                    ],
                    "hierarchyKey": "[\"179\"]",
                    "expandCollapseId": "24_[\"179\"]",
                    "valueIndex": 20,
                    "headerLabelKey": "24"
                },
                {
                    "headerId": "24",
                    "text": "Proin Associates",
                    "hasChildren": false,
                    "value": "Proin Associates",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "180"
                        }
                    ],
                    "hierarchyKey": "[\"180\"]",
                    "expandCollapseId": "24_[\"180\"]",
                    "valueIndex": 22,
                    "headerLabelKey": "24"
                },
                {
                    "headerId": "24",
                    "text": "Proin Inc",
                    "hasChildren": false,
                    "value": "Proin Inc",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "181"
                        }
                    ],
                    "hierarchyKey": "[\"181\"]",
                    "expandCollapseId": "24_[\"181\"]",
                    "valueIndex": 23,
                    "headerLabelKey": "24"
                },
                {
                    "headerId": "24",
                    "text": "Reservation Inc",
                    "hasChildren": false,
                    "value": "Reservation Inc",
                    "cellType": "ListRow",
                    "displayType": "line",
                    "key": [
                        {
                            "variable": "id",
                            "type": "text",
                            "value": "182"
                        }
                    ],
                    "hierarchyKey": "[\"182\"]",
                    "expandCollapseId": "24_[\"182\"]",
                    "valueIndex": 25,
                    "headerLabelKey": "24"
                }
            ]
        }
    ],
    "navigateFilterDictionary": {},
    "headerLabelDictionary": {
        "24": "Self-Ref Hierarchy"
    },
    "headerCellDictionary": {
        "24": {
            "__serviceColumn__": "__hierarchyFields__24__",
            "sizeValue": "sizeValue",
            "colorValue": "colorValue"
        }
    },
    "expandedKeys": {
        "24": {
            "[\"222\"]": {
                "isExpanded": true
            },
            "[\"223\"]": {
                "isExpanded": true
            },
            "[\"224\"]": {
                "isExpanded": true
            },
            "[\"225\"]": {
                "isExpanded": true
            },
            "[\"226\"]": {
                "isExpanded": true
            },
            "[\"227\"]": {
                "isExpanded": true
            }
        }
    },
    "chartCellRangeDictionary": {},
    "chartCellRangeInfo": {}
}

const merged = merge({initialNode, data, expandedNode})

debugger