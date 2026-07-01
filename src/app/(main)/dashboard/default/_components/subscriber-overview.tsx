import { Download } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface PartnerOverviewRow {
  id: string;
  name: string;
  type: string;
  status: string;
  contactPerson: string;
  email: string;
  phone: string;
  category: string;
  joinedDate: string;
}

export function SubscriberOverview({ partners }: { partners: PartnerOverviewRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="leading-none">{partners.length.toLocaleString("id-ID")} Mitra</CardTitle>
        <CardDescription>Data vendor dan pelanggan dari tabel Partner.</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm">
            <Download />
            Ekspor
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mitra</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Kontak</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Bergabung</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partners.map((partner) => (
              <TableRow key={partner.id}>
                <TableCell>
                  <div className="grid min-w-0 gap-1">
                    <span className="truncate font-medium">{partner.name}</span>
                    <span className="truncate text-muted-foreground text-xs">{partner.id}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{partner.type}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={partner.status === "ACTIVE" ? "secondary" : "outline"}>{partner.status}</Badge>
                </TableCell>
                <TableCell>
                  <div className="grid gap-1">
                    <span>{partner.contactPerson}</span>
                    <span className="text-muted-foreground text-xs">{partner.email}</span>
                    <span className="text-muted-foreground text-xs">{partner.phone}</span>
                  </div>
                </TableCell>
                <TableCell>{partner.category}</TableCell>
                <TableCell>{partner.joinedDate}</TableCell>
              </TableRow>
            ))}
            {!partners.length ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Tidak ada mitra.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
