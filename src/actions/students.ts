"use server";

import prisma from "@/lib/prisma";
import { Role } from "@/types/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function getStudents(search = "", page = 1, pageSize = 10) {
  try {
    const skip = (page - 1) * pageSize;
    const whereClause: any = { role: Role.STUDENT };
    
    if (search) {
      whereClause.name = { contains: search, mode: "insensitive" };
    }

    const [students, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        skip,
        take: pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          createdAt: true,
          studentProfile: {
            select: {
              id: true,
              classes: { select: { id: true, name: true } },
              subjects: { select: { id: true, name: true } }
            }
          }
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.user.count({ where: whereClause })
    ]);

    return { students, total, totalPages: Math.ceil(total / pageSize) };
  } catch (error) {
    return { error: "Failed to fetch students" };
  }
}

export async function registerStudent(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const dateOfBirth = formData.get("dateOfBirth") as string;
  const classIds = formData.getAll("classIds") as string[];
  const subjectIds = formData.getAll("subjectIds") as string[];

  if (!name || !email || !password) {
    return { error: "Missing required fields" };
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: Role.STUDENT,
        studentProfile: {
          create: {
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            classes: {
              connect: classIds.filter(Boolean).map(id => ({ id }))
            },
            subjects: {
              connect: subjectIds.filter(Boolean).map(id => ({ id }))
            }
          }
        }
      }
    });

    revalidatePath("/dashboard");
    return { success: "Student registered successfully" };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "Email already exists" };
    }
    return { error: "Failed to register student" };
  }
}

export async function updateStudent(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const dateOfBirth = formData.get("dateOfBirth") as string;
  const classIds = formData.getAll("classIds") as string[];
  const subjectIds = formData.getAll("subjectIds") as string[];

  try {
    const updateData: any = {
      name,
      email,
      studentProfile: {
        update: {
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          classes: {
            set: classIds.filter(Boolean).map(id => ({ id }))
          },
          subjects: {
            set: subjectIds.filter(Boolean).map(id => ({ id }))
          }
        }
      }
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await prisma.user.update({
      where: { id },
      data: updateData
    });

    revalidatePath("/dashboard");
    return { success: "Student updated successfully" };
  } catch (error) {
    return { error: "Failed to update student" };
  }
}

export async function deleteStudent(id: string) {
  try {
    await prisma.user.delete({
      where: { id }
    });
    revalidatePath("/dashboard");
    return { success: "Student deleted successfully" };
  } catch (error) {
    return { error: "Failed to delete student" };
  }
}

export async function getTeacherStudents(teacherProfileId: string, search = "", page = 1, pageSize = 10) {
  try {
    const skip = (page - 1) * pageSize;

    // 1. Get all classes associated with this teacher's courses
    const teacherCourses = await prisma.course.findMany({
      where: { teacherId: teacherProfileId },
      select: { classId: true }
    });

    const classIds = Array.from(new Set(teacherCourses.map((c: { classId: any; }) => c.classId).filter(Boolean)));

    if (classIds.length === 0) {
      return { students: [], total: 0, totalPages: 0 };
    }

    // 2. Fetch students in those classes
    const whereClause: any = {
      role: Role.STUDENT,
      studentProfile: {
        classes: {
          some: {
            id: { in: classIds }
          }
        }
      }
    };

    if (search) {
      whereClause.name = { contains: search, mode: "insensitive" };
    }

    const [students, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        skip,
        take: pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          createdAt: true,
          studentProfile: {
            select: {
              id: true,
              classes: { select: { id: true, name: true } },
              subjects: { select: { id: true, name: true } }
            }
          }
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.user.count({ where: whereClause })
    ]);

    return { students, total, totalPages: Math.ceil(total / pageSize) };
  } catch (error) {
    console.error("Error in getTeacherStudents:", error);
    return { error: "Failed to fetch your students" };
  }
}

/** Optimised action for dropdowns — returns only the fields needed for a <select>.
 *  Does NOT paginate so all students are available in the form. */
export async function getAllStudentsForSelect() {
  try {
    const students = await prisma.user.findMany({
      where: { role: Role.STUDENT },
      select: {
        id: true,
        name: true,
        studentProfile: { select: { id: true } }
      },
      orderBy: { name: "asc" }
    });
    return { students };
  } catch (error) {
    return { error: "Failed to fetch students for select" };
  }
}

export async function getStudentProfileByUserId(userId: string) {
  try {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId },
      select: { 
        id: true,
        user: { select: { id: true, name: true, email: true, image: true, role: true } },
        classes: {
          select: {
            id: true,
            name: true,
            courses: {
              select: {
                id: true,
                name: true,
                day: true,
                startTime: true,
                endTime: true,
                subject: { select: { id: true, name: true } },
                teacher: { 
                  select: { 
                    id: true,
                    user: { select: { id: true, name: true, image: true } } 
                  } 
                }
              }
            }
          }
        }
      }
    });
    return profile;
  } catch (error) {
    console.error("Error fetching student profile:", error);
    return null;
  }
}

export async function getStudentSchedule(userId: string, startDate: Date) {
  try {
    const student = await prisma.studentProfile.findUnique({
      where: { userId },
      select: { id: true, classes: { select: { id: true } } }
    });

    if (!student) return { courses: [] };

    const classIds = student.classes.map((c: { id: any; }) => c.id);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const courses = await prisma.course.findMany({
      where: {
        classId: { in: classIds },
        OR: [
          { recurrence: "WEEKLY" },
          {
            AND: [
              { recurrence: "ONCE" },
              { specificDate: { gte: startDate, lt: endDate } }
            ]
          }
        ]
      },
      select: {
        id: true,
        name: true,
        day: true,
        startTime: true,
        endTime: true,
        meetingLink: true,
        recurrence: true,
        specificDate: true,
        subject: { select: { id: true, name: true } },
        teacher: { 
          select: { 
            id: true,
            user: { select: { id: true, name: true, image: true } } 
          } 
        },
        class: { select: { id: true, name: true } }
      },
      orderBy: [
        { day: "asc" },
        { startTime: "asc" }
      ]
    });

    return { courses };
  } catch (error) {
    console.error("Error fetching student schedule:", error);
    return { error: "Failed to fetch schedule" };
  }
}
