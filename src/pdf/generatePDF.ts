import { pdf } from '@react-pdf/renderer'
import { AssessmentPDF } from './AssessmentPDF'
import type { StoredAssessment } from '../lib/db'
import { createElement } from 'react'

export async function downloadAssessmentPDF(assessment: StoredAssessment): Promise<void> {
  // AssessmentPDF renders a <Document> at its root — pdf() accepts the Document element directly.
  const element = createElement(AssessmentPDF, { assessment })
  // @ts-expect-error — pdf() accepts a ReactElement whose root is a Document
  const blob = await pdf(element).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const company = (assessment.data?.companyName as string | undefined) ?? 'assessment'
  const date = new Date(assessment.createdAt).toISOString().slice(0, 10)
  a.download = `spiral-eval-${company.replace(/\s+/g, '-').toLowerCase()}-${date}.pdf`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
