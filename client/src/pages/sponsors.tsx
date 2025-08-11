import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Search, Edit, Trash2, ArrowUpDown } from "lucide-react";
import SponsorModal from "@/components/modals/sponsor-modal";
import type { Sponsor } from "@shared/schema";

export default function Sponsors() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  // Redirect to login if not authenticated
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

  const { data: sponsors = [], isLoading: sponsorsLoading } = useQuery<Sponsor[]>({
    queryKey: ["/api/sponsors", search],
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/sponsors/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sponsors"] });
      toast({
        title: "Успешно",
        description: "Спонсор удален успешно",
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
        description: "Не удалось удалить спонсора",
        variant: "destructive",
      });
    },
  });

  const handleAdd = () => {
    setEditingSponsor(null);
    setIsModalOpen(true);
  };

  const handleEdit = (sponsor: Sponsor) => {
    setEditingSponsor(sponsor);
    setIsModalOpen(true);
  };

  const handleDelete = (sponsor: Sponsor) => {
    if (confirm(`Вы уверены, что хотите удалить ${sponsor.name}?`)) {
      deleteMutation.mutate(sponsor.id);
    }
  };

  const filteredSponsors = sponsors.filter((sponsor: Sponsor) => {
    if (filter === "active" && !sponsor.isActive) return false;
    if (filter === "inactive" && sponsor.isActive) return false;
    return true;
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading || sponsorsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-4 sm:mb-0">
            <div className="h-8 bg-muted rounded w-32 mb-2 animate-pulse"></div>
            <div className="h-5 bg-muted rounded w-48 animate-pulse"></div>
          </div>
          <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
        </div>
        <div className="data-table animate-pulse">
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="mb-4 sm:mb-0">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Спонсоры</h2>
            <p className="text-gray-600">Управление отношениями со спонсорами</p>
          </div>
          <Button 
            onClick={handleAdd}
            className="bg-primary hover:bg-blue-700 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Добавить спонсора
          </Button>
        </div>

        <div className="data-table">
          <div className="p-4 border-b border-border">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Поиск спонсоров..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все спонсоры</SelectItem>
                  <SelectItem value="active">Активные</SelectItem>
                  <SelectItem value="inactive">Неактивные</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer hover:bg-muted/50">
                    <div className="flex items-center">
                      Имя
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50">
                    <div className="flex items-center">
                      Номер телефона
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSponsors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      {search ? "Спонсоры по вашему запросу не найдены." : "Спонсоров пока нет. Добавьте своего первого спонсора, чтобы начать."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSponsors.map((sponsor: Sponsor) => (
                    <TableRow key={sponsor.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                              {getInitials(sponsor.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="font-medium text-gray-900">{sponsor.name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-900">{sponsor.phone}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={sponsor.isActive ? "default" : "secondary"}
                          className={sponsor.isActive ? "bg-secondary text-secondary-foreground" : ""}
                        >
                          {sponsor.isActive ? "Активный" : "Неактивный"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(sponsor)}
                            className="text-primary hover:text-blue-700 hover:bg-primary/10"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(sponsor)}
                            className="text-destructive hover:text-red-700 hover:bg-destructive/10"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <SponsorModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sponsor={editingSponsor}
      />
    </>
  );
}
