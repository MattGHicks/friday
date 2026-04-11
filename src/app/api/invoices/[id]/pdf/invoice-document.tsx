import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import React from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type LineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number; // cents
};

type InvoiceData = {
  id: string;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  dueDate: Date | null;
  paidAt: Date | null;
  notes: string | null;
  lineItems: unknown;
  createdAt: Date;
  project: { name: string };
  client: { name: string; company: string | null; email: string };
  user: { name: string | null; email: string; brandColor: string };
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    DRAFT: "Draft",
    SENT: "Sent",
    VIEWED: "Viewed",
    PAID: "Paid",
    OVERDUE: "Overdue",
  };
  return map[status] ?? status;
}

// ── Styles ────────────────────────────────────────────────────────────────────

function makeStyles(brandColor: string) {
  return StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      fontSize: 10,
      color: "#1a1a1a",
      paddingTop: 48,
      paddingBottom: 48,
      paddingLeft: 56,
      paddingRight: 56,
      backgroundColor: "#ffffff",
    },
    // Header
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 40,
    },
    wordmark: {
      fontSize: 22,
      fontFamily: "Helvetica-Bold",
      letterSpacing: 4,
      color: brandColor,
    },
    invoiceMeta: {
      alignItems: "flex-end",
    },
    invoiceTitle: {
      fontSize: 20,
      fontFamily: "Helvetica-Bold",
      color: "#111111",
      marginBottom: 4,
    },
    invoiceId: {
      fontSize: 10,
      color: "#888888",
      fontFamily: "Helvetica",
      letterSpacing: 1,
    },
    // Status badge
    statusBadge: {
      marginTop: 6,
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 4,
      alignSelf: "flex-end",
    },
    statusText: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    // Divider
    divider: {
      borderBottomWidth: 1,
      borderBottomColor: "#e5e5e5",
      marginBottom: 24,
    },
    // Billing section
    billingRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 32,
    },
    billingBlock: {
      flex: 1,
    },
    billingLabel: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: "#888888",
      letterSpacing: 1,
      textTransform: "uppercase",
      marginBottom: 6,
    },
    billingName: {
      fontSize: 12,
      fontFamily: "Helvetica-Bold",
      color: "#111111",
      marginBottom: 2,
    },
    billingDetail: {
      fontSize: 10,
      color: "#555555",
      lineHeight: 1.5,
    },
    // Dates
    datesRow: {
      flexDirection: "row",
      gap: 32,
      marginBottom: 32,
    },
    dateBlock: {},
    dateLabel: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: "#888888",
      letterSpacing: 1,
      textTransform: "uppercase",
      marginBottom: 4,
    },
    dateValue: {
      fontSize: 10,
      color: "#111111",
    },
    // Line items
    tableHeader: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#111111",
      paddingBottom: 6,
      marginBottom: 8,
    },
    tableHeaderText: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: "#111111",
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    tableRow: {
      flexDirection: "row",
      paddingVertical: 7,
      borderBottomWidth: 1,
      borderBottomColor: "#f0f0f0",
    },
    colDescription: { flex: 1 },
    colQty: { width: 48, textAlign: "center" },
    colUnitPrice: { width: 72, textAlign: "right" },
    colTotal: { width: 80, textAlign: "right" },
    cellText: {
      fontSize: 10,
      color: "#333333",
    },
    // Totals
    totalsSection: {
      marginTop: 16,
      alignItems: "flex-end",
    },
    totalsTable: {
      width: 240,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 4,
    },
    totalLabel: {
      fontSize: 10,
      color: "#555555",
    },
    totalValue: {
      fontSize: 10,
      color: "#333333",
    },
    grandTotalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 8,
      borderTopWidth: 1.5,
      borderTopColor: "#111111",
      marginTop: 4,
    },
    grandTotalLabel: {
      fontSize: 12,
      fontFamily: "Helvetica-Bold",
      color: "#111111",
    },
    grandTotalValue: {
      fontSize: 12,
      fontFamily: "Helvetica-Bold",
      color: brandColor,
    },
    // Notes
    notesSection: {
      marginTop: 32,
    },
    notesLabel: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: "#888888",
      letterSpacing: 1,
      textTransform: "uppercase",
      marginBottom: 6,
    },
    notesText: {
      fontSize: 10,
      color: "#555555",
      lineHeight: 1.6,
    },
    // Footer
    footer: {
      position: "absolute",
      bottom: 32,
      left: 56,
      right: 56,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    footerText: {
      fontSize: 8,
      color: "#aaaaaa",
    },
  });
}

// ── Status badge color helpers ─────────────────────────────────────────────────

function statusColors(status: string): { bg: string; text: string } {
  switch (status) {
    case "PAID":
      return { bg: "#d4f0e0", text: "#1a7a45" };
    case "SENT":
    case "VIEWED":
      return { bg: "#fef3d0", text: "#92610a" };
    case "OVERDUE":
      return { bg: "#fde8e4", text: "#9b3a2a" };
    default: // DRAFT
      return { bg: "#f0f0f0", text: "#666666" };
  }
}

// ── PDF Document Component ────────────────────────────────────────────────────

export function InvoiceDocument({ invoice }: { invoice: InvoiceData }) {
  const styles = makeStyles(invoice.user.brandColor || "#E55A3A");
  const shortId = invoice.id.slice(0, 8).toUpperCase();
  const lineItems = (invoice.lineItems as LineItem[]) ?? [];
  const { bg: statusBg, text: statusTextColor } = statusColors(invoice.status);

  const projectLabel = invoice.project.name;
  const clientDisplay = invoice.client.company
    ? `${invoice.client.company}\n${invoice.client.name}`
    : invoice.client.name;

  const fromDisplay = invoice.user.name
    ? `${invoice.user.name}\n${invoice.user.email}`
    : invoice.user.email;

  return (
    <Document title={`Invoice #${shortId}`} author="Friday">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.wordmark}>FRIDAY</Text>
          <View style={styles.invoiceMeta}>
            <Text style={styles.invoiceTitle}>Invoice</Text>
            <Text style={styles.invoiceId}>#{shortId}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
              <Text style={[styles.statusText, { color: statusTextColor }]}>
                {statusLabel(invoice.status)}
              </Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Bill To / From */}
        <View style={styles.billingRow}>
          <View style={styles.billingBlock}>
            <Text style={styles.billingLabel}>Bill To</Text>
            <Text style={styles.billingName}>
              {invoice.client.company ?? invoice.client.name}
            </Text>
            {invoice.client.company && (
              <Text style={styles.billingDetail}>{invoice.client.name}</Text>
            )}
            <Text style={styles.billingDetail}>{invoice.client.email}</Text>
          </View>
          <View style={[styles.billingBlock, { alignItems: "flex-end" }]}>
            <Text style={styles.billingLabel}>From</Text>
            <Text style={styles.billingName}>
              {invoice.user.name ?? invoice.user.email}
            </Text>
            {invoice.user.name && (
              <Text style={styles.billingDetail}>{invoice.user.email}</Text>
            )}
            <Text style={[styles.billingDetail, { marginTop: 4 }]}>
              {projectLabel}
            </Text>
          </View>
        </View>

        {/* Dates */}
        <View style={styles.datesRow}>
          <View style={styles.dateBlock}>
            <Text style={styles.dateLabel}>Invoice Date</Text>
            <Text style={styles.dateValue}>{formatDate(invoice.createdAt)}</Text>
          </View>
          <View style={styles.dateBlock}>
            <Text style={styles.dateLabel}>Due Date</Text>
            <Text style={styles.dateValue}>{formatDate(invoice.dueDate)}</Text>
          </View>
          {invoice.paidAt && (
            <View style={styles.dateBlock}>
              <Text style={styles.dateLabel}>Paid On</Text>
              <Text style={styles.dateValue}>{formatDate(invoice.paidAt)}</Text>
            </View>
          )}
        </View>

        {/* Line items table */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colDescription]}>
            Description
          </Text>
          <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
          <Text style={[styles.tableHeaderText, styles.colUnitPrice]}>
            Unit Price
          </Text>
          <Text style={[styles.tableHeaderText, styles.colTotal]}>Amount</Text>
        </View>

        {lineItems.map((item, i) => (
          <View key={item.id ?? i} style={styles.tableRow}>
            <Text style={[styles.cellText, styles.colDescription]}>
              {item.description}
            </Text>
            <Text style={[styles.cellText, styles.colQty]}>
              {item.quantity}
            </Text>
            <Text style={[styles.cellText, styles.colUnitPrice]}>
              {formatMoney(item.unitPrice)}
            </Text>
            <Text style={[styles.cellText, styles.colTotal]}>
              {formatMoney(item.quantity * item.unitPrice)}
            </Text>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsTable}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatMoney(invoice.subtotal)}</Text>
            </View>
            {invoice.tax > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax</Text>
                <Text style={styles.totalValue}>{formatMoney(invoice.tax)}</Text>
              </View>
            )}
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>
                {formatMoney(invoice.total)}
              </Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Generated by Friday · itsfriday.dev
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
