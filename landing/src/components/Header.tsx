import { useState } from "react";
import { SITE } from "../config/site";
import { ThemeToggle } from "./ThemeToggle";
import { LoginModal } from "./LoginModal";

type Props = {
  theme: "light" | "dark";
  onToggleTheme: () => void;
};

export function Header({ theme, onToggleTheme }: Props) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <a href="/" className="brand">
            <span className="brand-mark">F</span>
            <span className="brand-text">{SITE.name}</span>
          </a>
          <div className="header-actions">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <button 
              onClick={() => setIsLoginModalOpen(true)} 
              className="btn btn-ghost icon-btn"
              aria-label="Iniciar Sesión"
              title="Iniciar Sesión"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>
          </div>
        </div>
      </header>
      
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </>
  );
}
