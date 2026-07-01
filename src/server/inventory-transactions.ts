import {
  ApprovalStatus,
  ApprovalType,
  EntityType,
  RoleType,
  TaskStatus,
  TransactionStatus,
  TransactionType,
} from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";

type TransactionLineInput = {
  description: string;
  quantity: number;
  unitPrice: number;
  sku?: string;
  category?: string;
  uom?: string;
};

export type InventoryTransactionInput = {
  type: "STOCK_IN" | "STOCK_OUT";
  referenceNo?: string;
  partnerId?: string;
  locationId?: string;
  notes?: string;
  items: TransactionLineInput[];
  requestedBy?: string;
};

const categoryCodeMap: Record<string, { prefix: string; uom: string }> = {
  electronics: { prefix: "KMP-E", uom: "PCS" },
  electronic: { prefix: "KMP-E", uom: "PCS" },
  device: { prefix: "KMP-E", uom: "PCS" },
  devices: { prefix: "KMP-E", uom: "PCS" },
  elektronik: { prefix: "KMP-E", uom: "PCS" },
  food: { prefix: "KMP-F", uom: "PCS" },
  foods: { prefix: "KMP-F", uom: "PCS" },
  makanan: { prefix: "KMP-F", uom: "PCS" },
  minuman: { prefix: "KMP-F", uom: "PCS" },
};

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function inferCategory(description: string, category?: string) {
  const value = (category || description).toLowerCase();
  if (/(electronic|device|elektronik|gadget|charger|mouse|keyboard|headset)/.test(value)) return "electronics";
  if (/(food|makanan|minuman|snack|beras|susu|buah|sayur|kg)/.test(value)) return "food";
  return "general";
}

function skuPrefixFor(category: string) {
  return categoryCodeMap[category]?.prefix ?? "KMP-G";
}

function uomFor(category: string, uom?: string) {
  if (uom) return uom.toUpperCase();
  return categoryCodeMap[category]?.uom ?? "PCS";
}

function makeSku(prefix: string, sequence: number) {
  return `${prefix}-${String(sequence).padStart(3, "0")}`;
}

async function getDefaultLocationId(locationId?: string) {
  if (locationId) return locationId;

  const existing = await prisma.location.findFirst({ orderBy: { createdAt: "asc" } });
  if (existing) return existing.id;

  const warehouse = await prisma.warehouse.upsert({
    where: { code: "MAIN" },
    update: {},
    create: {
      code: "MAIN",
      name: "Main Warehouse",
      address: "Default inventory location",
    },
  });

  const location = await prisma.location.create({
    data: {
      name: "Main Storage",
      warehouseId: warehouse.id,
    },
  });

  return location.id;
}

async function getOrCreateItem(line: TransactionLineInput, sequence: number, partnerName?: string | null) {
  const name = normalizeName(line.description);
  const category = inferCategory(name, line.category);
  const prefix = skuPrefixFor(category);
  const sku = line.sku?.trim() || makeSku(prefix, sequence);
  const uom = uomFor(category, line.uom);
  const basePrice = Math.max(Number(line.unitPrice) || 0, 0);

  const existingBySku = await prisma.item.findUnique({ where: { sku } });
  if (existingBySku) {
    return prisma.item.update({
      where: { id: existingBySku.id },
      data: {
        name,
        basePrice,
        uom,
        description: existingBySku.description || `This product is from ${partnerName || "inventory transaction"}.`,
      },
    });
  }

  const existingByName = await prisma.item.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
  if (existingByName) {
    return prisma.item.update({
      where: { id: existingByName.id },
      data: {
        basePrice,
        uom,
        description: existingByName.description || `This product is from ${partnerName || "inventory transaction"}.`,
      },
    });
  }

  return prisma.item.create({
    data: {
      sku,
      name,
      basePrice,
      uom,
      description: `This product is from ${partnerName || "inventory transaction"}.`,
    },
  });
}

export async function createPendingInventoryTransaction(input: InventoryTransactionInput) {
  if (!input.items.length) {
    throw new Error("At least one invoice item is required.");
  }

  const transactionType = input.type === "STOCK_IN" ? TransactionType.STOCK_IN : TransactionType.STOCK_OUT;
  const approvalType = input.type === "STOCK_IN" ? ApprovalType.STOCK_IN : ApprovalType.STOCK_OUT;
  const locationId = await getDefaultLocationId(input.locationId);
  const partner = input.partnerId ? await prisma.partner.findUnique({ where: { id: input.partnerId } }) : null;
  const prefix = input.type === "STOCK_IN" ? "SI" : "SO";
  const referenceNo = input.referenceNo?.trim() || `${prefix}-${Date.now()}`;

  const details = [];
  for (let index = 0; index < input.items.length; index += 1) {
    const line = input.items[index];
    const quantity = Math.max(Math.trunc(Number(line.quantity) || 0), 0);
    if (!line.description.trim() || quantity <= 0) continue;

    const item = await getOrCreateItem(line, index + 1, partner?.name);

    if (input.type === "STOCK_OUT") {
      const balance = await prisma.inventoryBalance.findUnique({
        where: { itemId_locationId: { itemId: item.id, locationId } },
      });
      if (!balance || balance.quantity < quantity) {
        throw new Error(`Insufficient stock for ${item.name}. Available: ${balance?.quantity ?? 0}.`);
      }
    }

    details.push({
      itemId: item.id,
      locationId,
      quantity,
      metadata: {
        description: line.description,
        unitPrice: Number(line.unitPrice) || 0,
        sku: item.sku,
        uom: item.uom,
      },
    });
  }

  if (!details.length) {
    throw new Error("At least one invoice item must have a description and quantity.");
  }

  const approverRole = await prisma.role.upsert({
    where: { name: RoleType.KEPALA_GUDANG },
    update: {},
    create: {
      name: RoleType.KEPALA_GUDANG,
      description: "Approves inventory stock movements",
    },
  });

  const transaction = await prisma.transaction.create({
    data: {
      referenceNo,
      type: transactionType,
      status: TransactionStatus.PENDING,
      partnerId: input.partnerId,
      notes: input.notes,
      details: { create: details },
      workflowTasks: {
        create: {
          roleId: approverRole.id,
          taskName: input.type === "STOCK_IN" ? "Approve Stock In" : "Approve Stock Out",
          status: TaskStatus.PENDING,
        },
      },
      auditLogs: {
        create: {
          workflowName: input.type === "STOCK_IN" ? "Stock In Workflow" : "Stock Out Workflow",
          entityType: "Transaction",
          entityId: referenceNo,
          action: input.type === "STOCK_IN" ? "STOCK_IN_CREATED" : "STOCK_OUT_CREATED",
          actorRole: "ADMIN_GUDANG",
          status: TransactionStatus.PENDING,
        },
      },
    },
    include: { details: { include: { item: true, location: true } }, partner: true },
  });

  const approval = await prisma.approvalRequest.create({
    data: {
      type: approvalType,
      requestedBy: input.requestedBy || "admin_gudang",
      status: ApprovalStatus.PENDING,
      payload: {
        transactionId: transaction.id,
        referenceNo: transaction.referenceNo,
        transaction_type: input.type,
        partnerId: input.partnerId,
        partner_name: transaction.partner?.name,
        items: transaction.details.map((detail) => ({
          itemId: detail.itemId,
          item_name: detail.item.name,
          item_sku: detail.item.sku,
          quantity: detail.quantity,
          unit_price: detail.metadata && typeof detail.metadata === "object" ? (detail.metadata as any).unitPrice : null,
          locationId: detail.locationId,
          location_name: detail.location.name,
        })),
      },
    },
  });

  return { transaction, approval };
}

export async function completeInventoryTransaction(transactionId: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { details: true },
  });

  if (!transaction) throw new Error("Transaction tidak ditemukan");
  const completableStatuses: TransactionStatus[] = [
    TransactionStatus.PENDING,
    TransactionStatus.DISPUTE,
    TransactionStatus.APPROVED,
  ];
  if (!completableStatuses.includes(transaction.status)) {
    return transaction;
  }

  for (const detail of transaction.details) {
    const balance = await prisma.inventoryBalance.upsert({
      where: { itemId_locationId: { itemId: detail.itemId, locationId: detail.locationId } },
      update: {},
      create: {
        itemId: detail.itemId,
        locationId: detail.locationId,
        quantity: 0,
      },
    });

    const nextQuantity =
      transaction.type === TransactionType.STOCK_IN
        ? balance.quantity + detail.quantity
        : balance.quantity - detail.quantity;

    if (nextQuantity < 0) {
      throw new Error("Inventory stock cannot become negative.");
    }

    await prisma.inventoryBalance.update({
      where: { id: balance.id },
      data: { quantity: nextQuantity },
    });
  }

  const updated = await prisma.transaction.update({
    where: { id: transaction.id },
    data: { status: TransactionStatus.COMPLETED },
  });

  await prisma.workflowTask.updateMany({
    where: { transactionId: transaction.id },
    data: { status: TaskStatus.APPROVED },
  });

  await prisma.auditLog.create({
    data: {
      transactionId: transaction.id,
      workflowName: transaction.type === TransactionType.STOCK_IN ? "Stock In Workflow" : "Stock Out Workflow",
      entityType: "Transaction",
      entityId: transaction.id,
      action: transaction.type === TransactionType.STOCK_IN ? "STOCK_IN_APPROVED" : "STOCK_OUT_APPROVED",
      actorRole: "KEPALA_GUDANG",
      status: TransactionStatus.COMPLETED,
    },
  });

  return updated;
}

export async function rejectInventoryTransaction(transactionId: string) {
  await prisma.transaction.updateMany({
    where: { id: transactionId, status: { in: [TransactionStatus.PENDING, TransactionStatus.DISPUTE] } },
    data: { status: TransactionStatus.REJECTED },
  });

  await prisma.workflowTask.updateMany({
    where: { transactionId },
    data: { status: TaskStatus.REJECTED },
  });
}

export function expectedPartnerType(type: "STOCK_IN" | "STOCK_OUT") {
  return type === "STOCK_IN" ? EntityType.VENDOR : EntityType.CLIENT;
}
