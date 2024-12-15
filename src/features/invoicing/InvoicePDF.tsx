import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { Invoice, InvoiceItem } from '../../types';
import { formatCurrency } from '../../lib/utils';

// Register fonts
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeAmM.woff2' },
    { 
      src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeAmM.woff2',
      fontWeight: 'bold'
    }
  ]
});

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Inter'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827'
  },
  invoiceNumber: {
    fontSize: 14,
    color: '#6B7280'
  },
  section: {
    marginBottom: 20
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  column: {
    flexDirection: 'column',
    flex: 1,
    marginRight: 20
  },
  label: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 4
  },
  value: {
    fontSize: 12,
    color: '#111827',
    marginBottom: 8
  },
  table: {
    flexDirection: 'column',
    marginTop: 20,
    marginBottom: 20
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
    marginBottom: 8
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6B7280'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 8
  },
  tableCell: {
    fontSize: 11,
    color: '#111827'
  },
  description: { flex: 4 },
  quantity: { flex: 1, textAlign: 'center' },
  price: { flex: 1, textAlign: 'right' },
  amount: { flex: 1, textAlign: 'right' },
  totals: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    marginTop: 20
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4
  },
  totalLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginRight: 20,
    width: 100,
    textAlign: 'right'
  },
  totalValue: {
    fontSize: 11,
    color: '#111827',
    width: 100,
    textAlign: 'right'
  },
  grandTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827'
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40
  },
  notes: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 20
  },
  terms: {
    fontSize: 10,
    color: '#6B7280'
  }
});

interface InvoicePDFProps {
  invoice: Invoice;
}

export default function InvoicePDF({ invoice }: InvoicePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>#{invoice.invoiceNumber}</Text>
          </View>
          {/* Logo would go here */}
        </View>

        {/* Business Details */}
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>FROM</Text>
            <Text style={styles.value}>{invoice.fromDetails.businessName}</Text>
            {invoice.fromDetails.address && (
              <Text style={styles.value}>{invoice.fromDetails.address}</Text>
            )}
            {invoice.fromDetails.abn && (
              <Text style={styles.value}>ABN: {invoice.fromDetails.abn}</Text>
            )}
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>TO</Text>
            <Text style={styles.value}>{invoice.toDetails.businessName}</Text>
            {invoice.toDetails.address && (
              <Text style={styles.value}>{invoice.toDetails.address}</Text>
            )}
            {invoice.toDetails.abn && (
              <Text style={styles.value}>ABN: {invoice.toDetails.abn}</Text>
            )}
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>INVOICE DATE</Text>
            <Text style={styles.value}>{new Date(invoice.issueDate).toLocaleDateString()}</Text>
            {invoice.dueDate && (
              <>
                <Text style={styles.label}>DUE DATE</Text>
                <Text style={styles.value}>{new Date(invoice.dueDate).toLocaleDateString()}</Text>
              </>
            )}
            {invoice.paymentTerms && (
              <>
                <Text style={styles.label}>PAYMENT TERMS</Text>
                <Text style={styles.value}>{invoice.paymentTerms}</Text>
              </>
            )}
          </View>
        </View>

        {/* Line Items */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.description]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.quantity]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.price]}>Price</Text>
            <Text style={[styles.tableHeaderCell, styles.amount]}>Amount</Text>
          </View>
          {invoice.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.description]}>{item.description}</Text>
              <Text style={[styles.tableCell, styles.quantity]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, styles.price]}>{formatCurrency(item.unitPrice)}</Text>
              <Text style={[styles.tableCell, styles.amount]}>{formatCurrency(item.amount)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
          </View>
          
          {invoice.discountType && invoice.discountValue && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Discount
                {invoice.discountType === 'percentage' ? ` (${invoice.discountValue}%)` : ''}
              </Text>
              <Text style={styles.totalValue}>
                -{formatCurrency(
                  invoice.discountType === 'percentage'
                    ? (invoice.subtotal * (invoice.discountValue / 100))
                    : invoice.discountValue
                )}
              </Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>GST ({invoice.taxRate}%)</Text>
            <Text style={styles.totalValue}>
              {formatCurrency((invoice.subtotal - (invoice.discountValue || 0)) * (invoice.taxRate / 100))}
            </Text>
          </View>

          <View style={[styles.totalRow, { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB' }]}>
            <Text style={[styles.totalLabel, styles.grandTotal]}>Total</Text>
            <Text style={[styles.totalValue, styles.grandTotal]}>{formatCurrency(invoice.total)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {invoice.notes && (
            <View style={styles.section}>
              <Text style={styles.label}>NOTES</Text>
              <Text style={styles.notes}>{invoice.notes}</Text>
            </View>
          )}
          
          {invoice.terms && (
            <View style={styles.section}>
              <Text style={styles.label}>TERMS & CONDITIONS</Text>
              <Text style={styles.terms}>{invoice.terms}</Text>
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
} 