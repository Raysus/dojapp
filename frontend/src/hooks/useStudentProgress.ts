import { useMemo } from 'react'

export function useStudentProgress(student: any, contents: Array<{ id: string }> = []) {
  return useMemo(() => {
    const completedIds = new Set<string>(
      (student?.studentContents ?? [])
        .filter((x: any) => x?.completed)
        .map((x: any) => x.contentId),
    )

    const allIds = (contents ?? []).map(c => c.id)
    const unlockedIds = allIds

    const total = allIds.length
    const completed = allIds.filter(id => completedIds.has(id)).length
    const progress = total ? Math.round((completed / total) * 100) : 0

    return {
      completedIds: Array.from(completedIds),
      unlockedIds,
      progress,
      total,
      completed,
    }
  }, [student?.studentContents, contents])
}
