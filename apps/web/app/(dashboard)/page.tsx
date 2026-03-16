'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { Package, FolderOpen, FileText } from 'lucide-react';
import { ProductCard } from '@/components/product-card';

interface Project {
  id: string;
  name: string;
  client_name: string | null;
  status: string;
  rooms: { id: string }[];
}

interface Product {
  id: string;
  name: string;
  brand: string | null;
  retail_price: number | null;
  product_images: { id: string; image_url: string; is_primary: boolean }[];
}

interface Stats {
  totalProducts: number;
  activeProjects: number;
  generatedDocuments: number;
}

function statusBadgeClass(status: string) {
  switch (status) {
    case 'active':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'completed':
      return 'bg-teal-100 text-teal-800 border-teal-200';
    case 'archived':
      return 'bg-stone-100 text-stone-600 border-stone-200';
    default:
      return '';
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'active':
      return 'Active';
    case 'completed':
      return 'Completed';
    case 'archived':
      return 'Archived';
    default:
      return status;
  }
}

export default function DashboardPage() {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [recentProducts, setRecentProducts] = React.useState<Product[]>([]);
  const [stats, setStats] = React.useState<Stats>({
    totalProducts: 0,
    activeProjects: 0,
    generatedDocuments: 0,
  });

  React.useEffect(() => {
    const supabase = createClient();

    // Fetch active projects with room counts
    supabase
      .from('projects')
      .select('id, name, client_name, status, rooms(id)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setProjects(data as unknown as Project[]);
      });

    // Fetch recent products
    supabase
      .from('products')
      .select('id, name, brand, retail_price, product_images(id, image_url, is_primary)')
      .order('created_at', { ascending: false })
      .limit(4)
      .then(({ data }) => {
        if (data) setRecentProducts(data as unknown as Product[]);
      });

    // Fetch stats
    Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('documents').select('id', { count: 'exact', head: true }),
    ]).then(([productsRes, projectsRes, docsRes]) => {
      setStats({
        totalProducts: productsRes.count ?? 0,
        activeProjects: projectsRes.count ?? 0,
        generatedDocuments: docsRes.count ?? 0,
      });
    });
  }, []);

  const getPrimaryImageUrl = (product: Product): string | null => {
    if (!product.product_images || product.product_images.length === 0) return null;
    const primary = product.product_images.find((img) => img.is_primary);
    return primary?.image_url || product.product_images[0]?.image_url || null;
  };

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground mt-1">
          Here is what is happening with your projects and products.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-amber-50 p-3">
              <Package className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Products</p>
              <p className="text-2xl font-bold">{stats.totalProducts}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-emerald-50 p-3">
              <FolderOpen className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Projects</p>
              <p className="text-2xl font-bold">{stats.activeProjects}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-sky-500">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-sky-50 p-3">
              <FileText className="h-6 w-6 text-sky-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Generated Documents</p>
              <p className="text-2xl font-bold">{stats.generatedDocuments}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Products */}
      {recentProducts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Products</h2>
            <Link
              href="/products"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View all
            </Link>
          </div>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {recentProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                brand={product.brand}
                retail_price={product.retail_price}
                primary_image_url={getPrimaryImageUrl(product)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Active Projects */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Active Projects</h2>
          <Link
            href="/projects"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View all
          </Link>
        </div>
        {projects.length === 0 ? (
          <Card className="p-8">
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-muted p-4 mb-3">
                <FolderOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                No active projects yet. Create one to get started.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <Badge className={statusBadgeClass(project.status)}>
                        {statusLabel(project.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {project.client_name && (
                      <p className="text-sm text-muted-foreground">{project.client_name}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {project.rooms?.length ?? 0} {project.rooms?.length === 1 ? 'room' : 'rooms'}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
