// src/app/(main)/dashboard/approvals/_components/approvals-columns.tsx
"use client";
"use no memo";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, Clock, MoreHorizontal, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Impor server actions yang sudah terintegrasi dengan VFlow Task API
import { approveRequestAction, rejectRequestAction } from "@/server/server-actions";
import { statusMeta, type ApprovalRow } from "./data";

export const approvalsColumns: ColumnDef<ApprovalRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      </div>
    ),
    enableHiding: false,
    enableSorting: false,
  },
  {
    id: "search",
    accessorFn: (row) => {
      const payload = row.payload as any;
      return `${row.id} ${row.type} ${row.requestedBy} ${payload?.name || payload?.vendor_name || payload?.item_name || ""}`;
    },
    filterFn: "includesString",
  },
  {
    accessorKey: "id",
    header: "Nama",
    cell: ({ row }) => {
      const payload = row.original.payload as any;
      const itemName = payload?.item_name || payload?.name || payload?.vendor_name || payload?.referenceNo || row.original.id;
      return (
        <div className="grid min-w-0 gap-1">
          <div className="truncate font-medium text-foreground text-sm">{itemName}</div>
          <div className="truncate text-muted-foreground text-xs">{payload?.item_sku}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "requestedBy",
    header: "Permintaan dari",
    cell: ({ row }) => <div className="text-foreground text-sm">{row.original.requestedBy}</div>,
  },
  {
    id: "details",
    header: "Detail",
    cell: ({ row }) => {
      // Melakukan parsing data JSON form dari kolom payload
      const payload = row.original.payload as any;
      if (!payload) return <span className="text-muted-foreground">-</span>;

      if (row.original.type === "NEW_ITEM") {
        return <div className="max-w-75 truncate text-sm">Harga: Rp. {payload?.item_price.toLocaleString('id-ID')}</div>;
      }
      if (row.original.type === "NEW_VENDOR") {
        return <div className="max-w-75 truncate text-sm">Vendor: {payload?.vendor_name || payload?.name}</div>;
      }
      if (row.original.type === "STOCK_IN" || row.original.type === "STOCK_OUT") {
        const direction = row.original.type === "STOCK_IN" ? "Barang Masuk" : "Barang Keluar";
        return (
          <div className="max-w-75 truncate text-sm">
            {direction}: {payload?.items?.length ?? 0} barang - {payload?.partner_name || "Mitra"}
          </div>
        );
      }
      return <div className="max-w-75 truncate text-sm text-muted-foreground">Transaksi Inventory ID: {row.original.id}</div>;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Tanggal Permintaan",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
        <Clock className="size-3.5" />
        <span suppressHydrationWarning>{new Date(row.original.createdAt).toLocaleDateString("id-ID")}</span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const meta = statusMeta[status] || statusMeta.PENDING;
      return (
        <Badge className={cn("gap-1.5 border px-2 py-1 font-medium", meta.badgeClass)} variant="outline">
          <span className={cn("size-1.5 rounded-full", meta.dotClass)} />
          {translateApprovalStatus(status)}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Aksi</div>,
    cell: ({ row }) => {
      const [isPending, startTransition] = React.useTransition();
      const requestId = row.original.id;

      const handleApprove = () => {
        startTransition(async () => {
          const res = await approveRequestAction(requestId);
          if (res?.success) {
            toast.success("Permintaan berhasil disetujui, meneruskan ke VFlow!");
          } else {
            toast.error(res?.message || "Gagal menyetujui permintaan.");
          }
        });
      };

      const handleReject = () => {
        startTransition(async () => {
          const res = await rejectRequestAction(requestId);
          if (res?.success) {
            toast.success("Permintaan berhasil ditolak.");
          } else {
            toast.error(res?.message || "Gagal menolak permintaan.");
          }
        });
      };

      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                disabled={isPending}
                className="size-8 rounded-md text-muted-foreground hover:bg-muted/50"
                size="icon-sm"
                variant="ghost"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Lihat Payload JSON</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleApprove}
                className="text-emerald-600 focus:text-emerald-700 font-medium"
              >
                <CheckCircle2 className="mr-2 size-4" /> Setuju
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleReject}
                className="text-rose-600 focus:text-rose-700 font-medium"
              >
                <XCircle className="mr-2 size-4" /> Tolak
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

function translateApprovalStatus(value: string) {
  const labels: Record<string, string> = {
    PENDING: "Menunggu",
    APPROVED: "Disetujui",
    REJECTED: "Ditolak",
  };

  return labels[value] ?? value;
}
