import { Link } from '@inertiajs/react';
import {
    LayoutDashboard, Package, Users, Truck, Settings,
    ShoppingCart, Receipt, PackageX, Building2,
} from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar, SidebarContent, SidebarFooter,
    SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';
import { dashboard } from '@/routes';

const mainNavItems: NavItem[] = [
    { title: 'Tableau de bord',   href: dashboard(),          icon: LayoutDashboard, iconColor: 'text-blue-500'    },
    { title: 'Produits',          href: '/produits',          icon: Package,         iconColor: 'text-amber-500'   },
    { title: 'Clients',           href: '/clients',           icon: Users,           iconColor: 'text-emerald-500' },
    { title: 'Fournisseurs',      href: '/suppliers',         icon: Truck,           iconColor: 'text-violet-500'  },
    { title: "Factures d'achat",  href: '/purchase_invoices', icon: ShoppingCart,    iconColor: 'text-orange-500'  },
    { title: 'Factures de vente', href: '/sales_invoices',    icon: Receipt,         iconColor: 'text-sky-500'     },
    { title: 'Retours de vente',  href: '/sales_returns',     icon: PackageX,        iconColor: 'text-rose-500'    },
];

const footerNavItems: NavItem[] = [
    { title: "Profil d'entreprise", href: '/settings/company',  icon: Building2 },
    { title: 'Paramètres',          href: '/settings/profile',  icon: Settings  },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
