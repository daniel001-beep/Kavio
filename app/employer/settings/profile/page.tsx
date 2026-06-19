import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ProfileSettingsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="border-slate-200 shadow-sm rounded-3xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Personal Profile</CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-slate-500 font-medium">
          <p>Profile settings are managed through your Clerk account.</p>
          <Button variant="outline" className="mt-4 font-bold rounded-xl">Manage Account</Button>
        </CardContent>
      </Card>
    </div>
  );
}
