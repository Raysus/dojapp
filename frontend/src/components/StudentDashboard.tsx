import { useEffect, useState } from 'react';

export default function StudentDashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('http://localhost:3000/students/me', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
      .then(res => res.json())
      .then(setData);
  }, []);

  if (!data) return <p>Cargando...</p>;

  return (
    <div>
      <h2>Mi Dojo</h2>
      <p><b>Dojo:</b> {data.dojo.name}</p>
      <p><b>Grado:</b> {data.grade.name}</p>
    </div>
  );
}
