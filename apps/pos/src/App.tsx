import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.js";
import { CartProvider } from "./context/CartContext.js";
import { Layout } from "./components/Layout.js";
import { ProtectedRoute } from "./components/ProtectedRoute.js";
import { LoginPage } from "./pages/LoginPage.js";
import { PosPage } from "./pages/PosPage.js";
import { InventoryPage } from "./pages/InventoryPage.js";
import { CashPage } from "./pages/CashPage.js";

export default function App() {
  return (
    <BrowserRouter basename="/pos">
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <CartProvider>
                  <Layout />
                </CartProvider>
              </ProtectedRoute>
            }
          >
            <Route index element={<PosPage />} />
            <Route path="inventario" element={<InventoryPage />} />
            <Route path="caja" element={<CashPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
