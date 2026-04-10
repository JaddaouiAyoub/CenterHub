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

export async function getCourses(search = "", page = 1, pageSize = 10) {
  try {
    const skip = (page - 1) * pageSize;
    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { subject: { name: { contains: search, mode: "insensitive" } } },
        { class: { name: { contains: search, mode: "insensitive" } } }
      ];
    }
    
    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where: whereClause,
        skip,
        take: pageSize,
        include: {
          teacher: { include: { user: true } },
          subject: true,
          class: true
        },
        orderBy: [
          { day: "asc" },
          { startTime: "asc" }
        ]
      }),
      prisma.course.count({ where: whereClause })
    ]);
    return { courses, total, totalPages: Math.ceil(total / pageSize) };
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
  const meetingLink = formData.get("meetingLink") as string;

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
        endTime,
        meetingLink: meetingLink || null
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
  const meetingLink = formData.get("meetingLink") as string;

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
        endTime,
        meetingLink: meetingLink || null
      }
    });

    revalidatePath("/dashboard/courses");
    return { success: "Course updated successfully" };
  } catch (error) {
    return { error: "Failed to update course" };
  }
}

export async function getPaginatedClasses(search = "", page = 1, pageSize = 10) {
  try {
    const skip = (page - 1) * pageSize;
    const whereClause: any = {};
    if (search) {
      whereClause.name = { contains: search, mode: "insensitive" };
    }
    const [classes, total] = await Promise.all([
      prisma.class.findMany({
        where: whereClause,
        skip,
        take: pageSize,
        orderBy: { name: "asc" }
      }),
      prisma.class.count({ where: whereClause })
    ]);
    return { classes, total, totalPages: Math.ceil(total / pageSize) };
  } catch (error) {
    return { error: "Failed to fetch classes" };
  }
}

export async function getPaginatedSubjects(search = "", page = 1, pageSize = 10) {
  try {
    const skip = (page - 1) * pageSize;
    const whereClause: any = {};
    if (search) {
      whereClause.name = { contains: search, mode: "insensitive" };
    }
    const [subjects, total] = await Promise.all([
      prisma.subject.findMany({
        where: whereClause,
        skip,
        take: pageSize,
        orderBy: { name: "asc" }
      }),
      prisma.subject.count({ where: whereClause })
    ]);
    return { subjects, total, totalPages: Math.ceil(total / pageSize) };
  } catch (error) {
    return { error: "Failed to fetch subjects" };
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
export async function getStudentAvailableCourses(studentId: string) {
  try {
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        classes: {
          include: {
            courses: {
              include: {
                subject: true
              }
            }
          }
        }
      }
    });

    if (!student) return [];

    // Flatten all courses from all classes
    const allCourses = student.classes.flatMap(cl => cl.courses);
    
    // De-duplicate if necessary (shouldn't happen with current schema but good practice)
    const uniqueCourses = Array.from(new Map(allCourses.map(c => [c.id, c])).values());
    
    return uniqueCourses;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getTeacherSchedule(teacherProfileId: string) {
  try {
    const courses = await prisma.course.findMany({
      where: { teacherId: teacherProfileId },
      include: {
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
    return { error: "Failed to fetch teacher schedule" };
  }
}

