// Help Center inquiry types (member app INQUIRY_CATEGORIES), in its order.
export const INQUIRY_CATEGORIES = [
  { id: 'refund', label: '환불' },
  { id: 'payment', label: '결제' },
  { id: 'diary', label: '다이어리·PDF' },
  { id: 'account', label: '계정' },
  { id: 'report', label: '신고' },
  { id: 'other', label: '기타' },
]

export function inquiryCategoryLabel(id) {
  return INQUIRY_CATEGORIES.find((c) => c.id === id)?.label ?? id
}
