import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'

export async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  try {
    if (mimeType === 'application/pdf') {
      const data = await pdfParse(buffer)
      return data.text.trim().slice(0, 8000)
    }

    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimeType === 'application/msword') {
      const result = await mammoth.extractRawText({ buffer })
      return result.value.trim().slice(0, 8000)
    }

    if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        mimeType === 'application/vnd.ms-excel') {
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const text = workbook.SheetNames.map(name => {
        const sheet = workbook.Sheets[name]
        return `[Sheet: ${name}]\n${XLSX.utils.sheet_to_csv(sheet)}`
      }).join('\n\n')
      return text.trim().slice(0, 8000)
    }

    return ''
  } catch {
    return ''
  }
}
