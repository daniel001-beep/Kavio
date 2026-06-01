"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/src/lib/supabase-client";
import { useNotifications } from "@/app/context/NotificationContext";
import { useSession } from "@/app/context/AuthContext";
import { UITransaction } from "@/app/components/LedgerClient";

interface UseDashboardDataProps {
  initialBalance: number;
  initialChange: number;
  initialTransactions: UITransaction[];
}

export function useDashboardData({
  initialBalance,
  initialChange,
  initialTransactions = [],
}: UseDashboardDataProps) {
  const { data: session, status } = useSession();
  const userEmail = session?.user?.email;
  const userId = session?.user?.id;

  const [currency, setCurrency] = useState<"USD" | "EUR" | "NGN">("NGN"); // Default NGN for Kavio (Nigerian OS)
  const [isExporting, setIsExporting] = useState(false);
  const { addNotification } = useNotifications();
  
  const [apiTransactions, setApiTransactions] = useState<UITransaction[]>([]);
  const [serverBalance, setServerBalance] = useState(initialBalance);
  const [serverDayChange, setServerDayChange] = useState(initialChange);
  const [exchangeRates, setExchangeRates] = useState({
    USD: 1,
    EUR: 0.92,
    NGN: 1550.00, // Reasonable baseline NGN exchange rate
  });

  // Fetch live exchange rates
  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/USD")
      .then((r) => r.json())
      .then((d) => {
        if (d && d.rates) {
          setExchangeRates({
            USD: 1,
            EUR: d.rates.EUR || 0.92,
            NGN: d.rates.NGN || 1550.00,
          });
        }
      })
      .catch((e) => console.warn("Failed to fetch live exchange rates", e));
  }, []);

  // Load from cache or initial data
  useEffect(() => {
    setApiTransactions([]);
    if (initialTransactions && initialTransactions.length > 0) {
      setApiTransactions(initialTransactions);
    }

    if (userEmail) {
      const cached = localStorage.getItem(`velox_cached_api_transactions_${userEmail}`);
      if (cached) {
        try {
          const parsedCache = JSON.parse(cached);
          if (Array.isArray(parsedCache)) {
            setApiTransactions(parsedCache);
          }
        } catch (e) {
          console.warn("Failed to parse cached dashboard transactions:", e);
        }
      }
    }
  }, [userEmail, initialTransactions]);

  // Track last active email
  useEffect(() => {
    if (userEmail && typeof window !== "undefined") {
      localStorage.setItem("velox_last_active_user_email", userEmail);
    }
  }, [userEmail]);

  // Fetch latest transactions from API
  const fetchLatestTransactions = useCallback(async () => {
    try {
      const res = await fetch("/api/ledger/transaction?_t=" + Date.now(), {
        cache: "no-store",
      });

      if (!res.ok) {
        console.warn("Dashboard: API returned non-OK status:", res.status);
        return;
      }

      const data = await res.json();
      const transactionsPayload = Array.isArray(data) ? data : data.transactions || [];

      if (!Array.isArray(data)) {
        setServerBalance(data.totalBalanceUsd !== undefined ? data.totalBalanceUsd : initialBalance);
        setServerDayChange(data.dayChangeUsd !== undefined ? data.dayChangeUsd : initialChange);
      }

      const mapped: UITransaction[] = transactionsPayload.map((tx: any) => {
        const amountInDollars = Number(tx.amount) / 100;
        let meta = tx.metadata;
        if (typeof meta === "string") {
          try {
            meta = JSON.parse(meta);
          } catch (e) {}
        }
        return {
          id: tx.id?.toString(),
          type: amountInDollars > 0 ? "CREDIT" : "DEBIT",
          description: meta?.description || tx.description || "Transaction",
          date: tx.createdAt ? new Date(tx.createdAt).toISOString() : new Date().toISOString(),
          amount: amountInDollars,
          status: tx.status?.toUpperCase() || "COMPLETED",
        };
      });

      setApiTransactions((prev) => {
        const now = Date.now();
        const optimisticTxs = prev.filter((pTx) => {
          const isMissing = !mapped.find((m) => m.id === pTx.id);
          const isRecent = now - new Date(pTx.date).getTime() < 15000;
          return isMissing && isRecent;
        });

        const finalMerged = [...optimisticTxs, ...mapped];

        if (userEmail) {
          localStorage.setItem(
            `velox_cached_api_transactions_${userEmail}`,
            JSON.stringify(finalMerged)
          );
        }
        return finalMerged;
      });
    } catch (err) {
      console.error("Dashboard: Failed to fetch transactions:", err);
    }
  }, [userEmail, initialBalance, initialChange]);

  // Set up polling
  useEffect(() => {
    fetchLatestTransactions();
    const interval = setInterval(fetchLatestTransactions, 90000);
    return () => clearInterval(interval);
  }, [fetchLatestTransactions]);

  // Set up real-time supabase changes
  useEffect(() => {
    if (!supabase || !userEmail || !userId) return;

    const channel = supabase
      .channel("dashboard-realtime-hook")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transaction", filter: `user_id=eq.${userId}` },
        async (payload) => {
          fetchLatestTransactions();

          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const newTx = payload.new as any;
            if (newTx && (newTx.user_id === userId || newTx.userId === userId)) {
              const amountInCents = Number(newTx.amount || 0);
              const amountInDollars = amountInCents / 100;
              let meta = newTx.metadata;
              if (typeof meta === "string") {
                try {
                  meta = JSON.parse(meta);
                } catch (e) {}
              }

              const uiTx: UITransaction = {
                id: newTx.id?.toString(),
                type: amountInDollars > 0 ? "CREDIT" : "DEBIT",
                description: meta?.description || newTx.description || "Transaction",
                date: newTx.created_at ? new Date(newTx.created_at).toISOString() : new Date().toISOString(),
                amount: amountInDollars,
                status: newTx.status?.toUpperCase() || "COMPLETED",
              };

              setApiTransactions((prev) => {
                const index = prev.findIndex((tx) => tx.id === uiTx.id);
                let updated = [...prev];
                if (index >= 0) {
                  updated[index] = uiTx;
                } else {
                  updated = [uiTx, ...updated];
                }
                localStorage.setItem(`velox_cached_api_transactions_${userEmail}`, JSON.stringify(updated));
                return updated;
              });

              if (payload.eventType === "INSERT") {
                addNotification({
                  type: "SUCCESS",
                  title: "New Ledger Entry",
                  message: `Transaction processed: NGN ${(Math.abs(amountInDollars) * exchangeRates.NGN).toLocaleString()} (${uiTx.description})`,
                });
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [addNotification, userEmail, userId, fetchLatestTransactions, exchangeRates.NGN]);

  // Online presence tracking
  useEffect(() => {
    if (!supabase || !userEmail) return;

    const channel = supabase.channel("online-users-hook", {
      config: { presence: { key: userEmail } },
    });

    channel
      .on("presence", { event: "sync" }, () => {})
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          try {
            await channel.track({
              online_at: new Date().toISOString(),
              email: userEmail,
            });
          } catch (trackErr) {
            console.warn("Failed to track user presence:", trackErr);
          }
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userEmail]);

  // Computed transactions
  const transactions = useMemo<UITransaction[]>(() => {
    return [...apiTransactions].sort((a, b) => {
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      return timeB - timeA;
    });
  }, [apiTransactions]);

  // Dynamic formatting utilities
  const formatCurrency = useCallback((usdValue: number) => {
    const rate = exchangeRates[currency];
    const converted = usdValue * rate;
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: currency === "NGN" ? 0 : 2,
    }).format(converted);
  }, [currency, exchangeRates]);

  const formatLiveCurrency = useCallback((usdValue: number) => {
    const rate = exchangeRates[currency];
    const converted = usdValue * rate;
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: currency === "NGN" ? 0 : 2,
      maximumFractionDigits: currency === "NGN" ? 0 : 2,
    }).format(converted);
  }, [currency, exchangeRates]);

  // Export engine
  const exportToCSV = async () => {
    setIsExporting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const headers = ["Date", "Description", "Type", "Amount", "Status"];
    const csvContent = [
      headers.join(","),
      ...transactions.map((tx) =>
        [
          `"${tx.date ? new Date(tx.date).toLocaleString() : ""}"`,
          `"${tx.description}"`,
          tx.type,
          tx.amount,
          tx.status,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `kavio_audit_report_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsExporting(false);
    addNotification({
      type: "SUCCESS",
      title: "Audit Export Successful",
      message: "Your financial statement has been downloaded.",
    });
  };

  // Computations
  const gmvSum = useMemo(() => transactions.reduce((acc, tx) => acc + (tx.amount || 0), 0), [transactions]);
  
  // Completed positive transactions (revenue)
  const gpSum = useMemo(() => 
    transactions
      .filter((tx) => (tx.status?.toUpperCase() === "COMPLETED" || !tx.status) && tx.amount > 0)
      .reduce((acc, tx) => acc + (tx.amount || 0), 0),
    [transactions]
  );

  // Negative transactions (expenses)
  const apSum = useMemo(() => 
    transactions
      .filter((tx) => tx.amount < 0)
      .reduce((acc, tx) => acc + Math.abs(tx.amount), 0),
    [transactions]
  );

  // Unpaid invoices / Receivables
  const arSum = useMemo(() => 
    transactions
      .filter((tx) => tx.status === "PENDING" && tx.amount > 0)
      .reduce((acc, tx) => acc + (tx.amount || 0), 0),
    [transactions]
  );

  // Net Profit
  const netProfit = useMemo(() => gpSum - apSum, [gpSum, apSum]);

  const todayFormatted = useMemo(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }, []);

  const todayReadable = useMemo(() => {
    const today = new Date();
    return today.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, []);

  return {
    status,
    userEmail,
    currency,
    setCurrency,
    isExporting,
    transactions,
    balance: serverBalance,
    dayChange: serverDayChange,
    exchangeRates,
    gmvSum,
    gpSum,
    apSum,
    arSum,
    netProfit,
    formatCurrency,
    formatLiveCurrency,
    exportToCSV,
    todayFormatted,
    todayReadable,
    fetchLatestTransactions,
  };
}
