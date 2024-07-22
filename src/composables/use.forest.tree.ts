
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
        if (item[parentField] === null || !nodes[item[parentField]]) {
            roots.push(nodes[item.id]);
        } else {
            nodes[item[parentField]].sub_items.push(nodes[item.id]);
        }
    });

    return roots;
}
