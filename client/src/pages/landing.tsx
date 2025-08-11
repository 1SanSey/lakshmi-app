import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartLine, Handshake, Receipt, CreditCard } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-blue-600 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ChartLine className="text-white h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Финансовый менеджер</h1>
            <p className="text-gray-600 mt-2">Войдите для управления финансами</p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center space-x-3 text-gray-600">
              <Handshake className="h-5 w-5 text-primary" />
              <span className="text-sm">Управление спонсорами и отношениями</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-600">
              <Receipt className="h-5 w-5 text-secondary" />
              <span className="text-sm">Отслеживание доходов и поступлений</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-600">
              <CreditCard className="h-5 w-5 text-destructive" />
              <span className="text-sm">Контроль расходов и затрат</span>
            </div>
          </div>

          <Button 
            onClick={handleLogin}
            className="w-full bg-primary hover:bg-blue-700 text-white py-3 font-medium"
            size="lg"
          >
            Войти
            <ChartLine className="ml-2 h-4 w-4" />
          </Button>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Безопасная аутентификация от Replit
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
