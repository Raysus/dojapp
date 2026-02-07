import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStudentDetail, toggleContent } from '../services/students.service';
import { useStudentProgress } from '../hooks/useStudentProgress';
import type { Student } from '../types/student';
import StudentDetailSkeleton from '../components/StudentDetailSkeleton';
import { loadStudentProgress, saveStudentProgress } from '../utils/studentProgressStorage';
import { ThemeToggle } from '../components/Theme';


export default function StudentDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [student, setStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);

    const prevUnlockedRef = useRef<string[]>([]);

    // 🔹 Cargar estudiante (UNA sola vez)
    useEffect(() => {
        let mounted = true;

        getStudentDetail(id!).then(data => {
            if (!mounted) return;
            setStudent(data);
            setTimeout(() => setLoading(false), 300); // skeleton smooth
        });

        return () => {
            mounted = false;
        };
    }, [id]);

    useEffect(() => {
        let mounted = true;

        getStudentDetail(id!).then(data => {
            if (!mounted) return;

            const cached = loadStudentProgress(data.id);

            if (cached) {
                data = {
                    ...data,
                    studentContents: data.studentContents.filter(sc =>
                        cached.includes(sc.contentId)
                    )
                };
            }

            setStudent(data);
            setTimeout(() => setLoading(false), 300);
        });

        return () => {
            mounted = false;
        };
    }, [id]);


    // 🔹 Progreso (hook seguro)
    const { completedIds, unlockedIds, progress } =
        useStudentProgress(student);

    // 🔹 Guardar unlocked previo
    useEffect(() => {
        prevUnlockedRef.current = unlockedIds;
    }, [unlockedIds]);

    // 🔹 Estados de carga
    if (loading || !student) {
        return <StudentDetailSkeleton />;
    }

    const handleToggle = async (contentId: string) => {
        if (!unlockedIds.includes(contentId)) return;

        const updated = await toggleContent(student.id, contentId);

        const completed = updated.studentContents.map(
            (sc: { contentId: any; }) => sc.contentId
        );

        saveStudentProgress(updated.id, completed);
        setStudent(updated);
    };


    return (
        <div>
            <ThemeToggle />
            <div className="card">
                <h2>{student.user.name}</h2>

                <div className="progress">
                    <div
                        className="progress-bar"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <p>
                    Progreso: <strong>{progress}%</strong>
                </p>
            </div>

            <button
                className="button secondary"
                onClick={() => navigate(-1)}
                style={{ marginBottom: 16 }}
            >
                ← Volver
            </button>

            <ul>
                {student.grade.contents.map(c => {
                    const completed = completedIds.includes(c.id);
                    const unlocked = unlockedIds.includes(c.id);
                    const wasUnlockedBefore =
                        prevUnlockedRef.current.includes(c.id);
                    const justUnlocked = unlocked && !wasUnlockedBefore;

                    return (
                        <li
                            key={c.id}
                            data-tooltip={
                                !unlocked
                                    ? 'Este contenido se desbloquea al completar el anterior'
                                    : undefined
                            }
                            className={`
                                content-item
                                ${completed ? 'completed' : ''}
                                ${unlocked ? 'unlocked' : 'locked'}
                                ${justUnlocked ? 'just-unlocked' : ''}
                            `}
                        >
                            <label>
                                <input
                                    type="checkbox"
                                    checked={completed}
                                    disabled={!unlocked}
                                    onChange={() => handleToggle(c.id)}
                                />{' '}
                                {completed
                                    ? '✅'
                                    : unlocked
                                        ? '📘'
                                        : '🔒'}{' '}
                                {c.title}
                            </label>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
