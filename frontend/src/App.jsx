import { Toaster } from "react-hot-toast";
import AppRouter from "./routes/AppRouter";
import GlobalTooltip from "./components/GlobalTooltip/GlobalTooltip";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <Toaster position="top-right" />
      <GlobalTooltip />
      <AppRouter />
    </ErrorBoundary>
  );
}

export default App;