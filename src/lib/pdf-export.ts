// PDF Export for the AIM Glide ROI Calculator.
//
// This document is a leave-behind: the account manager walks the plant manager
// through the Results tab on an iPad, then leaves this. It therefore has to
// stand on its own -- every figure carries the calculation that produced it,
// and the inputs it was all derived from are stated at the end.
//
// Two things here are load-bearing and easy to undo by accident:
//
//  1. `ensureSpace` is called before every block AND every table row. The
//     previous version tracked `y` with two after-the-fact `if (y > 220)`
//     checks, so a long breakdown could run underneath the footer band.
//  2. The page furniture is drawn in one pass at the end, over every page. It
//     used to be drawn once inline, which meant a two-page export gave page 1 a
//     page number and no footer.

import { jsPDF } from 'jspdf';
import {
  buildCashflowSeries,
  formatCurrency,
  formatPayback,
  formatSignedCurrency,
  PERIODS_PER_YEAR,
  singularProduct,
  type CalculatorInputs,
  type TCOResult,
} from './calculator';
import { buildTcoRows } from './tco-rows';
import { INTRALOX_LOGO_PNG, INTRALOX_LOGO_SIZE } from '../assets/intralox-logo-pdf';

type RGB = [number, number, number];

const RED: RGB = [200, 16, 46];
const GREEN: RGB = [0, 140, 100];
const GRAY: RGB = [100, 100, 120];
const INK: RGB = [40, 40, 55];
const METAL: RGB = [110, 112, 130];
const PANEL: RGB = [244, 244, 248];
const ZEBRA: RGB = [250, 250, 252];

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 15;
const CONTENT_W = PAGE_W - MARGIN * 2; // 180
const RIGHT = PAGE_W - MARGIN; // 195

/** Nothing may be drawn below this; the footer band lives underneath it. */
const CONTENT_BOTTOM = 268;
/** Where content resumes on a continuation page. */
const CONTINUATION_TOP = 25;

export interface PdfExportResult {
  fileName: string;
  /**
   * False when the logo image failed to draw. The caller must tell the user --
   * an unbranded document going to a customer is not a silent success.
   */
  logoRendered: boolean;
}

/**
 * Build the document without saving it.
 *
 * Split out from `generatePDF` so the layout can be exercised outside a browser
 * -- `pdf.save()` triggers a download and cannot run headlessly.
 */
export function buildPDF(
  inputs: CalculatorInputs,
  tco: TCOResult,
  benefitYears: number,
): PdfExportResult & { pdf: jsPDF } {
  const pdf = new jsPDF('p', 'mm', 'a4');
  let y = 0;

  // ---------------------------------------------------------------- helpers

  const setFill = (c: RGB) => pdf.setFillColor(c[0], c[1], c[2]);
  const setText = (c: RGB) => pdf.setTextColor(c[0], c[1], c[2]);
  const setDraw = (c: RGB) => pdf.setDrawColor(c[0], c[1], c[2]);
  const setDrawRGB = (r: number, g: number, b: number) => pdf.setDrawColor(r, g, b);
  const bold = (size: number) => {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(size);
  };
  const normal = (size: number) => {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(size);
  };

  /** Break to a new page if `needed` mm would not fit above the footer. */
  const ensureSpace = (needed: number) => {
    if (y + needed > CONTENT_BOTTOM) {
      pdf.addPage();
      y = CONTINUATION_TOP;
    }
  };

  /**
   * `keepWith` is the height of the block that follows. Without it the heading
   * takes only its own height into account and can be stranded alone at the
   * bottom of a page while its content breaks to the next one.
   */
  const sectionHeading = (text: string, keepWith: number) => {
    ensureSpace(10 + keepWith);
    setText(RED);
    bold(13);
    pdf.text(text, MARGIN, y);
    setDrawRGB(225, 225, 232);
    pdf.setLineWidth(0.2);
    pdf.line(MARGIN, y + 2.5, RIGHT, y + 2.5);
    y += 10;
  };

  const statBox = (x: number, top: number, w: number, label: string, value: string, color: RGB) => {
    setFill(PANEL);
    pdf.roundedRect(x, top, w, 26, 2.5, 2.5, 'F');
    setText(GRAY);
    normal(7.5);
    pdf.text(label, x + 4, top + 8);
    setText(color);
    // Long words like "No payback" have to shrink rather than spill out of the box.
    bold(value.length > 12 ? 11 : 14);
    pdf.text(value, x + 4, top + 19);
  };

  // ----------------------------------------------------------------- header
  //
  // White, not the red band this used to have. The Intralox wordmark is red
  // artwork on transparency with no white pixels in it, so on a red band it was
  // invisible even once the truncated image data was repaired.

  let logoRendered = true;
  const logoW = 30;
  const logoH = (logoW * INTRALOX_LOGO_SIZE.height) / INTRALOX_LOGO_SIZE.width;
  try {
    pdf.addImage(INTRALOX_LOGO_PNG, 'PNG', MARGIN, 12, logoW, logoH);
  } catch {
    // Draw *something* so the header isn't a hole, but tell the caller, which
    // tells the user. Reporting success here is what shipped an unbranded PDF.
    logoRendered = false;
    setText(RED);
    bold(14);
    pdf.text('INTRALOX', MARGIN, 12 + logoH - 2);
  }

  setText(GRAY);
  normal(8.5);
  let metaY = 14;
  pdf.text(
    new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    RIGHT,
    metaY,
    { align: 'right' },
  );
  if (inputs.plantLocation) {
    metaY += 5;
    pdf.text(inputs.plantLocation, RIGHT, metaY, { align: 'right' });
  }
  if (inputs.preparedBy) {
    metaY += 5;
    pdf.text('Prepared by: ' + inputs.preparedBy, RIGHT, metaY, { align: 'right' });
  }

  y = Math.max(12 + logoH, metaY) + 10;

  setText(INK);
  bold(20);
  pdf.text('AIM Glide ROI Analysis', MARGIN, y);
  y += 7;

  const headerLine = inputs.customerName + (inputs.projectName ? ' | ' + inputs.projectName : '');
  if (headerLine.trim()) {
    setText(GRAY);
    normal(10);
    pdf.text(headerLine, MARGIN, y);
    y += 5;
  }

  setDraw(RED);
  pdf.setLineWidth(0.8);
  pdf.line(MARGIN, y, RIGHT, y);
  y += 12;

  // -------------------------------------------------------- executive summary

  sectionHeading('Executive Summary', 26);
  const boxW = (CONTENT_W - 3 * 4) / 4;
  // Any of these can go negative. Rendering a loss in green, with the sign
  // buried after the dollar symbol, would read as a win at a glance.
  const good = (n: number): RGB => (n >= 0 ? GREEN : RED);
  const boxes: Array<[string, string, RGB]> = [
    ['ANNUAL SAVINGS', formatSignedCurrency(tco.savings.yearly), good(tco.savings.yearly)],
    ['PAYBACK PERIOD', formatPayback(tco), RED],
    tco.reallocation.isReallocated
      ? ['HRS REALLOCATED', tco.reallocation.hoursPerYear + '/yr', RED]
      : [benefitYears + '-YEAR ROI', tco.savings.roi + '%', good(Number(tco.savings.roi))],
    [
      benefitYears + '-YR NET BENEFIT',
      formatSignedCurrency(tco.savings.multiYear),
      good(tco.savings.multiYear),
    ],
  ];
  boxes.forEach(([label, value, color], i) => {
    statBox(MARGIN + i * (boxW + 4), y, boxW, label, value, color);
  });
  y += 26 + 10;

  // ------------------------------------------------------- annual comparison

  sectionHeading('Annual Cost of Ownership', 46);
  const trackX = 60;
  const trackW = 110;
  const scaleMax = Math.max(tco.metal.total, tco.aim.total, 1);
  const bars: Array<[string, number, RGB]> = [
    ['Traditional Slat Switch', tco.metal.total, METAL],
    ['AIM Glide', tco.aim.total, GREEN],
  ];
  bars.forEach(([label, value, color], i) => {
    const barY = y + i * 14;
    setText(INK);
    normal(9);
    pdf.text(label, MARGIN, barY + 6);
    setFill([235, 235, 240]);
    pdf.rect(trackX, barY, trackW, 8, 'F');
    setFill(color);
    pdf.rect(trackX, barY, Math.max((value / scaleMax) * trackW, 0.5), 8, 'F');
    setText(INK);
    bold(9.5);
    pdf.text(formatCurrency(value), RIGHT, barY + 6, { align: 'right' });
  });
  y += 30;

  // The number the whole document exists to communicate. It was previously
  // absent from the chart entirely.
  ensureSpace(14);
  setFill(tco.savings.yearly > 0 ? [237, 248, 244] : [253, 240, 242]);
  pdf.roundedRect(MARGIN, y, CONTENT_W, 11, 2, 2, 'F');
  setText(tco.savings.yearly > 0 ? GREEN : RED);
  bold(11);
  pdf.text(
    tco.savings.yearly > 0
      ? `Saves ${formatCurrency(tco.savings.yearly)} per year`
      : `Costs ${formatCurrency(Math.abs(tco.savings.yearly))} more per year`,
    MARGIN + 4,
    y + 7.5,
  );
  normal(8.5);
  setText(GRAY);
  // Suppressed when there is no payback -- "Payback: No payback" is nonsense,
  // and the left-hand side of this band has already said what is happening.
  const deltaAside = tco.reallocation.isReallocated
    ? `${tco.reallocation.hoursPerYear} maintenance hours/year freed`
    : tco.savings.yearly > 0
      ? `Payback: ${formatPayback(tco)}`
      : '';
  if (deltaAside) pdf.text(deltaAside, RIGHT - 4, y + 7.5, { align: 'right' });
  y += 11 + 10;

  // ---------------------------------------------------------- payback chart

  const cashflow = buildCashflowSeries(tco, benefitYears);
  if (tco.investment > 0) {
    const chartH = 42;
    sectionHeading('Cumulative Position', chartH + 20);

    const plotX = MARGIN + 26;
    const plotW = CONTENT_W - 26;
    const top = y;
    const span = cashflow.max - cashflow.min || 1;
    const zeroY = top + ((cashflow.max - 0) / span) * chartH;
    const colW = plotW / (cashflow.points.length * 1.6);

    // Zero axis, which is the line the customer cares about crossing.
    setDraw(GRAY);
    pdf.setLineWidth(0.3);
    pdf.line(plotX, zeroY, plotX + plotW, zeroY);
    setText(GRAY);
    normal(6.5);
    pdf.text('$0', plotX - 2, zeroY + 1.5, { align: 'right' });
    pdf.text(formatSignedCurrency(cashflow.max), plotX - 2, top + 2, { align: 'right' });
    pdf.text(formatSignedCurrency(cashflow.min), plotX - 2, top + chartH + 1, { align: 'right' });

    cashflow.points.forEach((point, i) => {
      const cx = plotX + ((i + 0.5) * plotW) / cashflow.points.length;
      const height = (Math.abs(point.cumulative) / span) * chartH;
      setFill(point.cumulative >= 0 ? GREEN : METAL);
      pdf.rect(
        cx - colW / 2,
        point.cumulative >= 0 ? zeroY - height : zeroY,
        colW,
        Math.max(height, 0.3),
        'F',
      );
      setText(GRAY);
      normal(6.5);
      pdf.text(
        point.year === 0 ? 'Now' : `Yr ${point.year}`,
        cx,
        top + chartH + 6,
        { align: 'center' },
      );
    });

    y += chartH + 10;
    setText(GRAY);
    normal(8);
    const caption =
      cashflow.paybackYear === null
        ? 'The investment does not recover at these figures.'
        : `Investment of ${formatCurrency(tco.investment)} recovers after ${formatPayback(tco)}, then accumulates.`;
    pdf.text(caption, MARGIN, y);
    y += 10;
  }

  // ----------------------------------------------------------- the TCO table

  sectionHeading('Total Cost of Ownership Comparison (Annual)', 30);

  const METAL_X = 150;
  const AIM_X = RIGHT;

  const drawTableHeader = () => {
    setFill(PANEL);
    pdf.rect(MARGIN, y, CONTENT_W, 9, 'F');
    setText(GRAY);
    bold(8.5);
    pdf.text('Cost Category', MARGIN + 4, y + 6);
    pdf.text('Traditional Slat Switch', METAL_X, y + 6, { align: 'right' });
    pdf.text('AIM Glide', AIM_X - 4, y + 6, { align: 'right' });
    y += 9;
  };

  drawTableHeader();

  const rows = buildTcoRows(tco);
  // A plain hyphen, not an em dash: the standard-font encoding here is not worth
  // gambling a blank cell on in a document that goes to a customer.
  const cell = (value: number | null) => (value === null ? '-' : formatCurrency(value));

  rows
    .filter(r => !r.isTotal)
    .forEach((row, i) => {
      // The trace lines are the credibility layer -- "1 hrs/week x 52 x $70/hr"
      // is what answers "where did that number come from" in the room.
      const traceParts: string[] = [];
      if (row.metalBreakdown) traceParts.push(`Slat switch: ${row.metalBreakdown}`);
      if (row.aimBreakdown) traceParts.push(`AIM Glide: ${row.aimBreakdown}`);
      normal(6.8);
      const traceLines = traceParts.length
        ? (pdf.splitTextToSize(traceParts.join('   ·   '), CONTENT_W - 12) as string[])
        : [];

      const noteParts = [row.metalNote, row.aimNote].filter(Boolean) as string[];
      const rowH = 7 + traceLines.length * 3.4 + (noteParts.length ? 4 : 0);

      // Called per row, not per section -- this is the guard that was missing.
      ensureSpace(rowH + 4);
      if (y === CONTINUATION_TOP) drawTableHeader();

      if (i % 2 === 0) {
        setFill(ZEBRA);
        pdf.rect(MARGIN, y, CONTENT_W, rowH, 'F');
      }

      setText(INK);
      normal(9.5);
      pdf.text(row.label, MARGIN + 4, y + 5.5);
      pdf.text(cell(row.metal), METAL_X, y + 5.5, { align: 'right' });
      pdf.text(cell(row.aim), AIM_X - 4, y + 5.5, { align: 'right' });

      let lineY = y + 9;
      setText(GRAY);
      normal(6.8);
      traceLines.forEach(line => {
        pdf.text(line, MARGIN + 6, lineY);
        lineY += 3.4;
      });

      if (noteParts.length) {
        setText(RED);
        normal(7);
        pdf.text(noteParts.join('   ·   '), MARGIN + 6, lineY + 0.5);
      }

      y += rowH;
    });

  const total = rows.find(r => r.isTotal)!;
  ensureSpace(14);
  setFill(RED);
  pdf.rect(MARGIN, y, CONTENT_W, 10, 'F');
  pdf.setTextColor(255, 255, 255);
  bold(10);
  pdf.text('TOTAL ANNUAL TCO', MARGIN + 4, y + 6.5);
  pdf.text(cell(total.metal), METAL_X, y + 6.5, { align: 'right' });
  pdf.text(cell(total.aim), AIM_X - 4, y + 6.5, { align: 'right' });
  y += 10 + 10;

  // ------------------------------------------------------- other-cost detail

  if (tco.metal.otherCost > 0 || tco.aim.otherCost > 0) {
    const detail: string[] = [];
    if (tco.metal.otherCost > 0)
      detail.push('Traditional Slat Switch: ' + (inputs.metalOtherCostDesc || 'Not specified'));
    if (tco.aim.otherCost > 0)
      detail.push('AIM Glide: ' + (inputs.aimOtherCostDesc || 'Not specified'));

    normal(8);
    const lines = detail.flatMap(d => pdf.splitTextToSize(d, CONTENT_W - 10) as string[]);
    const boxH = 8 + lines.length * 4.5;

    ensureSpace(boxH + 6);
    setFill(PANEL);
    pdf.roundedRect(MARGIN, y, CONTENT_W, boxH, 2, 2, 'F');
    setText(GRAY);
    bold(8);
    pdf.text('Other Costs', MARGIN + 4, y + 6);
    normal(8);
    let lineY = y + 11;
    lines.forEach(line => {
      pdf.text(line, MARGIN + 4, lineY);
      lineY += 4.5;
    });
    y += boxH + 8;
  }

  // -------------------------------------------------------- labor callout

  if (tco.reallocation.isReallocated) {
    ensureSpace(22);
    setFill([253, 240, 242]);
    pdf.roundedRect(MARGIN, y, CONTENT_W, 17, 2, 2, 'F');
    setText(RED);
    bold(10);
    pdf.text(
      `${tco.reallocation.hoursPerYear} maintenance hours/year to be reallocated`,
      MARGIN + 4,
      y + 7,
    );
    setText(GRAY);
    normal(8);
    pdf.text(
      'Labor capacity freed by AIM Glide can be assigned to higher-value work.',
      MARGIN + 4,
      y + 13,
    );
    y += 17 + 10;
  }

  // ---------------------------------------------------- investment analysis

  sectionHeading('Investment Analysis', 26);

  const analysis: Array<[string, string]> = [
    ['One-time investment', formatCurrency(tco.investment)],
    ['Annual savings', formatSignedCurrency(tco.savings.yearly)],
    ['Payback period', formatPayback(tco)],
    [`${benefitYears}-year net benefit`, formatSignedCurrency(tco.savings.multiYear)],
  ];
  if (!tco.reallocation.isReallocated) {
    analysis.push([`${benefitYears}-year ROI`, tco.savings.roi + '%']);
  }

  analysis.forEach(([label, value]) => {
    ensureSpace(8);
    setText(INK);
    normal(9.5);
    pdf.text(label, MARGIN + 4, y);
    bold(9.5);
    pdf.text(value, RIGHT - 4, y, { align: 'right' });
    setDrawRGB(235, 235, 240);
    pdf.setLineWidth(0.2);
    pdf.line(MARGIN + 4, y + 2, RIGHT - 4, y + 2);
    y += 7;
  });
  y += 6;

  // -------------------------------------------------- inputs and assumptions
  //
  // Without these the document cannot be checked by anyone who wasn't in the
  // room when the numbers were entered.

  sectionHeading('Inputs & Assumptions', 28);

  const perYear = (unit: string) => PERIODS_PER_YEAR[unit] ?? 1;
  const assumptions: Array<[string, string]> = [
    [
      'Line output',
      `${inputs.outputValue.toLocaleString()} ${inputs.outputProduct} ${inputs.outputUnit}`,
    ],
    ['Value per ' + singularProduct(inputs.outputProduct), formatCurrency(inputs.productValue)],
    ['Maintenance labor rate', formatCurrency(inputs.laborRate) + '/hr'],
    [
      'Slat switch maintenance',
      `${inputs.maintenanceHours} hrs ${inputs.maintenanceTimeUnit} (${(inputs.maintenanceHours * perYear(inputs.maintenanceTimeUnit)).toLocaleString()} hrs/yr)`,
    ],
    ['AIM Glide maintenance', `${inputs.aimMaintenanceHours} hrs/yr`],
    ['AIM Glide investment', formatCurrency(inputs.aimGlideInvestment)],
    ['Benefit period', `${benefitYears} years`],
  ];

  // Two columns. In one column this block alone pushed the Notes onto a page of
  // their own, and a leave-behind with a near-empty final page reads as padding.
  const colW = CONTENT_W / 2;
  const assumptionRows = Math.ceil(assumptions.length / 2);
  ensureSpace(assumptionRows * 6 + 4);
  assumptions.forEach(([label, value], i) => {
    const col = Math.floor(i / assumptionRows);
    const rowY = y + (i % assumptionRows) * 6;
    const left = MARGIN + col * colW;
    setText(GRAY);
    normal(8.5);
    pdf.text(label, left + 4, rowY);
    setText(INK);
    pdf.text(value, left + colW - 4, rowY, { align: 'right' });
  });
  y += assumptionRows * 6 + 6;

  // ------------------------------------------------------------------ notes

  const activeNotes = inputs.notes.filter(n => n.trim() !== '');
  if (activeNotes.length > 0) {
    normal(9);
    const wrapped = activeNotes.map(
      note => pdf.splitTextToSize('• ' + note, CONTENT_W - 8) as string[],
    );

    sectionHeading('Notes', wrapped[0].length * 4.6);
    setText(INK);
    normal(9);

    const PAGE_CAPACITY = CONTENT_BOTTOM - CONTINUATION_TOP;
    wrapped.forEach(lines => {
      // Keep each note whole. A sentence split across a page break reads as a
      // printing fault in a document handed to a customer. A note too tall to
      // fit any page falls through to the per-line guard instead.
      const blockH = lines.length * 4.6;
      if (blockH <= PAGE_CAPACITY) ensureSpace(blockH);
      lines.forEach(line => {
        ensureSpace(6);
        pdf.text(line, MARGIN + 4, y);
        y += 4.6;
      });
      y += 2;
    });
  }

  // ---------------------------------------------------------- page furniture
  //
  // One pass over every page. Drawn inline, this only ever landed on whichever
  // page happened to be current when the drawing finished.

  const pageCount = (pdf as unknown as { internal: { getNumberOfPages(): number } }).internal.getNumberOfPages();
  for (let page = 1; page <= pageCount; page++) {
    pdf.setPage(page);
    setDrawRGB(230, 230, 236);
    pdf.setLineWidth(0.2);
    pdf.line(MARGIN, PAGE_H - 16, RIGHT, PAGE_H - 16);
    setText(GRAY);
    normal(8);
    pdf.text('Intralox AIM Glide ROI Calculator  |  Confidential', MARGIN, PAGE_H - 11);
    pdf.text(`Page ${page} of ${pageCount}`, RIGHT, PAGE_H - 11, { align: 'right' });
  }

  // ------------------------------------------------------------------- save

  const label = [inputs.customerName, inputs.projectName].filter(Boolean).join(' ');
  const slug = label
    .replace(/[^\w\s-]/g, '') // a customer name with "/" would otherwise break the filename
    .trim()
    .replace(/\s+/g, '_');
  const fileName = [
    'AIM_Glide_ROI',
    slug,
    new Date().toISOString().split('T')[0],
  ]
    .filter(Boolean)
    .join('_') + '.pdf';

  pdf.setProperties({
    title: `AIM Glide ROI Analysis${label ? ' - ' + label : ''}`,
    subject: 'Total cost of ownership comparison: traditional slat switch vs AIM Glide',
    author: inputs.preparedBy || 'Intralox',
    creator: 'Intralox Account Manager Hub',
  });

  return { pdf, fileName, logoRendered };
}

export function generatePDF(
  inputs: CalculatorInputs,
  tco: TCOResult,
  benefitYears: number,
): PdfExportResult {
  const { pdf, fileName, logoRendered } = buildPDF(inputs, tco, benefitYears);
  pdf.save(fileName);
  return { fileName, logoRendered };
}
