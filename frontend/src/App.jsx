import { lazy, Suspense } from "react";
import AppRouter from "./routes/AppRouter";

const Toaster = lazy(() =>
  import("react-hot-toast").then((mod) => ({ default: mod.Toaster }))
);

function App() {
  return (
    <>
      <Suspense fallback={null}>
        <Toaster position="top-right" />
      </Suspense>
      <AppRouter />
    </>
  );
}

export default App;