"use server";

import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";
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
        include: {
          studentProfile: {
            include: {
              classes: true,
              subjects: true
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
