import { useState, useEffect } from "react";
import { SITE } from "../config/site";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function LoginModal({ isOpen, onClose }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate a brief loading state before redirecting to the POS
    setTimeout(() => {
      window.location.href = SITE.posUrl;
    }, 600);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Cerrar modal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        
        <div className="modal-header">
          <div className="modal-icon-wrap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h2>Iniciar Sesión</h2>
          <p>Accede al sistema de administración</p>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="username">Usuario</label>
            <input 
              type="text" 
              id="username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="tu_usuario"
              required 
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input 
              type="password" 
              id="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block modal-submit" disabled={isLoading}>
            {isLoading ? "Verificando..." : "Entrar al sistema"}
          </button>
        </form>
      </div>
    </div>
  );
}
