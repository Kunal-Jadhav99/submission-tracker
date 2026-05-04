"use client";

import { useSession } from "next-auth/react";
import { UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { data: session } = useSession();
  const user = session?.user as any;

  return (
    <div className="page-container max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">My Profile</h1>
      
      <div className="glass rounded-2xl p-6 border border-border/50">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className={cn("w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-xl", `bg-gradient-to-br ${user?.gradient ?? "from-gray-500 to-gray-600"}`)}>
            {user?.name?.charAt(0) ?? "U"}
          </div>
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-2xl font-bold text-foreground">{user?.name ?? "User"}</h2>
            <p className="text-muted-foreground">{user?.email}</p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center sm:justify-start">
              <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">Active Student</span>
              <span className="text-xs px-3 py-1 rounded-full bg-secondary text-muted-foreground border border-border/50">Cohort 2026</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border/50 grid sm:grid-cols-2 gap-4">
          <div className="bg-secondary/30 rounded-xl p-4 border border-border/30">
            <h3 className="text-sm font-semibold text-foreground mb-1">Account Role</h3>
            <p className="text-xs text-muted-foreground">Co-Owner (Full Access)</p>
          </div>
          <div className="bg-secondary/30 rounded-xl p-4 border border-border/30">
            <h3 className="text-sm font-semibold text-foreground mb-1">Member Since</h3>
            <p className="text-xs text-muted-foreground">August 2024</p>
          </div>
        </div>
      </div>
    </div>
  );
}
