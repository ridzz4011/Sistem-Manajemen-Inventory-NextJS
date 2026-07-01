"use client";

import { format, parseISO } from "date-fns";
import { Area, CartesianGrid, ComposedChart, Line, XAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export interface ActivityPoint {
  date: string;
  stockIn: number;
  stockOut: number;
  approvals: number;
}

const chartConfig = {
  stockIn: {
    label: "Barang Masuk",
    color: "var(--chart-1)",
  },
  stockOut: {
    label: "Barang Keluar",
    color: "var(--chart-2)",
  },
  approvals: {
    label: "Persetujuan",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export function PerformanceOverview({ data }: { data: ActivityPoint[] }) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle className="leading-none">Aktivitas Inventaris</CardTitle>
        <CardDescription>
          <span className="@[540px]/card:block hidden">Pergerakan bulanan dan persetujuan dari database</span>
          <span className="@[540px]/card:hidden">Pergerakan bulanan</span>
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-80 w-full">
          <ComposedChart data={data} margin={{ top: 0 }}>
            <defs>
              <linearGradient id="fillStockIn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-stockIn)" stopOpacity={0.36} />
                <stop offset="95%" stopColor="var(--color-stockIn)" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeOpacity={0.5} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={48}
              tickFormatter={(value) =>
                parseISO(value).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  className="w-48"
                  indicator="line"
                  labelFormatter={(value) => format(parseISO(value), "d MMMM yyyy")}
                />
              }
            />
            <ChartLegend verticalAlign="top" content={<ChartLegendContent className="mb-5 justify-end" />} />
            <Area
              dataKey="stockIn"
              type="natural"
              fill="url(#fillStockIn)"
              stroke="var(--color-stockIn)"
              strokeWidth={1.25}
              dot={false}
              fillOpacity={1}
            />
            <Line dataKey="stockOut" type="natural" stroke="var(--color-stockOut)" strokeWidth={1.4} dot={false} />
            <Line dataKey="approvals" type="natural" stroke="var(--color-approvals)" strokeWidth={1.2} dot={false} />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
