// src/app/(main)/dashboard/approvals/_components/data.tsx
import type { ApprovalRequest } from '@/generated/prisma/client';

export const statusMeta = {
  APPROVED: {
    badgeClass: "border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
    dotClass: "bg-emerald-500",
  },
  PENDING: {
    badgeClass: "border-amber-500/30 text-amber-700 dark:text-amber-300",
    dotClass: "bg-amber-500",
  },
  REJECTED: {
    badgeClass: "border-rose-500/30 text-rose-700 dark:text-rose-300",
    dotClass: "bg-rose-500",
  },
};

// Gunakan tipe data bawaan dari Prisma untuk konsistensi seluruh aplikasi
export type ApprovalRow = ApprovalRequest;

export const filters = {
  type: ["All", "NEW_ITEM", "NEW_VENDOR", "STOCK_IN", "STOCK_OUT", "STOCK_OPNAME"],
  status: ["All", "PENDING", "APPROVED", "REJECTED"],
} as const;