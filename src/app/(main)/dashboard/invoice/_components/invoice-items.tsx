import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { GripVertical, PackageSearch, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { Control, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { Controller, useFieldArray, useFormContext, useWatch } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

import {
  getLineAmount,
  type InvoiceAvailableItem,
  type InvoiceFormValues,
  type InvoiceLineItem,
  invoiceItemCategories,
  invoiceUomOptions,
} from "./data";

export function InvoiceItems({ availableItems }: { availableItems: InvoiceAvailableItem[] }) {
  const { control, register, setValue } = useFormContext<InvoiceFormValues>();
  const { append, fields, move, remove } = useFieldArray({
    control,
    name: "items",
    keyName: "fieldKey",
  });
  const transactionType = useWatch({ control, name: "transactionType" });
  const locationId = useWatch({ control, name: "locationId" });
  const items = useWatch({ control, name: "items" }) ?? [];

  if (transactionType === "STOCK_OUT") {
    return (
      <StockOutInvoiceItems
        append={append}
        availableItems={availableItems}
        fields={fields}
        items={items}
        locationId={locationId}
        remove={remove}
        setValue={setValue}
      />
    );
  }

  return (
    <StockInInvoiceItems
      append={append}
      control={control}
      fields={fields}
      items={items}
      move={move}
      register={register}
      remove={remove}
    />
  );
}

function StockInInvoiceItems({
  append,
  control,
  fields,
  items,
  move,
  register,
  remove,
}: {
  append: (value: InvoiceLineItem | InvoiceLineItem[]) => void;
  control: Control<InvoiceFormValues>;
  fields: { id: string }[];
  items: InvoiceLineItem[];
  move: (from: number, to: number) => void;
  register: UseFormRegister<InvoiceFormValues>;
  remove: (index: number) => void;
}) {
  const sortableItemIds = fields.map((field) => field.id);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = fields.findIndex((field) => field.id === active.id);
    const newIndex = fields.findIndex((field) => field.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    move(oldIndex, newIndex);
  }

  function handleAddItem() {
    append({ id: `item-${Date.now()}`, description: "", quantity: 1, unitPrice: 0, category: "general", uom: "PCS" });
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-medium tracking-tight">Daftar Barang</h2>
        <Button type="button" variant="ghost" size="sm" onClick={handleAddItem}>
          <Plus data-icon="inline-start" />
          Tambah Barang
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="hidden items-center gap-2 px-1 font-medium text-muted-foreground text-xs md:grid md:grid-cols-[24px_minmax(150px,1fr)_86px_56px_64px_112px_32px]">
          <span />
          <span>Deskripsi</span>
          <span>Kategori</span>
          <span>Jumlah</span>
          <span>UOM</span>
          <span>Harga satuan</span>
          <span />
        </div>

        <DndContext
          id="invoice-items"
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortableItemIds} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-3">
              {fields.map((field, index) => (
                <SortableInvoiceItemRow
                  key={field.id}
                  id={field.id}
                  index={index}
                  item={items[index]}
                  control={control}
                  register={register}
                  onRemove={() => remove(index)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </section>
  );
}

function StockOutInvoiceItems({
  append,
  availableItems,
  fields,
  items,
  locationId,
  remove,
  setValue,
}: {
  append: (value: InvoiceLineItem | InvoiceLineItem[]) => void;
  availableItems: InvoiceAvailableItem[];
  fields: { id: string }[];
  items: InvoiceLineItem[];
  locationId: string;
  remove: (index: number) => void;
  setValue: UseFormSetValue<InvoiceFormValues>;
}) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selectedSkus = useMemo(() => new Set(items.map((item) => item.sku).filter(Boolean)), [items]);

  const selectableItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return availableItems
      .filter((item) => !selectedSkus.has(item.sku))
      .filter((item) => getAvailableQuantity(item, locationId) > 0)
      .filter((item) => {
        if (!query) return true;
        return `${item.sku} ${item.name} ${item.uom}`.toLowerCase().includes(query);
      });
  }, [availableItems, locationId, searchQuery, selectedSkus]);

  function toggleSelected(itemId: string, checked: boolean | "indeterminate") {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked === true) next.add(itemId);
      else next.delete(itemId);
      return next;
    });
  }

  function handleAddSelectedItems() {
    const selectedItems = availableItems.filter((item) => selectedIds.has(item.id));
    append(
      selectedItems.map((item) => ({
        id: `stock-out-${item.id}-${Date.now()}`,
        description: item.name,
        quantity: 1,
        unitPrice: item.unitPrice,
        sku: item.sku,
        category: categoryFromSku(item.sku),
        uom: item.uom,
      })),
    );
    setSelectedIds(new Set());
    setSearchQuery("");
    setIsPickerOpen(false);
  }

  function handleQuantityChange(index: number, quantity: number, maxQuantity: number) {
    const nextQuantity = Math.min(Math.max(Math.trunc(quantity) || 1, 1), Math.max(maxQuantity, 1));
    setValue(`items.${index}.quantity`, nextQuantity, { shouldDirty: true, shouldValidate: true });
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-medium tracking-tight">Daftar Barang</h2>
        <Button type="button" variant="ghost" size="sm" onClick={() => setIsPickerOpen(true)}>
          <Plus data-icon="inline-start" />
          Tambah Barang
        </Button>
      </div>

      {fields.length ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Barang</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Tersedia</TableHead>
              <TableHead className="w-20">Jumlah</TableHead>
              <TableHead>UOM</TableHead>
              <TableHead className="text-right">Harga satuan</TableHead>
              <TableHead className="text-right">Total baris</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => {
              const item = items[index];
              const sourceItem = availableItems.find((availableItem) => availableItem.sku === item?.sku);
              const availableQuantity = sourceItem ? getAvailableQuantity(sourceItem, locationId) : 0;

              return (
                <TableRow key={field.id}>
                  <TableCell className="max-w-48">
                    <div className="truncate font-medium">{item?.description || "-"}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item?.sku || "-"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{availableQuantity.toLocaleString("id-ID")}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={1}
                      max={availableQuantity || 1}
                      step={1}
                      className="h-8"
                      value={item?.quantity ?? 1}
                      aria-label={`Quantity for ${item?.description || "stock out item"}`}
                      onChange={(event) => handleQuantityChange(index, Number(event.target.value), availableQuantity)}
                    />
                  </TableCell>
                  <TableCell>{item?.uom || "-"}</TableCell>
                  <TableCell className="text-right">{formatInvoiceCurrency(item?.unitPrice ?? 0)}</TableCell>
                  <TableCell className="text-right font-medium">{formatInvoiceCurrency(getLineAmount(item))}</TableCell>
                  <TableCell>
                    <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove item" onClick={() => remove(index)}>
                      <Trash2 />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <Empty className="min-h-48 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PackageSearch />
            </EmptyMedia>
            <EmptyTitle>Belum ada barang stok keluar dipilih</EmptyTitle>
            <EmptyDescription>Pilih barang inventaris yang tersedia sebelum mengajukan transaksi stok keluar.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <Dialog open={isPickerOpen} onOpenChange={setIsPickerOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Pilih Barang Inventaris</DialogTitle>
            <DialogDescription>Pilih satu atau lebih produk yang tersedia dari lokasi penyimpanan yang dipilih.</DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 rounded-md border px-3">
            <Search className="text-muted-foreground" />
            <Input
              className="border-0 px-0 shadow-none focus-visible:ring-0"
              placeholder="Cari berdasarkan SKU, nama produk, atau satuan"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          <ScrollArea className="h-80 rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>Produk</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>UOM</TableHead>
                  <TableHead className="text-right">Tersedia</TableHead>
                  <TableHead className="text-right">Harga</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectableItems.map((item) => (
                  <TableRow key={item.id} data-state={selectedIds.has(item.id) ? "selected" : undefined}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(item.id)}
                        aria-label={`Select ${item.name}`}
                        onCheckedChange={(checked) => toggleSelected(item.id, checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{item.name}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.sku}</Badge>
                    </TableCell>
                    <TableCell>{item.uom}</TableCell>
                    <TableCell className="text-right">{getAvailableQuantity(item, locationId).toLocaleString("id-ID")}</TableCell>
                    <TableCell className="text-right">{formatInvoiceCurrency(item.unitPrice)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!selectableItems.length ? (
              <Empty className="border-0">
                <EmptyHeader>
                  <EmptyTitle>Tidak ada inventaris yang cocok</EmptyTitle>
                  <EmptyDescription>Tidak ada barang tersedia untuk lokasi atau kata kunci pencarian ini.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : null}
          </ScrollArea>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsPickerOpen(false)}>
              Batal
            </Button>
            <Button type="button" disabled={!selectedIds.size} onClick={handleAddSelectedItems}>
              Tambah Pilihan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function SortableInvoiceItemRow({
  id,
  index,
  item,
  control,
  register,
  onRemove,
}: {
  id: string;
  index: number;
  item?: InvoiceLineItem;
  control: Control<InvoiceFormValues>;
  register: UseFormRegister<InvoiceFormValues>;
  onRemove: () => void;
}) {
  const { attributes, isDragging, listeners, setActivatorNodeRef, setNodeRef, transform, transition } = useSortable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
      }}
      className={cn(
        "grid min-w-0 grid-cols-[24px_minmax(0,0.8fr)_minmax(0,1fr)_32px] items-center gap-2 rounded-lg md:grid-cols-[24px_minmax(150px,1fr)_86px_56px_64px_112px_32px]",
        isDragging && "relative z-10 opacity-50",
      )}
    >
      <Button
        ref={setActivatorNodeRef}
        type="button"
        variant="ghost"
        size="icon-sm"
        className="-ml-2 cursor-grab text-muted-foreground active:cursor-grabbing"
        aria-label={`Reorder ${id}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical />
      </Button>
      <Input
        className="min-w-0 text-sm max-md:col-span-3"
        aria-label={`Item ${index + 1} description`}
        {...register(`items.${index}.description` as const)}
      />
      <Controller
        control={control}
        name={`items.${index}.category` as const}
        render={({ field }) => (
          <Select value={field.value || "general"} onValueChange={field.onChange}>
            <SelectTrigger className="h-9 min-w-0 text-sm" aria-label={`Item ${index + 1} category`}>
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {invoiceItemCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.prefix}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
      />
      <Input
        type="number"
        step="1"
        className="text-sm max-md:col-start-2 max-md:row-start-2"
        aria-label={`Item ${index + 1} quantity`}
        {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
      />
      <Controller
        control={control}
        name={`items.${index}.uom` as const}
        render={({ field }) => (
          <Select value={field.value || "PCS"} onValueChange={field.onChange}>
            <SelectTrigger className="h-9 min-w-0 text-sm max-md:row-start-2" aria-label={`Item ${index + 1} unit of measure`}>
              <SelectValue placeholder="UOM" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {invoiceUomOptions.map((uom) => (
                  <SelectItem key={uom} value={uom}>
                    {uom}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
      />
      <Controller
        control={control}
        name={`items.${index}.unitPrice` as const}
        render={({ field }) => (
          <Input
            type="text"
            inputMode="numeric"
            className="min-w-0 text-sm max-md:col-start-3 max-md:row-start-2"
            aria-label={`Item ${index + 1} unit price`}
            value={formatNumberInput(field.value)}
            onBlur={field.onBlur}
            onChange={(event) => field.onChange(parseNumberInput(event.target.value))}
          />
        )}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="max-md:col-start-4 max-md:row-start-2"
        aria-label={`Remove item ${index + 1}`}
        onClick={onRemove}
      >
        <Trash2 />
      </Button>
      <div className="col-span-3 col-start-2 flex min-w-0 items-center justify-between rounded-md bg-muted/30 px-2 py-1 font-medium text-xs md:col-span-5 md:col-start-2">
        <span className="text-muted-foreground">Total baris</span>
        <span className="truncate text-right">{formatInvoiceCurrency(getLineAmount(item))}</span>
      </div>
    </div>
  );
}

function getAvailableQuantity(item: InvoiceAvailableItem, locationId: string) {
  if (!locationId) return item.totalQuantity;
  return item.balances.find((balance) => balance.locationId === locationId)?.quantity ?? 0;
}

function categoryFromSku(sku: string) {
  if (sku.startsWith("KMP-E")) return "electronics";
  if (sku.startsWith("KMP-F")) return "food";
  return "general";
}

function formatInvoiceCurrency(value: number) {
  const amount = Number.isFinite(value) ? Math.round(value) : 0;
  return `Rp. ${amount.toLocaleString("id-ID")}`;
}

function formatNumberInput(value: unknown) {
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount) || amount === 0) return "";

  return Math.round(amount).toLocaleString("id-ID");
}

function parseNumberInput(value: string) {
  const numeric = value.replace(/[^\d]/g, "");
  return numeric ? Number(numeric) : 0;
}
