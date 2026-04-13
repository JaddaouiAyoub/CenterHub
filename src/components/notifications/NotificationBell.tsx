"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, Check, FileText, Video, ImageIcon, FileIcon, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getUnreadCount, getMyNotifications, markAsRead, markAllAsRead } from "@/actions/notifications";
import { useParams, useRouter } from "next/navigation";
import { DocumentViewer } from "@/components/dashboard/teacher/DocumentViewer";
import { cn } from "@/lib/utils";

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "À l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

function AttachmentIcon({ type }: { type: string | null }) {
  if (!type) return null;
  if (type === "PDF")   return <FileText className="w-3.5 h-3.5 text-red-500" />;
  if (type === "VIDEO") return <Video className="w-3.5 h-3.5 text-blue-500" />;
  if (type === "IMAGE") return <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />;
  return <FileIcon className="w-3.5 h-3.5 text-slate-400" />;
}

interface NotificationBellProps {
  userId: string;
  role: string;
  studentProfileId?: string;
}

export function NotificationBell({ userId, role, studentProfileId }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const fetchCount = useCallback(async () => {
    const res = await getUnreadCount(userId, role, studentProfileId);
    setUnreadCount(res.count);
  }, [userId, role, studentProfileId]);

  const fetchPreview = useCallback(async () => {
    setLoading(true);
    const res = await getMyNotifications(userId, role, studentProfileId, 1, 5);
    if (res.notifications) setNotifications(res.notifications);
    setLoading(false);
  }, [userId, role, studentProfileId]);

  // Initial load + polling every 30s
  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  const handleOpen = async () => {
    if (!isOpen) {
      setIsOpen(true);
      await fetchPreview();
    } else {
      setIsOpen(false);
    }
  };

  const handleNotificationClick = async (notif: any) => {
    if (!notif.isRead) {
      await markAsRead(notif.id, userId);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    }
    // We remove the open tab logic since DocumentViewer handles it now
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead(userId, role, studentProfileId);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative">
      {/* Bell button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative text-slate-600 hover:bg-slate-100 rounded-xl"
        onClick={handleOpen}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-white px-0.5">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute right-0 top-12 z-50 w-[380px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-50">
              <div>
                <h3 className="font-black text-slate-900">Notifications</h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-blue-600 font-medium mt-0.5">{unreadCount} non-lue(s)</p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-blue-600 font-bold h-8 px-3 hover:bg-blue-50 rounded-lg"
                    onClick={handleMarkAllRead}
                  >
                    <Check className="w-3 h-3 mr-1" /> Tout lire
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:bg-slate-100 rounded-lg" onClick={() => setIsOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-[360px] overflow-y-auto">
              {loading ? (
                <div className="py-12 flex flex-col items-center space-y-3">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-slate-400 text-sm">Chargement...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm font-medium">Aucune notification</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={cn(
                      "w-full text-left px-4 py-3.5 border-b border-slate-50 hover:bg-slate-50/70 transition-colors flex items-start space-x-3",
                      !notif.isRead && "bg-blue-50/40"
                    )}
                  >
                    {/* Unread dot */}
                    <div className="flex-shrink-0 mt-1.5">
                      {!notif.isRead ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full bg-transparent" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <p className={cn("text-sm font-bold text-slate-900 truncate", !notif.isRead && "text-blue-900")}>
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2 mt-0.5">{timeAgo(notif.createdAt)}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 font-medium">{notif.message}</p>
                      <div className="flex items-center space-x-2 mt-1.5">
                        <span className="text-[10px] text-slate-400 font-medium">
                          {notif.sender?.name} · {notif.senderRole === "SECRETARY" ? "Secrétariat" : "Prof"}
                        </span>
                        {notif.attachmentUrl && (
                          <div onClick={(e) => e.stopPropagation()}>
                            <DocumentViewer
                              notificationId={notif.id}
                              name={notif.attachmentName || "Fichier"}
                              type={notif.attachmentType || "OTHER"}
                              trigger={
                                <button className="flex items-center space-x-0.5 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full hover:bg-blue-100 transition-colors shadow-[0_0_0_1px_theme(colors.blue.100)]">
                                  <AttachmentIcon type={notif.attachmentType} />
                                  <span>{notif.attachmentName || "Fichier"}</span>
                                </button>
                              }
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-50">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push(`/${locale}/dashboard/notifications`);
                }}
                className="w-full flex items-center justify-center space-x-2 text-sm font-bold text-blue-600 hover:text-blue-700 py-2 hover:bg-blue-50 rounded-xl transition-colors"
              >
                <span>Voir toutes les notifications</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
