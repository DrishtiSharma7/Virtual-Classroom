import { lazy, Suspense } from "react";
import AppRouter from "./routes/AppRouter";

// Lazy so react-hot-toast isn't part of the eagerly-loaded entry bundle —
// the public auth pages (login/register) never call toast(), only
// protected pages reached after signing in do. React.lazy starts this
// import the moment App mounts, in parallel with everything else, so it's
// still ready well before a lazy-loaded protected page could ever call
// toast() from its own network round trip.
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