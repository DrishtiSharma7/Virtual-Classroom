import { Toaster } from "react-hot-toast";
import AppRouter from "./routes/AppRouter";
import GlobalTooltip from "./components/GlobalTooltip/GlobalTooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import useTheme from "./hooks/useTheme";

function App() {
  useTheme();

  return (
    <ErrorBoundary>
      <Toaster
        position="top-right"
        toastOptions={{
          className: "vc-toast",
        }}
      />
      <GlobalTooltip />
      <AppRouter />
    </ErrorBoundary>
  );
}

export default App;