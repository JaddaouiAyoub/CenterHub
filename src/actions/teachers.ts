"use server";

import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function getTeachers() {
  try {
    const teachers = await prisma.user.findMany({
      where: { role: Role.TEACHER },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        teacherProfile: {
          select: {
            id: true,
            specialization: true,
            bio: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return { teachers };
  } catch (error) {
    return { error: "Failed to fetch teachers" };
  }
}

export async function getPaginatedTeachers(search = "", page = 1, pageSize = 10) {
  try {
    const skip = (page - 1) * pageSize;
    const whereClause: any = { role: Role.TEACHER };
    if (search) {
      whereClause.name = { contains: search, mode: "insensitive" };
    }
    const [teachers, total] = await Promise.all([
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
          teacherProfile: {
            select: {
              id: true,
              specialization: true,
              bio: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.user.count({ where: whereClause })
    ]);
    return { teachers, total, totalPages: Math.ceil(total / pageSize) };
  } catch (error) {
    return { error: "Failed to fetch teachers" };
  }
}

export async function createTeacher(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const specialization = formData.get("specialization") as string;

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
        role: Role.TEACHER,
        teacherProfile: {
          create: {
            specialization
          }
        }
      }
    });

    revalidatePath("/dashboard");
    return { success: "Teacher created successfully" };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "Email already exists" };
    }
    return { error: "Failed to create teacher" };
  }
}

export async function updateTeacher(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const specialization = formData.get("specialization") as string;
  const bio = formData.get("bio") as string;

  try {
    await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        teacherProfile: {
          update: {
            specialization,
            bio
          }
        }
      }
    });

    revalidatePath("/dashboard");
    return { success: "Teacher updated successfully" };
  } catch (error) {
    return { error: "Failed to update teacher" };
  }
}

export async function deleteTeacher(id: string) {
  try {
    await prisma.user.delete({
      where: { id }
    });
    revalidatePath("/dashboard");
    return { success: "Teacher deleted successfully" };
  } catch (error) {
    return { error: "Failed to delete teacher" };
  }
}export async function getTeacherProfileByUserId(userId: string) {
  if (!userId) {
    console.warn("getTeacherProfileByUserId called with missing userId");
    return null;
  }
  try {
    let profile = await prisma.teacherProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        specialization: true,
        bio: true,
        user: { select: { id: true, name: true, email: true, image: true, role: true } }
      }
    });

    if (!profile) {
      // Fallback: Check if the user exists and has the TEACHER role
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user && user.role === Role.TEACHER) {
        // Auto-create missing profile record
        profile = await prisma.teacherProfile.create({
          data: { userId },
          select: {
            id: true,
            userId: true,
            specialization: true,
            bio: true,
            user: { select: { id: true, name: true, email: true, image: true, role: true } }
          }
        });
        console.log(`Auto-created missing teacher profile for user ${userId}`);
      }
    }

    return profile;
  } catch (error) {
    console.error("Error in getTeacherProfileByUserId:", error);
    return null;
  }
}


