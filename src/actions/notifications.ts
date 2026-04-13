"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { uploadToMega } from "@/lib/mega";

// ─── Send a notification ────────────────────────────────────────────────────

export async function sendNotification(formData: FormData) {
  const title        = formData.get("title") as string;
  const message      = formData.get("message") as string;
  const senderId     = formData.get("senderId") as string;
  const senderRole   = formData.get("senderRole") as string;
  const targetType   = formData.get("targetType") as string; // "ALL_CLASSES" | "CLASS" | "TEACHER"
  const targetClassId = formData.get("targetClassId") as string | null;
  const targetUserId  = formData.get("targetUserId") as string | null;
  
  const file = formData.get("file") as File | null;

  if (!title || !message || !senderId || !senderRole || !targetType) {
    return { error: "Champs obligatoires manquants" };
  }

  try {
    let attachmentUrl = null;
    let attachmentName = null;
    let attachmentType = null;

    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = `${Date.now()}-${file.name || "upload"}`;
      attachmentUrl = await uploadToMega(fileName, buffer);
      attachmentName = file.name;
      
      if (file.type.startsWith("image/")) attachmentType = "IMAGE";
      else if (file.type.startsWith("video/")) attachmentType = "VIDEO";
      else if (file.type === "application/pdf") attachmentType = "PDF";
      else attachmentType = "OTHER";
    }

    await prisma.notification.create({
      data: {
        title,
        message,
        senderId,
        senderRole,
        targetType,
        targetClassId: targetClassId || null,
        targetUserId: targetUserId || null,
        attachmentUrl: attachmentUrl || null,
        attachmentName: attachmentName || null,
        attachmentType: attachmentType || null,
      },
    });

    revalidatePath("/dashboard");
    return { success: "Notification envoyée" };
  } catch (error) {
    console.error(error);
    return { error: "Échec de l'envoi de la notification" };
  }
}

// ─── Get notifications for a user ──────────────────────────────────────────

export async function getMyNotifications(
  userId: string,
  role: string,
  studentProfileId?: string,
  page = 1,
  pageSize = 10
) {
  try {
    const skip = (page - 1) * pageSize;
    let whereClause: any = {};

    if (role === "STUDENT" && studentProfileId) {
      // Students: get notifications targeted at their class(es) or ALL_CLASSES
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { id: studentProfileId },
        select: { classes: { select: { id: true } } },
      });
      const classIds = studentProfile?.classes.map((c) => c.id) || [];

      whereClause = {
        OR: [
          { targetType: "ALL_CLASSES" },
          { targetType: "CLASS", targetClassId: { in: classIds } },
        ],
      };
    } else if (role === "TEACHER") {
      // Teachers: notifications targeted at ALL_CLASSES or their userId
      whereClause = {
        OR: [
          { targetType: "ALL_CLASSES" },
          { targetType: "TEACHER", targetUserId: userId },
        ],
      };
    } else if (role === "SECRETARY") {
      // Secretary sees all notifications
      whereClause = {};
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          sender: { select: { id: true, name: true, role: true } },
          targetClass: { select: { id: true, name: true } },
          reads: { where: { userId }, select: { id: true } },
        },
      }),
      prisma.notification.count({ where: whereClause }),
    ]);

    // Map read status
    const notificationsWithRead = notifications.map((n) => ({
      ...n,
      isRead: n.reads.length > 0,
    }));

    return {
      notifications: notificationsWithRead,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    console.error(error);
    return { error: "Erreur de récupération des notifications" };
  }
}

// ─── Get sent notifications ─────────────────────────────────────────────────

export async function getSentNotifications(senderId: string, page = 1, pageSize = 10) {
  try {
    const skip = (page - 1) * pageSize;
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { senderId },
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          targetClass: { select: { name: true } },
          reads: { select: { id: true } },
        },
      }),
      prisma.notification.count({ where: { senderId } }),
    ]);

    return { notifications, total, totalPages: Math.ceil(total / pageSize) };
  } catch (error) {
    return { error: "Erreur" };
  }
}

// ─── Mark as read ───────────────────────────────────────────────────────────

export async function markAsRead(notificationId: string, userId: string) {
  try {
    await prisma.notificationRead.upsert({
      where: { notificationId_userId: { notificationId, userId } },
      update: {},
      create: { notificationId, userId },
    });
    return { success: true };
  } catch (error) {
    return { error: "Erreur" };
  }
}

export async function markAllAsRead(userId: string, role: string, studentProfileId?: string) {
  try {
    // Fetch the raw notification IDs the user can see
    const res = await getMyNotifications(userId, role, studentProfileId, 1, 1000);
    if ("error" in res) return { error: res.error };

    const ids = res.notifications.filter((n) => !n.isRead).map((n) => n.id);
    if (ids.length === 0) return { success: true };

    await prisma.notificationRead.createMany({
      data: ids.map((notificationId) => ({ notificationId, userId })),
      skipDuplicates: true,
    });

    return { success: true };
  } catch (error) {
    return { error: "Erreur" };
  }
}

// ─── Unread count (for badge) ───────────────────────────────────────────────

export async function getUnreadCount(userId: string, role: string, studentProfileId?: string) {
  try {
    const res = await getMyNotifications(userId, role, studentProfileId, 1, 200);
    if ("error" in res) return { count: 0 };
    const count = res.notifications.filter((n) => !n.isRead).length;
    return { count };
  } catch (error) {
    return { count: 0 };
  }
}

// ─── Get teachers list for targeting ────────────────────────────────────────

export async function getTeachersForNotification() {
  try {
    const teachers = await prisma.user.findMany({
      where: { role: "TEACHER" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return teachers;
  } catch (error) {
    return [];
  }
}
