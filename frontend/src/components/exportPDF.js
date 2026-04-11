import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function exportPDF(result) {
  const doc = new jsPDF()
  const pageW = doc.internal.pageSize.width

  // Header — ScailzeX NOT italic
  doc.setFillColor(20, 20, 20)
  doc.rect(0, 0, pageW, 44, 'F')
  doc.setTextColor(245, 240, 232)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('ScailzeX', 14, 18)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(45, 212, 191)
  doc.text('INTELLIGENT CODE ANALYSIS', 14, 28)
  doc.setTextColor(107, 101, 88)
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageW - 14, 28, { align: 'right' })
  if (result.filename) {
    doc.text(`File: ${result.filename}`, pageW - 14, 36, { align: 'right' })
  }

  // Score
  doc.setTextColor(20, 20, 20)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Quality Score', 14, 56)
  const scoreColor = result.score >= 80 ? [74,222,128] : result.score >= 60 ? [45,212,191] : result.score >= 40 ? [251,146,60] : [248,113,113]
  doc.setFontSize(30)
  doc.setTextColor(...scoreColor)
  doc.text(`${result.score}/100`, 14, 70)
  doc.setFontSize(11)
  doc.setTextColor(80, 80, 80)
  doc.setFont('helvetica', 'italic')
  const summaryLines = doc.splitTextToSize(result.summary, pageW - 80)
  doc.text(summaryLines, 14, 80)

  // Category scores
  let y = 96
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(40, 40, 40)
  doc.text('CATEGORY BREAKDOWN', 14, y)
  y += 6
  Object.entries(result.category_scores || {}).forEach(([cat, val]) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(80, 80, 80)
    doc.text(cat.charAt(0).toUpperCase() + cat.slice(1), 14, y + 4)
    doc.setFillColor(230, 230, 230)
    doc.rect(55, y, 80, 4, 'F')
    const barColor = val >= 80 ? [74,222,128] : val >= 60 ? [45,212,191] : val >= 40 ? [251,146,60] : [248,113,113]
    doc.setFillColor(...barColor)
    doc.rect(55, y, (val / 100) * 80, 4, 'F')
    doc.setTextColor(...barColor)
    doc.text(`${val}`, 140, y + 4)
    y += 10
  })

  y += 6

  // Reviewed code
  if (result.code) {
    if (y > 220) { doc.addPage(); y = 20 }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(20, 20, 20)
    doc.text('Reviewed Code', 14, y)
    y += 6
    doc.setFillColor(20, 20, 20)
    const codeLines = doc.splitTextToSize(result.code, pageW - 34)
    const blockH = Math.min(codeLines.length * 5 + 16, 90)
    doc.rect(14, y, pageW - 28, blockH, 'F')
    doc.setFont('courier', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(200, 200, 200)
    codeLines.slice(0, 16).forEach((line, i) => doc.text(line, 18, y + 8 + i * 5))
    if (codeLines.length > 16) {
      doc.setTextColor(120, 120, 120)
      doc.text(`... ${codeLines.length - 16} more lines`, 18, y + 8 + 16 * 5)
    }
    y += blockH + 10
  }

  // Issues table
  if (result.issues?.length > 0) {
    if (y > 220) { doc.addPage(); y = 20 }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(20, 20, 20)
    doc.text(`Issues Found (${result.issues.length})`, 14, y)
    y += 6

    autoTable(doc, {
      startY: y,
      head: [['Severity', 'Type', 'Line', 'Title', 'Description']],
      body: result.issues.map(i => [
        i.severity.toUpperCase(),
        i.type,
        i.line || '—',
        i.title,
        i.description.substring(0, 80) + (i.description.length > 80 ? '...' : ''),
      ]),
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [20, 20, 20], textColor: [45, 212, 191] },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      columnStyles: {
        0: { cellWidth: 18 }, 1: { cellWidth: 16 },
        2: { cellWidth: 10 }, 3: { cellWidth: 44 }, 4: { cellWidth: 'auto' },
      },
    })
  }

  // Before/After fixes page
  doc.addPage()
  let sy = 20
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(20, 20, 20)
  doc.text('Issue by Issue Fix Guide', 14, sy)
  sy += 12

  result.issues?.forEach((issue, idx) => {
    if (sy > 240) { doc.addPage(); sy = 20 }

    // Issue title
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(20, 20, 20)
    doc.text(`${idx + 1}. ${issue.title}`, 14, sy)
    sy += 6

    // Description
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(80, 80, 80)
    const descLines = doc.splitTextToSize(issue.description, pageW - 28)
    doc.text(descLines, 14, sy)
    sy += descLines.length * 4.5 + 4

    // Before
    if (issue.before) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(248, 113, 113)
      doc.text('BEFORE:', 14, sy)
      sy += 5
      doc.setFillColor(40, 20, 20)
      const beforeLines = doc.splitTextToSize(issue.before, pageW - 34)
      const bh = beforeLines.length * 4.5 + 8
      doc.rect(14, sy - 3, pageW - 28, bh, 'F')
      doc.setFont('courier', 'normal')
      doc.setTextColor(200, 150, 150)
      beforeLines.forEach((line, i) => doc.text(line, 18, sy + i * 4.5))
      sy += bh + 3
    }

    // After
    if (issue.after) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(74, 222, 128)
      doc.text('AFTER:', 14, sy)
      sy += 5
      doc.setFillColor(20, 40, 20)
      const afterLines = doc.splitTextToSize(issue.after, pageW - 34)
      const ah = afterLines.length * 4.5 + 8
      doc.rect(14, sy - 3, pageW - 28, ah, 'F')
      doc.setFont('courier', 'normal')
      doc.setTextColor(150, 200, 150)
      afterLines.forEach((line, i) => doc.text(line, 18, sy + i * 4.5))
      sy += ah + 8
    } else {
      // Fallback suggestion
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(8)
      doc.setTextColor(45, 212, 191)
      const fixLines = doc.splitTextToSize(issue.suggestion, pageW - 28)
      doc.text(fixLines, 14, sy)
      sy += fixLines.length * 4.5 + 8
    }
  })

  // Footer on all pages — no name
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `ScailzeX · Intelligent Code Analysis · Page ${i}/${pageCount}`,
      pageW / 2, 290, { align: 'center' }
    )
  }

  doc.save(`scailzex-review-${Date.now()}.pdf`)
}
