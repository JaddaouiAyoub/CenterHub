import { z } from "zod";

// ─── Enums (mirror Prisma enums) ─────────────────────────────────────────────

export const PaidResourceTypeValues = ["PDF", "IMAGE", "VIDEO"] as const;
export type PaidResourceType = (typeof PaidResourceTypeValues)[number];

export const PaidResourceStatusValues = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type PaidResourceStatus = (typeof PaidResourceStatusValues)[number];

export const PaidResourceSourceValues = ["DRIVE", "URL"] as const;
export type PaidResourceSource = (typeof PaidResourceSourceValues)[number];

export const PurchaseStatusValues = ["PENDING", "COMPLETED", "REFUNDED"] as const;
export type PurchaseStatus = (typeof PurchaseStatusValues)[number];

export const PaymentMethodValues = ["CASH", "CARD", "TRANSFER"] as const;
export type PaymentMethod = (typeof PaymentMethodValues)[number];

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const BasePaidResourceSchema = z.object({
  title: z.string().min(2, "Le titre doit faire au moins 2 caractères").max(200),
  description: z.string().max(2000).optional(),
  price: z.coerce.number().min(0, "Le prix ne peut pas être négatif"),
  type: z.enum(PaidResourceTypeValues),
  source: z.enum(PaidResourceSourceValues),
  // Drive upload fields
  driveFileId: z.string().optional(),
  mimeType: z.string().optional(),
  // URL fields
  externalUrl: z.string().url("URL invalide").optional(),
  // Relations
  subjectId: z.string().optional(),
  classId: z.string().optional(),
  teacherId: z.string().optional(),
  status: z.enum(PaidResourceStatusValues).default("DRAFT"),
});

export const CreatePaidResourceSchema = BasePaidResourceSchema.superRefine((data, ctx) => {
  if (data.source === "DRIVE" && !data.driveFileId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Un fichier Drive est requis pour la source DRIVE",
      path: ["driveFileId"],
    });
  }
  if (data.source === "URL" && !data.externalUrl) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Une URL est requise pour la source URL",
      path: ["externalUrl"],
    });
  }
});

export type CreatePaidResourceInput = z.infer<typeof CreatePaidResourceSchema>;

export const UpdatePaidResourceSchema = BasePaidResourceSchema.partial()
  .extend({
    id: z.string().cuid(),
  })
  .superRefine((data, ctx) => {
    // For updates, we only check if the field is present AND the source is set
    if (data.source === "DRIVE" && !data.driveFileId && data.driveFileId !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Un fichier Drive est requis pour la source DRIVE",
        path: ["driveFileId"],
      });
    }
  });

export type UpdatePaidResourceInput = z.infer<typeof UpdatePaidResourceSchema>;

export const CreatePurchaseSchema = z.object({
  resourceId: z.string().cuid(),
  studentId: z.string().cuid(),
  amountPaid: z.coerce.number().min(0),
  method: z.enum(PaymentMethodValues).default("CASH"),
  status: z.enum(PurchaseStatusValues).default("COMPLETED"),
});
export type CreatePurchaseInput = z.infer<typeof CreatePurchaseSchema>;

// ─── List / filter params ────────────────────────────────────────────────────

export const ListPaidResourcesParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  subjectId: z.string().optional(),
  classId: z.string().optional(),
  teacherId: z.string().optional(),
  type: z.enum(PaidResourceTypeValues).optional(),
  status: z.enum(PaidResourceStatusValues).optional(),
  source: z.enum(PaidResourceSourceValues).optional(),
  sortBy: z.enum(["createdAt", "price", "totalSales", "totalRevenue", "title"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});
export type ListPaidResourcesParams = z.infer<typeof ListPaidResourcesParamsSchema>;

export const ListPurchasesParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  resourceId: z.string().optional(),
  studentId: z.string().optional(),
  status: z.enum(PurchaseStatusValues).optional(),
  method: z.enum(PaymentMethodValues).optional(),
  sortBy: z.enum(["purchasedAt", "amountPaid"]).default("purchasedAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});
export type ListPurchasesParams = z.infer<typeof ListPurchasesParamsSchema>;

// ─── Response DTOs ────────────────────────────────────────────────────────────

export interface PaidResourceDTO {
  id: string;
  title: string;
  description: string | null;
  price: number;
  type: PaidResourceType;
  mimeType: string;
  source: PaidResourceSource;
  status: PaidResourceStatus;
  totalSales: number;
  totalRevenue: number;
  subjectId: string | null;
  subject: { id: string; name: string } | null;
  classId: string | null;
  class: { id: string; name: string } | null;
  teacherId: string | null;
  teacher: { id: string; user: { name: string | null } } | null;
  createdAt: Date;
  updatedAt: Date;
  // NOTE: driveFileId and externalUrl are NEVER included in DTOs sent to client
}

export interface PurchaseDTO {
  id: string;
  amountPaid: number;
  method: string;
  status: PurchaseStatus;
  purchasedAt: Date;
  resource: {
    id: string;
    title: string;
    type: PaidResourceType;
    mimeType: string;
    source: PaidResourceSource;
    subject: { id: string; name: string } | null;
  };
  student: {
    id: string;
    user: { id: string; name: string | null; email: string };
  };
}

export interface PaidResourceAnalytics {
  totalRevenue: number;
  totalPurchases: number;
  totalResources: number;
  publishedResources: number;
  averagePrice: number;
  monthlyRevenue: { month: string; revenue: number; purchases: number }[];
  topResources: { title: string; totalSales: number; totalRevenue: number }[];
  topSubjects: { name: string; totalRevenue: number; totalSales: number }[];
  topTeachers: { name: string; totalRevenue: number; totalSales: number }[];
  revenueByType: { type: string; revenue: number; count: number }[];
}
