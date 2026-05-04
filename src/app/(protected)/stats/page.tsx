"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Loader2 } from "lucide-react";

export default function StatsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [a, u] = await Promise.all([ fetch("/api/assignments").then(r => r.json()), fetch("/api/users").then(r => r.json()) ]);
        const stats = u.map((user:any) => {
          let count = 0;
          a.forEach((ass:any) => {
            if (ass.submissions?.find((s:any) => (s.user?._id ?? s.user) === user._id)) count++;
          });
          return { name: user.name.split(" ")[0], submissions: count };
        });
        setData(stats);
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="page-container space-y-5">
      <h1 className="text-xl font-bold">Group Statistics</h1>
      <div className="glass p-6 rounded-2xl border border-border/50 h-[400px]">
        <h2 className="font-semibold mb-6">Total Assignments Submitted</h2>
        {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /> : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#1E293B', border: 'none', borderRadius: '8px', color: '#fff'}} />
              <Bar dataKey="submissions" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
