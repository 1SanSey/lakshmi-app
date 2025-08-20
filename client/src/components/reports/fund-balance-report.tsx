import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function FundBalanceReport() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showReport, setShowReport] = useState(false);

  const { data: reportData, isLoading } = useQuery({
    queryKey: ["/api/reports/fund-balance", dateFrom, dateTo],
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

  const displayData = reportData || [];
  const dataArray = Array.isArray(displayData) ? displayData : [];
  const totals = dataArray.reduce(
    (acc: any, fund: any) => ({
      openingBalance: acc.openingBalance + fund.openingBalance,
      income: acc.income + fund.income,
      expenses: acc.expenses + fund.expenses,
      currentBalance: acc.currentBalance + fund.currentBalance
    }),
    { openingBalance: 0, income: 0, expenses: 0, currentBalance: 0 }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Отчет по остаткам средств в фондах</CardTitle>
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
            ) : dataArray.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Фонд</TableHead>
                      <TableHead className="text-right">Остаток на начало</TableHead>
                      <TableHead className="text-right">Приход средств</TableHead>
                      <TableHead className="text-right">Расход средств</TableHead>
                      <TableHead className="text-right">Текущий остаток</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataArray.map((fund: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{fund.fundName}</TableCell>
                        <TableCell className="text-right">
                          {fund.openingBalance.toLocaleString('ru-RU')} ₽
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          +{fund.income.toLocaleString('ru-RU')} ₽
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          -{fund.expenses.toLocaleString('ru-RU')} ₽
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {fund.currentBalance.toLocaleString('ru-RU')} ₽
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2 font-medium">
                      <TableCell>ИТОГО</TableCell>
                      <TableCell className="text-right">
                        {totals.openingBalance.toLocaleString('ru-RU')} ₽
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        +{totals.income.toLocaleString('ru-RU')} ₽
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        -{totals.expenses.toLocaleString('ru-RU')} ₽
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {totals.currentBalance.toLocaleString('ru-RU')} ₽
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Нет данных за выбранный период
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}