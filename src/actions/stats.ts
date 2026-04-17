"use server";

import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function getDashboardStats() {
  try {
    const [studentCount, teacherCount, courseCount, subjectCount, classCount, recentPayments] = await Promise.all([
      prisma.user.count({ where: { role: Role.STUDENT } }),
      prisma.user.count({ where: { role: Role.TEACHER } }),
      prisma.course.count(),
      prisma.subject.count(),
      prisma.class.count(),
      prisma.payment.findMany({
        take: 5,
        orderBy: { date: "desc" },
        select: {
          id: true,
          amount: true,
          date: true,
          status: true,
          student: {
            select: {
              id: true,
              user: { select: { name: true, image: true } }
            }
          }
        }
      })
    ]);

    const totalRevenue = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "PAID" }
    });

    return {
      stats: {
        studentCount,
        teacherCount,
        courseCount,
        subjectCount,
        classCount,
        totalRevenue: totalRevenue._sum.amount || 0
      },
      recentPayments
    };
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return { error: "Failed to fetch dashboard statistics" };
  }
}
