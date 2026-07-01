"use client";
"use no memo";

import * as React from "react";
import {
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ArrowUpRight, Download, MoreHorizontal, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { AddItemForm } from "./add-item-forms";

import { inventoryColumns } from "./inventory-table/columns";
import { type InventoryRow } from "./inventory-table/schema";
import { preventPaginationNavigation } from "@/lib/utils";
import { useState } from "react";

interface InventoryTableProps {
  data: InventoryRow[]; // Menerima data asli dari database
}

export function InventoryTable({ data }: InventoryTableProps) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useReactTable({
    data, // Menggunakan data dari props
    columns: inventoryColumns, // Menggunakan definisi kolom inventaris
    state: {
      rowSelection,
      sorting,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const itemCount = table.getFilteredRowModel().rows.length;
  const visibleItemCount = table.getRowModel().rows.length;
  const currentPage = table.getState().pagination.pageIndex + 1;
  const pageCount = table.getPageCount();

  const pageNumbers = React.useMemo(() => {
    if (pageCount <= 3) {
      return Array.from({ length: pageCount }, (_, index) => index + 1);
    }
    if (currentPage <= 2) return [1, 2, 3];
    if (currentPage >= pageCount - 1) return [pageCount - 2, pageCount - 1, pageCount];
    return [currentPage - 1, currentPage, currentPage + 1];
  }, [currentPage, pageCount]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal text-muted-foreground text-sm">Stok Inventaris</CardTitle>
        <CardDescription className="text-foreground text-xl tabular-nums leading-none tracking-tight">
          {itemCount} Barang
        </CardDescription>
        <CardAction className="flex items-center gap-1">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button aria-label="Tambah barang" size="icon-sm" variant="default">
                <Plus />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-106.25">
              <DialogHeader>
                <DialogTitle>Tambah Barang Baru</DialogTitle>
              </DialogHeader>
              <AddItemForm onSuccess={() => setIsAddDialogOpen(false)} />
            </DialogContent>
          </Dialog>
          <Button aria-label="Ekspor data" size="icon-sm" variant="outline">
            <Download />
          </Button>
          <Button size="icon-sm" variant="outline">
            <MoreHorizontal />
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 px-0">
        <div className="flex items-center justify-between px-4">
          {/* Anda bisa menambahkan search bar atau filter kategori di sini */}
          <div className="flex-1" />
          <Button
            size="icon-sm"
            variant="outline"
            onClick={() => table.getColumn("name")?.toggleSorting(table.getColumn("name")?.getIsSorted() === "asc")}
          >
            <ArrowUpDown />
          </Button>
        </div>

        <div className="overflow-hidden">
          <Table className="**:data-[slot='table-cell']:px-4.5 **:data-[slot='table-head']:px-4.5">
            <TableHeader className="border-t **:data-[slot='table-head']:h-11 **:data-[slot='table-head']:font-normal **:data-[slot='table-head']:text-foreground **:data-[slot='table-head']:text-sm">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="**:data-[slot='table-row']:border-border/50 **:data-[slot='table-cell']:px-4 **:data-[slot='table-cell']:py-3 **:data-[slot='table-row']:hover:bg-transparent">
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="h-24 text-center" colSpan={table.getVisibleLeafColumns().length}>
                    Tidak ada barang di gudang.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between gap-4 px-4 pb-1">

          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent className="gap-1.5">
              <PaginationItem>
                <PaginationPrevious
                  className={!table.getCanPreviousPage() ? "pointer-events-none opacity-50" : undefined}
                  href="#"
                  onClick={(event) => {
                    preventPaginationNavigation(event);
                    table.previousPage();
                  }}
                />
              </PaginationItem>
              {pageNumbers[0] > 1 ? (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : null}
              {pageNumbers.map((pageNumber) => (
                <PaginationItem key={`page-${pageNumber}`}>
                  <PaginationLink
                    href="#"
                    isActive={table.getState().pagination.pageIndex === pageNumber - 1}
                    onClick={(event) => {
                      preventPaginationNavigation(event);
                      table.setPageIndex(pageNumber - 1);
                    }}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              ))}
              {pageNumbers[pageNumbers.length - 1] < pageCount ? (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : null}
              <PaginationItem>
                <PaginationNext
                  className={!table.getCanNextPage() ? "pointer-events-none opacity-50" : undefined}
                  href="#"
                  onClick={(event) => {
                    preventPaginationNavigation(event);
                    table.nextPage();
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>        

      </CardContent>
    </Card>
  );
}
