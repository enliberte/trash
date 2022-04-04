function ListNode(val, next) {
    this.val = (val===undefined ? 0 : val)
    this.next = (next===undefined ? null : next)
}

const head = new ListNode(1, new ListNode(1, new ListNode(2)));

const printLinkedList = (head) => {
    if (head !== null) {
        console.log(head.val)
        printLinkedList(head.next);
    }
};

printLinkedList(head)
