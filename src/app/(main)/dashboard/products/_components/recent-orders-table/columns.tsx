"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Eye, MoreHorizontal, FileText } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { type TransactionRow } from "./schema";

export const recentOrdersColumns: ColumnDef<TransactionRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "referenceNo",
    header: "No. Referensi",
    cell: ({ row }) => (
      <div className="font-mono text-sm font-medium">{row.getValue("referenceNo")}</div>
    ),
  },
  {
    accessorKey: "date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="p-0 hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Tanggal
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      // Asumsi format string dari Server: "DD MMM YYYY" atau sejenisnya
      return <div className="text-sm text-muted-foreground">{row.getValue("date")}</div>;
    },
  },
  {
    accessorKey: "partnerName",
    header: "Partner",
    cell: ({ row }) => {
      const name = row.getValue("partnerName") as string;
      return (
        <div className="font-medium">
          {name ? name : <span className="italic text-muted-foreground">Internal</span>}
        </div>
      );
    },
  },
  {
    accessorKey: "type",
    header: "Tipe",
    cell: ({ row }) => {
      const type = row.original.type;
      const typeLabel = type.replace("_", " ");
      
      return (
        <Badge variant="secondary" className="font-normal text-[11px]">
          {typeLabel}
        </Badge>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;

      // Pemetaan warna berdasarkan status VFlow
      const statusStyles = {
        DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
        PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200",
        APPROVED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200",
        COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200",
        REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200",
        DISPUTE: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200"
      };

      return (
        <Badge variant="outline" className={`font-normal rounded-md ${statusStyles[status] || ""}`}>
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "totalItems",
    header: () => <div className="text-right">Total Item</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium tabular-nums">{row.getValue("totalItems")}</div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const transaction = row.original;

      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Buka menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Aksi Transaksi</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => console.log("Lihat Detail", transaction.id)}>
                <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
                Lihat Detail
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log("Cetak Dokumen", transaction.id)}>
                <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                Cetak Dokumen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];