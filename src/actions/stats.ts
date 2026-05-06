"use server";

import prisma from "@/lib/prisma";
import { Role } from "@/types/prisma";

export async function getDashboardStats() {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const [
      studentCount, 
      teacherCount, 
      courseCount, 
      subjectCount, 
      classCount, 
      recentPayments,
      totalRevenueData,
      currentMonthRevenueData,
      monthlyHistory
    ] = await Promise.all([
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
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: "PAID" }
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { 
          status: "PAID",
          month: currentMonth,
          year: currentYear
        }
      }),
      prisma.payment.groupBy({
        by: ['year', 'month'],
        _sum: { amount: true },
        where: { status: "PAID" },
        orderBy: [
          { year: 'desc' },
          { month: 'desc' }
        ],
        take: 6
      })
    ]);

    // Format monthly history for the chart
    const chartData = monthlyHistory.map((item: { month: any; year: any; _sum: { amount: any; }; }) => ({
      name: `${item.month}/${item.year}`,
      total: item._sum.amount || 0,
      month: item.month,
      year: item.year
    })).reverse();

    return {
      stats: {
        studentCount,
        teacherCount,
        courseCount,
        subjectCount,
        classCount,
        totalRevenue: totalRevenueData._sum.amount || 0,
        currentMonthRevenue: currentMonthRevenueData._sum.amount || 0,
        chartData
      },
      recentPayments
    };
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return { error: "Failed to fetch dashboard statistics" };
  }
}
