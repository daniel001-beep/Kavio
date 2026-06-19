import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export default function NotificationsSettingsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="border-slate-200 shadow-sm rounded-3xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Notification Preferences</CardTitle>
          <CardDescription>Choose what updates you want to receive.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900">Payment Reminders</p>
              <p className="text-sm font-medium text-slate-500">Get an email 2 days before a payment is due.</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div>
              <p className="font-bold text-slate-900">Weekly Reports</p>
              <p className="text-sm font-medium text-slate-500">Receive a weekly summary of your payroll activity.</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div>
              <p className="font-bold text-slate-900">Product Updates</p>
              <p className="text-sm font-medium text-slate-500">Hear about new features and improvements.</p>
            </div>
            <Switch defaultChecked={false} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
