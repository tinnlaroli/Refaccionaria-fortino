import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { useTheme } from "./hooks/useTheme";
import { CatalogPage } from "./pages/CatalogPage";
import { ContactPage } from "./pages/ContactPage";
import { HomePage } from "./pages/HomePage";

export default function App() {
  const { theme, toggle } = useTheme();

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout theme={theme} onToggleTheme={toggle} />}>
          <Route index element={<HomePage />} />
          <Route path="catalogo" element={<CatalogPage />} />
          <Route path="contacto" element={<ContactPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
