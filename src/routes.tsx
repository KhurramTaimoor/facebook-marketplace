import { createBrowserRouter } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { RequireAuth } from "./auth/RequireAuth";
import { AppHome } from "./pages/AppHome";

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
  {
    path: "/app",
    element: (
      <RequireAuth>
        <AppHome />
      </RequireAuth>
    ),
  },
]);
