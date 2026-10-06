"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, FileText, Folder, FolderPlus, Link2, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createPaidFormationFolder,
  createPaidFormationResource,
  deletePaidFormationResource,
  deletePaidFormationFolder,
  movePaidFormationResource,
  renamePaidFormationFolder,
  setPaidFormationStatus,
  setPaidFormationResourceStatus,
} from "@/actions/paidFormations";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface FolderItem {
  id: string;
  name: string;
  parentId: string | null;
  canDelete: boolean;
}

interface ResourceItem {
  id: string;
  folderId: string;
  title: string;
  type: string;
  status: string;
}

export function PaidFormationManager({
  formationId,
  formationStatus,
  folders,
  resources,
}: {
  formationId: string;
  formationStatus: string;
  folders: FolderItem[];
  resources: ResourceItem[];
}) {
  const router = useRouter();
  const [folderPending, startFolderTransition] = useTransition();
  const [resourcePending, startResourceTransition] = useTransition();
  const [statusPending, startStatusTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [createResourceOpen, setCreateResourceOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [parentId, setParentId] = useState("");
  const [editingFolderId, setEditingFolderId] = useState("");
  const [editingFolderName, setEditingFolderName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [folderId, setFolderId] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [resourceType, setResourceType] = useState("PDF");
  const [resourceToDelete, setResourceToDelete] = useState<ResourceItem | null>(null);

  const handleCreateFolder = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData();
    data.set("formationId", formationId);
    data.set("name", folderName);
    data.set("parentId", parentId);
    startFolderTransition(async () => {
      const result = await createPaidFormationFolder(data);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(result.success);
      setFolderName("");
      setParentId("");
      setCreateFolderOpen(false);
      router.refresh();
    });
  };

  const handleRenameFolder = (event: React.FormEvent<HTMLFormElement>, id: string) => {
    event.preventDefault();
    startFolderTransition(async () => {
      const result = await renamePaidFormationFolder(id, editingFolderName);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(result.success);
      setEditingFolderId("");
      router.refresh();
    });
  };

  const handleDeleteFolder = (id: string) => {
    if (!window.confirm("Supprimer ce dossier vide ?")) return;
    startFolderTransition(async () => {
      const result = await deletePaidFormationFolder(id);
      if ("error" in result) toast.error(result.error);
      else { toast.success(result.success); router.refresh(); }
    });
  };

  const handleCreateResource = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startResourceTransition(async () => {
      const data = new FormData();
      data.set("folderId", folderId);
      data.set("title", title);
      data.set("description", description);
      data.set("externalUrl", externalUrl);
      data.set("type", resourceType);
      const result = await createPaidFormationResource(data);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(result.success);
      setTitle("");
      setDescription("");
      setExternalUrl("");
      setCreateResourceOpen(false);
      router.refresh();
    });
  };

  const handleDeleteResource = () => {
    if (!resourceToDelete) return;
    startDeleteTransition(async () => {
      const result = await deletePaidFormationResource(resourceToDelete.id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(result.success);
      setResourceToDelete(null);
      router.refresh();
    });
  };

  const renderFolder = (currentParentId: string | null, depth = 0): React.ReactNode => {
    const children = folders.filter((folder) => folder.parentId === currentParentId);
    return children.map((folder) => (
      <div key={folder.id} className="border-l border-slate-200 dark:border-slate-700" style={{ marginLeft: depth ? 18 : 0 }}>
        <div className="flex items-center gap-2 py-2 pl-3">
          <Folder className="h-4 w-4 shrink-0 text-amber-600" />
          {editingFolderId === folder.id ? (
            <span className="min-w-0 flex-1 truncate font-medium text-slate-800 dark:text-slate-200">{folder.name}</span>
          ) : (
            <>
              <span className="min-w-0 flex-1 truncate font-medium text-slate-800 dark:text-slate-200">{folder.name}</span>
              <button type="button" title="Renommer le dossier" onClick={() => { setEditingFolderId(folder.id); setEditingFolderName(folder.name); }} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"><Pencil className="h-3.5 w-3.5" /></button>
              <button type="button" title={folder.canDelete ? "Supprimer le dossier vide" : "Le dossier doit être vide"} disabled={!folder.canDelete || folderPending} onClick={() => handleDeleteFolder(folder.id)} className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-30"><Trash2 className="h-3.5 w-3.5" /></button>
            </>
          )}
        </div>
        <div className="pl-5">
          {resources.filter((resource) => resource.folderId === folder.id).map((resource) => (
            <div key={resource.id} className="flex items-center justify-between gap-3 border-t border-slate-100 py-2 text-sm dark:border-slate-800">
              <span className="flex min-w-0 items-center gap-2 truncate text-slate-600 dark:text-slate-300">
                <FileText className="h-4 w-4 shrink-0" />{resource.title}
                <span className="text-xs text-slate-400">{resource.type}</span>
              </span>
              <div className="flex shrink-0 items-center gap-2">
                <select aria-label={`Déplacer ${resource.title}`} value={resource.folderId} disabled={statusPending} onChange={(event) => {
                  const targetFolderId = event.currentTarget.value;
                  startStatusTransition(async () => {
                    const result = await movePaidFormationResource(resource.id, targetFolderId);
                    if ("error" in result) toast.error(result.error);
                    else { toast.success(result.success); router.refresh(); }
                  });
                }} className="max-w-36 rounded border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800">
                  {folders.map((target) => <option key={target.id} value={target.id}>{target.name}</option>)}
                </select>
                <button type="button" disabled={statusPending} onClick={() => startStatusTransition(async () => {
                  const result = await setPaidFormationResourceStatus(resource.id, resource.status === "PUBLISHED" ? "ARCHIVED" : "PUBLISHED");
                  if ("error" in result) toast.error(result.error);
                  else { toast.success(result.success); router.refresh(); }
                })} className="text-xs text-blue-700 hover:underline disabled:opacity-50">
                  {resource.status === "PUBLISHED" ? "Archiver" : "Publier"}
                </button>
                <button type="button" title="Supprimer la ressource de la formation" onClick={() => setResourceToDelete(resource)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30" aria-label={`Supprimer ${resource.title}`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        {renderFolder(folder.id, depth + 1)}
      </div>
    ));
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-5 dark:border-slate-700">
        <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
          <DialogTrigger className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
            <FolderPlus className="h-4 w-4" />Nouveau dossier
          </DialogTrigger>
          <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Créer un dossier</DialogTitle>
              <DialogDescription>Choisissez un nom et, si besoin, un dossier parent pour créer un sous-dossier.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Nom du dossier
                <input value={folderName} onChange={(event) => setFolderName(event.target.value)} required maxLength={100} autoFocus className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800" placeholder="Ex. Chapitre 1" />
              </label>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Dossier parent
                <select value={parentId} onChange={(event) => setParentId(event.target.value)} className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800">
                  <option value="">À la racine de la formation</option>
                  {folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
                </select>
              </label>
              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
                <button type="button" disabled={folderPending} onClick={() => setCreateFolderOpen(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">Annuler</button>
                <button disabled={folderPending} className="inline-flex min-w-32 items-center justify-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">
                  {folderPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{folderPending ? "Création…" : "Créer le dossier"}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={createResourceOpen} onOpenChange={setCreateResourceOpen}>
          <DialogTrigger disabled={!folders.length} className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">
            <Link2 className="h-4 w-4" />Ajouter une ressource
          </DialogTrigger>
          <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Ajouter une ressource</DialogTitle>
              <DialogDescription>Collez le lien de la ressource, choisissez son type et son dossier. Le lien reste masqué aux étudiants.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateResource} className="space-y-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Titre
                <input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={160} className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800" placeholder="Titre de la ressource" />
              </label>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Description
                <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} rows={2} className="mt-1.5 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800" placeholder="Description facultative" />
              </label>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Dossier
                <select value={folderId} onChange={(event) => setFolderId(event.target.value)} required className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800">
                  <option value="">Choisir un dossier</option>
                  {folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Type de ressource
                <select value={resourceType} onChange={(event) => setResourceType(event.target.value)} className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800">
                  <option value="PDF">PDF</option>
                  <option value="IMAGE">Image</option>
                  <option value="VIDEO">Vidéo</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Lien de la ressource
                <input value={externalUrl} onChange={(event) => setExternalUrl(event.target.value)} type="url" required placeholder="https://drive.google.com/…, https://…" className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800" />
              </label>
              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
                <button type="button" disabled={resourcePending} onClick={() => setCreateResourceOpen(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">Annuler</button>
                <button disabled={resourcePending || !externalUrl} className="inline-flex min-w-40 items-center justify-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">
                  {resourcePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}{resourcePending ? "Ajout…" : "Ajouter le lien"}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={Boolean(editingFolderId)} onOpenChange={(open) => { if (!open) setEditingFolderId(""); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Renommer le dossier</DialogTitle>
            <DialogDescription>Le contenu du dossier et ses sous-dossiers seront conservés.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(event) => handleRenameFolder(event, editingFolderId)} className="space-y-4">
            <input value={editingFolderName} onChange={(event) => setEditingFolderName(event.target.value)} required maxLength={100} autoFocus className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800" />
            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
              <button type="button" disabled={folderPending} onClick={() => setEditingFolderId("")} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">Annuler</button>
              <button disabled={folderPending} className="inline-flex min-w-32 items-center justify-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">
                {folderPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}{folderPending ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(resourceToDelete)} onOpenChange={(open) => { if (!open && !deletePending) setResourceToDelete(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer cette ressource ?</DialogTitle>
            <DialogDescription>
              « {resourceToDelete?.title} » sera retirée de la formation. Le fichier ou la page source ne sera pas supprimé.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
            <button type="button" disabled={deletePending} onClick={() => setResourceToDelete(null)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">Annuler</button>
            <button type="button" disabled={deletePending} onClick={handleDeleteResource} className="inline-flex min-w-28 items-center justify-center gap-2 rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50">
              {deletePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}{deletePending ? "Suppression…" : "Supprimer"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-slate-900 dark:text-white">Contenu de la formation</h2>
          <button type="button" disabled={statusPending} onClick={() => startStatusTransition(async () => {
            const nextStatus = formationStatus === "PUBLISHED" ? "ARCHIVED" : "PUBLISHED";
            const result = await setPaidFormationStatus(formationId, nextStatus);
            if ("error" in result) toast.error(result.error);
            else { toast.success(result.success); router.refresh(); }
          })} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
            <Archive className="h-4 w-4" />{formationStatus === "PUBLISHED" ? "Archiver la formation" : "Publier la formation"}
          </button>
        </div>
        {folders.length ? <div>{renderFolder(null)}</div> : <p className="text-sm text-slate-500">Créez un premier dossier pour organiser les ressources.</p>}
      </section>
    </div>
  );
}
