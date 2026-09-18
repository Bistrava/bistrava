import type { Metadata } from "next";
import { PackageSearch } from "lucide-react";
import { notFound } from "next/navigation";

import { AdminProductEditor } from "@/components/admin/product-editor";
import { AdminWorkspace } from "@/components/admin/admin-workspace";
import { getAdminProductEditorData } from "@/lib/admin/product-editor-repository";
import { getAdminPageAccess } from "@/lib/auth/admin-page";
import { getSpecialistProduct } from "@/lib/catalog/catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getSpecialistProduct(slug);
  return { title: product ? `${product.nameSl} · Administracija` : "Izdelek · Administracija" };
}

export default async function AdminProductEditorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [{ slug }, access] = await Promise.all([params, getAdminPageAccess()]);

  if (access.mode === "not_configured") {
    return (
      <section className="admin-content">
        <div className="admin-panel card">
          <PackageSearch aria-hidden="true" size={36} />
          <p className="section-kicker">Katalog ni povezan</p>
          <h1>Upravljanje izdelkov potrebuje Supabase.</h1>
          <p>Lokalni predogled se zaradi varnosti izvaja samo v razvojnem okolju.</p>
        </div>
      </section>
    );
  }

  const editorData = await getAdminProductEditorData(slug);
  if (!editorData) notFound();

  return (
    <AdminWorkspace access={access} active="products">
      <AdminProductEditor accessMode={access.mode} product={editorData} />
    </AdminWorkspace>
  );
}
