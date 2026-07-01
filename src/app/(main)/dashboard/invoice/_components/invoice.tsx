"use client";

import { Send } from "lucide-react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import {
  defaultInvoiceValues,
  type InvoiceAvailableItem,
  type InvoiceFormValues,
  type InvoiceLocationOption,
  type InvoiceToDetails,
} from "./data";
import { InvoiceForm } from "./invoice-form";
import { InvoicePreview } from "./invoice-preview";

export function Invoice({
  clients,
  locations,
  availableItems,
}: {
  clients: InvoiceToDetails[];
  locations: InvoiceLocationOption[];
  availableItems: InvoiceAvailableItem[];
}) {
  const form = useForm<InvoiceFormValues>({
    defaultValues: {
      ...defaultInvoiceValues,
      to: clients[0] ?? defaultInvoiceValues.to,
      locationId: locations[0]?.id ?? "",
      referenceNumber: `INV-${Date.now()}`,
    },
  });
  const invoice = useWatch({ control: form.control }) as InvoiceFormValues;
  const isSubmitting = form.formState.isSubmitting;

  async function handleSubmit(values: InvoiceFormValues) {
    const response = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: values.transactionType,
        referenceNo: values.referenceNumber,
        partnerId: values.to.id,
        locationId: values.locationId,
        notes: values.notes,
        requestedBy: "admin_gudang",
        items: values.items,
      }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      toast.error(result.message || "Gagal mengirim transaksi.");
      return;
    }

    toast.success("Transaksi berhasil diajukan.", {
      description: `${result.data.referenceNo} menunggu persetujuan Kepala Gudang.`,
    });
  }

  return (
    <FormProvider {...form}>
      <form className="grid gap-5 xl:grid-cols-2" noValidate onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="flex flex-col gap-4">
          <InvoiceForm clients={clients} locations={locations} availableItems={availableItems} />
          <Button type="submit" disabled={isSubmitting}>
            <Send data-icon="inline-start" />
            {isSubmitting ? "Mengirim..." : "Ajukan Persetujuan"}
          </Button>
        </div>
        <InvoicePreview invoice={invoice} />
      </form>
    </FormProvider>
  );
}
