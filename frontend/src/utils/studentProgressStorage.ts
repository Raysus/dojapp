const key = (studentId: string) =>
    `student-progress:${studentId}`;

export function saveStudentProgress(
    studentId: string,
    completedIds: string[]
) {
    localStorage.setItem(
        key(studentId),
        JSON.stringify({ completedIds })
    );
}

export function loadStudentProgress(
    studentId: string
): string[] | null {
    const raw = localStorage.getItem(key(studentId));
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw);
        return parsed.completedIds ?? null;
    } catch {
        return null;
    }
}
