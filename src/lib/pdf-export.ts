// PDF Export for AIM Glide ROI Calculator
import { jsPDF } from 'jspdf';
import type { CalculatorInputs, TCOResult } from './calculator';

// Intralox logo as base64 PNG (same as original)
const INTRALOX_LOGO = 'data:image/png;base64,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';

export function generatePDF(inputs: CalculatorInputs, tco: TCOResult, benefitYears: number) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const red: [number, number, number] = [200, 16, 46];
  const green: [number, number, number] = [0, 168, 120];
  const gray: [number, number, number] = [100, 100, 120];
  const lightGray: [number, number, number] = [240, 240, 245];

  // Header
  pdf.setFillColor(...red);
  pdf.rect(0, 0, 210, 45, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  try {
    pdf.addImage(INTRALOX_LOGO, 'PNG', 15, 8, 30, 16);
  } catch {
    pdf.text('INTRALOX', 15, 18);
  }
  pdf.setFontSize(20);
  pdf.text('AIM Glide ROI Analysis', 15, 32);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const headerLine = inputs.customerName + (inputs.projectName ? ' | ' + inputs.projectName : '');
  if (headerLine) pdf.text(headerLine, 15, 40);
  pdf.setFontSize(9);
  pdf.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 155, 18);
  if (inputs.plantLocation) pdf.text(inputs.plantLocation, 155, 25);
  if (inputs.preparedBy) pdf.text('Prepared by: ' + inputs.preparedBy, 155, 32);

  let y = 55;

  // Executive Summary
  pdf.setTextColor(...red);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Executive Summary', 20, y);
  y += 12;

  const boxWidth = 42;
  const boxHeight = 30;
  const startX = 15;
  const boxGap = 3;

  // Box 1: Annual Savings
  pdf.setFillColor(...lightGray);
  pdf.roundedRect(startX, y, boxWidth, boxHeight, 3, 3, 'F');
  pdf.setTextColor(...gray);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('ANNUAL SAVINGS', startX + 3, y + 10);
  pdf.setTextColor(...green);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('$' + tco.savings.yearly.toLocaleString(), startX + 3, y + 22);

  // Box 2: Payback Period
  pdf.setFillColor(...lightGray);
  pdf.roundedRect(startX + (boxWidth + boxGap), y, boxWidth, boxHeight, 3, 3, 'F');
  pdf.setTextColor(...gray);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('PAYBACK PERIOD', startX + (boxWidth + boxGap) + 3, y + 10);
  pdf.setTextColor(...red);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text(tco.savings.paybackYears + ' yrs', startX + (boxWidth + boxGap) + 3, y + 22);

  // Box 3: ROI or Hours Reallocated
  pdf.setFillColor(...lightGray);
  pdf.roundedRect(startX + (boxWidth + boxGap) * 2, y, boxWidth, boxHeight, 3, 3, 'F');
  pdf.setTextColor(...gray);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  if (tco.reallocation.isReallocated) {
    pdf.text('HRS REALLOCATED', startX + (boxWidth + boxGap) * 2 + 3, y + 10);
    pdf.setTextColor(...red);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(tco.reallocation.hoursPerYear + '/yr', startX + (boxWidth + boxGap) * 2 + 3, y + 22);
  } else {
    pdf.text(benefitYears + '-YEAR ROI', startX + (boxWidth + boxGap) * 2 + 3, y + 10);
    pdf.setTextColor(...green);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(tco.savings.roi + '%', startX + (boxWidth + boxGap) * 2 + 3, y + 22);
  }

  // Box 4: Net Benefit
  pdf.setFillColor(...lightGray);
  pdf.roundedRect(startX + (boxWidth + boxGap) * 3, y, boxWidth, boxHeight, 3, 3, 'F');
  pdf.setTextColor(...gray);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(benefitYears + '-YR NET BENEFIT', startX + (boxWidth + boxGap) * 3 + 3, y + 10);
  pdf.setTextColor(...green);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('$' + tco.savings.multiYear.toLocaleString(), startX + (boxWidth + boxGap) * 3 + 3, y + 22);

  y += boxHeight + 20;

  // TCO Comparison Table
  pdf.setTextColor(...red);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total Cost of Ownership Comparison (Annual)', 20, y);
  y += 12;

  pdf.setFillColor(...lightGray);
  pdf.rect(20, y, 170, 10, 'F');
  pdf.setTextColor(...gray);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Cost Category', 25, y + 7);
  pdf.text('Traditional Slat Switch', 95, y + 7);
  pdf.text('AIM Glide', 160, y + 7);
  y += 12;

  const rows = [
    { category: 'Maintenance Labor', metal: '$' + tco.metal.maintenanceLabor.toLocaleString() + (tco.reallocation.isReallocated ? ' *' : ''), aim: '$' + tco.aim.maintenanceLabor.toLocaleString() },
    { category: 'Maintenance Parts', metal: '$' + tco.metal.maintenanceParts.toLocaleString(), aim: '$' + tco.aim.spareparts.toLocaleString() },
    { category: 'Unscheduled Downtime', metal: '$' + tco.metal.downtimeCost.toLocaleString(), aim: '$0' },
    { category: 'Product Waste', metal: '$' + tco.metal.wasteCost.toLocaleString(), aim: '$0' },
    { category: 'Rebuild Cost', metal: '$' + tco.metal.rebuildCost.toLocaleString(), aim: '$' + tco.aim.rebuildCost.toLocaleString() },
    { category: 'Sanitation', metal: '$' + tco.metal.sanitationCost.toLocaleString(), aim: '$' + tco.aim.sanitationCost.toLocaleString() },
  ];
  if (tco.metal.otherCost > 0 || tco.aim.otherCost > 0) {
    rows.push({
      category: 'Other Costs **',
      metal: tco.metal.otherCost > 0 ? '$' + tco.metal.otherCost.toLocaleString() : '-',
      aim: tco.aim.otherCost > 0 ? '$' + tco.aim.otherCost.toLocaleString() : '-',
    });
  }

  pdf.setFont('helvetica', 'normal');
  rows.forEach((row, i) => {
    if (i % 2 === 0) {
      pdf.setFillColor(250, 250, 252);
      pdf.rect(20, y - 4, 170, 10, 'F');
    }
    pdf.setTextColor(50, 50, 70);
    pdf.setFontSize(10);
    pdf.text(row.category, 25, y + 3);
    pdf.text(row.metal, 95, y + 3);
    pdf.text(row.aim, 160, y + 3);
    y += 10;
  });

  // Total row
  pdf.setFillColor(...red);
  pdf.rect(20, y - 2, 170, 10, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TOTAL ANNUAL TCO', 25, y + 5);
  pdf.text('$' + tco.metal.total.toLocaleString(), 95, y + 5);
  pdf.text('$' + tco.aim.total.toLocaleString(), 160, y + 5);
  y += 18;

  // Other costs footnote
  if (tco.metal.otherCost > 0 || tco.aim.otherCost > 0) {
    let otherCostLines = 1;
    if (tco.metal.otherCost > 0) otherCostLines++;
    if (tco.aim.otherCost > 0) otherCostLines++;
    const footnoteHeight = 6 + (otherCostLines * 5);
    pdf.setFillColor(245, 245, 250);
    pdf.roundedRect(20, y - 2, 170, footnoteHeight, 3, 3, 'F');
    pdf.setTextColor(...gray);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('** Other Costs:', 25, y + 4);
    pdf.setFont('helvetica', 'normal');
    let lineY = y + 9;
    if (tco.metal.otherCost > 0) {
      pdf.text('Traditional Slat Switch: ' + (inputs.metalOtherCostDesc || 'Not specified'), 25, lineY);
      lineY += 5;
    }
    if (tco.aim.otherCost > 0) {
      pdf.text('AIM Glide: ' + (inputs.aimOtherCostDesc || 'Not specified'), 25, lineY);
    }
    y += footnoteHeight + 6;
  }

  // Labor reallocation note
  if (tco.reallocation.isReallocated) {
    pdf.setFillColor(255, 240, 240);
    pdf.roundedRect(20, y - 2, 170, 18, 3, 3, 'F');
    pdf.setTextColor(...red);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('* ' + tco.reallocation.hoursPerYear + ' maintenance labor hours/year to be reallocated after AIM investment', 25, y + 6);
    pdf.setTextColor(...gray);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Labor capacity freed by AIM Glide can be assigned to higher-value work', 25, y + 13);
    y += 26;
  }

  // Investment Analysis
  if (y > 220) { pdf.addPage(); y = 20; }
  pdf.setTextColor(...red);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Investment Analysis', 20, y);
  y += 12;
  pdf.setTextColor(50, 50, 70);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text('One-Time Investment: $' + tco.investment.toLocaleString(), 25, y); y += 8;
  pdf.text('Annual Savings: $' + tco.savings.yearly.toLocaleString(), 25, y); y += 8;
  pdf.text('Payback Period: ' + tco.savings.paybackYears + ' years (' + tco.savings.paybackMonths + ' months)', 25, y); y += 8;
  if (!tco.reallocation.isReallocated) {
    pdf.text(benefitYears + '-Year Net Benefit: $' + tco.savings.multiYear.toLocaleString(), 25, y);
    y += 8;
  }
  y += 8;

  // Notes
  const activeNotes = inputs.notes.filter(n => n.trim() !== '');
  if (activeNotes.length > 0) {
    if (y > 250) { pdf.addPage(); y = 20; }
    pdf.setTextColor(...red);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Notes & Assumptions', 20, y);
    y += 10;
    pdf.setTextColor(50, 50, 70);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    activeNotes.forEach(note => {
      const lines = pdf.splitTextToSize('• ' + note, 170);
      lines.forEach((line: string) => {
        pdf.text(line, 25, y);
        y += 5;
      });
    });
  }

  // Page numbers
  // jsPDF exposes `internal` at runtime but omits it from its public types.
  const pageCount = (pdf as unknown as { internal: { getNumberOfPages(): number } })
    .internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(9);
    pdf.setTextColor(...gray);
    pdf.text('Page ' + i + ' of ' + pageCount, 185, 287);
  }

  // Footer
  pdf.setFillColor(...lightGray);
  pdf.rect(0, 277, 210, 20, 'F');
  pdf.setTextColor(...gray);
  pdf.setFontSize(9);
  pdf.text('Intralox AIM Glide ROI Calculator | Confidential', 20, 287);

  // Save
  let fileName = 'AIM_Glide_ROI';
  if (inputs.customerName) fileName += '_' + inputs.customerName.replace(/\s+/g, '_');
  if (inputs.projectName) fileName += '_' + inputs.projectName.replace(/\s+/g, '_');
  fileName += '_' + new Date().toISOString().split('T')[0] + '.pdf';
  pdf.save(fileName);
}
