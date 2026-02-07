import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyDojos } from '../services/dojos.service';
import { getStudentsByDojo } from '../services/students.service';

export default function ProfessorDashboard() {
  const [dojos, setDojos] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedDojo, setSelectedDojo] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getMyDojos().then(setDojos);
  }, []);

  const loadStudents = async (dojoId: string) => {
    const data = await getStudentsByDojo(dojoId);
    setStudents(data);
    setSelectedDojo(dojoId);
  };

  return (
    <div>
      <h2>Mis Dojos</h2>

      {dojos.map(dojo => (
        <div key={dojo.id} className="card dojo-card">
          <h3>🥋 {dojo.name}</h3>

          <button
            className="button secondary"
            onClick={() => loadStudents(dojo.id)}
          >
            Ver alumnos
          </button>
        </div>
      ))}

      {selectedDojo && (
        <>
          <h3>Alumnos</h3>

          {students.length === 0 && <p>No hay alumnos</p>}

          <ul>
            {students.map(student => (
              <li
                key={student.id}
                className="student-item"
                onClick={() => navigate(`/students/${student.id}`)}
              >
                👤 {student.user.name}
              </li>
            ))}
          </ul>

        </>
      )}
    </div>
  );
}
