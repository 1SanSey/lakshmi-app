import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import AuthPage from "@/pages/auth";
import Home from "@/pages/home";
import Sponsors from "@/pages/sponsors";
import Receipts from "@/pages/receipts";
import Costs from "@/pages/costs";
import Funds from "@/pages/funds";
import FundTransfers from "@/pages/fund-transfers";
import FundDistributions from "@/pages/fund-distributions";
import IncomeSources from "@/pages/income-sources";
import Nomenclature from "@/pages/nomenclature";
import ExpenseCategories from "@/pages/expense-categories";
import Reports from "@/pages/reports";
import NotFound from "@/pages/not-found";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Загрузка...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route component={Landing} />
      </Switch>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex max-w-7xl mx-auto">
        <Sidebar />
        <main className="flex-1 lg:pl-64 pb-20 lg:pb-0">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/sponsors" component={Sponsors} />
              <Route path="/receipts" component={Receipts} />
              <Route path="/costs" component={Costs} />
              <Route path="/funds" component={Funds} />
              <Route path="/fund-transfers" component={FundTransfers} />
              <Route path="/fund-distributions" component={FundDistributions} />
              <Route path="/income-sources" component={IncomeSources} />
              <Route path="/nomenclature" component={Nomenclature} />
              <Route path="/expense-categories" component={ExpenseCategories} />
              <Route path="/reports" component={Reports} />
              <Route component={NotFound} />
            </Switch>
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
