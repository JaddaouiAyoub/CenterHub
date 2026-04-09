"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getPayments(search = "", page = 1, pageSize = 10) {
  try {
    const skip = (page - 1) * pageSize;
    const whereClause: any = {};
    if (search) {
      whereClause.student = {
        user: { name: { contains: search, mode: "insensitive" } }
      };
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: whereClause,
        skip,
        take: pageSize,
        include: {
          student: { include: { user: true } }
        },
        orderBy: { date: "desc" }
      }),
      prisma.payment.count({ where: whereClause })
    ]);
    return { payments, total, totalPages: Math.ceil(total / pageSize) };
  } catch (error) {
    return { error: "Failed to fetch payments" };
  }
}

export async function createPayment(formData: FormData) {
  const studentId = formData.get("studentId") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const month = parseInt(formData.get("month") as string);
  const year = parseInt(formData.get("year") as string);
  const status = formData.get("status") as string;
  const method = formData.get("method") as string;

  if (!studentId || isNaN(amount) || isNaN(month) || isNaN(year) || !status) {
    return { error: "Missing required fields" };
  }

  try {
    await prisma.payment.create({
      data: {
        studentId,
        amount,
        month,
        year,
        status,
        method: method || "CASH"
      }
    });

    revalidatePath("/dashboard");
    return { success: "Payment recorded successfully" };
  } catch (error) {
    return { error: "Failed to record payment" };
  }
}

export async function updatePaymentStatus(id: string, status: string) {
  try {
    await prisma.payment.update({
      where: { id },
      data: { status }
    });
    revalidatePath("/dashboard");
    return { success: "Payment status updated successfully" };
  } catch (error) {
    return { error: "Failed to update payment status" };
  }
}

export async function updatePayment(id: string, formData: FormData) {
  const studentId = formData.get("studentId") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const month = parseInt(formData.get("month") as string);
  const year = parseInt(formData.get("year") as string);
  const status = formData.get("status") as string;
  const method = formData.get("method") as string;

  try {
    await prisma.payment.update({
      where: { id },
      data: {
        studentId,
        amount,
        month,
        year,
        status,
        method
      }
    });

    revalidatePath("/dashboard");
    return { success: "Payment updated successfully" };
  } catch (error) {
    return { error: "Failed to update payment" };
  }
}

export async function deletePayment(id: string) {
  try {
    await prisma.payment.delete({ where: { id } });
    revalidatePath("/dashboard");
    return { success: "Payment record deleted successfully" };
  } catch (error) {
    return { error: "Failed to delete payment record" };
  }
}
