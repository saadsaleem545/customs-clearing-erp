export function generateInvoicePdf(invoice: any) {
  // Create a clean printable HTML window for the invoice
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups for this website to download the PDF invoice.');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice - ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; padding: 40px; margin: 0; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
          .title { font-size: 22px; font-weight: 800; color: #1e3a8a; margin: 0; }
          .subtitle { font-size: 11px; color: #64748b; margin-top: 4px; }
          .inv-heading { font-size: 20px; font-weight: 800; color: #2563eb; text-align: right; margin: 0; }
          .grid { display: flex; justify-content: space-between; margin-top: 30px; }
          .box { font-size: 12px; line-height: 1.6; }
          .box strong { color: #0f172a; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; margin-top: 35px; }
          th { background-color: #1e293b; color: white; text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; }
          td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #334155; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .totals { margin-top: 30px; float: right; width: 280px; font-size: 12px; }
          .totals-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9; }
          .totals-row.grand { font-weight: bold; font-size: 14px; color: #1e3a8a; border-top: 2px solid #2563eb; border-bottom: none; margin-top: 6px; padding-top: 10px; }
          .clear { clear: both; }
          .remarks { margin-top: 40px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; pt: 15px; }
          .sigs { display: flex; justify-content: space-between; margin-top: 60px; font-size: 11px; color: #64748b; text-align: center; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">SHAHEEN CUSTOMS CLEARING & LOGISTICS</h1>
            <div class="subtitle">Customs Agents, Freight Forwarding & WeBOC Electronic Consultants</div>
          </div>
          <div>
            <h2 class="inv-heading">TAX INVOICE</h2>
            <div class="subtitle" style="text-align: right;">Original Client Copy</div>
          </div>
        </div>

        <div class="grid">
          <div class="box">
            <div style="color: #64748b; font-weight: bold; margin-bottom: 4px; font-size: 10px; text-transform: uppercase;">Invoice To:</div>
            <strong>${invoice.party.companyName}</strong><br/>
            NTN Number: ${invoice.party.ntn}<br/>
            Party Code: ${invoice.party.partyCode}
          </div>
          <div class="box" style="text-align: right;">
            <div style="color: #64748b; font-weight: bold; margin-bottom: 4px; font-size: 10px; text-transform: uppercase;">Invoice Details:</div>
            <strong>Invoice #: ${invoice.invoiceNumber}</strong><br/>
            Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-GB')}<br/>
            Due Date: ${new Date(invoice.dueDate).toLocaleDateString('en-GB')}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description of Clearing Services / Charges</th>
              <th class="text-center">Reference / Qty</th>
              <th class="text-right">Amount (PKR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Customs Agency Processing & Documentation Fee</td>
              <td class="text-center">1 Service</td>
              <td class="text-right">Rs. ${Number(invoice.agencyFee).toLocaleString('en-PK')}</td>
            </tr>
            <tr>
              <td>WeBOC Electronic Clearing & Wharfage Charges</td>
              <td class="text-center">1 Lot</td>
              <td class="text-right">Rs. ${Number(invoice.clearingCharges).toLocaleString('en-PK')}</td>
            </tr>
            <tr>
              <td>Reimbursable Port Terminal, Demurrage & Storage Expenses</td>
              <td class="text-center">Actual</td>
              <td class="text-right">Rs. ${Number(invoice.reimbursableExp).toLocaleString('en-PK')}</td>
            </tr>
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row">
            <span>Total Amount:</span>
            <strong>Rs. ${Number(invoice.totalAmount).toLocaleString('en-PK')}</strong>
          </div>
          <div class="totals-row">
            <span>Paid Amount:</span>
            <span style="color: #059669;">Rs. ${Number(invoice.paidAmount).toLocaleString('en-PK')}</span>
          </div>
          <div class="totals-row grand">
            <span>Balance Due:</span>
            <span>Rs. ${Number(invoice.balanceDue).toLocaleString('en-PK')}</span>
          </div>
        </div>
        <div class="clear"></div>

        <div class="remarks">
          <strong>Remarks / Instructions:</strong><br/>
          ${invoice.remarks || 'Please make all payments via cross cheque in favor of "Shaheen Customs Clearing & Logistics".'}
        </div>

        <div class="sigs">
          <div>_____________________<br/>Prepared By</div>
          <div>_____________________<br/>Verified By</div>
          <div>_____________________<br/>Authorized Signature</div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}