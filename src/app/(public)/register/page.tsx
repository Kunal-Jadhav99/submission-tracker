import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Link href="/login" className="absolute top-8 left-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Login
      </Link>
      <div className="w-full max-w-md glass rounded-2xl p-8 border border-border/50 text-center">
        <h1 className="text-2xl font-bold mb-2">Create Account</h1>
        <p className="text-sm text-muted-foreground mb-6">SubTrack is currently configured for 3 specific friends. Registration is closed.</p>
        
        <div className="bg-secondary/40 border border-border/50 rounded-xl p-4 mb-6 text-sm text-left">
          <p className="text-foreground font-medium mb-2">Why can&apos;t I register?</p>
          <p className="text-muted-foreground">This application uses a hardcoded credentials setup for three specific users (Alex, Blake, Casey) to demonstrate a high-trust, fully transparent collaborative environment without complex role management.</p>
        </div>

        <Link href="/login" className="btn-primary w-full inline-block">Go to Login</Link>
      </div>
    </div>
  );
}
