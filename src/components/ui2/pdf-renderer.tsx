import React from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

interface PDFRendererProps {
  title: string;
  content: {
    sections: {
      title?: string;
      content: React.ReactNode;
    }[];
  };
  footer?: string;
  className?: string;
}

export function PDFRenderer({ title, content, footer, className = '' }: PDFRendererProps) {
  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Set fonts and initial styles
    doc.setFont('helvetica', 'bold');
    
    // Add logo/header
    doc.setFillColor(41, 128, 185); // Primary blue color
    doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');
    
    // Add title
    doc.setTextColor(255, 255, 255); // White text
    doc.setFontSize(24);
    doc.text(title, 20, 25);
    
    // Add date
    doc.setFontSize(10);
    doc.text(format(new Date(), 'MMMM d, yyyy'), 20, 35);

    let yPos = 60;

    // Add sections
    content.sections.forEach((section) => {
      // Check if we need a new page
      if (yPos > doc.internal.pageSize.height - 60) { // Increased margin for footer
        doc.addPage();
        yPos = 20;
      }

      if (section.title) {
        // Section title styling
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(41, 128, 185); // Primary blue
        doc.setFontSize(16);
        doc.text(section.title, 20, yPos);
        yPos += 10;
      }

      // Convert React nodes to text/tables for PDF
      if (typeof section.content === 'string') {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60); // Dark gray
        doc.setFontSize(12);
        const lines = doc.splitTextToSize(section.content, doc.internal.pageSize.width - 40);
        doc.text(lines, 20, yPos);
        yPos += lines.length * 7;
      } else if (React.isValidElement(section.content)) {
        // Handle table data
        if (section.content.type === PDFTable) {
          const { headers, data } = section.content.props;
          (doc as any).autoTable({
            head: [headers],
            body: data,
            startY: yPos,
            margin: { left: 20, right: 20, bottom: 40 }, // Increased bottom margin
            styles: {
              fontSize: 10,
              cellPadding: 8, // Increased padding
              lineColor: [220, 220, 220],
              lineWidth: 0.5,
              overflow: 'linebreak', // Handle text overflow
              cellWidth: 'wrap', // Allow cell content to wrap
              font: 'helvetica'
            },
            headStyles: {
              fillColor: [41, 128, 185],
              textColor: 255,
              fontStyle: 'bold',
              halign: 'left',
              valign: 'middle',
              fontSize: 10
            },
            bodyStyles: {
              textColor: 60,
              fontSize: 9,
              valign: 'middle',
              fontStyle: 'normal'
            },
            alternateRowStyles: {
              fillColor: [245, 247, 250]
            },
            columnStyles: {
              0: { cellWidth: 'auto', halign: 'left' }, // Description column
              1: { cellWidth: 45, halign: 'right' }, // Amount columns with fixed width
              2: { cellWidth: 45, halign: 'right' },
              3: { cellWidth: 45, halign: 'right' },
              4: { cellWidth: 35, halign: 'right' }
            },
            didDrawCell: function(data: any) {
              // Format amounts in body cells
              if (data.section === 'body' && data.column.index > 0) {
                // Skip percentage columns
                if (!data.cell.raw.toString().includes('%')) {
                  const value = data.cell.raw;
                  if (typeof value === 'number' || !isNaN(parseFloat(value))) {
                    const amount = Math.abs(parseFloat(value.toString())); // Convert to number and remove negative sign
                    data.cell.text = [amount.toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'PHP',
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })];
                  }
                }
              }
            },
            didParseCell: function(data: any) {
              // Parse currency values
              if (data.section === 'body' && data.column.index > 0) {
                const value = data.cell.raw;
                if (typeof value === 'string') {
                  // Remove currency symbols and commas
                  const numericValue = value.replace(/[₱,]/g, '');
                  if (!isNaN(parseFloat(numericValue))) {
                    data.cell.raw = parseFloat(numericValue);
                  }
                }
              }
            },
            willDrawCell: function(data: any) {
              // Ensure minimum row height
              if (data.row.height < 12) {
                data.row.height = 12;
              }
            },
            drawCell: function(data: any) {
              // Add extra padding for amount cells
              if (data.column.index > 0 && data.section === 'body') {
                const padding = 2;
                data.cell.padding('horizontal', padding);
              }
            }
          });
          yPos = (doc as any).lastAutoTable.finalY + 15;
        }
      }
    });

    // Build footer text
    let footerText = `Generated by StewardTrack.com | ${format(new Date(), 'MMMM d, yyyy h:mm a')}`;
    if (footer) {
      footerText = `${footer}\n${footerText}`;
    }

    // Add footer background
    doc.setFillColor(245, 247, 250);
    doc.rect(0, doc.internal.pageSize.height - 25, doc.internal.pageSize.width, 25, 'F');
    
    // Add footer text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const footerLines = doc.splitTextToSize(footerText, doc.internal.pageSize.width - 60);
    doc.text(footerLines, 20, doc.internal.pageSize.height - 15);

    // Add page numbers
    const pageCount = doc.internal.getNumberOfPages();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width - 30,
        doc.internal.pageSize.height - 15
      );
    }

    return doc;
  };

  const handleDownload = () => {
    const doc = generatePDF();
    doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const handlePreview = () => {
    const doc = generatePDF();
    const pdfDataUri = doc.output('datauristring');
    window.open(pdfDataUri);
  };

  return (
    <div className={`flex flex-col space-y-4 ${className}`}>
      <div className="flex justify-end space-x-4">
        <button
          onClick={handlePreview}
          className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-colors duration-200 shadow-sm"
        >
          Preview PDF
        </button>
        <button
          onClick={handleDownload}
          className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-colors duration-200 shadow-sm"
        >
          Download PDF
        </button>
      </div>
      <div className="flex-1 bg-muted/10 rounded-lg p-4">
        <div className="bg-card rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-6 -mx-8 -mt-8 rounded-t-lg mb-8">
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="text-primary-foreground/80 mt-2">
              Generated on {format(new Date(), 'MMMM d, yyyy')}
            </p>
          </div>

          {/* Content */}
          {content.sections.map((section, index) => (
            <div key={index} className="mb-8 last:mb-0">
              {section.title && (
                <h2 className="text-xl font-semibold text-primary mb-4 pb-2 border-b">
                  {section.title}
                </h2>
              )}
              <div className="prose max-w-none dark:prose-invert">
                {section.content}
              </div>
            </div>
          ))}

          {/* Footer */}
          {footer && (
            <div className="mt-8 pt-4 border-t text-sm text-muted-foreground">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface PDFTextProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const PDFText = ({ children, style = {} }: PDFTextProps) => (
  <p className="text-foreground leading-relaxed mb-4" style={style}>
    {children}
  </p>
);

interface PDFTableProps {
  headers: string[];
  data: any[][];
  widths?: number[];
}

export const PDFTable = ({ headers, data, widths = [] }: PDFTableProps) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-border">
      <thead className="bg-muted/50">
        <tr>
          {headers.map((header, i) => (
            <th
              key={i}
              className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              style={widths[i] ? { width: `${widths[i]}%` } : {}}
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-card divide-y divide-border">
        {data.map((row, i) => (
          <tr key={i} className={i % 2 === 0 ? 'bg-muted/5' : ''}>
            {row.map((cell, j) => (
              <td
                key={j}
                className={`px-6 py-4 text-sm ${
                  j === 0 ? 'text-foreground font-medium' : 'text-muted-foreground text-right'
                }`}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);