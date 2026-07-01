import { subDays } from "date-fns";

import { ApprovalType, EntityType, TransactionStatus, TransactionType } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";

import { MetricCards, type DashboardMetrics } from "./_components/metric-cards";
import { type ActivityPoint, PerformanceOverview } from "./_components/performance-overview";
import { type PartnerOverviewRow, SubscriberOverview } from "./_components/subscriber-overview";

export const dynamic = "force-dynamic";

export default async function Page() {
  const since = subDays(new Date(), 90);
  const [items, partners, transactions, approvals] = await Promise.all([
    prisma.item.findMany({
      include: { balances: true },
    }),
    prisma.partner.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.transaction.findMany({
      where: { createdAt: { gte: since } },
      include: {
        details: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.approvalRequest.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const revenue = transactions
    .filter((transaction) => transaction.type === TransactionType.STOCK_OUT && transaction.status === TransactionStatus.COMPLETED)
    .reduce((sum, transaction) => sum + transaction.details.reduce((detailSum, detail) => detailSum + getDetailAmount(detail), 0), 0);

  const inventoryValue = items.reduce((sum, item) => {
    const stock = item.balances.reduce((total, balance) => total + balance.quantity, 0);
    return sum + stock * Number(item.basePrice);
  }, 0);

  const metrics: DashboardMetrics = {
    revenue,
    vendorCount: await prisma.partner.count({ where: { type: EntityType.VENDOR } }),
    productCount: items.length,
    inventoryValue,
  };

  const chartData = buildActivityData(since, transactions, approvals);

  const partnerRows: PartnerOverviewRow[] = partners.map((partner) => ({
    id: partner.id,
    name: partner.name,
    type: partner.type,
    status: partner.status,
    contactPerson: partner.contactPerson || "-",
    email: partner.email || "-",
    phone: partner.phone || "-",
    category: partner.category || "-",
    joinedDate: partner.joinedDate || partner.createdAt.toLocaleDateString("id-ID"),
  }));

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <MetricCards metrics={metrics} />
      <PerformanceOverview data={chartData} />
      <SubscriberOverview partners={partnerRows} />
    </div>
  );
}

function buildActivityData(
  since: Date,
  transactions: ActivityTransaction[],
  approvals: ActivityApproval[],
): ActivityPoint[] {
  const days = Array.from({ length: 13 }, (_, index) => {
    const date = new Date(since);
    date.setDate(since.getDate() + index * 7);
    return date;
  });

  return days.map((date, index) => {
    const nextDate = days[index + 1] ?? new Date();
    const inRange = (value: Date) => value >= date && value < nextDate;

    return {
      date: date.toISOString(),
      stockIn: transactions
        .filter((transaction) => transaction.type === TransactionType.STOCK_IN && inRange(transaction.createdAt))
        .reduce((total, transaction) => total + transaction.details.reduce((sum, detail) => sum + detail.quantity, 0), 0),
      stockOut: transactions
        .filter((transaction) => transaction.type === TransactionType.STOCK_OUT && inRange(transaction.createdAt))
        .reduce((total, transaction) => total + transaction.details.reduce((sum, detail) => sum + detail.quantity, 0), 0),
      approvals: approvals.filter((approval) => approval.type !== ApprovalType.NEW_VENDOR && inRange(approval.createdAt)).length,
    };
  });
}

function getDetailAmount(detail: { quantity: number; metadata: unknown }) {
  const metadata = detail.metadata;
  const unitPrice =
    metadata && typeof metadata === "object" && "unitPrice" in metadata ? Number(metadata.unitPrice) || 0 : 0;

  return detail.quantity * unitPrice;
}

type ActivityTransaction = {
  type: TransactionType;
  createdAt: Date;
  details: { quantity: number }[];
};

type ActivityApproval = {
  type: ApprovalType;
  createdAt: Date;
};
