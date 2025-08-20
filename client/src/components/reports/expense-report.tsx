import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function ExpenseReport() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showReport, setShowReport] = useState(false);

  const { data: reportData, isLoading } = useQuery({
    queryKey: ["/api/reports/expenses", dateFrom, dateTo],
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
  
  const totalAmount = dataArray.reduce(
    (total: number, category: any) => total + category.expenses.reduce((sum: number, expense: any) => sum + expense.amount, 0),
    0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Отчет по расходам</CardTitle>
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
              <div className="space-y-6">
                {dataArray.map((category: any, categoryIndex: number) => {
                  const categoryTotal = category.expenses.reduce((sum: number, expense: any) => sum + expense.amount, 0);
                  const categoryPercentage = totalAmount > 0 ? (categoryTotal / totalAmount * 100).toFixed(1) : 0;

                  return (
                    <div key={categoryIndex} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4 pb-2 border-b">
                        <h3 className="text-lg font-semibold">{category.categoryName}</h3>
                        <div className="text-right">
                          <div className="font-medium">{categoryTotal.toLocaleString('ru-RU')} ₽</div>
                          <div className="text-sm text-muted-foreground">{categoryPercentage}% от общих расходов</div>
                        </div>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Название траты</TableHead>
                              <TableHead className="text-right">Сумма</TableHead>
                              <TableHead className="text-right">% от категории</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {category.expenses.map((expense: any, expenseIndex: number) => {
                              const expensePercentage = categoryTotal > 0 ? (expense.amount / categoryTotal * 100).toFixed(1) : 0;
                              return (
                                <TableRow key={expenseIndex}>
                                  <TableCell>{expense.name}</TableCell>
                                  <TableCell className="text-right">{expense.amount.toLocaleString('ru-RU')} ₽</TableCell>
                                  <TableCell className="text-right">{expensePercentage}%</TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  );
                })}

                <div className="border-t-2 pt-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold">Итого расходов за период:</h3>
                    <div className="text-xl font-bold">{totalAmount.toLocaleString('ru-RU')} ₽</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Нет расходов за выбранный период
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}