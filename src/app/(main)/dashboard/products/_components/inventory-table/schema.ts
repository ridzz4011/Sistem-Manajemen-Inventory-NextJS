// src/app/(main)/dashboard/products/_components/inventory-table/schema.ts

// Penapis (filters) yang berguna untuk paparan jadual inventori
export const inventoryFilters = ["Semua", "Tersedia", "Stok Menipis", "Habis"] as const;

export type InventoryFilter = (typeof inventoryFilters)[number];

// Definisi baris data berdasarkan model Item dan InventoryBalance di Prisma
export type InventoryRow = {
  id: string;               // CUID dari model Item
  sku: string;              // SKU yang unik dari model Item
  name: string;             // Nama barang
  description?: string | null; // Penerangan barang (pilihan)
  
  // basePrice di Prisma menggunakan Decimal. 
  // Untuk paparan UI, ia biasanya ditukar (parsed) menjadi number atau string.
  basePrice: number;        
  
  uom: string;              // Unit of Measurement (cth: PCS, KG, BOX) daripada model Item
  
  // stock adalah hasil tambah (sum) quantity daripada model InventoryBalance
  stock: number;            
  
  // status adalah medan tambahan khusus untuk UI/Frontend untuk memudahkan penapisan 
  // (contoh: jika stock > 10 = "Tersedia", jika stock > 0 && stock <= 10 = "Stok Menipis", jika 0 = "Habis")
  status: "Tersedia" | "Stok Menipis" | "Habis"; 
};