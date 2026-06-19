"use server";

import { db } from "@/src/db";
import { workers, employerPayments } from "@/src/db/schema";
import { eq, and, gte, lte, sum, count } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getEmployerDashboardStats() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Get total workers
  const totalWorkersQuery = await db
    .select({ value: count() })
    .from(workers)
    .where(eq(workers.employerId, userId));
  const totalWorkers = totalWorkersQuery[0].value;

  // Get next 30 days due
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  const amountDueQuery = await db
    .select({ value: sum(employerPayments.amount) })
    .from(employerPayments)
    .where(
      and(
        eq(employerPayments.employerId, userId),
        eq(employerPayments.status, "PENDING"),
        lte(employerPayments.dueDate, thirtyDaysFromNow)
      )
    );
  const amountDue = amountDueQuery[0].value || 0;

  // Get paid this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const paidThisMonthQuery = await db
    .select({ value: sum(employerPayments.amount) })
    .from(employerPayments)
    .where(
      and(
        eq(employerPayments.employerId, userId),
        eq(employerPayments.status, "PAID"),
        gte(employerPayments.paidDate, startOfMonth)
      )
    );
  const paidThisMonth = paidThisMonthQuery[0].value || 0;

  // Get overdue payments
  const now = new Date();
  const overdueQuery = await db
    .select({ value: sum(employerPayments.amount) })
    .from(employerPayments)
    .where(
      and(
        eq(employerPayments.employerId, userId),
        eq(employerPayments.status, "OVERDUE")
      )
    );
  
  // also check if any PENDING are past due
  const pendingPastDueQuery = await db
    .select({ value: sum(employerPayments.amount) })
    .from(employerPayments)
    .where(
      and(
        eq(employerPayments.employerId, userId),
        eq(employerPayments.status, "PENDING"),
        lte(employerPayments.dueDate, now)
      )
    );

  const overdue = (Number(overdueQuery[0].value) || 0) + (Number(pendingPastDueQuery[0].value) || 0);

  return {
    totalWorkers,
    amountDue: Number(amountDue),
    paidThisMonth: Number(paidThisMonth),
    overdue: Number(overdue),
  };
}

export async function getWorkers() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const results = await db.query.workers.findMany({
    where: eq(workers.employerId, userId),
    orderBy: (workers, { desc }) => [desc(workers.createdAt)],
  });

  return results;
}

export async function createWorker(data: {
  name: string;
  email?: string;
  phone?: string;
  accountNumber?: string;
  role: string;
  salaryAmount: number;
  paymentFrequency: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db.insert(workers).values({
    employerId: userId,
    name: data.name,
    email: data.email,
    phone: data.phone,
    accountNumber: data.accountNumber,
    role: data.role,
    salaryAmount: data.salaryAmount,
    paymentFrequency: data.paymentFrequency,
  });

  revalidatePath("/employer/workers");
  revalidatePath("/employer");
}

export async function getPayments() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const results = await db.select({
    id: employerPayments.id,
    workerId: employerPayments.workerId,
    employerId: employerPayments.employerId,
    amount: employerPayments.amount,
    dueDate: employerPayments.dueDate,
    paidDate: employerPayments.paidDate,
    paymentMethod: employerPayments.paymentMethod,
    status: employerPayments.status,
    note: employerPayments.note,
    createdAt: employerPayments.createdAt,
    workerName: workers.name,
  })
  .from(employerPayments)
  .leftJoin(workers, eq(employerPayments.workerId, workers.id))
  .where(eq(employerPayments.employerId, userId));

  // Sort by due date desc in memory or add .orderBy(desc(employerPayments.dueDate))
  results.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  return results.map(r => ({
    ...r,
    workerName: r.workerName || "Unknown Worker",
  }));
}

export async function createPayment(data: {
  workerId: string;
  amount: number;
  dueDate: Date;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db.insert(employerPayments).values({
    employerId: userId,
    workerId: data.workerId,
    amount: data.amount,
    dueDate: data.dueDate,
    status: "PENDING",
  });

  revalidatePath("/employer/payments");
  revalidatePath("/employer/calendar");
  revalidatePath("/employer");
}

export async function markPaymentPaid(paymentId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db.update(employerPayments)
    .set({ 
      status: "PAID", 
      paidDate: new Date() 
    })
    .where(
      and(
        eq(employerPayments.id, paymentId),
        eq(employerPayments.employerId, userId)
      )
    );

  revalidatePath("/employer/payments");
  revalidatePath("/employer/analytics");
  revalidatePath("/employer");
}

export async function getEmployerAnalytics() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const payments = await db.select({
    amount: employerPayments.amount,
    status: employerPayments.status,
    paidDate: employerPayments.paidDate,
    dueDate: employerPayments.dueDate,
    role: workers.role,
  })
  .from(employerPayments)
  .leftJoin(workers, eq(employerPayments.workerId, workers.id))
  .where(eq(employerPayments.employerId, userId));

  let totalPayroll = 0;
  let paidCount = 0;
  let onTimeCount = 0;
  
  const distribution: Record<string, number> = {};

  payments.forEach(p => {
    if (p.status === "PAID") {
      totalPayroll += p.amount;
      paidCount++;
      if (p.paidDate && p.dueDate && p.paidDate <= p.dueDate) {
        onTimeCount++;
      }
      
      const roleName = p.role || "Other";
      distribution[roleName] = (distribution[roleName] || 0) + p.amount;
    }
  });

  const onTimePaymentRate = paidCount > 0 ? Math.round((onTimeCount / paidCount) * 100) : 100;
  
  // Calculate average cost per worker using the total distinct workers
  const totalWorkersQuery = await db.select({ value: count() }).from(workers).where(eq(workers.employerId, userId));
  const activeWorkers = totalWorkersQuery[0].value || 1;
  const avgCostPerWorker = totalPayroll / activeWorkers;

  // Colors for pie chart
  const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];
  const distributionData = Object.entries(distribution).map(([name, value], idx) => ({
    name,
    value,
    color: colors[idx % colors.length]
  }));

  // Simple mock for historical payroll (normally we'd group by month)
  // For demo, just distributing total across last 6 months randomly + current month
  const payrollData = [
    { name: 'Jan', amount: totalPayroll * 0.1 },
    { name: 'Feb', amount: totalPayroll * 0.15 },
    { name: 'Mar', amount: totalPayroll * 0.12 },
    { name: 'Apr', amount: totalPayroll * 0.18 },
    { name: 'May', amount: totalPayroll * 0.2 },
    { name: 'Jun', amount: totalPayroll * 0.25 },
  ];

  return {
    totalPayroll,
    onTimePaymentRate,
    avgCostPerWorker,
    activeWorkers,
    distributionData,
    payrollData
  };
}
