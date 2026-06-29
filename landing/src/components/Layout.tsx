import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Header } from "./Header";

type Props = {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  children: ReactNode;
};

export function Layout({ theme, onToggleTheme, children }: Props) {
  return (
    <div className="site-shell">
      <Header theme={theme} onToggleTheme={onToggleTheme} />
      <main id="main-content">{children}</main>
      <Footer />
    </div>
  );
}
