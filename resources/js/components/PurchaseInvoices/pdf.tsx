import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Import or redefine Invoice interface here
interface Supplier {
  nom: string;
  email?: string;
  telephone?: string | null;
  adresse?: string;
  ville?: string;
  pays?: string;
}

interface Item {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: string;
  total_price: string;
}

interface Invoice {
  uuid: string;
  code: string;
  invoice_date: string;
  status: 'unpaid' | 'partial' | 'paid';
  subtotal: string;
  tax_amount: string;
  total_amount: string;
  remaining_amount: string;
  supplier: Supplier;
  items: Item[];
}

interface InvoiceProps {
  invoice: Invoice;
}

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 12, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 'bold' },
  table: { flexDirection: 'column', marginBottom: 20 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000' },
  tableColHeader: { flex: 1, padding: 5, backgroundColor: '#eee', fontWeight: 'bold' },
  tableCol: { flex: 1, padding: 5 },
});

export const InvoicePDF = ({ invoice }: InvoiceProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Invoice #{invoice.code}</Text>
        <Text>Date: {invoice.invoice_date}</Text>
      </View>

      {/* Supplier */}
      <Text>Supplier: {invoice.supplier.nom}</Text>
      {invoice.supplier.email && <Text>Email: {invoice.supplier.email}</Text>}
      {invoice.supplier.telephone && <Text>Phone: {invoice.supplier.telephone}</Text>}

      {/* Table */}
      <View style={styles.table}>
        {/* Header row */}
        <View style={styles.tableRow}>
          <Text style={styles.tableColHeader}>Description</Text>
          <Text style={styles.tableColHeader}>Qty</Text>
          <Text style={styles.tableColHeader}>Price</Text>
          <Text style={styles.tableColHeader}>Total</Text>
        </View>

        {/* Data rows */}
        {invoice.items.map((item) => (
          <View style={styles.tableRow} key={item.id}>
            <Text style={styles.tableCol}>{item.product_name}</Text>
            <Text style={styles.tableCol}>{item.quantity}</Text>
            <Text style={styles.tableCol}>${Number(item.unit_price).toFixed(2)}</Text>
            <Text style={styles.tableCol}>${Number(item.total_price).toFixed(2)}</Text>
          </View>
        ))}
      </View>

      <Text>Total Amount: ${Number(invoice.total_amount).toFixed(2)}</Text>
    </Page>
  </Document>
);