"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./AccountMenu.module.css";
import { BriefcaseIcon, LogoutIcon, MenuIcon, UserCircleIcon } from "./icons";

// Menu hamburger dell'header: se non sei loggato apre un piccolo form per
// "Accedi come guest" (mail -> link via email, come su HomeToGo, vedi
// screenshot di riferimento); se sei loggato mostra "Bentornato" con le
// scorciatoie a /account. Nessuna password: lo stato di accesso è deciso
// dal cookie httpOnly guest_session, che qui leggiamo indirettamente
// tramite GET /api/auth/me (il client non può leggere un cookie httpOnly).
export function AccountMenu({ isHost = false }: { isHost?: boolean }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string | null | undefined>(undefined); // undefined = ancora in caricamento
  const [inputEmail, setInputEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [devLoginUrl, setDevLoginUrl] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data: { email: string | null }) => setEmail(data.email))
      .catch(() => setEmail(null));
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleRequestLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!inputEmail.trim()) return;
    setStatus("sending");
    setDevLoginUrl(null);
    try {
      const res = await fetch("/api/auth/request-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inputEmail.trim() }),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      const data: { devLoginUrl?: string } = await res.json();
      setStatus("sent");
      if (data.devLoginUrl) setDevLoginUrl(data.devLoginUrl);
    } catch {
      setStatus("error");
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setEmail(null);
    setOpen(false);
    window.location.reload();
  }

  async function handleHostLogout() {
    await fetch("/api/auth/host-logout", { method: "POST" });
    setOpen(false);
    window.location.reload();
  }

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        type="button"
        className={styles.menuBtn}
        aria-label="Menu account"
        onClick={() => setOpen((v) => !v)}
      >
        {email ? (
          <span className={styles.avatar}>{email.charAt(0).toUpperCase()}</span>
        ) : (
          <MenuIcon size={22} />
        )}
      </button>

      {open && (
        <div className={styles.dropdown}>
          {email ? (
            <>
              <div className={styles.welcomeBlock}>
                <span className={styles.avatarBig}>{email.charAt(0).toUpperCase()}</span>
                <div>
                  <p className={styles.welcomeTitle}>Bentornato</p>
                  <p className={styles.welcomeEmail}>{email}</p>
                </div>
              </div>

              <Link href="/account" className={styles.menuItem} onClick={() => setOpen(false)}>
                <UserCircleIcon size={18} />
                Il tuo account
              </Link>
              <Link
                href="/account?tab=prenotazioni"
                className={styles.menuItem}
                onClick={() => setOpen(false)}
              >
                <BriefcaseIcon size={18} />
                Le tue prenotazioni
              </Link>

              <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
                <LogoutIcon size={16} />
                Esci
              </button>
            </>
          ) : (
            <>
              <p className={styles.loginTitle}>Accedi come guest</p>
              <p className={styles.loginSubtitle}>
                Inserisci la tua mail: ti mandiamo un link per accedere, senza password.
              </p>

              {status === "sent" ? (
                <div>
                  <p className={styles.sentText}>
                    Controlla la tua casella <strong>{inputEmail}</strong>: ti abbiamo mandato il
                    link di accesso.
                  </p>
                  {devLoginUrl && (
                    <a href={devLoginUrl} className={styles.devLink}>
                      (dev) apri il link di accesso
                    </a>
                  )}
                </div>
              ) : (
                <form onSubmit={handleRequestLogin} className={styles.loginForm}>
                  <input
                    type="email"
                    required
                    placeholder="la-tua-mail@esempio.it"
                    value={inputEmail}
                    onChange={(e) => setInputEmail(e.target.value)}
                    className={styles.loginInput}
                  />
                  <button type="submit" className={styles.loginBtn} disabled={status === "sending"}>
                    {status === "sending" ? "Invio..." : "Invia il link"}
                  </button>
                  {status === "error" && (
                    <p className={styles.errorText}>Qualcosa è andato storto, riprova.</p>
                  )}
                </form>
              )}
            </>
          )}

          {isHost ? (
            <button type="button" className={styles.hostLogoutBtn} onClick={handleHostLogout}>
              <LogoutIcon size={16} />
              Esci
            </button>
          ) : (
            <Link href="/admin/login" className={styles.hostLink} onClick={() => setOpen(false)}>
              Accedi come SuperHost
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
