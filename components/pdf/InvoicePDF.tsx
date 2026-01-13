import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Define styles for the PDF
const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: 'Helvetica',
        backgroundColor: '#ffffff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
        paddingBottom: 20,
        borderBottom: '1px solid #e5e7eb',
    },
    companyInfo: {
        flexDirection: 'column',
    },
    companyName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#3b82f6',
        marginBottom: 10,
    },
    companyDetails: {
        fontSize: 9,
        color: '#6b7280',
        lineHeight: 1.5,
    },
    invoiceTitle: {
        fontSize: 28,
        color: '#60a5fa',
        marginBottom: 5,
        textAlign: 'right',
    },
    invoiceNumber: {
        fontSize: 12,
        fontFamily: 'Courier',
        marginBottom: 3,
        textAlign: 'right',
    },
    invoiceDate: {
        fontSize: 9,
        color: '#6b7280',
        textAlign: 'right',
    },
    clientSection: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    clientName: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 3,
    },
    clientDetails: {
        fontSize: 9,
        color: '#1a1a1a',
        lineHeight: 1.5,
    },
    table: {
        marginBottom: 30,
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: 8,
        marginBottom: 8,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 8,
        borderBottom: '0.5px solid #f3f4f6',
    },
    tableColDescription: {
        width: '50%',
        fontSize: 9,
    },
    tableColQty: {
        width: '15%',
        fontSize: 9,
        textAlign: 'center',
    },
    tableColPrice: {
        width: '17.5%',
        fontSize: 9,
        textAlign: 'right',
    },
    tableColTotal: {
        width: '17.5%',
        fontSize: 9,
        textAlign: 'right',
        fontWeight: 'bold',
    },
    headerText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#6b7280',
    },
    totalsSection: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 20,
    },
    totalsBox: {
        width: '40%',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 5,
        fontSize: 9,
        color: '#6b7280',
    },
    grandTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingTop: 12,
        borderTop: '1px solid #e5e7eb',
        fontSize: 12,
        fontWeight: 'bold',
    },
    grandTotalLabel: {
        color: '#1a1a1a',
    },
    grandTotalAmount: {
        color: '#3b82f6',
    },
    notesSection: {
        marginTop: 30,
        paddingTop: 20,
        borderTop: '1px solid #e5e7eb',
    },
    notesTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    notesText: {
        fontSize: 9,
        color: '#6b7280',
        lineHeight: 1.5,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 8,
        color: '#9ca3af',
    },
});

interface InvoiceItem {
    id: number;
    description: string;
    quantity: number;
    unitPrice: number;
    total?: number;
}

interface InvoiceData {
    id: number;
    invoiceNumber: string;
    date: string;
    dueDate: string;
    status: string;
    subtotal: number;
    tax?: number;
    totalAmount: number;
    notes?: string;
    client: {
        firstName: string;
        lastName: string;
        email: string;
        companyName?: string;
        address?: string;
        city?: string;
        country?: string;
    };
    items: InvoiceItem[];
}

interface InvoicePDFProps {
    invoice: InvoiceData;
    appName?: string;
}

export const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice, appName = 'WHMCS CRM' }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.companyInfo}>
                    <Text style={styles.companyName}>{appName}</Text>
                    <View style={styles.companyDetails}>
                        <Text>123 Hosting Street</Text>
                        <Text>Dhaka, Bangladesh</Text>
                        <Text>support@whmcscrm.com</Text>
                    </View>
                </View>
                <View>
                    <Text style={styles.invoiceTitle}>INVOICE</Text>
                    <Text style={styles.invoiceNumber}>#{invoice.invoiceNumber || invoice.id}</Text>
                    <Text style={styles.invoiceDate}>
                        Date: {new Date((invoice as any).invoiceDate || (invoice as any).createdAt || invoice.date).toLocaleDateString()}
                    </Text>
                    <Text style={styles.invoiceDate}>
                        Due: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
                    </Text>
                </View>
            </View>

            {/* Client Information */}
            <View style={styles.clientSection}>
                <Text style={styles.sectionTitle}>BILL TO</Text>
                <Text style={styles.clientName}>
                    {invoice.client.firstName} {invoice.client.lastName}
                </Text>
                {invoice.client.companyName && (
                    <Text style={styles.clientDetails}>{invoice.client.companyName}</Text>
                )}
                <View style={styles.clientDetails}>
                    {invoice.client.address && <Text>{invoice.client.address}</Text>}
                    {(invoice.client.city || invoice.client.country) && (
                        <Text>{invoice.client.city} {invoice.client.country}</Text>
                    )}
                    <Text>{invoice.client.email}</Text>
                </View>
            </View>

            {/* Items Table */}
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={[styles.tableColDescription, styles.headerText]}>Description</Text>
                    <Text style={[styles.tableColQty, styles.headerText]}>Qty</Text>
                    <Text style={[styles.tableColPrice, styles.headerText]}>Unit Price</Text>
                    <Text style={[styles.tableColTotal, styles.headerText]}>Total</Text>
                </View>
                {invoice.items.map((item) => (
                    <View key={item.id} style={styles.tableRow}>
                        <Text style={styles.tableColDescription}>{item.description}</Text>
                        <Text style={styles.tableColQty}>{item.quantity}</Text>
                        <Text style={styles.tableColPrice}>${Number(item.unitPrice).toFixed(2)}</Text>
                        <Text style={styles.tableColTotal}>
                            ${Number(item.total || (item.quantity * item.unitPrice)).toFixed(2)}
                        </Text>
                    </View>
                ))}
            </View>

            {/* Totals */}
            <View style={styles.totalsSection}>
                <View style={styles.totalsBox}>
                    <View style={styles.totalRow}>
                        <Text>Subtotal</Text>
                        <Text>${Number(invoice.subtotal).toFixed(2)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text>Tax</Text>
                        <Text>${Number(invoice.tax || 0).toFixed(2)}</Text>
                    </View>
                    <View style={styles.grandTotalRow}>
                        <Text style={styles.grandTotalLabel}>Total</Text>
                        <Text style={styles.grandTotalAmount}>${Number(invoice.totalAmount).toFixed(2)}</Text>
                    </View>
                </View>
            </View>

            {/* Notes */}
            {invoice.notes && (
                <View style={styles.notesSection}>
                    <Text style={styles.notesTitle}>Notes</Text>
                    <Text style={styles.notesText}>{invoice.notes}</Text>
                </View>
            )}

            {/* Footer */}
            <View style={styles.footer}>
                <Text>Thank you for your business.</Text>
                <Text>Generated by {appName}</Text>
            </View>
        </Page>
    </Document>
);
