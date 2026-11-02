import { describe, it, expect } from "vitest";
import { totalScore, getPeriodAvg, calculateFinalGrade } from "../src/lib/grades.js";

const data = {
  periods: [
    { id: 1, weight: 0.25, active: true },
    { id: 2, weight: 0.25 },
    { id: 3, weight: 0.25 },
    { id: 4, weight: 0.25 },
  ],
  assignments: [
    { id: 1, courseId: 1, periodId: 1, maxScore: 10 },
    { id: 2, courseId: 1, periodId: 1, maxScore: 90 },
    { id: 3, courseId: 1, periodId: 2, maxScore: 100 },
  ],
  scores: [
    { studentId: 7, assignmentId: 1, score: 10 },
    { studentId: 7, assignmentId: 2, score: 80 },
  ],
};

describe("cálculo de notas", () => {
  it("suma los puntos obtenidos", () => {
    expect(totalScore(7, data.assignments, data.scores)).toBe(90);
  });

  it("devuelve null en un bimestre sin tareas", () => {
    expect(getPeriodAvg(7, 1, 3, data)).toBeNull();
    expect(getPeriodAvg(7, 1, 1, data)).toBe(90);
  });

  it("pondera solo los bimestres que tienen tareas", () => {
    // Bimestre 1: 90 %, bimestre 2: 0 % (tarea sin nota) → (90·0.25 + 0·0.25) / 0.5 = 45
    expect(calculateFinalGrade(7, 1, data)).toBe(45);
    // Con solo el bimestre 1 publicado, la nota final es la del bimestre (no 22.5)
    const soloB1 = { ...data, assignments: data.assignments.filter((a) => a.periodId === 1) };
    expect(calculateFinalGrade(7, 1, soloB1)).toBe(90);
  });

  it("devuelve 0 si el curso no tiene tareas", () => {
    expect(calculateFinalGrade(7, 99, data)).toBe(0);
  });
});
