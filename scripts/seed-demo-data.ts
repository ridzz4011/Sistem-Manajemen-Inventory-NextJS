import {
  ApprovalStatus,
  ApprovalType,
  EntityType,
  PartnerStatus,
  TransactionStatus,
  TransactionType,
} from "../src/generated/prisma/client";
import { prisma } from "../src/server/db/prisma";

const partners = [
  {
    name: "PT Sumber Elektronik Nusantara",
    contactPerson: "Rizky Pratama",
    type: EntityType.VENDOR,
    email: "procurement@sumber-elektronik.test",
    phone: "021-555-0101",
    address: "Jl. Merdeka No. 12, Jakarta",
    category: "Electronics",
    products: "Keyboard, mouse, charger",
    rating: 4.6,
  },
  {
    name: "CV Pangan Makmur",
    contactPerson: "Dewi Kartika",
    type: EntityType.VENDOR,
    email: "sales@pangan-makmur.test",
    phone: "022-555-0132",
    address: "Jl. Asia Afrika No. 8, Bandung",
    category: "Food",
    products: "Beras, susu, makanan ringan",
    rating: 4.4,
  },
  {
    name: "PT Cahaya Retail Mandiri",
    contactPerson: "Nadia Safitri",
    type: EntityType.CLIENT,
    email: "billing@cahaya-retail.test",
    phone: "031-555-0177",
    address: "Jl. Pemuda No. 41, Surabaya",
    category: "Retail",
    products: "Mixed goods",
    rating: 4.8,
  },
  {
    name: "Koperasi Sejahtera Bersama",
    contactPerson: "Agus Santoso",
    type: EntityType.CLIENT,
    email: "finance@ksb.test",
    phone: "0274-555-0188",
    address: "Jl. Kaliurang No. 21, Yogyakarta",
    category: "Cooperative",
    products: "Office supplies",
    rating: 4.3,
  },
];

const items = [
  { sku: "KMP-E-101", name: "Keyboard Mechanical", basePrice: 450000, uom: "PCS", stock: 32 },
  { sku: "KMP-E-102", name: "Mouse Wireless", basePrice: 175000, uom: "PCS", stock: 58 },
  { sku: "KMP-E-103", name: "Charger USB-C 65W", basePrice: 265000, uom: "PCS", stock: 24 },
  { sku: "KMP-F-101", name: "Beras Premium 5kg", basePrice: 82000, uom: "PCS", stock: 96 },
  { sku: "KMP-F-102", name: "Susu UHT 1L", basePrice: 18500, uom: "PCS", stock: 140 },
  { sku: "KMP-G-101", name: "Kertas A4 80gsm", basePrice: 62000, uom: "PCS", stock: 75 },
];

async function upsertPartner(data: (typeof partners)[number]) {
  const existing = await prisma.partner.findFirst({
    where: { name: data.name, type: data.type },
  });

  const payload = {
    ...data,
    status: PartnerStatus.ACTIVE,
    joinedDate: new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  };

  if (existing) {
    return prisma.partner.update({ where: { id: existing.id }, data: payload });
  }

  return prisma.partner.create({ data: payload });
}

async function main() {
  const warehouse = await prisma.warehouse.upsert({
    where: { code: "MAIN" },
    update: { name: "Main Warehouse", address: "Default KDMP inventory warehouse" },
    create: {
      code: "MAIN",
      name: "Main Warehouse",
      address: "Default KDMP inventory warehouse",
    },
  });

  const location = await prisma.location.upsert({
    where: { id: "demo-main-storage" },
    update: { name: "Main Storage", warehouseId: warehouse.id },
    create: {
      id: "demo-main-storage",
      name: "Main Storage",
      warehouseId: warehouse.id,
    },
  });

  const createdPartners = await Promise.all(partners.map(upsertPartner));
  const vendors = createdPartners.filter((partner) => partner.type === EntityType.VENDOR);
  const clients = createdPartners.filter((partner) => partner.type === EntityType.CLIENT);

  const createdItems = [];
  for (const item of items) {
    const created = await prisma.item.upsert({
      where: { sku: item.sku },
      update: {
        name: item.name,
        basePrice: item.basePrice,
        uom: item.uom,
        description: `Demo product for KDMP Inventory reports.`,
      },
      create: {
        sku: item.sku,
        name: item.name,
        basePrice: item.basePrice,
        uom: item.uom,
        description: `Demo product for KDMP Inventory reports.`,
      },
    });

    await prisma.inventoryBalance.upsert({
      where: { itemId_locationId: { itemId: created.id, locationId: location.id } },
      update: { quantity: item.stock },
      create: {
        itemId: created.id,
        locationId: location.id,
        quantity: item.stock,
      },
    });

    createdItems.push(created);
  }

  const transactionPlans = [
    {
      referenceNo: "DEMO-SI-001",
      type: TransactionType.STOCK_IN,
      status: TransactionStatus.COMPLETED,
      partnerId: vendors[0]?.id,
      lines: [
        { item: createdItems[0], quantity: 18 },
        { item: createdItems[1], quantity: 24 },
      ],
    },
    {
      referenceNo: "DEMO-SI-002",
      type: TransactionType.STOCK_IN,
      status: TransactionStatus.COMPLETED,
      partnerId: vendors[1]?.id,
      lines: [
        { item: createdItems[3], quantity: 40 },
        { item: createdItems[4], quantity: 80 },
      ],
    },
    {
      referenceNo: "DEMO-SO-001",
      type: TransactionType.STOCK_OUT,
      status: TransactionStatus.COMPLETED,
      partnerId: clients[0]?.id,
      lines: [
        { item: createdItems[0], quantity: 4 },
        { item: createdItems[1], quantity: 10 },
      ],
    },
    {
      referenceNo: "DEMO-SO-002",
      type: TransactionType.STOCK_OUT,
      status: TransactionStatus.COMPLETED,
      partnerId: clients[1]?.id,
      lines: [
        { item: createdItems[3], quantity: 12 },
        { item: createdItems[5], quantity: 6 },
      ],
    },
    {
      referenceNo: "DEMO-SO-003",
      type: TransactionType.STOCK_OUT,
      status: TransactionStatus.PENDING,
      partnerId: clients[0]?.id,
      lines: [{ item: createdItems[2], quantity: 3 }],
    },
  ];

  for (const plan of transactionPlans) {
    const existing = await prisma.transaction.findUnique({ where: { referenceNo: plan.referenceNo } });
    if (existing) continue;

    const transaction = await prisma.transaction.create({
      data: {
        referenceNo: plan.referenceNo,
        type: plan.type,
        status: plan.status,
        partnerId: plan.partnerId,
        notes: "Demo transaction for dashboard reporting.",
        details: {
          create: plan.lines.map((line) => ({
            itemId: line.item.id,
            locationId: location.id,
            quantity: line.quantity,
            metadata: {
              unitPrice: Number(line.item.basePrice),
              sku: line.item.sku,
              uom: line.item.uom,
              description: line.item.name,
            },
          })),
        },
      },
    });

    await prisma.approvalRequest.create({
      data: {
        type: plan.type === TransactionType.STOCK_IN ? ApprovalType.STOCK_IN : ApprovalType.STOCK_OUT,
        requestedBy: "admin_gudang",
        status: plan.status === TransactionStatus.PENDING ? ApprovalStatus.PENDING : ApprovalStatus.APPROVED,
        payload: {
          transactionId: transaction.id,
          referenceNo: transaction.referenceNo,
          source: "demo-seed",
        },
      },
    });
  }

  console.log("Demo inventory data seeded.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
