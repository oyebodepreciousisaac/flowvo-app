import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusChip } from "@/components/ui/StatusChip";
import { LeadStatusActions } from "./LeadStatusActions";
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  ExternalLink,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const session = await getCurrentSession();
  if (!session) return { title: "Lead Details — Flowvo" };

  const lead = await prisma.lead.findFirst({
    where: { id, businessId: session.user.businessId },
    select: { customerName: true },
  });

  return {
    title: lead ? `${lead.customerName} — Lead Details — Flowvo` : "Lead Details — Flowvo",
  };
}

export default async function LeadDetailPage({ params }: PageProps) {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  const lead = await prisma.lead.findFirst({
    where: {
      id,
      businessId: session.user.businessId,
    },
    include: {
      activityLogs: {
        orderBy: { occurredAt: "desc" },
      },
    },
  });

  if (!lead) {
    notFound();
  }

  const isLost = lead.status === "LOST";

  return (
    <div className="space-y-6">
      {/* Back button & Breadcrumb */}
      <div>
        <Link
          href="/leads"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Leads</span>
        </Link>
      </div>

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-card)]">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
              {lead.customerName}
            </h1>
            <StatusChip status={lead.status} />
          </div>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Enquiry for <strong className="text-[var(--color-text)]">{lead.serviceType}</strong>
          </p>
        </div>

        {/* Primary Action Button */}
        <div>
          {!isLost ? (
            <Link
              href={`/quotes/new?leadId=${lead.id}`}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm font-semibold rounded-[var(--radius-md)] transition-colors shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span>Create quote</span>
            </Link>
          ) : (
            <span className="text-xs text-[var(--color-text-muted)] italic">
              Lead marked as lost
            </span>
          )}
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Description */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Job Info Card */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-card)] space-y-4">
            <h2 className="text-sm font-semibold text-[var(--color-text)] uppercase tracking-wider">
              Customer Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="block text-xs text-[var(--color-text-muted)] mb-1">Phone Number</span>
                <a
                  href={`tel:${lead.phone}`}
                  className="inline-flex items-center gap-2 font-medium text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors"
                >
                  <Phone className="w-4 h-4 text-[var(--color-text-muted)]" />
                  <span>{lead.phone}</span>
                </a>
              </div>

              <div>
                <span className="block text-xs text-[var(--color-text-muted)] mb-1">Email Address</span>
                <a
                  href={`mailto:${lead.email}`}
                  className="inline-flex items-center gap-2 font-medium text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors truncate max-w-full"
                >
                  <Mail className="w-4 h-4 text-[var(--color-text-muted)]" />
                  <span className="truncate">{lead.email}</span>
                </a>
              </div>

              <div>
                <span className="block text-xs text-[var(--color-text-muted)] mb-1">Service Requested</span>
                <span className="font-medium text-[var(--color-text)]">{lead.serviceType}</span>
              </div>

              <div>
                <span className="block text-xs text-[var(--color-text-muted)] mb-1">Enquiry Source</span>
                <span className="text-[var(--color-text-secondary)]">{lead.source || "Direct form submission"}</span>
              </div>

              <div>
                <span className="block text-xs text-[var(--color-text-muted)] mb-1">Received At</span>
                <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                  <Calendar className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                  {new Date(lead.createdAt).toLocaleString("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            </div>

            {/* Quick status actions */}
            <div className="pt-4 border-t border-[var(--color-border)]">
              <LeadStatusActions leadId={lead.id} currentStatus={lead.status} />
            </div>
          </div>

          {/* Description Card */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-sm font-semibold text-[var(--color-text)] uppercase tracking-wider mb-3">
              Project Description
            </h2>
            <div className="bg-[var(--color-bg)] rounded-[var(--radius-md)] p-4 text-sm text-[var(--color-text)] leading-relaxed whitespace-pre-wrap border border-[var(--color-border)]">
              {lead.description}
            </div>
          </div>
        </div>

        {/* Right Column: Activity Timeline */}
        <div className="space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-sm font-semibold text-[var(--color-text)] uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Activity Timeline</span>
              <Clock className="w-4 h-4 text-[var(--color-text-muted)]" />
            </h2>

            {lead.activityLogs.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)]">No activity recorded.</p>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--color-border)]">
                {lead.activityLogs.map((log) => {
                  const isSuccess = log.status === "SUCCESS";
                  let eventLabel = log.eventType;
                  let description = log.detail;

                  if (log.eventType === "lead.created") {
                    eventLabel = "Enquiry received";
                    description = description || "Submitted via public enquiry form";
                  } else if (log.eventType === "ack.sent") {
                    eventLabel = "Acknowledgement sent";
                    description = description || "Automated email sent to customer";
                  } else if (log.eventType === "ack.failed") {
                    eventLabel = "Acknowledgement failed";
                    description = description || "Email delivery failed";
                  }

                  return (
                    <div key={log.id} className="relative group">
                      {/* Timeline dot */}
                      <span
                        className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 bg-[var(--color-surface)] ${
                          isSuccess
                            ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                            : "border-[var(--color-error)] text-[var(--color-error)]"
                        }`}
                      >
                        {isSuccess ? (
                          <CheckCircle2 className="w-3 h-3 fill-current" />
                        ) : (
                          <XCircle className="w-3 h-3 fill-current" />
                        )}
                      </span>

                      {/* Content */}
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-[var(--color-text)]">
                            {eventLabel}
                          </p>
                          <span className="text-[10px] text-[var(--color-text-muted)]">
                            {new Date(log.occurredAt).toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {description && (
                          <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                            {description}
                          </p>
                        )}
                        <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">
                          {new Date(log.occurredAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
