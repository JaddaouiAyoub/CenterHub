"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSubjects() {
  return prisma.subject.findMany({ orderBy: { name: "asc" } });
}

export async function getClasses() {
  return prisma.class.findMany({ orderBy: { name: "asc" } });
}

export async function createSubject(name: string) {
  try {
    const subject = await prisma.subject.create({ data: { name } });
    revalidatePath("/dashboard/subjects");
    return { subject };
  } catch (error) {
    return { error: "Failed to create subject" };
  }
}

export async function updateSubject(id: string, name: string) {
  try {
    const subject = await prisma.subject.update({ where: { id }, data: { name } });
    revalidatePath("/dashboard/subjects");
    return { subject };
  } catch (error) {
    return { error: "Failed to update subject" };
  }
}

export async function createClass(name: string) {
  try {
    const classData = await prisma.class.create({ data: { name } });
    revalidatePath("/dashboard/classes");
    return { classData };
  } catch (error) {
    return { error: "Failed to create class" };
  }
}

export async function updateClass(id: string, name: string) {
  try {
    const classData = await prisma.class.update({ where: { id }, data: { name } });
    revalidatePath("/dashboard/classes");
    return { classData };
  } catch (error) {
    return { error: "Failed to update class" };
  }
}

export async function getCourses() {
  try {
    const courses = await prisma.course.findMany({
      include: {
        teacher: { include: { user: true } },
        subject: true,
        class: true
      },
      orderBy: [
        { day: "asc" },
        { startTime: "asc" }
      ]
    });
    return { courses };
  } catch (error) {
    return { error: "Failed to fetch courses" };
  }
}

export async function createCourse(formData: FormData) {
  const name = formData.get("name") as string;
  const teacherId = formData.get("teacherId") as string;
  const subjectId = formData.get("subjectId") as string;
  const classId = formData.get("classId") as string;
  const day = parseInt(formData.get("day") as string);
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;

  if (!name || !subjectId || !classId || isNaN(day) || !startTime || !endTime) {
    return { error: "Missing required fields" };
  }

  try {
    await prisma.course.create({
      data: {
        name,
        teacherId: teacherId || null,
        subjectId,
        classId,
        day,
        startTime,
        endTime
      }
    });

    revalidatePath("/dashboard/courses");
    return { success: "Course scheduled successfully" };
  } catch (error) {
    return { error: "Failed to schedule course" };
  }
}

export async function updateCourse(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const teacherId = formData.get("teacherId") as string;
  const subjectId = formData.get("subjectId") as string;
  const classId = formData.get("classId") as string;
  const day = parseInt(formData.get("day") as string);
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;

  try {
    await prisma.course.update({
      where: { id },
      data: {
        name,
        teacherId: teacherId || null,
        subjectId,
        classId,
        day,
        startTime,
        endTime
      }
    });

    revalidatePath("/dashboard/courses");
    return { success: "Course updated successfully" };
  } catch (error) {
    return { error: "Failed to update course" };
  }
}

export async function deleteCourse(id: string) {
  try {
    await prisma.course.delete({ where: { id } });
    revalidatePath("/dashboard");
    return { success: "Course deleted successfully" };
  } catch (error) {
    return { error: "Failed to delete course" };
  }
}

export async function deleteSubject(id: string) {
  try {
    await prisma.subject.delete({ where: { id } });
    revalidatePath("/dashboard/subjects");
    return { success: "Subject deleted successfully" };
  } catch (error) {
    return { error: "Failed to delete subject" };
  }
}

export async function deleteClass(id: string) {
  try {
    await prisma.class.delete({ where: { id } });
    revalidatePath("/dashboard/classes");
    return { success: "Class deleted successfully" };
  } catch (error) {
    return { error: "Failed to delete class" };
  }
}

