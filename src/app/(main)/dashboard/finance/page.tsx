import { format, subDays } from "date-fns";
import { Download, RotateCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionStatus, TransactionType } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";

export const dynamic = "force-dynamic";

export default async function Page() {
  const formattedDate = format(new Date(), "EEEE, do MMMM yyyy");
  const since = subDays(new Date(), 30);

  const [transactions, items] = await Promise.all([
    prisma.transaction.findMany({
      include: {
        partner: true,
        details: { include: { item: true, location: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.item.findMany({ include: { balances: true } }),
  ]);

  const completedTransactions = transactions.filter((transaction) => transaction.status === TransactionStatus.COMPLETED);
  const stockInValue = completedTransactions
    .filter((transaction) => transaction.type === TransactionType.STOCK_IN)
    .reduce((sum, transaction) => sum + getTransactionValue(transaction.details), 0);
  const stockOutValue = completedTransactions
    .filter((transaction) => transaction.type === TransactionType.STOCK_OUT)
    .reduce((sum, transaction) => sum + getTransactionValue(transaction.details), 0);
  const pendingValue = transactions
    .filter((transaction) => transaction.status === TransactionStatus.PENDING)
    .reduce((sum, transaction) => sum + getTransactionValue(transaction.details), 0);
  const inventoryValue = items.reduce((sum, item) => {
    const stock = item.balances.reduce((total, balance) => total + balance.quantity, 0);
    return sum + stock * Number(item.basePrice);
  }, 0);
  const monthlyTransactions = transactions.filter((transaction) => transaction.createdAt >= since);

  const stockOutShare = stockOutValue + stockInValue > 0 ? (stockOutValue / (stockOutValue + stockInValue)) * 100 : 0;
  const stockInShare = stockOutValue + stockInValue > 0 ? (stockInValue / (stockOutValue + stockInValue)) * 100 : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl tracking-tight">Keuangan Inventaris</h1>
          <p className="text-muted-foreground text-sm">{formattedDate}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <RotateCw />
            <span>Nilai langsung dari database</span>
          </div>
          <Button size="sm" variant="outline">
            <Download data-icon="inline-start" />
            Ekspor
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="flex flex-col gap-4">
        <TabsList variant="line">
          <TabsTrigger value="dashboard">Dasbor</TabsTrigger>
          <TabsTrigger value="transactions">Transaksi</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
            <FinanceKpi title="Pendapatan Barang Keluar" value={formatRupiah(stockOutValue)} description="Penjualan pelanggan yang sudah selesai" />
            <FinanceKpi title="Biaya Barang Masuk" value={formatRupiah(stockInValue)} description="Pembelian supplier yang sudah selesai" />
            <FinanceKpi title="Nilai Tertunda" value={formatRupiah(pendingValue)} description="Menunggu persetujuan" />
            <FinanceKpi title="Nilai Inventaris" value={formatRupiah(inventoryValue)} description="Stok yang tersedia saat ini" />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <Card className="xl:col-span-7">
              <CardHeader>
                <CardTitle>Ringkasan Transaksi</CardTitle>
                <CardDescription>30 hari terakhir dari Transaction dan TransactionDetail.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <div className="grid grid-cols-3 gap-4">
                  <SummaryBlock label="Transaksi" value={monthlyTransactions.length.toLocaleString("id-ID")} />
                  <SummaryBlock
                    label="Barang Masuk"
                    value={monthlyTransactions.filter((transaction) => transaction.type === TransactionType.STOCK_IN).length.toLocaleString("id-ID")}
                  />
                  <SummaryBlock
                    label="Barang Keluar"
                    value={monthlyTransactions.filter((transaction) => transaction.type === TransactionType.STOCK_OUT).length.toLocaleString("id-ID")}
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <ShareBar label="Porsi pendapatan barang keluar" value={stockOutShare} />
                  <ShareBar label="Porsi biaya barang masuk" value={stockInShare} />
                </div>
              </CardContent>
            </Card>

            <Card className="xl:col-span-5">
              <CardHeader>
                <CardTitle>Sumber Nilai</CardTitle>
                <CardDescription>Distribusi nilai transaksi yang sudah selesai.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <ValueSource label="Barang keluar pelanggan" value={stockOutValue} percentage={stockOutShare} />
                <ValueSource label="Barang masuk supplier" value={stockInValue} percentage={stockInShare} />
                <ValueSource label="Persetujuan tertunda" value={pendingValue} percentage={pendingValue + stockOutValue + stockInValue > 0 ? (pendingValue / (pendingValue + stockOutValue + stockInValue)) * 100 : 0} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaksi Terbaru</CardTitle>
              <CardDescription>Data dari tabel Transaction dan TransactionDetail.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referensi</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Mitra</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Barang</TableHead>
                    <TableHead className="text-right">Nilai</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.referenceNo}</TableCell>
                      <TableCell>{format(transaction.createdAt, "dd MMM yyyy")}</TableCell>
                      <TableCell>{transaction.partner?.name || "Internal"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{transaction.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={transaction.status === TransactionStatus.COMPLETED ? "secondary" : "outline"}>
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {transaction.details.reduce((sum, detail) => sum + detail.quantity, 0).toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right">{formatRupiah(getTransactionValue(transaction.details))}</TableCell>
                    </TableRow>
                  ))}
                  {!transactions.length ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        Tidak ada transaksi.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FinanceKpi({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal text-muted-foreground text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">{value}</div>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}

function SummaryBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="font-medium text-2xl tabular-nums">{value}</div>
    </div>
  );
}

function ShareBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span>{label}</span>
        <span className="tabular-nums">{value.toFixed(1)}%</span>
      </div>
      <Progress value={value} />
    </div>
  );
}

function ValueSource({ label, value, percentage }: { label: string; value: number; percentage: number }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-muted-foreground text-sm">{formatRupiah(value)}</div>
      </div>
      <Badge variant="secondary">{percentage.toFixed(1)}%</Badge>
    </div>
  );
}

function getTransactionValue(details: { quantity: number; metadata: unknown }[]) {
  return details.reduce((sum, detail) => sum + getDetailAmount(detail), 0);
}

function getDetailAmount(detail: { quantity: number; metadata: unknown }) {
  const metadata = detail.metadata;
  const unitPrice =
    metadata && typeof metadata === "object" && "unitPrice" in metadata ? Number(metadata.unitPrice) || 0 : 0;

  return detail.quantity * unitPrice;
}

function formatRupiah(value: number) {
  return `Rp. ${Math.round(value).toLocaleString("id-ID")}`;
}
