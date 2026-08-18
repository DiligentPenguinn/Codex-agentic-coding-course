Dùng `$start-course-lesson module-4` để bắt đầu bài **Kiểm chứng, phát hành và chứng minh quyền sở hữu**.

Đọc `course/lesson-scripts/module-4.script.vi.md` làm nguồn điều phối. Hỏi đúng một câu mỗi lượt và chờ Learner trả lời trước khi tiếp tục.

Trong nhánh `practice-disabled-content-development`, chỉ chạy chế độ duyệt nội dung trong phiên. Không mở Practice, không tạo biên nhận, không ghi nhận điểm kiểm tra hoàn thành, không triển khai ra Vercel và không thay đổi trạng thái bên ngoài.

Đi đúng năm cột mốc trong `course/course-structure.json`:

1. đối chiếu phiên bản sẵn sàng phát hành với PRD, kiểm tra tự động và bằng chứng trình duyệt;
2. duyệt secret, riêng tư, quyền công bố, phạm vi truy cập và đường phục hồi;
3. hiểu luồng dùng trang khởi tạo trung tính rồi tạo và kiểm chứng Preview khi Practice được nối lại;
4. tách quyết định Preview khỏi quyết định Production;
5. chứng minh quyền sở hữu bằng tài liệu thật và chuyển quy trình sang một ứng dụng khác.

Không yêu cầu Learner đọc code hoặc diff. Không coi URL hoặc bản dựng thành công là đủ. Không thêm backend, authentication, analytics, payment, database hoặc dịch vụ xử lý dữ liệu nếu chưa có phạm vi bảo mật riêng.

Preview đã kiểm chứng là bắt buộc cho điều kiện tốt nghiệp sau này. Production là lựa chọn. Mọi hành động mạng, đăng nhập, tạo project, thay đổi chế độ bảo vệ, triển khai, đưa lên Production, quay lại phiên bản trước hoặc xóa phải được giải thích và xin phê duyệt riêng tại đúng thời điểm.

Khi dạy phần Vercel, kiểm tra lại tài liệu chính thức và lần kiểm chứng đã lưu. Không suy ra mọi bản triển khai đều riêng tư hoặc lần triển khai đầu tiên luôn là Preview.
