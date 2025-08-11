import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Trash2, ArrowRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { FundTransfer, Fund } from "@shared/schema";
import FundTransferModal from "../components/modals/fund-transfer-modal";

export default function FundTransfers() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const { data: transfers = [], isLoading: transfersLoading } = useQuery<(FundTransfer & { fromFundName: string; toFundName: string })[]>({
    queryKey: ["/api/fund-transfers"],
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const { data: funds = [] } = useQuery<Fund[]>({
    queryKey: ["/api/funds"],
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/fund-transfers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fund-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/funds-with-balances"] });
      toast({
        title: "Успешно",
        description: "Перевод удален",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
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
        description: "Не удалось удалить перевод",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: string) => {
    if (confirm("Вы уверены, что хотите удалить этот перевод?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const filteredTransfers = transfers.filter(transfer =>
    transfer.fromFundName.toLowerCase().includes(search.toLowerCase()) ||
    transfer.toFundName.toLowerCase().includes(search.toLowerCase()) ||
    transfer.description?.toLowerCase().includes(search.toLowerCase())
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
          <h1 className="text-2xl font-bold text-foreground">Переводы между фондами</h1>
          <p className="text-muted-foreground">
            Управляйте переводами средств между фондами
          </p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto"
          disabled={funds.length < 2}
        >
          <Plus className="w-4 h-4 mr-2" />
          Новый перевод
        </Button>
      </div>

      {funds.length < 2 && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-muted-foreground">
              Для создания переводов необходимо иметь минимум 2 фонда
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Поиск переводов..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Transfers List */}
      {transfersLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-pulse text-muted-foreground">Загрузка переводов...</div>
        </div>
      ) : filteredTransfers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">
              {search ? "Нет переводов, соответствующих вашему поиску." : "Пока нет переводов. Создайте первый перевод!"}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTransfers.map((transfer) => (
            <Card key={transfer.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-medium">
                        {transfer.fromFundName}
                      </Badge>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <Badge variant="outline" className="font-medium">
                        {transfer.toFundName}
                      </Badge>
                    </div>
                    <div className="text-lg font-semibold">
                      {Number(transfer.amount).toLocaleString('ru-RU')} ₽
                    </div>
                    {transfer.description && (
                      <p className="text-sm text-muted-foreground">
                        {transfer.description}
                      </p>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {new Date(transfer.createdAt).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(transfer.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Transfer Modal */}
      <FundTransferModal
        open={isModalOpen}
        onClose={handleCloseModal}
        funds={funds}
      />
    </div>
  );
}