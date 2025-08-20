import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function SponsorReport() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showReport, setShowReport] = useState(false);

  const { data: reportData, isLoading } = useQuery({
    queryKey: ["/api/reports/sponsors", dateFrom, dateTo],
    enabled: Boolean(showReport && dateFrom && dateTo),
    retry: false,
  });

  const handleGenerateReport = () => {
    if (dateFrom && dateTo) {
      setShowReport(true);
    }
  };

  const handleClearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setShowReport(false);
  };

  // Mock data for demonstration
  const mockData = [
    {
      sponsorName: "Иван Петров",
      phone: "+7 (999) 123-45-67",
      totalAmount: 45000,
      donationsCount: 3
    },
    {
      sponsorName: "ООО Рога и копыта",
      phone: "+7 (999) 987-65-43",
      totalAmount: 80000,
      donationsCount: 2
    },
    {
      sponsorName: "Мария Сидорова",
      phone: "+7 (999) 555-55-55",
      totalAmount: 25000,
      donationsCount: 5
    },
    {
      sponsorName: "АО Прогресс",
      phone: "+7 (999) 111-22-33",
      totalAmount: 120000,
      donationsCount: 1
    }
  ];

  const displayData = reportData || (showReport ? mockData : []);
  const dataArray = Array.isArray(displayData) ? displayData : [];
  const totalAmount = dataArray.reduce((sum: number, sponsor: any) => sum + sponsor.totalAmount, 0);
  const totalDonations = dataArray.reduce((sum: number, sponsor: any) => sum + sponsor.donationsCount, 0);

  // Sort by total amount descending
  const sortedData = [...dataArray].sort((a: any, b: any) => b.totalAmount - a.totalAmount);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Отчет по спонсорам</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="date-from">Дата с</Label>
            <Input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="date-to">Дата по</Label>
            <Input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div className="flex items-end space-x-2">
            <Button onClick={handleGenerateReport} disabled={!dateFrom || !dateTo}>
              Сформировать отчет
            </Button>
            <Button variant="outline" onClick={handleClearFilters}>
              Сбросить
            </Button>
          </div>
        </div>

        {showReport && (
          <div className="space-y-4">
            {dateFrom && dateTo && (
              <div className="text-sm text-muted-foreground">
                Период: {format(new Date(dateFrom), 'dd MMMM yyyy', { locale: ru })} — {format(new Date(dateTo), 'dd MMMM yyyy', { locale: ru })}
              </div>
            )}

            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-64 bg-muted rounded"></div>
              </div>
            ) : sortedData.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{sortedData.length}</div>
                      <p className="text-xs text-muted-foreground">Активных спонсоров</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{totalDonations}</div>
                      <p className="text-xs text-muted-foreground">Всего пожертвований</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">
                        {Math.round(totalAmount / sortedData.length).toLocaleString('ru-RU')} ₽
                      </div>
                      <p className="text-xs text-muted-foreground">Средняя сумма на спонсора</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Спонсор</TableHead>
                        <TableHead>Телефон</TableHead>
                        <TableHead className="text-right">Сумма пожертвований</TableHead>
                        <TableHead className="text-right">Количество пожертвований</TableHead>
                        <TableHead className="text-right">% от общей суммы</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedData.map((sponsor, index) => {
                        const percentage = totalAmount > 0 ? (sponsor.totalAmount / totalAmount * 100).toFixed(1) : 0;
                        return (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{sponsor.sponsorName}</TableCell>
                            <TableCell>{sponsor.phone}</TableCell>
                            <TableCell className="text-right font-medium">
                              {sponsor.totalAmount.toLocaleString('ru-RU')} ₽
                            </TableCell>
                            <TableCell className="text-right">{sponsor.donationsCount}</TableCell>
                            <TableCell className="text-right">{percentage}%</TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow className="border-t-2 font-medium">
                        <TableCell colSpan={2}>ИТОГО</TableCell>
                        <TableCell className="text-right font-bold">
                          {totalAmount.toLocaleString('ru-RU')} ₽
                        </TableCell>
                        <TableCell className="text-right font-bold">{totalDonations}</TableCell>
                        <TableCell className="text-right font-bold">100%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Нет поступлений от спонсоров за выбранный период
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}