/**
 * WhatsApp Deep-Link Helpers & Automation Formatting
 *
 * Facilitates 1-click WhatsApp messaging for:
 * 1. Merchant sending quotes to customers
 * 2. Merchant sending invoices to customers
 * 3. Customer confirming bank transfer / payment proof to merchant
 * 4. System alerting merchant of incoming leads, accepted quotes, and settled invoices
 */

export function cleanPhoneForWhatsApp(phone: string, defaultCountryCode: string = "234"): string {
  if (!phone) return "";
  let cleaned = phone.replace(/[^\d+]/g, "");

  // If starts with +, strip +
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith("0")) {
    // If local Nigerian e.g. 080... or UK 07...
    if (defaultCountryCode === "44" && cleaned.startsWith("07")) {
      cleaned = "44" + cleaned.substring(1);
    } else {
      // Default to 234 (Nigeria) or defaultCountryCode
      cleaned = defaultCountryCode + cleaned.substring(1);
    }
  }

  return cleaned;
}

export function buildQuoteWhatsAppUrl({
  customerPhone,
  customerName,
  businessName,
  quoteTotalFormatted,
  quoteUrl,
}: {
  customerPhone: string;
  customerName: string;
  businessName: string;
  quoteTotalFormatted: string;
  quoteUrl: string;
}): string {
  const phone = cleanPhoneForWhatsApp(customerPhone);
  const firstName = customerName.split(" ")[0] || customerName;

  const text = `Hi ${firstName} 👋, *${businessName}* has sent you a quote for *${quoteTotalFormatted}*.

📋 *What's inside:*
• Itemized breakdown of all work
• Your total: *${quoteTotalFormatted}*

✅ *To accept or decline*, just tap the link below:
${quoteUrl}

You can review everything and confirm with one tap. No signup needed!`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function buildInvoiceWhatsAppUrl({
  customerPhone,
  customerName,
  businessName,
  invoiceNumber,
  invoiceTotalFormatted,
  dueDateFormatted,
  invoiceUrl,
}: {
  customerPhone: string;
  customerName: string;
  businessName: string;
  invoiceNumber: string;
  invoiceTotalFormatted: string;
  dueDateFormatted: string;
  invoiceUrl: string;
}): string {
  const phone = cleanPhoneForWhatsApp(customerPhone);
  const firstName = customerName.split(" ")[0] || customerName;

  const text = `Hi ${firstName} 👋, your invoice *${invoiceNumber}* for *${invoiceTotalFormatted}* from *${businessName}* is ready.

📅 Payment due: *${dueDateFormatted}*

💳 *To view, pay online, or get bank transfer details*, tap:
${invoiceUrl}

Thank you for your business! 🙏`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function buildCustomerPaymentProofWhatsAppUrl({
  ownerPhone,
  businessName,
  customerName,
  invoiceNumber,
  invoiceTotalFormatted,
}: {
  ownerPhone: string;
  businessName: string;
  customerName: string;
  invoiceNumber: string;
  invoiceTotalFormatted: string;
}): string {
  const phone = cleanPhoneForWhatsApp(ownerPhone);

  const text = `Hi *${businessName}*, I have completed the bank transfer of *${invoiceTotalFormatted}* for invoice *${invoiceNumber}*.\n\nPlease find attached my payment receipt/proof.\n\nFrom: ${customerName}`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function buildOwnerAlertWhatsAppUrl({
  ownerPhone,
  alertTitle,
  details,
  actionUrl,
}: {
  ownerPhone: string;
  alertTitle: string;
  details: string;
  actionUrl?: string;
}): string {
  const phone = cleanPhoneForWhatsApp(ownerPhone);

  let text = `*${alertTitle}*\n\n${details}`;
  if (actionUrl) {
    text += `\n\nView details: ${actionUrl}`;
  }

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
