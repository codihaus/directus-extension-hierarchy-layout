
/**
 * A row's parent normally arrives as a bare primary key. It arrives as the
 * related *object* instead as soon as the title template reads a field off the
 * parent relation (`{{parent.title}}`), because Directus answers a request for
 * `parent` plus `parent.title` with one nested object. Keying the tree on that
 * object would make every lookup miss and promote every row to the top level —
 * the whole tree would render as a flat list.
 *
 * `index.ts` asks for the parent's primary key alongside, so the id is there in
 * either shape. The node index below is keyed on `item.id`, so that is the key
 * to read back out.
 */
function parentKey(item: Item, parentField: string | number) {
    const value = item[parentField];

    return value !== null && typeof value === 'object' ? value.id ?? null : value;
}

export function useBuildForest(data: Item[], parentField: string | number) {
    // Tạo một đối tượng để lưu trữ các node theo id
    const nodes = {};
    // Khởi tạo các node
    data.forEach(item => {
        nodes[item.id] = { ...item, sub_items: [] };
    });

    // Tạo danh sách các gốc cây
    const roots = [];
    data.forEach(item => {
        const parent = parentKey(item, parentField);

        if (parent === null || !nodes[parent]) {
            roots.push(nodes[item.id]);
        } else {
            nodes[parent].sub_items.push(nodes[item.id]);
        }
    });

    return roots;
}
