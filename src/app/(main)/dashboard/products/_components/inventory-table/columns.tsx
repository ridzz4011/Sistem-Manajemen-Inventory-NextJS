"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Edit, MoreHorizontal, Trash2, History } from "lucide-react";

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

import { type InventoryRow } from "./schema";

export const inventoryColumns: ColumnDef<InventoryRow>[] = [
  // 1. Kolom Pilihan (Checkbox Selection)
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Pilih semua baris"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Pilih baris ini"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },

  // 2. Kolom SKU (Stock Keeping Unit)
  {
    accessorKey: "sku",
    header: "SKU",
    cell: ({ row }) => {
      return <span className="font-mono text-xs font-semibold tracking-wider">{row.getValue("sku")}</span>;
    },
  },

  // 3. Kolom Nama Barang & Deskripsi
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="p-0 hover:bg-transparent text-foreground"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nama Barang
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const name = row.original.name;
      const description = row.original.description;

      return (
        <div className="flex flex-col max-w-70">
          <span className="font-medium text-sm truncate">{name}</span>
          {description && (
            <span className="text-xs text-muted-foreground truncate" title={description}>
              {description}
            </span>
          )}
        </div>
      );
    },
  },

  // 4. Kolom Harga (Base Price)
  {
    accessorKey: "basePrice",
    header: () => <div className="text-right">Harga Dasar</div>,
    cell: ({ row }) => {
      const price = Number(row.getValue("basePrice"));
      
      // Format mata uang ke Rupiah (id-ID)
      const formatted = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(price);

      return <div className="text-right font-medium tabular-nums">{formatted}</div>;
    },
  },

  // 5. Kolom Satuan (UOM)
  {
    accessorKey: "uom",
    header: () => <div className="text-center">Satuan</div>,
    cell: ({ row }) => {
      return (
        <div className="text-center">
          <Badge variant="outline" className="uppercase px-2 py-0.5 text-[11px]">
            {row.getValue("uom")}
          </Badge>
        </div>
      );
    },
  },

  // 6. Kolom Total Stok (Jumlah Gabungan dari Berbagai Lokasi)
  {
    accessorKey: "stock",
    header: () => <div className="text-center">Total Stok</div>,
    cell: ({ row }) => {
      const stock = Number(row.getValue("stock"));
      return <div className="text-center font-semibold tabular-nums text-sm">{stock}</div>;
    },
  },

  // 7. Kolom Status Stok (Visual Indicator)
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;

      // Pemetaan warna berdasarkan status inventaris
      const statusStyles = {
        Tersedia: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400 border-green-200",
        "Stok Menipis": "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 border-amber-200",
        Habis: "bg-destructive/10 text-destructive dark:bg-destructive/20 border-destructive/20",
      };

      return (
        <Badge variant="outline" className={`font-normal rounded-md shadow-sm ${statusStyles[status] || ""}`}>
          {status}
        </Badge>
      );
    },
  },

  // 8. Kolom Aksi (Actions Dropdown)
  {
    id: "actions",
    cell: ({ row }) => {
      const item = row.original;

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
              <DropdownMenuLabel>Aksi Produk</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => console.log("Edit item:", item.id)}>
                <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
                Edit Detail Barang
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => console.log("Log history:", item.id)}>
                <History className="mr-2 h-4 w-4 text-muted-foreground" />
                Riwayat Transaksi
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                onClick={() => console.log("Hapus item:", item.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus Barang
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];