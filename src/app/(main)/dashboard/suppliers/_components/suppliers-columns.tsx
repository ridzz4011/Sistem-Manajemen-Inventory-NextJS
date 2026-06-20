"use client";
"use no memo";

import type { ColumnDef } from "@tanstack/react-table";
import { Check, Clock, Mail, MoreHorizontal, Phone, Star, X } from "lucide-react";

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

import { statusMeta, type SupplierRow } from "./data";

function StatusBadge({ status }: { status: SupplierRow["status"] }) {
  const meta = statusMeta[status];

  return (
    <Badge className={cn("gap-1.5 border px-2 py-1 font-medium", meta.badgeClass)} variant="outline">
      <span className={cn("size-1.5 rounded-full", meta.dotClass)} />
      {status}
    </Badge>
  );
}

function RatingCell({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1.5 text-foreground text-sm">
      <Star className="size-4 fill-amber-400 text-amber-400" />
      <span>{rating.toFixed(1)}</span>
    </div>
  );
}

export const suppliersColumns: ColumnDef<SupplierRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          aria-label="Select all suppliers"
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          aria-label={`Select ${row.original.name}`}
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
    accessorFn: (row) => `${row.id} ${row.name} ${row.contactPerson} ${row.email} ${row.phone}`,
    filterFn: "includesString",
    enableHiding: true,
  },
  {
    accessorKey: "name",
    header: "Supplier",
    cell: ({ row }) => (
      <div className="grid min-w-0 gap-1">
        <div className="truncate font-medium text-foreground text-sm">{row.original.name}</div>
        <div className="truncate text-muted-foreground text-sm">{row.original.id}</div>
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    filterFn: "equalsString",
    cell: ({ row }) => <div className="text-sm">{row.original.category}</div>,
  },
  {
    accessorKey: "contactPerson",
    header: "Contact",
    cell: ({ row }) => (
      <div className="grid gap-1">
        <div className="text-foreground text-sm">{row.original.contactPerson}</div>
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Mail className="size-3.5" />
          <span className="truncate">{row.original.email}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Phone className="size-3.5" />
          <span>{row.original.phone}</span>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "products",
    header: "Products",
    cell: ({ row }) => <div className="text-sm">{row.original.products}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    filterFn: "equalsString",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "rating",
    header: "Rating",
    cell: ({ row }) => <RatingCell rating={row.original.rating} />,
  },
  {
    accessorKey: "joinedDate",
    header: "Joined date",
    cell: ({ row }) => <div className="text-foreground text-sm">{row.original.joinedDate}</div>,
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => (
      <div className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label={`Open actions for ${row.original.name}`}
              className="size-8 rounded-md text-muted-foreground hover:bg-muted/50"
              size="icon-sm"
              variant="ghost"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View supplier</DropdownMenuItem>
            <DropdownMenuItem>Edit supplier</DropdownMenuItem>
            <DropdownMenuItem>View purchase history</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Deactivate supplier</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
    enableHiding: false,
    enableSorting: false,
  },
];
