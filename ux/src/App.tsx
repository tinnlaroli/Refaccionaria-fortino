import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { HelpProvider } from "./context/HelpContext.js";
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
import { SyncPage } from "./pages/SyncPage.js";
import { CashPage } from "./pages/CashPage.js";
import { DashboardPage } from "./pages/admin/DashboardPage.js";
import { ProductsPage } from "./pages/admin/ProductsPage.js";
import { AdminInventoryPage } from "./pages/admin/AdminInventoryPage.js";
import { MovementsPage } from "./pages/admin/MovementsPage.js";
import { CategoriesPage } from "./pages/admin/CategoriesPage.js";
import { EmployeesPage } from "./pages/admin/EmployeesPage.js";
import { SalesPage } from "./pages/admin/SalesPage.js";
import { SuppliersPage } from "./pages/admin/SuppliersPage.js";
import { BrandsPage } from "./pages/admin/BrandsPage.js";
import { PurchasesPage } from "./pages/admin/PurchasesPage.js";
import { MediaLibraryPage } from "./pages/admin/MediaLibraryPage.js";

export default function App() {
  return (
    <BrowserRouter basename="/pos">
      <ThemeProvider>
        <ErrorBoundary>
          <ToastProvider>
            <AuthProvider>
              <HelpProvider>
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
                  <Route path="sincronizacion" element={<SyncPage />} />
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
                    path="marcas"
                    element={
                      <PermissionRoute permission="brands.view">
                        <BrandsPage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="proveedores"
                    element={
                      <PermissionRoute permission="suppliers.view">
                        <SuppliersPage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="compras"
                    element={
                      <PermissionRoute permission="purchases.view">
                        <PurchasesPage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="imagenes"
                    element={
                      <PermissionRoute permission="media.view">
                        <MediaLibraryPage />
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
              </HelpProvider>
            </AuthProvider>
          </ToastProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </BrowserRouter>
  );
}
