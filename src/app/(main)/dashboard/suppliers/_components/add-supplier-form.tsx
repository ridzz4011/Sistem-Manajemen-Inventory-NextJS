"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { submitApprovalRequestAction } from "@/server/server-actions";
import { toast } from "sonner";

interface AddSupplierFormProps {
  onSuccess?: () => void;
}

const CATEGORIES = [
  "Makanan & Minuman",
  "Elektronik",
  "Perlengkapan Toko",
  "Peralatan Rumah Tangga",
  "Kesehatan",
  "Tekstil",
  "Furniture",
  "Kebersihan",
  "Lainnya",
];

export function AddSupplierForm({ onSuccess }: AddSupplierFormProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form states
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [products, setProducts] = useState("");
  const [rating, setRating] = useState("0");
  const [vendorStatus, setVendorStatus] = useState("NEW");

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Nama Vendor wajib diisi.";
    if (!contactPerson.trim()) newErrors.contactPerson = "Kontak Person wajib diisi.";
    if (!phone.trim()) newErrors.phone = "Nomor Telepon wajib diisi.";
    if (!email.trim()) newErrors.email = "Email wajib diisi.";
    if (!selectedCategory || (selectedCategory === "Lainnya" && !customCategory.trim())) {
      newErrors.category = "Kategori wajib dipilih atau diisi.";
    }
    if (!products.trim()) newErrors.products = "Produk atau layanan wajib diisi.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Gagal mengajukan vendor. Silakan periksa kembali input yang merah.");
      setLoading(false);
      return;
    }

    const finalCategory = selectedCategory === "Lainnya" ? customCategory.trim() : selectedCategory;
    const data = {
      vendor_name: name.trim(),
      vendor_contactPerson: contactPerson.trim(),
      vendor_phone: phone.trim(),
      vendor_contact: phone.trim(),
      vendor_email: email.trim(),
      vendor_address: address.trim() || "-",
      vendor_category: finalCategory,
      vendor_products: products.trim(),
      vendor_rating: Number(rating) || 0,
      vendor_status: vendorStatus,
    };

    const result = await submitApprovalRequestAction("NEW_VENDOR", data, "admin_gudang");

    if (!result.success) {
      toast.error(result.message);
    } else {
      if (result.data?.status === "REJECTED") {
        toast.error("Vendor Ditolak Otomatis (VRule)", {
          description: "Vendor dengan status Blacklist otomatis ditolak oleh sistem VFlow.",
          duration: 5000,
        });
      } else {
        toast.success("Berhasil diajukan ke VFlow!", {
          description: "Usulan vendor baru masuk ke tabel Suppliers (Pending) & tabel Approvals menunggu manajer.",
          duration: 5000,
        });
      }
      onSuccess?.();
    }

    setLoading(false);
  };

  const getBorderClass = (field: string) =>
    errors[field]
      ? "border-red-500 focus:ring-1 focus:ring-red-500"
      : "border-gray-600 focus:border-blue-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
      <div className="space-y-2">
        <Label htmlFor="name">Nama Vendor / Supplier <span className="text-red-500">*</span></Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`transition-colors border ${getBorderClass("name")}`}
          placeholder="Contoh: PT. Sumber Makmur Abadi"
        />
        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contactPerson">Kontak Person <span className="text-red-500">*</span></Label>
          <Input
            id="contactPerson"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
            className={`transition-colors border ${getBorderClass("contactPerson")}`}
            placeholder="Contoh: Budi Santoso"
          />
          {errors.contactPerson && <p className="mt-1 text-xs text-red-500">{errors.contactPerson}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Nomor Telepon <span className="text-red-500">*</span></Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={`transition-colors border ${getBorderClass("phone")}`}
            placeholder="081234567890"
          />
          {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`transition-colors border ${getBorderClass("email")}`}
            placeholder="sales@sumbermakmur.com"
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="rating">Reputasi / Rating (Opsional)</Label>
          <Input
            id="rating"
            type="number"
            step="0.1"
            min="0"
            max="5"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            className="transition-colors border border-gray-600 focus:border-blue-500"
            placeholder="0.0 - 5.0"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Kategori <span className="text-red-500">*</span></Label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className={`border ${getBorderClass("category")}`}>
            <SelectValue placeholder="Pilih Kategori Vendor" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedCategory === "Lainnya" && (
          <Input
            className={`mt-2 transition-colors border ${getBorderClass("category")}`}
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            placeholder="Ketik spesifikasi kategori lainnya..."
          />
        )}
        {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="products">Produk atau Layanan yang Dijual <span className="text-red-500">*</span></Label>
        <Input
          id="products"
          value={products}
          onChange={(e) => setProducts(e.target.value)}
          className={`transition-colors border ${getBorderClass("products")}`}
          placeholder="Contoh: Snack, kemasan plastik, jasa pengiriman"
        />
        {errors.products && <p className="mt-1 text-xs text-red-500">{errors.products}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Alamat Vendor (Opsional)</Label>
        <Textarea
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="transition-colors border border-gray-600 focus:border-blue-500"
          placeholder="Jl. Raya Industri No. 12, Jakarta..."
        />
      </div>

      <div className="space-y-2 bg-slate-50 dark:bg-slate-900 p-3 rounded-md border border-slate-200 dark:border-slate-800">
        <Label htmlFor="status" className="font-semibold text-sm">Status Evaluasi Awal (Untuk Uji Coba VRule)</Label>
        <Select value={vendorStatus} onValueChange={setVendorStatus}>
          <SelectTrigger className="border border-gray-600 focus:border-blue-500 mt-1">
            <SelectValue placeholder="Pilih status vendor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NEW">Vendor Baru (Valid - Masuk Pending & Review Manager)</SelectItem>
            <SelectItem value="BLACKLISTED">Vendor Blacklist (Otomatis Ditolak VFlow)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full mt-2" disabled={loading}>
        {loading ? "Mengajukan..." : "Ajukan Vendor Baru"}
      </Button>
    </form>
  );
}
