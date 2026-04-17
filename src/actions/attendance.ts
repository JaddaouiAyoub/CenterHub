"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getAttendanceByCourse(courseId: string, date: Date) {
  try {
    const attendance = await prisma.attendance.findMany({
      where: {
        courseId,
        date: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lte: new Date(date.setHours(23, 59, 59, 999))
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

export async function markAttendance(courseId: string, studentId: string, status: string, date: string) {
  try {
    const targetDate = new Date(date);
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
