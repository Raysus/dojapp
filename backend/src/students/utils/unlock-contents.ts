export function getUnlockedContentIds(
    contents: { id: string; order: number }[],
    completedIds: string[],
): string[] {

    if (contents.length === 0) return [];

    if (completedIds.length === 0) {
        return [contents[0].id];
    }

    const completedOrders = contents
        .filter(c => completedIds.includes(c.id))
        .map(c => c.order);

    const maxOrder = Math.max(...completedOrders);

    const nextContent = contents.find(
        c => c.order === maxOrder + 1
    );

    return nextContent
        ? [...completedIds, nextContent.id]
        : completedIds;
}
