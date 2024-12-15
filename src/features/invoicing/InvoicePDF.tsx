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
            <Text style={styles.invoiceNumber}>#{invoice.invoice_number}</Text>
          </View>
          {/* Logo would go here */}
        </View>

        {/* Business Details */}
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>FROM</Text>
            <Text style={styles.value}>
              {typeof invoice.from_details === 'string' 
                ? JSON.parse(invoice.from_details).businessName 
                : invoice.from_details.businessName}
            </Text>
            {(typeof invoice.from_details === 'string' 
              ? JSON.parse(invoice.from_details).address 
              : invoice.from_details.address) && (
              <Text style={styles.value}>
                {typeof invoice.from_details === 'string' 
                  ? JSON.parse(invoice.from_details).address 
                  : invoice.from_details.address}
              </Text>
            )}
            {(typeof invoice.from_details === 'string' 
              ? JSON.parse(invoice.from_details).abn 
              : invoice.from_details.abn) && (
              <Text style={styles.value}>ABN: {
                typeof invoice.from_details === 'string' 
                  ? JSON.parse(invoice.from_details).abn 
                  : invoice.from_details.abn
              }</Text>
            )}
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>TO</Text>
            <Text style={styles.value}>
              {typeof invoice.to_details === 'string' 
                ? JSON.parse(invoice.to_details).businessName 
                : invoice.to_details.businessName}
            </Text>
            {(typeof invoice.to_details === 'string' 
              ? JSON.parse(invoice.to_details).address 
              : invoice.to_details.address) && (
              <Text style={styles.value}>
                {typeof invoice.to_details === 'string' 
                  ? JSON.parse(invoice.to_details).address 
                  : invoice.to_details.address}
              </Text>
            )}
            {(typeof invoice.to_details === 'string' 
              ? JSON.parse(invoice.to_details).abn 
              : invoice.to_details.abn) && (
              <Text style={styles.value}>ABN: {
                typeof invoice.to_details === 'string' 
                  ? JSON.parse(invoice.to_details).abn 
                  : invoice.to_details.abn
              }</Text>
            )}
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>INVOICE DATE</Text>
            <Text style={styles.value}>{new Date(invoice.issue_date).toLocaleDateString()}</Text>
            {invoice.due_date && (
              <>
                <Text style={styles.label}>DUE DATE</Text>
                <Text style={styles.value}>{new Date(invoice.due_date).toLocaleDateString()}</Text>
              </>
            )}
            {invoice.payment_terms && (
              <>
                <Text style={styles.label}>PAYMENT TERMS</Text>
                <Text style={styles.value}>{invoice.payment_terms}</Text>
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
              <Text style={[styles.tableCell, styles.price]}>{formatCurrency(item.unit_price)}</Text>
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
          
          {invoice.discount_type && invoice.discount_value && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Discount
                {invoice.discount_type === 'percentage' ? ` (${invoice.discount_value}%)` : ''}
              </Text>
              <Text style={styles.totalValue}>
                -{formatCurrency(
                  invoice.discount_type === 'percentage'
                    ? (invoice.subtotal * (invoice.discount_value / 100))
                    : invoice.discount_value
                )}
              </Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>GST ({invoice.tax_rate}%)</Text>
            <Text style={styles.totalValue}>
              {formatCurrency((invoice.subtotal - (invoice.discount_value || 0)) * (invoice.tax_rate / 100))}
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