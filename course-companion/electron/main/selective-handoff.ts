export const selectiveTransferCapability = Object.freeze({
  available: false as const,
  reason:
    'Codex hiện chỉ nhận phần chuyển trong ngữ cảnh ẩn; nội dung đó không hiển thị trong task Codex mới.'
})

export function selectiveTransferUnavailable(): Error & { code: 'SELECTIVE_TRANSFER_UNAVAILABLE' } {
  return Object.assign(new Error(selectiveTransferCapability.reason), {
    code: 'SELECTIVE_TRANSFER_UNAVAILABLE' as const
  })
}
