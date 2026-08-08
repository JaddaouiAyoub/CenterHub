"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function normalizeAttendanceDate(date: Date | string) {
  if (typeof date === "string") {
    const [year, month, day] = date.split("-").map(Number);
    if ([year, month, day].every((value) => Number.isFinite(value))) {
      const normalized = new Date(year, month - 1, day);
      normalized.setHours(12, 0, 0, 0);
      return normalized;
    }
  }

  const normalized = new Date(date);
  normalized.setHours(12, 0, 0, 0);
  return normalized;
}

export async function getAttendanceByCourse(courseId: string, date: Date | string) {
  try {
    const normalizedDate = normalizeAttendanceDate(date);
    const startOfDay = new Date(normalizedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(normalizedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const attendance = await prisma.attendance.findMany({
      where: {
        courseId,
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      select: {
        id: true,
        status: true,
        date: true,
        student: {
          select: {
            id: true,
            user: { select: { name: true, image: true } }
          }
        }
      }
    });
    return { attendance };
  } catch (error) {
    return { error: "Failed to fetch attendance" };
  }
}

export async function markAttendance(courseId: string, studentId: string, status: string, date: string | Date) {
  try {
    const targetDate = normalizeAttendanceDate(date);
    targetDate.setHours(12, 0, 0, 0); // Mid-day to avoid TZ issues

    await prisma.attendance.upsert({
      where: {
        // Since we don't have a unique constraint on course+student+date in schema yet, 
        // we'll find and update or create.
        id: (await prisma.attendance.findFirst({
          where: { courseId, studentId, date: targetDate }
        }))?.id || 'new-id'
      },
      update: { status },
      create: {
        courseId,
        studentId,
        status,
        date: targetDate
      }
    });

    revalidatePath("/dashboard/attendance");
    return { success: "Attendance marked" };
  } catch (error) {
    console.error(error);
    return { error: "Failed to mark attendance" };
  }
}

export async function getStudentsForCourse(courseId: string) {
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        class: {
          select: {
            students: {
              select: {
                id: true,
                user: { select: { name: true, image: true } }
              }
            }
          }
        }
      }
    });
    return { students: course?.class.students || [] };
  } catch (error) {
    return { error: "Failed to fetch students for course" };
  }
}

export async function getStudentAttendanceHistory(studentId: string) {
  try {
    const attendance = await prisma.attendance.findMany({
      where: { studentId },
      select: {
        id: true,
        status: true,
        date: true,
        course: {
          select: {
            id: true,
            name: true,
            subject: { select: { id: true, name: true } },
            teacher: {
              select: {
                id: true,
                user: { select: { name: true, image: true } }
              }
            }
          }
        }
      },
      orderBy: { date: "desc" }
    });
    return { attendance };
  } catch (error) {
    return { error: "Failed to fetch attendance history" };
  }
}
