"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNotifications } from "@/app/context/NotificationContext";
import { useSession } from "@/app/context/AuthContext";

export interface InvoiceItem {
  description: string;
  qty: number;
  rate: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  status: "DRAFT" | "SENT" | "VIEWED" | "OVERDUE" | "PAID";
  projectDescription: string;
  paymentInstructions?: string;
  createdAt: string;
  client: {
    id: string;
    name: string;
    email: string;
    phone: string;
    companyName?: string;
    location?: string;
  };
}

export function useDashboardData() {
  const { data: session, status } = useSession();
  const userEmail = session?.user?.email;

  const [invoicesList, setInvoicesList] = useState<Invoice[]>([]);
  const [clientsCount, setClientsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { addNotification } = useNotifications();

  // Fetch all collection invoices
  const fetchInvoices = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/invoices?_t=" + Date.now(), {
        cache: "no-store",
      });

      if (!res.ok) {
        console.warn("Dashboard: Invoices API returned non-OK status:", res.status);
        return;
      }

      const data = await res.json();
      setInvoicesList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Dashboard: Failed to fetch invoices:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch clients count
  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/clients?_t=" + Date.now(), {
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        setClientsCount(Array.isArray(data) ? data.length : 0);
      }
    } catch (err) {
      console.error("Dashboard: Failed to fetch clients:", err);
    }
  }, []);

  useEffect(() => {
    if (userEmail) {
      fetchInvoices();
      fetchClients();
    }
  }, [userEmail, fetchInvoices, fetchClients]);

  // Compute Outstanding, Paid, and Overdue sums (in NGN/baseline currency representation)
  const outstandingSum = useMemo(() => {
    return invoicesList
      .filter((inv) => ["SENT", "VIEWED", "OVERDUE"].includes(inv.status))
      .reduce((acc, inv) => acc + (inv.amount || 0), 0);
  }, [invoicesList]);

  const overdueSum = useMemo(() => {
    const now = new Date();
    return invoicesList
      .filter((inv) => {
        const isOverdueStatus = inv.status === "OVERDUE";
        const isPastDue = new Date(inv.dueDate) < now && inv.status !== "PAID";
        return isOverdueStatus || isPastDue;
      })
      .reduce((acc, inv) => acc + (inv.amount || 0), 0);
  }, [invoicesList]);

  const paidSum = useMemo(() => {
    return invoicesList
      .filter((inv) => inv.status === "PAID")
      .reduce((acc, inv) => acc + (inv.amount || 0), 0);
  }, [invoicesList]);

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(value);
  }, []);

  const todayReadable = useMemo(() => {
    const today = new Date();
    return today.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, []);

  // Trigger manual payment logger on the client side
  const recordManualPayment = useCallback(async (invoiceId: string, reference?: string, notes?: string) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, notes }),
      });

      if (!res.ok) {
        throw new Error("Failed to record manual payment");
      }

      addNotification({
        type: "SUCCESS",
        title: "Payment Logged",
        message: "Invoice marked as PAID and balance updated.",
      });

      // Refresh list
      fetchInvoices();
      return true;
    } catch (e: any) {
      addNotification({
        type: "ERROR",
        title: "Log Payment Failed",
        message: e.message || "Failed to save manual payment.",
      });
      return false;
    }
  }, [addNotification, fetchInvoices]);

  // Log reminder events (WhatsApp/Email)
  const logReminder = useCallback(async (invoiceId: string, templateType: string, channel: string) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/remind`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateType, channel }),
      });
      if (res.ok) {
        addNotification({
          type: "SUCCESS",
          title: "Reminder Logged",
          message: `Sent ${templateType.replace("_", " ")} nudge tracking status.`,
        });
      }
    } catch (e) {
      console.warn("Failed to log reminder event", e);
    }
  }, [addNotification]);

  return {
    status: status === "loading" || (status === "authenticated" && isLoading) ? "loading" : "authenticated",
    userEmail,
    invoices: invoicesList,
    clientsCount,
    outstandingSum,
    overdueSum,
    paidSum,
    formatCurrency,
    todayReadable,
    recordManualPayment,
    logReminder,
    refreshData: () => {
      fetchInvoices();
      fetchClients();
    },
  };
}
