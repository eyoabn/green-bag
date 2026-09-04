import Link from "next/link";
import { LayoutDashboard, ShoppingBag, Users, PenTool, CreditCard, LogOut } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-border flex flex-col fixed h-full z-20">
        <div className="p-6">
          <div className="font-serif text-xl font-bold tracking-tight text-primary">
            Arenguade Admin
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-primary/10 text-primary">
            <LayoutDashboard size={18} /> Dashboard
          </Link>
          <Link href="/admin/orders" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors">
            <ShoppingBag size={18} /> Orders
          </Link>
          <Link href="/admin/products" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors">
            <ShoppingBag size={18} /> Products
          </Link>
          <Link href="/admin/classes" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors">
            <Users size={18} /> Classes
          </Link>
          <Link href="/admin/designs" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors">
            <PenTool size={18} /> Design Submissions
          </Link>
          <Link href="/admin/bank-accounts" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors">
            <CreditCard size={18} /> Bank Accounts
          </Link>
        </nav>
        
        <div className="p-4 border-t border-border">
          <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
