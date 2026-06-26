import type React from "react";

import type { TransactionFilter } from "./schema";

export function formatOrderCount(filter: TransactionFilter, count: number) {
  const orderLabel = count === 1 ? "order" : "orders";

  if (filter === "ALL") {
    return `${count.toLocaleString()} ${orderLabel}`;
  }

  if (filter === "DRAFT") {
    return `${count.toLocaleString()} ${orderLabel} DRAFT`;
  }

  if (filter === "PENDING") {
    return `${count.toLocaleString()} ${orderLabel} PENDING`;
  }

  if (filter === "APPROVED") {
    return `${count.toLocaleString()} ${orderLabel} APPROVED`;
  }

  if (filter === "COMPLETED") {
    return `${count.toLocaleString()} ${orderLabel} COMPLETED`;
  }

  if (filter === "REJECTED") {
    return `${count.toLocaleString()} ${orderLabel} REJECTED`;
  }

  return `${count.toLocaleString()} ${String(filter).toLowerCase()} ${orderLabel}`;
}

export function formatSelectedOrderCount(count: number) {
  const orderLabel = count === 1 ? "order" : "orders";

  return `${count.toLocaleString()} ${orderLabel} selected`;
}
