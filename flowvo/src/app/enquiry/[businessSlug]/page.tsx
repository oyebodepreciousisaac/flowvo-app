import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import EnquiryForm from "./EnquiryForm";

interface PageProps {
  params: Promise<{ businessSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { businessSlug } = await params;
  const business = await prisma.business.findUnique({
    where: { slug: businessSlug },
    select: { name: true },
  });

  if (!business) {
    return { title: "Enquiry — Settlevo" };
  }

  return {
    title: `Enquire with ${business.name}`,
    description: `Submit an enquiry directly to ${business.name}.`,
  };
}

export default async function EnquiryPage({ params }: PageProps) {
  const { businessSlug } = await params;

  const business = await prisma.business.findUnique({
    where: { slug: businessSlug },
    select: { id: true, name: true, slug: true },
  });

  if (!business) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[560px] w-full mx-auto">
        {/* Business Branding Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--color-primary-subtle)] text-[var(--color-primary)] font-bold text-lg mb-3">
            {business.name.slice(0, 2).toUpperCase()}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-3xl">
            {business.name}
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Send us the details of your project or job, and we&apos;ll be in touch with a quote or next steps.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-card)] rounded-[var(--radius-lg)] p-6 sm:p-8">
          <EnquiryForm businessSlug={business.slug} businessName={business.name} />
        </div>

        {/* Footer Note */}
        <p className="mt-6 text-center text-xs text-[var(--color-text-muted)]">
          Protected by Settlevo operations system. Your information is sent securely to {business.name}.
        </p>
      </div>
    </div>
  );
}
