"use server";

import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function getStudents() {
  try {
    const students = await prisma.user.findMany({
      where: { role: Role.STUDENT },
      include: {
        studentProfile: {
          include: {
            class: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return { students };
  } catch (error) {
    return { error: "Failed to fetch students" };
  }
}

export async function registerStudent(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const dateOfBirth = formData.get("dateOfBirth") as string;
  const classId = formData.get("classId") as string;

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
            classId: classId || null
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
  const dateOfBirth = formData.get("dateOfBirth") as string;
  const classId = formData.get("classId") as string;

  try {
    await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        studentProfile: {
          update: {
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            classId: classId || null
          }
        }
      }
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
