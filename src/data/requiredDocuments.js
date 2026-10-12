export const REQUIRED_DOCUMENTS_BY_COUNTERPARTY = {
  Client: [
    'SPPH (Surat Permintaan Penawaran Harga)',
    'SPH (Surat Penawaran Harga)',
    'BAKN (Berita Acara Klarifikasi dan Negosiasi)',
    'KAK (Kerangka Acuan Kerja)',
  ],
  Vendor: [
    'FPBJ (Formulir Permintaan Barang/Jasa)',
    'KAK (Kerangka Acuan Kerja)',
    'HPS (Surat Perkiraan Harga)',
    'SPPH (Surat Permintaan Penawaran Harga)',
    'SPH (Surat Penawaran Harga)',
    'BAKN (Berita Acara Klarifikasi dan Negosiasi)',
  ],
  // Mengikuti baseline dokumen kontrak dengan Client sampai ada SOP khusus Konsorsium.
  Konsorsium: [
    'SPPH (Surat Permintaan Penawaran Harga)',
    'SPH (Surat Penawaran Harga)',
    'BAKN (Berita Acara Klarifikasi dan Negosiasi)',
    'KAK (Kerangka Acuan Kerja)',
  ],
}

export function createRequiredDocumentChecklist(counterpartyKind, defaults = {}) {
  const documents = REQUIRED_DOCUMENTS_BY_COUNTERPARTY[counterpartyKind] || []

  return documents.map((label, index) => ({
    id: index + 1,
    label,
    required: true,
    ...defaults,
  }))
}
