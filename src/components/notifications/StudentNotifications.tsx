"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, Clock, Eye, FileText, Video, ImageIcon, FileIcon, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMyNotifications, markAsRead, markAllAsRead } from "@/actions/notifications";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { DocumentViewer } from "@/components/dashboard/teacher/DocumentViewer";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  userId: string;
  studentProfileId: string;
}

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "À l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days}j`;
  return new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function AttachmentBadge({ url, name, type, notifId }: { url: string; name?: string | null; type?: string | null; notifId: string }) {
  const icon =
    type === "PDF"   ? <FileText className="w-3.5 h-3.5 text-red-500" /> :
    type === "VIDEO" ? <Video className="w-3.5 h-3.5 text-blue-500" /> :
    type === "IMAGE" ? <ImageIcon className="w-3.5 h-3.5 text-emerald-500" /> :
    <FileIcon className="w-3.5 h-3.5 text-slate-400" />;

  return (
    <div onClick={(e) => e.stopPropagation()} className="mt-3">
      <DocumentViewer
        notificationId={notifId}
        name={name || "Pièce jointe"}
        type={type || "OTHER"}
        trigger={
          <button
            className="inline-flex items-center space-x-1.5 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors"
          >
            {icon}
            <span className="max-w-[200px] truncate">{name || "Ouvrir le fichier"}</span>
            <Eye className="w-3 h-3 opacity-60" />
          </button>
        }
      />
    </div>
  );
}

export function StudentNotifications({ userId, studentProfileId }: Props) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const res = await getMyNotifications(userId, "STUDENT", studentProfileId, page, pageSize);
    if (res.notifications) {
      setNotifications(res.notifications);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    }
    setLoading(false);
  }, [userId, studentProfileId, page]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (notif: any) => {
    if (!notif.isRead) {
      await markAsRead(notif.id, userId);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
    }
  };

  const handleMarkAll = async () => {
    await markAllAsRead(userId, "STUDENT", studentProfileId);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    toast.success("Toutes les notifications marquées comme lues");
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Mes Notifications</h2>
            <p className="text-slate-500 text-sm font-medium">
              {total} notification(s) •{" "}
              {unreadCount > 0
                ? <span className="text-blue-600 font-bold">{unreadCount} non-lue(s)</span>
                : <span className="text-emerald-600 font-bold">Tout lu ✓</span>
              }
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl font-bold h-9"
            onClick={handleMarkAll}
          >
            <CheckCircle className="w-4 h-4 mr-2" /> Tout marquer comme lu
          </Button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-20 flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-medium">Chargement de vos notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-24 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="inline-flex p-5 bg-slate-50 rounded-full mb-4">
            <Bell className="w-12 h-12 text-slate-200" />
          </div>
          <h3 className="text-slate-700 font-bold text-lg">Aucune notification</h3>
          <p className="text-slate-400 text-sm mt-2">Vous serez notifié ici de vos cours, devoirs et messages.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleMarkRead(notif)}
              className={cn(
                "bg-white rounded-2xl border shadow-sm p-5 cursor-pointer transition-all hover:shadow-md",
                !notif.isRead
                  ? "border-blue-200 bg-gradient-to-r from-blue-50/60 to-white"
                  : "border-slate-100"
              )}
            >
              <div className="flex items-start space-x-4">
                {/* Avatar / Indicator */}
                <div className="flex-shrink-0">
                  {!notif.isRead ? (
                    <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-sm shadow-blue-300">
                      {notif.sender?.name?.charAt(0) || "?"}
                    </div>
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-sm">
                      {notif.sender?.name?.charAt(0) || "?"}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center space-x-2 flex-wrap gap-1">
                      <h4 className={cn(
                        "font-bold text-base",
                        !notif.isRead ? "text-blue-900" : "text-slate-900"
                      )}>
                        {notif.title}
                      </h4>
                      {!notif.isRead && (
                        <span className="inline-flex items-center bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                          Nouveau
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 text-[11px] text-slate-400 font-medium whitespace-nowrap">
                      <Clock className="w-3 h-3" />
                      <span>{timeAgo(notif.createdAt)}</span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 font-medium mt-1.5 leading-relaxed">{notif.message}</p>

                  <div className="flex items-center space-x-2 mt-2 flex-wrap gap-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {notif.sender?.name} · {notif.senderRole === "SECRETARY" ? "Secrétariat" : "Enseignant"}
                    </span>
                    {notif.isRead && (
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center space-x-0.5">
                        <CheckCircle className="w-2.5 h-2.5" />
                        <span>Lu</span>
                      </span>
                    )}
                  </div>

                  {notif.attachmentUrl && (
                    <AttachmentBadge
                      url={notif.attachmentUrl}
                      name={notif.attachmentName}
                      type={notif.attachmentType}
                      notifId={notif.id}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}

          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={total}
            onPageChange={setPage}
            onPageSizeChange={() => {}}
          />
        </div>
      )}
    </div>
  );
}
