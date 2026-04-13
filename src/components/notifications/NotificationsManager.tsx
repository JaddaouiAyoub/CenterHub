"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Bell, Send, Inbox, CheckCircle2, Clock, 
  FileText, Video, ImageIcon, FileIcon,
  Eye, RefreshCw, BookOpen, GraduationCap
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SendNotificationForm } from "./SendNotificationForm";
import { getMyNotifications, getSentNotifications, markAsRead } from "@/actions/notifications";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { DocumentViewer } from "@/components/dashboard/teacher/DocumentViewer";
import { cn } from "@/lib/utils";

interface Props {
  userId: string;
  role: "SECRETARY" | "TEACHER";
  studentProfileId?: string;
  /** Teacher: their assigned class IDs for targeting */
  assignedClassIds?: string[];
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
  const icon = type === "PDF" ? <FileText className="w-3 h-3" /> :
               type === "VIDEO" ? <Video className="w-3 h-3" /> :
               type === "IMAGE" ? <ImageIcon className="w-3 h-3" /> :
               <FileIcon className="w-3 h-3" />;
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DocumentViewer
        notificationId={notifId}
        name={name || "Pièce jointe"}
        type={type || "OTHER"}
        trigger={
          <button
            className="inline-flex items-center space-x-1 bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full hover:bg-blue-100 transition-colors border border-blue-100 cursor-pointer"
          >
            {icon}
            <span className="max-w-[120px] truncate ml-1">{name || "Pièce jointe"}</span>
          </button>
        }
      />
    </div>
  );
}

function TargetLabel({ targetType, targetClass, targetUserId }: any) {
  if (targetType === "ALL_CLASSES") return <Badge className="bg-indigo-100 text-indigo-700 border-none text-[10px] font-bold"><GraduationCap className="w-2.5 h-2.5 mr-1" />Toutes les classes</Badge>;
  if (targetType === "CLASS" && targetClass) return <Badge className="bg-purple-100 text-purple-700 border-none text-[10px] font-bold"><BookOpen className="w-2.5 h-2.5 mr-1" />{targetClass.name}</Badge>;
  if (targetType === "TEACHER") return <Badge className="bg-amber-100 text-amber-700 border-none text-[10px] font-bold"><Bell className="w-2.5 h-2.5 mr-1" />Enseignant ciblé</Badge>;
  return null;
}

export function NotificationsManager({ userId, role, assignedClassIds }: Props) {
  const [tab, setTab] = useState<"received" | "send" | "sent">("received");
  
  // Received
  const [received, setReceived] = useState<any[]>([]);
  const [receivedPage, setReceivedPage] = useState(1);
  const [receivedTotal, setReceivedTotal] = useState(0);
  const [receivedTotalPages, setReceivedTotalPages] = useState(1);

  // Sent
  const [sent, setSent] = useState<any[]>([]);
  const [sentPage, setSentPage] = useState(1);
  const [sentTotal, setSentTotal] = useState(0);
  const [sentTotalPages, setSentTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);

  const fetchReceived = useCallback(async () => {
    setLoading(true);
    const res = await getMyNotifications(userId, role, undefined, receivedPage, 8);
    if (res.notifications) {
      setReceived(res.notifications);
      setReceivedTotal(res.total || 0);
      setReceivedTotalPages(res.totalPages || 1);
    }
    setLoading(false);
  }, [userId, role, receivedPage]);

  const fetchSent = useCallback(async () => {
    setLoading(true);
    const res = await getSentNotifications(userId, sentPage, 8);
    if (res.notifications) {
      setSent(res.notifications);
      setSentTotal(res.total || 0);
      setSentTotalPages(res.totalPages || 1);
    }
    setLoading(false);
  }, [userId, sentPage]);

  useEffect(() => {
    if (tab === "received") fetchReceived();
    if (tab === "sent") fetchSent();
  }, [tab, fetchReceived, fetchSent]);

  const handleMarkRead = async (notif: any) => {
    if (!notif.isRead) {
      await markAsRead(notif.id, userId);
      setReceived(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
    }
  };

  const tabs = [
    { key: "received", label: "Reçues", icon: Inbox },
    { key: "send",     label: "Envoyer", icon: Send },
    { key: "sent",     label: "Envoyées", icon: CheckCircle2 },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Notifications</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Gérez vos communications avec la communauté scolaire.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl h-9"
          onClick={() => tab === "received" ? fetchReceived() : fetchSent()}
        >
          <RefreshCw className="w-3.5 h-3.5 mr-2" /> Actualiser
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit space-x-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center space-x-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all",
              tab === key
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Received Tab */}
      {tab === "received" && (
        <div className="space-y-4">
          {loading ? (
            <div className="py-16 flex flex-col items-center space-y-3">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 font-medium text-sm">Chargement...</p>
            </div>
          ) : received.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-2xl border border-slate-100">
              <Bell className="w-14 h-14 text-slate-200 mx-auto mb-4" />
              <h3 className="text-slate-700 font-bold text-lg">Aucune notification</h3>
              <p className="text-slate-400 text-sm mt-1">Vos notifications apparaîtront ici.</p>
            </div>
          ) : (
            <>
              {received.map((notif) => (
                <NotificationCard key={notif.id} notif={notif} userId={userId} onRead={handleMarkRead} mode="received" />
              ))}
              <PaginationControls
                currentPage={receivedPage}
                totalPages={receivedTotalPages}
                pageSize={8}
                totalItems={receivedTotal}
                onPageChange={setReceivedPage}
                onPageSizeChange={() => {}}
              />
            </>
          )}
        </div>
      )}

      {/* Send Tab */}
      {tab === "send" && (
        <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-white/20 rounded-xl">
                <Send className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-black text-lg">Nouvelle Notification</h3>
                <p className="text-blue-100 text-sm">Envoyez un message à votre audience.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <SendNotificationForm
              senderId={userId}
              senderRole={role}
              availableClassIds={assignedClassIds}
              onSuccess={() => { setTab("sent"); fetchSent(); }}
            />
          </CardContent>
        </Card>
      )}

      {/* Sent Tab */}
      {tab === "sent" && (
        <div className="space-y-4">
          {loading ? (
            <div className="py-16 flex flex-col items-center space-y-3">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 font-medium text-sm">Chargement...</p>
            </div>
          ) : sent.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-2xl border border-slate-100">
              <Send className="w-14 h-14 text-slate-200 mx-auto mb-4" />
              <h3 className="text-slate-700 font-bold text-lg">Aucun envoi</h3>
              <p className="text-slate-400 text-sm mt-1">Vos notifications envoyées apparaîtront ici.</p>
            </div>
          ) : (
            <>
              {sent.map((notif) => (
                <NotificationCard key={notif.id} notif={notif} userId={userId} onRead={() => {}} mode="sent" />
              ))}
              <PaginationControls
                currentPage={sentPage}
                totalPages={sentTotalPages}
                pageSize={8}
                totalItems={sentTotal}
                onPageChange={setSentPage}
                onPageSizeChange={() => {}}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Single Notification Card ────────────────────────────────────────────────

function NotificationCard({ notif, userId, onRead, mode }: {
  notif: any;
  userId: string;
  onRead: (n: any) => void;
  mode: "received" | "sent";
}) {
  return (
    <div
      onClick={() => mode === "received" && onRead(notif)}
      className={cn(
        "bg-white rounded-2xl border shadow-sm p-5 transition-all",
        mode === "received" && !notif.isRead
          ? "border-blue-200 bg-blue-50/30 cursor-pointer hover:shadow-md"
          : "border-slate-100 hover:shadow-sm",
        mode === "received" && "cursor-pointer"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start space-x-4 flex-1 min-w-0">
          {/* Unread indicator */}
          {mode === "received" && (
            <div className="flex-shrink-0 mt-2">
              {!notif.isRead
                ? <div className="w-3 h-3 rounded-full bg-blue-600 ring-4 ring-blue-100" />
                : <div className="w-3 h-3 rounded-full bg-slate-200" />
              }
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2 flex-wrap gap-1">
                <h4 className={cn(
                  "font-bold text-base",
                  mode === "received" && !notif.isRead ? "text-blue-900" : "text-slate-900"
                )}>
                  {notif.title}
                </h4>
                {mode === "received" && !notif.isRead && (
                  <Badge className="bg-blue-600 text-white border-none text-[9px] font-black uppercase px-1.5">
                    NOUVEAU
                  </Badge>
                )}
              </div>
              <span className="text-xs text-slate-400 font-medium whitespace-nowrap flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {timeAgo(notif.createdAt)}
              </span>
            </div>

            <p className="text-slate-600 text-sm mt-2 leading-relaxed font-medium">{notif.message}</p>

            <div className="flex items-center flex-wrap gap-2 mt-3">
              {/* Targeting */}
              {mode === "sent" && (
                <TargetLabel
                  targetType={notif.targetType}
                  targetClass={notif.targetClass}
                  targetUserId={notif.targetUserId}
                />
              )}
              {/* Sender (for received) */}
              {mode === "received" && (
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {notif.sender?.name} · {notif.senderRole === "SECRETARY" ? "Secrétariat" : "Enseignant"}
                </span>
              )}
              {/* Read count (for sent) */}
              {mode === "sent" && (
                <span className="flex items-center space-x-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                  <Eye className="w-2.5 h-2.5" />
                  <span>{notif.reads?.length || 0} lecture(s)</span>
                </span>
              )}
              {/* Attachment */}
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
      </div>
    </div>
  );
}
