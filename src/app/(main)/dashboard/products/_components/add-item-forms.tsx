"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createItemAction } from "@/server/server-actions";
import { toast } from "sonner";

interface AddItemFormProps {
  onSuccess?: () => void;
}

export function AddItemForm({ onSuccess }: AddItemFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      item_sku: formData.get("sku") as string,
      item_name: formData.get("name") as string,
      item_price: Number(formData.get("price")),
      item_uom: formData.get("uom") as string,
    };

    // Panggil Server Action
    const result = await createItemAction(data);

    if (!result.success) {
      if (result.errorType === "DUPLICATE_SKU") {
        // 1. Ubah border input SKU menjadi merah
        setErrors({ sku: result.message });
        // 2. Tampilkan notifikasi toast error ringan
        toast.error("Gagal menambahkan barang. Silakan periksa kembali input Anda.");
      } else {
        // Error umum (misal server VFlow mati)
        toast.error(result.message);
      }
    } else {
      // BERHASIL! Panggil Sonner
      toast.success("Berhasil dikirim ke VFlow!", {
        description: "Data barang sedang ditinjau oleh Manajer.",
        duration: 5000,
      });
      
      // Tutup modal secara otomatis (panggil callback onSuccess jika disediakan)
      onSuccess?.();
    }
    
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="sku">SKU (Stock Keeping Unit)</Label>
        <Input id="sku" name="sku" type="text" className={`transition-colors border ${errors.sku ? "border-red-500 focus:ring-1 focus:ring-red-500" : "border-gray-600 focus:border-blue-500"}`} required placeholder="e.g., KBD-001" />
        {errors.sku && <p className="mt-1 text-xs text-red-500">{errors.sku}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="name">Nama Barang</Label>
        <Input id="name" name="name" type="text" className="transition-colors border border-gray-600 focus:border-blue-500" required placeholder="e.g., Mechanical Keyboard" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea id="description" name="description" className="transition-colors border border-gray-600 focus:border-blue-500" placeholder="Spesifikasi atau detail barang..." />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="basePrice">Harga Dasar (IDR)</Label>
          <Input id="basePrice" name="basePrice" type="number" className="transition-colors border border-gray-600 focus:border-blue-500" required placeholder="150000" min="0" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="uom">Satuan (UOM)</Label>
          <Input id="uom" name="uom" type="text" className="transition-colors border border-gray-600 focus:border-blue-500 uppercase" required placeholder="PCS, BOX, KG..." />
        </div>
      </div>
      
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Menyimpan..." : "Simpan Barang"}
      </Button>
    </form>
  );
}