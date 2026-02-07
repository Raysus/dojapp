import { useMemo } from 'react';
import type { Student } from '../types/student';

export function useStudentProgress(student: Student | null) {
    const completedIds = useMemo(() => {
        if (!student) return [];
        return student.studentContents.map(sc => sc.contentId);
    }, [student]);

    const progress = useMemo(() => {
        if (!student) return 0;

        const total = student.grade.contents.length;
        const done = completedIds.length;

        return total === 0 ? 0 : Math.round((done / total) * 100);
    }, [student, completedIds]);

    const unlockedIds = useMemo(() => {
        if (!student) return [];

        const contents = [...student.grade.contents].sort(
            (a, b) => a.order - b.order
        );

        const unlocked: string[] = [];

        contents.forEach((content, index) => {
            if (
                index === 0 ||
                completedIds.includes(contents[index - 1].id)
            ) {
                unlocked.push(content.id);
            }
        });

        return unlocked;
    }, [student, completedIds]);

    return {
        completedIds,
        unlockedIds,
        progress
    };
}
