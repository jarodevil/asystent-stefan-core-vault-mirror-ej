import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { OfflineIndicator } from "./components/OfflineIndicator";
import FloatingNotesPanel from "./components/FloatingNotesPanel";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import Analysis from "./pages/Analysis";
import Templates from "./pages/Templates";
import Notes from "./pages/Notes";
import Knowledge from "./pages/Knowledge";
import About from "@/pages/About";
import Help from "@/pages/Help";
import Settings from "./pages/Settings";
import Pricing from "./pages/Pricing";
import Sessions from "./pages/Sessions";
import Privacy from "./pages/Privacy";

import DevPanel from "./pages/DevPanel";
import KSeF from "./pages/KSeF";
import KsefClientCards from "./pages/KsefClientCards";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/chat"} component={Chat} />
      <Route path={"/analysis"} component={Analysis} />
      <Route path={"/templates"} component={Templates} />
      <Route path={"/notes"} component={Notes} />
      <Route path={"/knowledge"} component={Knowledge} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/pricing"} component={Pricing} />
      <Route path={"/sessions"} component={Sessions} />

      <Route path="/dev" component={DevPanel} />
      <Route path="/ksef" component={KSeF} />
      <Route path="/ksef/klient" component={KsefClientCards} />
      <Route path="/about" component={About} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/help" component={Help} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <OfflineIndicator />
          <FloatingNotesPanel />
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
