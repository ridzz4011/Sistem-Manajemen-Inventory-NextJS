export type SupplierStatus = "Active" | "Inactive" | "Pending" | "Suspended";

export const statusMeta: Record<SupplierStatus, { badgeClass: string; dotClass: string }> = {
  Active: {
    badgeClass: "border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
    dotClass: "bg-emerald-500",
  },
  Inactive: {
    badgeClass: "border-slate-500/30 text-slate-700 dark:text-slate-300",
    dotClass: "bg-slate-500",
  },
  Pending: {
    badgeClass: "border-amber-500/30 text-amber-700 dark:text-amber-300",
    dotClass: "bg-amber-500",
  },
  Suspended: {
    badgeClass: "border-rose-500/30 text-rose-700 dark:text-rose-300",
    dotClass: "bg-rose-500",
  },
};

export type SupplierRow = {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  category: string;
  status: SupplierStatus;
  products: string;
  rating: number;
  joinedDate: string;
};

export const suppliers: SupplierRow[] = [
  {
    id: "SUP-001",
    name: "PT Sumber Makmur Sentosa",
    contactPerson: "Andi Pratama",
    email: "andi.pratama@sumbermakmur.co.id",
    phone: "+62 812-3456-7890",
    category: "Makanan & Minuman",
    status: "Active",
    products: "Snack, minuman kemasan",
    rating: 4.8,
    joinedDate: "12 Jan 2024",
  },
  {
    id: "SUP-002",
    name: "CV Berkah Elektronik",
    contactPerson: "Siti Nurhaliza",
    email: "siti@berkahelektronik.id",
    phone: "+62 813-9876-5432",
    category: "Elektronik",
    status: "Active",
    products: "Aksesoris gadget, charger",
    rating: 4.6,
    joinedDate: "03 Mar 2024",
  },
  {
    id: "SUP-003",
    name: "PT Nusantara Packaging",
    contactPerson: "Budi Santoso",
    email: "budi.santoso@nusantarapackaging.com",
    phone: "+62 811-2345-6789",
    category: "Perlengkapan Toko",
    status: "Active",
    products: "Box, label, plastik kemasan",
    rating: 4.4,
    joinedDate: "21 Apr 2024",
  },
  {
    id: "SUP-004",
    name: "UD Jaya Abadi",
    contactPerson: "Rina Wulandari",
    email: "rina@jayaabadi.co.id",
    phone: "+62 819-8765-4321",
    category: "Peralatan Rumah Tangga",
    status: "Pending",
    products: "Sapu, ember, lap microfiber",
    rating: 4.1,
    joinedDate: "16 Jun 2024",
  },
  {
    id: "SUP-005",
    name: "PT Graha Farmasi",
    contactPerson: "Hendra Wijaya",
    email: "hendra.wijaya@grahafarmasi.com",
    phone: "+62 821-1122-3344",
    category: "Kesehatan",
    status: "Active",
    products: "Vitamin, obat bebas, masker",
    rating: 4.9,
    joinedDate: "08 Feb 2024",
  },
  {
    id: "SUP-006",
    name: "CV Mitra Kain",
    contactPerson: "Dewi Lestari",
    email: "dewi@mitrakain.id",
    phone: "+62 822-4455-6677",
    category: "Tekstil",
    status: "Inactive",
    products: "Kain, serbet, lap",
    rating: 3.9,
    joinedDate: "30 May 2023",
  },
  {
    id: "SUP-007",
    name: "PT Segar Alam Lestari",
    contactPerson: "Rudi Hartono",
    email: "rudi@segaralam.co.id",
    phone: "+62 856-7788-9900",
    category: "Makanan & Minuman",
    status: "Active",
    products: "Buah segar, sayur organik",
    rating: 4.7,
    joinedDate: "19 Sep 2024",
  },
  {
    id: "SUP-008",
    name: "CV Teknologi Maju",
    contactPerson: "Lina Marlina",
    email: "lina@teknologimaju.id",
    phone: "+62 857-3344-5566",
    category: "Elektronik",
    status: "Suspended",
    products: "Mouse, keyboard, headset",
    rating: 3.7,
    joinedDate: "14 Jul 2024",
  },
  {
    id: "SUP-009",
    name: "UD Berkah Furniture",
    contactPerson: "Agus Setiawan",
    email: "agus@berkahfurniture.co.id",
    phone: "+62 858-2233-4455",
    category: "Furniture",
    status: "Active",
    products: "Rak, kursi, meja kasir",
    rating: 4.5,
    joinedDate: "05 Aug 2024",
  },
  {
    id: "SUP-010",
    name: "PT Kimia Sejahtera",
    contactPerson: "Maya Kusuma",
    email: "maya@kimiasejahtera.com",
    phone: "+62 859-6677-8899",
    category: "Kebersihan",
    status: "Active",
    products: "Sabun, deterjen, pembersih lantai",
    rating: 4.3,
    joinedDate: "27 Oct 2024",
  },
];

export const filters = {
  category: ["All", ...Array.from(new Set(suppliers.map((supplier) => supplier.category)))],
  status: ["All", ...Array.from(new Set(suppliers.map((supplier) => supplier.status)))],
} as const;
