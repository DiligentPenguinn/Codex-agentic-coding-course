# ContentPilot

ContentPilot là ứng dụng cục bộ mà bạn sẽ xây xuyên suốt khóa học. Bản khởi đầu
này chỉ cung cấp nền tảng an toàn và có thể chạy được. Các tính năng thương
hiệu, nghiên cứu, ý tưởng, bản thảo, hình ảnh và phê duyệt sẽ được chính bạn xây
trong từng module.

## Yêu cầu

- Node.js 20.19 trở lên
- npm 10.9 trở lên

## Cài đặt

```bash
npm install
cp .env.example .env.local
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000). API key chưa cần thiết để
chạy bản khởi đầu.

## Biến môi trường

```text
OPENAI_API_KEY=
```

Giữ key trong `.env.local`. Không đưa key vào client, log, ảnh chụp màn hình
hoặc Git.

## Lệnh kiểm tra

| Lệnh | Mục đích |
|---|---|
| `npm run dev` | Chạy ứng dụng cục bộ |
| `npm run lint` | Kiểm tra quy tắc mã nguồn |
| `npm run typecheck` | Kiểm tra TypeScript |
| `npm test` | Chạy bộ kiểm thử |
| `npm run build` | Kiểm tra bản build production |
| `npm run check` | Chạy lint, typecheck, test và build |

## Trạng thái ban đầu

- `/` có một hành động chính để bắt đầu thiết lập.
- `/setup`, `/workflow` và `/review` là các trạng thái trống trung thực.
- `/api/health` trả về trạng thái sẵn sàng không chứa thông tin nhạy cảm.
- `server/storage/` giới hạn đường dẫn trong `data/` và ghi JSON nguyên tử.
- `samples/sample-brand.json` là dữ liệu tham khảo, không được tự động nạp thành
  kết quả thật.

Không có nghiên cứu, ý tưởng, bản thảo, hình ảnh hoặc trạng thái tiến độ giả
trong bản khởi đầu này.
