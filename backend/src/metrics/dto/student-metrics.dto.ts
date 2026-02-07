export interface StudentMetrics {
    userId: string;
    name: string;
    grade: string | null;
    completed: number;
    total: number;
    percentage: number;
    lastActivity: Date | null;
}
