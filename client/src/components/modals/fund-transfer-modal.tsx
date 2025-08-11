import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { insertFundTransferSchema } from "@shared/schema";
import type { Fund } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";

interface FundTransferModalProps {
  open: boolean;
  onClose: () => void;
  funds: Fund[];
}

const formSchema = z.object({
  fromFundId: z.string().min(1, "Выберите фонд-источник"),
  toFundId: z.string().min(1, "Выберите фонд-получатель"),
  amount: z.string().min(1, "Сумма обязательна").refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Сумма должна быть положительным числом",
  }),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function FundTransferModal({ open, onClose, funds }: FundTransferModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fromFundId: "",
      toFundId: "",
      amount: "",
      description: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        fromFundId: "",
        toFundId: "",
        amount: "",
        description: "",
      });
    }
  }, [open, form]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      await apiRequest("/api/fund-transfers", "POST", {
        ...data,
        amount: parseFloat(data.amount),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fund-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/funds-with-balances"] });
      toast({
        title: "Успешно",
        description: "Перевод создан",
      });
      form.reset();
      onClose();
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
        description: "Не удалось создать перевод",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (data.fromFundId === data.toFundId) {
      toast({
        title: "Ошибка",
        description: "Нельзя переводить средства в тот же фонд",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const activeFunds = funds.filter(fund => fund.isActive);
  const fromFundId = form.watch("fromFundId");
  const availableToFunds = activeFunds.filter(fund => fund.id !== fromFundId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Новый перевод между фондами</DialogTitle>
          <DialogDescription>
            Переведите средства из одного фонда в другой
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fromFundId">Из фонда</Label>
            <Select 
              value={form.watch("fromFundId")} 
              onValueChange={(value) => {
                form.setValue("fromFundId", value);
                // Reset toFundId if it's the same as fromFundId
                if (form.watch("toFundId") === value) {
                  form.setValue("toFundId", "");
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите фонд-источник" />
              </SelectTrigger>
              <SelectContent>
                {activeFunds.map((fund) => (
                  <SelectItem key={fund.id} value={fund.id}>
                    {fund.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.fromFundId && (
              <p className="text-sm text-destructive">{form.formState.errors.fromFundId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="toFundId">В фонд</Label>
            <Select 
              value={form.watch("toFundId")} 
              onValueChange={(value) => form.setValue("toFundId", value)}
              disabled={!fromFundId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите фонд-получатель" />
              </SelectTrigger>
              <SelectContent>
                {availableToFunds.map((fund) => (
                  <SelectItem key={fund.id} value={fund.id}>
                    {fund.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.toFundId && (
              <p className="text-sm text-destructive">{form.formState.errors.toFundId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Сумма (₽)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...form.register("amount")}
            />
            {form.formState.errors.amount && (
              <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание (необязательно)</Label>
            <Textarea
              id="description"
              placeholder="Причина перевода..."
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Создание..." : "Создать перевод"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}