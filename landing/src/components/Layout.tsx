import { Outlet } from "react-router-dom";
import { Footer } from "./Footer";
import { Header } from "./Header";

type Props = {
  theme: "light" | "dark";
  onToggleTheme: () => void;
};

export function Layout({ theme, onToggleTheme }: Props) {
  return (
    <div className="site-shell">
      <Header theme={theme} onToggleTheme={onToggleTheme} />
      <main id="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
