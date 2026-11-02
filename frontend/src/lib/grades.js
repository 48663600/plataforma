// Cálculo de notas: totales por curso, promedio por bimestre y nota final ponderada.

export const scoreColor = (s, max) => {
  if (s == null) return "#9ca3af";
  const p = (s / max) * 100;
  if (p >= 90) return "#16a34a";
  if (p >= 75) return "#2563eb";
  if (p >= 60) return "#d97706";
  if (p >= 50) return "#ea580c";
  return "#dc2626";
};

export const pctOf = (s, max) => (max > 0 ? Math.round((s / max) * 100) : 0);

export const letterGrade = (s, max) => {
  if (s == null) return "–";
  const p = pctOf(s, max);
  if (p >= 90) return "A";
  if (p >= 75) return "B";
  if (p >= 60) return "C";
  if (p >= 50) return "D";
  return "F";
};

export const totalScore = (studentId, assignments, scores) => {
  let total = 0;
  assignments.forEach((a) => {
    const sc = scores.find((s) => s.studentId === studentId && s.assignmentId === a.id);
    if (sc?.score != null) total += sc.score;
  });
  return Math.round(total * 10) / 10;
};

export const maxPossible = (assignments) => assignments.reduce((a, b) => a + (Number(b.maxScore) || 0), 0);

const assignmentsOfPeriod = (courseId, periodId, data) => {
  // Una tarea sin bimestre se cuenta en el bimestre activo (o en el 1).
  const activePeriodId = data.periods?.find((p) => p.active)?.id || 1;
  return data.assignments.filter((a) => a.courseId === courseId && (a.periodId || activePeriodId) === periodId);
};

/** Porcentaje (0-100) del alumno en un bimestre, o null si el bimestre no tiene tareas. */
export const getPeriodAvg = (studentId, courseId, periodId, data) => {
  const asgns = assignmentsOfPeriod(courseId, periodId, data);
  const maxP = maxPossible(asgns);
  if (!asgns.length || maxP === 0) return null;
  return (totalScore(studentId, asgns, data.scores) / maxP) * 100;
};

/**
 * Nota final (0-100) ponderada solo con los bimestres que ya tienen tareas.
 * Así, a mitad de año, un alumno con 100 % en el I Bimestre tiene 100 y no 25.
 */
export const calculateFinalGrade = (studentId, courseId, data) => {
  const pList = data.periods || [];
  if (!pList.length) {
    const asgns = data.assignments.filter((a) => a.courseId === courseId);
    const max = maxPossible(asgns);
    return max > 0 ? Math.round((totalScore(studentId, asgns, data.scores) / max) * 1000) / 10 : 0;
  }
  let weighted = 0;
  let weights = 0;
  pList.forEach((p) => {
    const avg = getPeriodAvg(studentId, courseId, p.id, data);
    if (avg == null) return;
    const w = Number(p.weight) || 0;
    weighted += avg * w;
    weights += w;
  });
  if (weights === 0) return 0;
  return Math.round((weighted / weights) * 10) / 10;
};
