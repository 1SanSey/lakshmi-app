import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit2, Trash2, TrendingUp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Fund } from "@shared/schema";
import FundModal from "../components/modals/fund-modal";

export default function Funds() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFund, setEditingFund] = useState<Fund | null>(null);
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Неавторизован",
        description: "Вы вышли из системы. Выполняется повторный вход...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: funds = [], isLoading: fundsLoading } = useQuery<Fund[]>({
    queryKey: ["/api/funds", search],
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/funds/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/funds"] });
      toast({
        title: "Успешно",
        description: "Фонд удален успешно!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Неавторизован",
          description: "Вы вышли из системы. Выполняется повторный вход...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Ошибка",
        description: "Не удалось удалить фонд",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (fund: Fund) => {
    setEditingFund(fund);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Вы уверены, что хотите удалить этот фонд?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingFund(null);
  };

  // Calculate total percentage
  const totalPercentage = funds.reduce((sum, fund) => 
    fund.isActive ? sum + parseFloat(fund.percentage) : sum, 0
  );

  const filteredFunds = funds.filter(fund =>
    fund.name.toLowerCase().includes(search.toLowerCase()) ||
    fund.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-pulse text-muted-foreground">Загрузка...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Управление фондами</h1>
          <p className="text-muted-foreground">
            Управляйте своими фондами и их процентными распределениями
          </p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить фонд
        </Button>
      </div>

      {/* Distribution Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Сводка распределения
          </CardTitle>
          <CardDescription>
            Общее размещение активных фондов: {totalPercentage.toFixed(2)}%
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {totalPercentage < 100 && (
              <div className="text-amber-600 dark:text-amber-400 text-sm">
                ⚠️ Предупреждение: Активные фонды размещают только {totalPercentage.toFixed(2)}% поступающих средств
              </div>
            )}
            {totalPercentage > 100 && (
              <div className="text-red-600 dark:text-red-400 text-sm">
                ❌ Ошибка: Активные фонды превышают 100% размещения ({totalPercentage.toFixed(2)}%)
              </div>
            )}
            {totalPercentage === 100 && (
              <div className="text-green-600 dark:text-green-400 text-sm">
                ✅ Отлично: Активные фонды размещают ровно 100% поступающих средств
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Поиск фондов..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Funds List */}
      {fundsLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-pulse text-muted-foreground">Загрузка фондов...</div>
        </div>
      ) : filteredFunds.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">
              {search ? "Нет фондов, соответствующих вашему поиску." : "Пока нет фондов. Создайте свой первый фонд!"}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredFunds.map((fund) => (
            <Card key={fund.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{fund.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={fund.isActive ? "default" : "secondary"}>
                        {fund.isActive ? "Активен" : "Неактивен"}
                      </Badge>
                      <Badge variant="outline">
                        {parseFloat(fund.percentage).toFixed(2)}%
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(fund)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(fund.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {fund.description && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">
                    {fund.description}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Fund Modal */}
      <FundModal
        open={isModalOpen}
        onClose={handleCloseModal}
        fund={editingFund}
      />
    </div>
  );
}