"use client";
"use no memo";

import * as React from "react";

import {
  type ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { CheckCircle2, Download, ListFilter, Search, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { filters, type ApprovalRow } from "./data";
import { approvalsColumns } from "./approvals-columns";
import { ApprovalsTable } from "./approvals-table";

export function Approvals({ approvals }: { approvals: ApprovalRow[] }) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    search: false,
  });
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useReactTable({
    data: approvals,
    columns: approvalsColumns,
    state: {
      rowSelection,
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
    },
    getRowId: (row) => row.id,
    autoResetPageIndex: false,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const searchQuery = (table.getColumn("search")?.getFilterValue() as string) ?? "";
  const idFilter = (table.getColumn("id")?.getFilterValue() as string) ?? filters.type[0];
  const statusFilter = (table.getColumn("status")?.getFilterValue() as string) ?? filters.status[0];
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  function setColumnSelectFilter(columnId: string, value: string) {
    table.getColumn(columnId)?.setFilterValue(value === "All" ? undefined : value);
    table.setPageIndex(0);
  }

  return (
    <Card>
      <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
        <CardTitle className="text-xl leading-none">Persetujuan</CardTitle>
        <CardDescription className="max-w-sm leading-snug">
          Tinjau dan kelola permintaan barang baru, vendor baru, dan transaksi inventaris.
        </CardDescription>
        <CardAction className="col-start-1 row-start-auto flex w-full flex-wrap justify-start gap-2 justify-self-stretch md:col-start-2 md:row-span-2 md:row-start-1 md:w-auto md:flex-nowrap md:justify-end md:justify-self-end">
          <InputGroup className="h-7 w-full md:w-64">
            <InputGroupAddon align="inline-start">
              <Search className="size-3.5" />
            </InputGroupAddon>
            <InputGroupInput
              className="h-7"
              placeholder="Cari permintaan..."
              value={searchQuery}
              onChange={(event) => {
                table.getColumn("search")?.setFilterValue(event.target.value || undefined);
                table.setPageIndex(0);
              }}
            />
          </InputGroup>
          <Button variant="outline" size="sm">
            <ListFilter className="mr-2 size-4" /> Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 size-4" /> Ekspor
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-0">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={idFilter} onValueChange={(value) => setColumnSelectFilter("type", value)}>
              <SelectTrigger size="sm">
                <span className="text-muted-foreground">Jenis Permintaan:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                <SelectGroup>
                  {filters.type.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option === "All" ? "Semua" : translateApprovalType(option)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(value) => setColumnSelectFilter("status", value)}>
              <SelectTrigger size="sm">
                <span className="text-muted-foreground">Status:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                <SelectGroup>
                  {filters.status.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option === "All" ? "Semua" : translateApprovalStatus(option)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-4 h-9">
          <div className="text-muted-foreground text-sm tabular-nums">
            {selectedCount > 0 ? (
              <span className="font-medium text-foreground">{selectedCount} dipilih</span>
            ) : (
              "0 dipilih"
            )}
          </div>
          
          {selectedCount > 0 && (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                <XCircle className="mr-2 size-4" /> Tolak Terpilih
              </Button>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <CheckCircle2 className="mr-2 size-4" /> Setujui Terpilih
              </Button>
            </div>
          )}
        </div>

        <ApprovalsTable table={table} />
      </CardContent>
    </Card>
  );
}

function translateApprovalType(value: string) {
  const labels: Record<string, string> = {
    NEW_ITEM: "Barang Baru",
    NEW_VENDOR: "Vendor Baru",
    STOCK_IN: "Barang Masuk",
    STOCK_OUT: "Barang Keluar",
    STOCK_OPNAME: "Stock Opname",
  };

  return labels[value] ?? value;
}

function translateApprovalStatus(value: string) {
  const labels: Record<string, string> = {
    PENDING: "Menunggu",
    APPROVED: "Disetujui",
    REJECTED: "Ditolak",
  };

  return labels[value] ?? value;
}
