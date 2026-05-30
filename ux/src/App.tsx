import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.js";
import { CartProvider } from "./context/CartContext.js";
import { ThemeProvider } from "./context/ThemeContext.js";
import { ToastProvider } from "./context/ToastContext.js";
import { ErrorBoundary } from "./components/ErrorBoundary.js";
import { Layout } from "./components/Layout.js";
import { ProtectedRoute } from "./components/ProtectedRoute.js";
import { PermissionRoute } from "./components/PermissionRoute.js";
import { AdminRoute } from "./components/AdminRoute.js";
import { DashboardLayout } from "./components/dashboard/DashboardLayout.js";
import { LoginPage } from "./pages/LoginPage.js";
import { PosPage } from "./pages/PosPage.js";
import { InventoryPage } from "./pages/InventoryPage.js";
import { CashPage } from "./pages/CashPage.js";
import { DashboardPage } from "./pages/admin/DashboardPage.js";
import { ProductsPage } from "./pages/admin/ProductsPage.js";
import { AdminInventoryPage } from "./pages/admin/AdminInventoryPage.js";
import { MovementsPage } from "./pages/admin/MovementsPage.js";
import { CategoriesPage } from "./pages/admin/CategoriesPage.js";
import { EmployeesPage } from "./pages/admin/EmployeesPage.js";
import { SalesPage } from "./pages/admin/SalesPage.js";

export default function App() {
  return (
    <BrowserRouter basename="/pos">
      <ThemeProvider>
        <ErrorBoundary>
          <ToastProvider>
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
                <Route
                  path="/app"
                  element={
                    <ProtectedRoute>
                      <AdminRoute>
                        <DashboardLayout />
                      </AdminRoute>
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<DashboardPage />} />
                  <Route
                    path="productos"
                    element={
                      <PermissionRoute permission="products.view">
                        <ProductsPage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="categorias"
                    element={
                      <PermissionRoute permission="products.view">
                        <CategoriesPage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="empleados"
                    element={
                      <PermissionRoute permission="users.manage">
                        <EmployeesPage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="inventario"
                    element={
                      <PermissionRoute permission="products.view">
                        <AdminInventoryPage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="movimientos"
                    element={
                      <PermissionRoute permission="products.view">
                        <MovementsPage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="ventas"
                    element={
                      <PermissionRoute permission="sales.view_all">
                        <SalesPage />
                      </PermissionRoute>
                    }
                  />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AuthProvider>
          </ToastProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </BrowserRouter>
  );
}
