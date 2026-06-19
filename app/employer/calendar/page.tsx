"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 1)); // Default to June 2026 based on dummy data

  const dummyEvents = [
    { id: 1, date: 15, worker: "Bob Jones", amount: 1200, status: "PAID" },
    { id: 2, date: 30, worker: "Alice Smith", amount: 2500, status: "PENDING" },
    { id: 3, date: 1, worker: "Charlie Brown", amount: 800, status: "OVERDUE" },
  ];

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Payment Calendar</h1>
        <p className="text-slate-500 mt-2 font-medium">Visualize upcoming payroll and invoice deadlines.</p>
      </div>

      <Card className="border-slate-200 shadow-sm rounded-3xl p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black text-slate-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={nextMonth} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-2xl overflow-hidden border border-slate-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="bg-slate-50 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
          
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-white min-h-[120px] p-2" />
          ))}
          
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEvents = dummyEvents.filter(e => e.date === day);
            
            return (
              <div key={day} className="bg-white min-h-[120px] p-2 border-t border-slate-100 hover:bg-slate-50 transition-colors group relative">
                <span className="text-sm font-bold text-slate-400 group-hover:text-emerald-600 transition-colors">
                  {day}
                </span>
                
                <div className="mt-2 space-y-1">
                  {dayEvents.map(event => (
                    <div 
                      key={event.id}
                      className={`px-2 py-1.5 rounded-lg text-xs font-bold border flex flex-col gap-1 ${
                        event.status === 'PAID' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                        event.status === 'OVERDUE' ? 'bg-rose-50 border-rose-100 text-rose-700' :
                        'bg-amber-50 border-amber-100 text-amber-700'
                      }`}
                    >
                      <div className="truncate">{event.worker}</div>
                      <div className="flex items-center justify-between">
                        <span>${event.amount}</span>
                        {event.status === 'PAID' && <CheckCircle2 className="w-3 h-3" />}
                        {event.status === 'PENDING' && <Clock className="w-3 h-3" />}
                        {event.status === 'OVERDUE' && <AlertTriangle className="w-3 h-3" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
