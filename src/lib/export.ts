import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { AmortizationEntry, LoanInputs, EMIResult } from './finance';
import { formatCurrency } from './utils';

export const exportToExcel = (data: AmortizationEntry[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data.map(item => ({
    Month: item.month,
    EMI: Math.round(item.emi),
    Principal: Math.round(item.principal),
    Interest: Math.round(item.interest),
    "Running Balance": Math.round(item.balance)
  })));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Amortization Schedule");
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

export const generateKFSPDF = (inputs: LoanInputs, result: EMIResult, borrowerName: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const primaryColor = [37, 99, 235]; // #2563eb
  const secondaryColor = [100, 116, 139]; // #64748b

  // 1. Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text("FinPlan Pro", 14, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text("Key Fact Statement (KFS) - RBI Standardized Format", 14, 30);
  
  doc.setFontSize(8);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth - 14, 30, { align: 'right' });

  let currentY = 50;

  // 2. Section: Borrower & Loan Identity
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("1. Borrower & Loan Identity", 14, currentY);
  currentY += 5;

  autoTable(doc, {
    startY: currentY,
    body: [
      ["Borrower Name", borrowerName],
      ["Loan Type", inputs.type.toUpperCase() + " LOAN"],
      ["Interest Calculation Type", inputs.interestType === 'reducing' ? "Reducing Balance" : "Flat Rate"]
    ],
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: 'bold', width: 60 } }
  });
  currentY = (doc as any).lastAutoTable.finalY + 10;

  // 3. Section: Loan Financials
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("2. Loan Financial Terms", 14, currentY);
  currentY += 5;

  autoTable(doc, {
    startY: currentY,
    head: [['Parameter', 'Value', 'Description']],
    body: [
      ["Loan Amount", formatCurrency(inputs.amount), "Principal amount sanctioned"],
      ["Annual Interest Rate", `${inputs.rate}% p.a.`, "Interest rate charged on the loan"],
      ["Tenure", `${inputs.tenure} ${inputs.tenureUnit}`, "Duration of the loan"],
      ["Monthly EMI", formatCurrency(result.emi), "Fixed monthly installment"],
      ["Annual Percentage Rate (APR)", `${result.apr.toFixed(2)}%`, "Effective annual cost including fees"]
    ],
    theme: 'grid',
    headStyles: { fillColor: primaryColor },
    styles: { fontSize: 9 }
  });
  currentY = (doc as any).lastAutoTable.finalY + 10;

  // 4. Section: Fee Structure & Penalties
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("3. Fees, Charges & Penalties", 14, currentY);
  currentY += 5;

  autoTable(doc, {
    startY: currentY,
    head: [['Charge Type', 'Amount/Rate', 'Notes']],
    body: [
      ["Processing Fees", formatCurrency(result.processingFeeAmount), "One-time non-refundable fee"],
      ["Insurance Premium", formatCurrency(inputs.insurance), "Credit shield/Life insurance"],
      ["Prepayment Charges", "2.00% - 4.00%", "Applicable on outstanding principal"],
      ["Late Payment Penalty", "2.00% per month", "Charged on overdue EMI amount"]
    ],
    theme: 'grid',
    headStyles: { fillColor: secondaryColor },
    styles: { fontSize: 9 }
  });
  currentY = (doc as any).lastAutoTable.finalY + 10;

  // 5. Section: Repayment Summary
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("4. Repayment Summary", 14, currentY);
  currentY += 5;

  autoTable(doc, {
    startY: currentY,
    body: [
      ["Total Interest Payable", formatCurrency(result.totalInterest)],
      ["Total Repayment Amount", formatCurrency(result.totalPayment)]
    ],
    theme: 'striped',
    styles: { fontSize: 11, fontStyle: 'bold' },
    columnStyles: { 0: { width: 100 } }
  });

  // 6. Footer
  const footerY = pageHeight - 30;
  doc.setDrawColor(200, 200, 200);
  doc.line(14, footerY, pageWidth - 14, footerY);
  
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'italic');
  const disclaimer = "Disclaimer: This Key Fact Statement is for informational purposes only. Actual terms may vary based on credit assessment and bank policies. FinPlan Pro is not a financial institution and does not provide loans directly.";
  const splitDisclaimer = doc.splitTextToSize(disclaimer, pageWidth - 28);
  doc.text(splitDisclaimer, 14, footerY + 5);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Page 1 of 1`, pageWidth / 2, pageHeight - 10, { align: 'center' });

  doc.save(`KFS_${borrowerName.replace(/\s+/g, '_')}.pdf`);
};
