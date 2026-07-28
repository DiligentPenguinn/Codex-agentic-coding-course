# Module 1 — Thiết lập dự án và làm việc an toàn với Codex

## Kết quả

Sau 70 phút, Learner có thể:

- chạy và inspect starter ContentPilot,
- phân biệt hướng dẫn bền vững với yêu cầu chỉ dùng một lần,
- viết một task brief có phạm vi và tiêu chí hoàn thành,
- duyệt plan trước khi Codex sửa file,
- xem diff, chạy kiểm tra và xác nhận UI bằng mắt, và
- giải thích vì sao thay đổi an toàn để chấp nhận.

## Sản phẩm thực hành

Ứng dụng nằm trong `contentpilot/`. Baseline là hạ tầng chạy được nhưng chưa có
workflow tạo nội dung. Module này không thêm AI, research, draft, đăng bài hoặc
hệ thống bên ngoài.

## Build lab

Cải thiện hành động chính trên welcome screen cho màn hình hẹp:

- phạm vi cho phép: `contentpilot/app/page.tsx` và
  `contentpilot/app/globals.css`,
- ở viewport rộng tối đa 640px, hành động chính phải chiếm toàn bộ chiều rộng
  cột nội dung, có tap target cao ít nhất 54px, và giữ mũi tên ở mép phải,
- ở desktop, hành động vẫn có chiều rộng theo nội dung như baseline,
- không có horizontal overflow,
- không đổi route đích `/setup`,
- không sửa file ngoài phạm vi.

Baseline phải pass trước khi Learner phê duyệt edit. Sau edit, `npm run check`
phải pass và Learner phải xem diff cùng kết quả desktop/mobile.

## Artifact

Sao chép `artifacts/module-1-evidence.template.md` thành
`artifacts/module-1-evidence.md`. Artifact phải ghi lệnh, task brief, file thay
đổi, kết quả kiểm tra, quan sát UI, quyết định chấp nhận và rủi ro còn lại.

## Mastery gate

Module hoàn thành khi:

- app chạy bằng lệnh được ghi trong README,
- `npm run check` pass,
- UI thỏa task brief ở desktop và mobile,
- diff chỉ chứa file đã được phê duyệt,
- `contentpilot/AGENTS.md` có lựa chọn dự án riêng của Learner,
- Learner phân loại đúng hành động read-only, edit, network/install,
  destructive và external publish, và
- Learner giải thích được vì sao bằng chứng đủ để chấp nhận thay đổi.

