import { prisma } from "../src/server/db/prisma";

const dummySuppliers = [
  {
    name: "PT Sumber Makmur Sentosa",
    contactPerson: "Andi Pratama",
    email: "andi.pratama@sumbermakmur.co.id",
    phone: "+62 812-3456-7890",
    category: "Makanan & Minuman",
    status: "Active" as const,
    products: "Snack, minuman kemasan",
    rating: 4.8,
    joinedDate: "12 Jan 2024",
  },
  {
    name: "CV Berkah Elektronik",
    contactPerson: "Siti Nurhaliza",
    email: "siti@berkahelektronik.id",
    phone: "+62 813-9876-5432",
    category: "Elektronik",
    status: "Active" as const,
    products: "Aksesoris gadget, charger",
    rating: 4.6,
    joinedDate: "03 Mar 2024",
  },
  {
    name: "PT Nusantara Packaging",
    contactPerson: "Budi Santoso",
    email: "budi.santoso@nusantarapackaging.com",
    phone: "+62 811-2345-6789",
    category: "Perlengkapan Toko",
    status: "Active" as const,
    products: "Box, label, plastik kemasan",
    rating: 4.4,
    joinedDate: "21 Apr 2024",
  },
  {
    name: "UD Jaya Abadi",
    contactPerson: "Rina Wulandari",
    email: "rina@jayaabadi.co.id",
    phone: "+62 819-8765-4321",
    category: "Peralatan Rumah Tangga",
    status: "Pending" as const,
    products: "Sapu, ember, lap microfiber",
    rating: 4.1,
    joinedDate: "-",
  },
  {
    name: "PT Graha Farmasi",
    contactPerson: "Hendra Wijaya",
    email: "hendra.wijaya@grahafarmasi.com",
    phone: "+62 821-1122-3344",
    category: "Kesehatan",
    status: "Active" as const,
    products: "Vitamin, obat bebas, masker",
    rating: 4.9,
    joinedDate: "08 Feb 2024",
  },
  {
    name: "CV Mitra Kain",
    contactPerson: "Dewi Lestari",
    email: "dewi@mitrakain.id",
    phone: "+62 822-4455-6677",
    category: "Tekstil",
    status: "Inactive" as const,
    products: "Kain, serbet, lap",
    rating: 3.9,
    joinedDate: "30 May 2023",
  },
  {
    name: "PT Segar Alam Lestari",
    contactPerson: "Rudi Hartono",
    email: "rudi@segaralam.co.id",
    phone: "+62 856-7788-9900",
    category: "Makanan & Minuman",
    status: "Active" as const,
    products: "Buah segar, sayur organik",
    rating: 4.7,
    joinedDate: "19 Sep 2024",
  },
  {
    name: "CV Teknologi Maju",
    contactPerson: "Lina Marlina",
    email: "lina@teknologimaju.id",
    phone: "+62 857-3344-5566",
    category: "Elektronik",
    status: "Suspended" as const,
    products: "Mouse, keyboard, headset",
    rating: 3.7,
    joinedDate: "14 Jul 2024",
  },
  {
    name: "UD Berkah Furniture",
    contactPerson: "Agus Setiawan",
    email: "agus@berkahfurniture.co.id",
    phone: "+62 858-2233-4455",
    category: "Furniture",
    status: "Active" as const,
    products: "Rak, kursi, meja kasir",
    rating: 4.5,
    joinedDate: "05 Aug 2024",
  },
  {
    name: "PT Kimia Sejahtera",
    contactPerson: "Maya Kusuma",
    email: "maya@kimiasejahtera.com",
    phone: "+62 859-6677-8899",
    category: "Kebersihan",
    status: "Active" as const,
    products: "Sabun, deterjen, pembersih lantai",
    rating: 4.3,
    joinedDate: "27 Oct 2024",
  },
];

async function main() {
  console.log("Seeding dummy suppliers to Partner table...");
  for (const s of dummySuppliers) {
    const existing = await prisma.partner.findFirst({
      where: { name: s.name, type: "VENDOR" },
    });
    if (!existing) {
      await prisma.partner.create({
        data: {
          name: s.name,
          contactPerson: s.contactPerson,
          email: s.email,
          phone: s.phone,
          category: s.category,
          status: s.status,
          products: s.products,
          rating: s.rating,
          joinedDate: s.joinedDate,
          type: "VENDOR",
        },
      });
      console.log(`Created vendor: ${s.name}`);
    } else {
      console.log(`Vendor already exists: ${s.name}`);
    }
  }
  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
