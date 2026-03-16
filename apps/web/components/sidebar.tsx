'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Package, FolderOpen, FileText, ShoppingCart, Settings } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/projects', label: 'Projects', icon: FolderOpen },
  { href: '/generate', label: 'Generate', icon: FileText },
  { href: '/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      data-testid="sidebar"
      className="flex h-full w-64 flex-col bg-sidebar border-r border-border/60"
    >
      {/* App header */}
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Design Vault</h2>
        <div className="mt-1 h-0.5 w-10 rounded-full bg-primary/40" />
      </div>

      {/* Separator */}
      <div className="mx-4 border-t border-border/50" />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 pt-4">
        {navItems.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary/10 text-primary border-l-2 border-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground border-l-2 border-transparent',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer branding */}
      <div className="px-6 py-4 border-t border-border/50">
        <p className="text-xs text-muted-foreground/70 leading-relaxed">Decorating Den Interiors</p>
      </div>
    </aside>
  );
}
