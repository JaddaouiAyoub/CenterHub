import { google } from "googleapis";
import { Readable } from "stream";

// ─── Auth ──────────────────────────────────────────────────────────────────

function getDriveAuth() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_REFRESH_TOKEN in env"
    );
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  return oauth2Client;
}

function getDriveClient() {
  return google.drive({ version: "v3", auth: getDriveAuth() });
}

// ─── Folder helpers ─────────────────────────────────────────────────────────

const folderCache = new Map<string, string>();

/**
 * Returns the Drive folderId for a given subject name.
 * Creates the subfolder under the root folder if it does not exist yet.
 */
export async function getOrCreateSubjectFolder(
  subjectName: string
): Promise<string> {
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootFolderId) throw new Error("GOOGLE_DRIVE_ROOT_FOLDER_ID not set in env");

  // In-process cache to avoid redundant Drive API calls per request
  const cacheKey = `${rootFolderId}::${subjectName}`;
  if (folderCache.has(cacheKey)) return folderCache.get(cacheKey)!;

  const drive = getDriveClient();

  // Search for existing folder
  const res = await drive.files.list({
    q: `'${rootFolderId}' in parents and name = '${subjectName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id, name)",
    spaces: "drive",
  });

  if (res.data.files && res.data.files.length > 0) {
    const folderId = res.data.files[0].id!;
    folderCache.set(cacheKey, folderId);
    return folderId;
  }

  // Create new subfolder
  const createRes = await drive.files.create({
    requestBody: {
      name: subjectName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [rootFolderId],
    },
    fields: "id",
  });

  const newFolderId = createRes.data.id!;
  folderCache.set(cacheKey, newFolderId);
  return newFolderId;
}

// ─── Upload ──────────────────────────────────────────────────────────────────

export interface UploadResult {
  fileId: string;
  name: string;
  mimeType: string;
  size: number;
}

/**
 * Uploads a buffer to Google Drive into the subject's subfolder.
 * File is kept PRIVATE — no public permissions are set.
 */
export async function uploadFileToDrive(
  fileName: string,
  buffer: Buffer,
  mimeType: string,
  subjectName: string
): Promise<UploadResult> {
  const folderId = await getOrCreateSubjectFolder(subjectName);
  const drive = getDriveClient();

  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);

  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: readable,
    },
    fields: "id, name, mimeType, size",
  });

  return {
    fileId: res.data.id!,
    name: res.data.name!,
    mimeType: res.data.mimeType ?? mimeType,
    size: Number(res.data.size ?? buffer.length),
  };
}

// ─── Stream ──────────────────────────────────────────────────────────────────

/**
 * Returns a Node.js Readable stream for the file from Google Drive.
 * Called by the secure streaming route handler — Drive URL NEVER sent to client.
 */
export async function streamFileFromDrive(
  fileId: string
): Promise<{ stream: NodeJS.ReadableStream; mimeType: string; size: number }> {
  const drive = getDriveClient();

  // Fetch metadata first so we can set correct Content-Type
  const meta = await drive.files.get({
    fileId,
    fields: "mimeType, size",
  });

  const res = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "stream" }
  );

  return {
    stream: res.data as NodeJS.ReadableStream,
    mimeType: meta.data.mimeType ?? "application/octet-stream",
    size: Number(meta.data.size ?? 0),
  };
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export interface DriveFileMetadata {
  name: string;
  mimeType: string;
  size: number;
}

export async function getFileMetadata(
  fileId: string
): Promise<DriveFileMetadata> {
  const drive = getDriveClient();

  const res = await drive.files.get({
    fileId,
    fields: "name, mimeType, size",
  });

  return {
    name: res.data.name ?? "Unknown",
    mimeType: res.data.mimeType ?? "application/octet-stream",
    size: Number(res.data.size ?? 0),
  };
}

// ─── Delete ──────────────────────────────────────────────────────────────────

/**
 * Permanently deletes a file from Google Drive.
 * Called when an admin deletes a PaidResource.
 */
export async function deleteFileFromDrive(fileId: string): Promise<void> {
  const drive = getDriveClient();
  await drive.files.delete({ fileId });
}
