"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
export type EvaluationType = "CONTROLE_1" | "CONTROLE_2" | "CONTROLE_3" | "DEVOIR" | "EXAMEN" | "AUTRE";

export async function getTeacherEvaluations(teacherProfileId: string) {
  try {
    const evaluations = await prisma.evaluation.findMany({
      where: { teacherId: teacherProfileId },
      include: {
        subject: true,
        class: true,
        _count: {
          select: { grades: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return { evaluations };
  } catch (error) {
    console.error("Error fetching evaluations:", error);
    return { error: "Failed to fetch evaluations" };
  }
}

export async function createEvaluation(data: {
  title: string;
  type: EvaluationType;
  subjectId: string;
  classId: string;
  teacherId: string;
  date: Date;
}) {
  try {
    const evaluation = await prisma.evaluation.create({
      data: {
        title: data.title,
        type: data.type,
        subjectId: data.subjectId,
        classId: data.classId,
        teacherId: data.teacherId,
        date: data.date,
      }
    });
    revalidatePath("/dashboard");
    return { evaluation, success: true };
  } catch (error) {
    console.error("Error creating evaluation:", error);
    return { error: "Failed to create evaluation" };
  }
}

export async function updateEvaluation(id: string, data: {
  title?: string;
  type?: EvaluationType;
  date?: Date;
  isPublished?: boolean;
}) {
  try {
    const evaluation = await prisma.evaluation.update({
      where: { id },
      data
    });
    revalidatePath("/dashboard");
    return { evaluation, success: true };
  } catch (error) {
    console.error("Error updating evaluation:", error);
    return { error: "Failed to update evaluation" };
  }
}

export async function deleteEvaluation(id: string) {
  try {
    await prisma.evaluation.delete({
      where: { id }
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error deleting evaluation:", error);
    return { error: "Failed to delete evaluation" };
  }
}

export async function getTeacherSubjectsClasses(teacherProfileId: string) {
  try {
    const courses = await prisma.course.findMany({
      where: { teacherId: teacherProfileId },
      include: {
        subject: true,
        class: true
      }
    });

    const pairs = courses.reduce((acc: any[], curr) => {
      const exists = acc.find(p => p.subjectId === curr.subject.id && p.classId === curr.class.id);
      if (!exists) {
        acc.push({
          subjectId: curr.subject.id,
          subjectName: curr.subject.name,
          classId: curr.class.id,
          className: curr.class.name
        });
      }
      return acc;
    }, []);

    return { pairs };
  } catch (error) {
    console.error("Error fetching teacher pairs:", error);
    return { error: "Failed to fetch subjects and classes" };
  }
}

export async function getStudentsForGrades(evaluationId: string) {
  try {
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      select: { subjectId: true, classId: true }
    });

    if (!evaluation) return { error: "Evaluation not found" };

    const students = await prisma.studentProfile.findMany({
      where: {
        classes: { some: { id: evaluation.classId } },
        subjects: { some: { id: evaluation.subjectId } }
      },
      include: {
        user: {
          select: { name: true, image: true }
        },
        grades: {
          where: { evaluationId }
        }
      }
    });

    return { students };
  } catch (error) {
    console.error("Error fetching students for grades:", error);
    return { error: "Failed to fetch students" };
  }
}

export async function upsertGrades(evaluationId: string, grades: { studentId: string, value: number, comment?: string }[]) {
  try {
    // We use a transaction to ensure all grades are saved correctly
    await prisma.$transaction(
      grades.map(grade => 
        prisma.grade.upsert({
          where: {
            studentId_evaluationId: {
              studentId: grade.studentId,
              evaluationId
            }
          },
          update: {
            value: grade.value,
            comment: grade.comment
          },
          create: {
            studentId: grade.studentId,
            evaluationId,
            value: grade.value,
            comment: grade.comment
          }
        })
      )
    );

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error upserting grades:", error);
    return { error: "Failed to save grades" };
  }
}

export async function getStudentGrades(studentProfileId: string) {
  try {
    const grades = await prisma.grade.findMany({
      where: { 
        studentId: studentProfileId,
        evaluation: { isPublished: true }
      },
      include: {
        evaluation: {
          include: {
            subject: true,
            teacher: {
              include: { user: { select: { name: true } } }
            }
          }
        }
      },
      orderBy: { 
        evaluation: { date: "desc" }
      }
    });
    return { grades };
  } catch (error) {
    console.error("Error fetching student grades:", error);
    return { error: "Failed to fetch grades" };
  }
}
