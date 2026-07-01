import { Controller, useFormContext, useWatch } from "react-hook-form";

import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ClientSelector } from "./client-selector";
import {
  defaultInvoiceValues,
  type InvoiceAvailableItem,
  type InvoiceFormValues,
  type InvoiceLocationOption,
  type InvoiceToDetails,
} from "./data";
import { InvoiceAdjustments } from "./invoice-adjustments";
import { InvoiceDetails } from "./invoice-details";
import { InvoiceItems } from "./invoice-items";

export function InvoiceForm({
  clients,
  locations,
  availableItems,
}: {
  clients: InvoiceToDetails[];
  locations: InvoiceLocationOption[];
  availableItems: InvoiceAvailableItem[];
}) {
  const { control, setValue } = useFormContext<InvoiceFormValues>();
  const transactionType = useWatch({ control, name: "transactionType" });
  const availablePartners = clients.filter((client) =>
    transactionType === "STOCK_IN" ? client.type === "VENDOR" : client.type === "CLIENT",
  );

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      <Tabs
        value={transactionType}
        onValueChange={(value) => {
          const nextType = value === "STOCK_OUT" ? "STOCK_OUT" : "STOCK_IN";
          setValue("transactionType", nextType);
          const nextPartner = clients.find((client) => client.type === (nextType === "STOCK_IN" ? "VENDOR" : "CLIENT"));
          if (nextPartner) setValue("to", nextPartner);
          setValue("items", nextType === "STOCK_OUT" ? [] : defaultInvoiceValues.items);
        }}
      >
        <TabsList className="w-full">
          <TabsTrigger value="STOCK_IN">Stok Masuk</TabsTrigger>
          <TabsTrigger value="STOCK_OUT">Stok Keluar</TabsTrigger>
        </TabsList>
      </Tabs>

      <InvoiceDetails />

      <Separator />

      <div className="grid gap-4 lg:grid-cols-2">
        <ClientSelector clients={availablePartners.length ? availablePartners : clients} />
        <section className="flex flex-col gap-4">
          <div className="flex min-h-8 items-center">
            <h2 className="font-medium tracking-tight">Lokasi</h2>
          </div>
          <Controller
            control={control}
            name="locationId"
            render={({ field }) => (
              <Field className="gap-1">
                <FieldLabel className="text-xs">Lokasi Penyimpanan</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-10 w-full min-w-0">
                    <SelectValue placeholder="Pilih lokasi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name} - {location.warehouseName}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
        </section>
      </div>

      <Separator />

      <InvoiceItems availableItems={availableItems} />

      <Separator />

      <InvoiceAdjustments />
    </div>
  );
}
