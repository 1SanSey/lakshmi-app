import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { insertIncomeSourceSchema, type IncomeSource } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const incomeSourceFormSchema = insertIncomeSourceSchema.extend({
  name: z.string().min(1, "Название обязательно"),
});

type IncomeSourceFormData = z.infer<typeof incomeSourceFormSchema>;

interface IncomeSourceModalProps {
  incomeSource: IncomeSource | null;
  isOpen: boolean;
  onClose: () => void;
}

export function IncomeSourceModal({ incomeSource, isOpen, onClose }: IncomeSourceModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<IncomeSourceFormData>({
    resolver: zodResolver(incomeSourceFormSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (incomeSource) {
        form.reset({
          name: incomeSource.name,
          description: incomeSource.description || "",
          isActive: incomeSource.isActive,
        });
      } else {
        form.reset({
          name: "",
          description: "",
          isActive: true,
        });
      }
    }
  }, [incomeSource, form, isOpen]);

  const createMutation = useMutation({
    mutationFn: async (data: IncomeSourceFormData) => {
      return await apiRequest("/api/income-sources", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/income-sources"] });
      toast({
        title: "Успешно",
        description: "Источник поступления создан",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось создать источник поступления",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: IncomeSourceFormData) => {
      return await apiRequest(`/api/income-sources/${incomeSource!.id}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/income-sources"] });
      toast({
        title: "Успешно",
        description: "Источник поступления обновлен",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить источник поступления",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: IncomeSourceFormData) => {
    if (incomeSource) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {incomeSource ? "Редактировать источник" : "Новый источник поступления"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название</FormLabel>
                  <FormControl>
                    <Input placeholder="Введите название источника" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Введите описание источника (необязательно)"
                      value={field.value || ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Активен</FormLabel>
                    <div className="text-[0.8rem] text-muted-foreground">
                      Активные источники доступны для создания поступлений
                    </div>
                  </div>
                  <FormControl>
                    <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Отмена
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? incomeSource
                    ? "Обновление..."
                    : "Создание..."
                  : incomeSource
                  ? "Обновить"
                  : "Создать"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}