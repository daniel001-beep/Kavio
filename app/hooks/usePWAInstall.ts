"use client";

import { useEffect, useState } from "react";

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent browser default mini-infobar on mobile
      e.preventDefault();
      // Store the install event
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // If already running inside PWA standalone display mode
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const triggerInstall = async () => {
    if (!installPrompt) {
      console.warn("PWA: Installation prompt is not deferred yet.");
      return false;
    }

    // Trigger user prompt UI
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    console.log(`PWA: Install response outcome - ${outcome}`);

    if (outcome === "accepted") {
      setInstallPrompt(null);
      setIsInstallable(false);
      return true;
    }
    return false;
  };

  return { isInstallable, triggerInstall };
}
