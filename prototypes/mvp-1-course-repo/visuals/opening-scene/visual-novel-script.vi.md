# Visual Novel Script - Ca trực trước ngày ra mắt

Trạng thái: bản nháp để polish.

Mục tiêu của prologue: đặt learner vào một tình huống marketing thực tế, giới thiệu Hương như Teacher, Codex như cộng sự kỹ thuật trong repo, và dẫn tự nhiên sang Module 0: đọc repo trước khi sửa.

## Ghi chú polish đã tích hợp

- Giảm lặp phần giới thiệu năng lực của Codex: Scene 05 nói năng lực tổng quát, Scene 06 chỉ nói riêng chế độ inspect chỉ đọc.
- Cắt các đoạn Hương liệt kê dài thành nhiều nhịp thoại ngắn hơn.
- Cho Bạn chen vào ở Scene 07 để vai của Teacher, Executor và learner được giới thiệu tự nhiên hơn.
- Đổi nhãn cuối thành "Tín hiệu cho thấy hôm nay tôi đang học đúng hướng" để rõ và mềm hơn.

## Dàn nhân vật chính

### Bạn

Nhân vật chính, do người học nhập vai. Bạn đang giữ vai trò điều phối nội dung cho một team marketing nhỏ. Áp lực không đến từ việc thiếu ý tưởng, mà từ một workflow rời rạc: file nằm rải rác, phản hồi không có chỗ neo, brand voice phải hỏi lại mỗi lần viết. Bạn cần học cách giao việc cho Codex để biến sự rối đó thành một hệ thống có thể lặp lại.

### Hương

Teacher. Mentor về quy trình AI cho team marketing. Hương không "bán phép màu AI"; Hương giúp learner nhìn ra workflow đang gãy ở đâu, rồi học cách giao việc cho Codex.

### Codex

Cộng sự kỹ thuật trong repo. Có thể đọc file, đề xuất kế hoạch, sửa code, chạy kiểm tra và báo bằng chứng khi nhiệm vụ đủ rõ.

## Scene 01 - Phòng họp sáng thứ Hai

**Background picture:** Phòng họp marketing, màn hình lớn chiếu campaign của đối thủ, laptop và ly cà phê trên bàn. Không khí hơi căng nhưng thực tế.

**On screen:** Bạn

**Narration:**

Màn hình phòng họp đang chiếu campaign mới của một đối thủ.

Bạn không bất ngờ vì hình ảnh của họ đẹp. Team nào cũng có lúc làm được một campaign đẹp.

Điều khiến bạn im lặng là nhịp độ.

Hai tuần. Một landing page mới. Mười mấy bài social. Ba chuỗi email. FAQ, caption, headline, short video script. Tất cả dùng cùng một giọng. Claim không văng khỏi guideline. Lịch đăng nhìn rõ ai viết, ai duyệt, ai sửa.

**Bạn:**

"Không phải họ chỉ làm nhanh hơn. Họ có vẻ đang làm theo một hệ thống."

## Scene 02 - Folder campaign rối

**Background picture:** Màn hình laptop cận cảnh: nhiều file "final", bảng lịch đăng thiếu người duyệt, khung chat feedback, Notion brand guideline mở bên cạnh.

**On screen:** Bạn

**Narration:**

Bạn nhìn lại folder campaign của team mình.

Ba file có chữ "final". Một bảng lịch đăng thiếu người duyệt. Feedback nằm rải rác trong chat. Brand guideline thì có, nhưng mỗi lần viết vẫn phải hỏi lại: "Câu này có được nói không?"

Không ai thiếu ý tưởng.

Nhưng mỗi lần cần tạo nội dung mới, team lại phải tự ráp ngữ cảnh từ đầu.

**Bạn:**

"Càng gần deadline thì mọi thứ càng rối."

## Scene 03 - Hương đặt câu hỏi

**Background picture:** Một góc phòng họp yên hơn. Hương ngồi đối diện bạn, không mở slide, chỉ có notebook và laptop.

**On screen:** Bạn, Hương

**Hương:**

"Chị không nghĩ vấn đề của team em là thiếu ý tưởng."

**Bạn:**

"Vậy là thiếu người? Hay thiếu công cụ?"

**Hương:**

"Có thể chưa phải. Chị muốn hỏi câu khác trước."

**Hương:**

"Workflow này đang gãy ở đâu?"

**Narration:**

Bạn nhìn lại màn hình. File rời. Feedback rời. Lịch đăng rời. Quy tắc thương hiệu rời.

Lần đầu tiên, vấn đề có tên rõ hơn.

## Scene 04 - Hương mở ContentPilot Lite

**Background picture:** Laptop của Hương mở repo ContentPilot Lite. Trên màn hình thấy các khu vực Brand Brain, Idea Lab, Draft Studio, Calendar Board.

**On screen:** Bạn, Hương

**Hương:**

"Chị muốn cho em thử một cách khác."

**Narration:**

Hương mở một repo nhỏ tên ContentPilot Lite.

**Hương:**

"Đây chưa phải sản phẩm hoàn chỉnh."

**Hương:**

"Nó chỉ là một bản nháp - nhưng có đủ những mảnh team em đang thiếu."

**Hương:**

"Nơi lưu brand voice. Nơi gom ý tưởng. Nơi viết bản nháp. Nơi nhìn lịch đăng - tất cả trên một màn hình."

**Bạn:**

"Nhưng em đâu phải kỹ sư."

**Hương:**

"Không cần. Điều em cần học trước không phải là code."

**Hương:**

"Điều em cần học là cách giao việc cho một cộng sự kỹ thuật."

## Scene 05 - Codex xuất hiện

**Background picture:** Màn hình chia đôi: bên trái là repo ContentPilot Lite, bên phải là cửa sổ Codex/terminal sạch, đang chờ lệnh.

**On screen:** Bạn, Hương, Codex

**Hương:**

"Đây là Codex."

**Codex:**

"Xin chào. Tôi đọc file, đề xuất kế hoạch, sửa code, chạy kiểm tra - và luôn báo lại bằng chứng cho việc mình vừa làm."

**Hương:**

"Nhưng Codex không tự biết team em muốn gì, nếu em không giao việc rõ."

**Narration:**

Folder campaign vẫn rối. Nhưng trên màn hình, lần đầu tiên có một nơi đủ nhỏ để thử.

**Bạn:**

"Vậy nếu mình dùng Codex để từng bước biến ContentPilot Lite thành xưởng làm việc cho team thì sao?"

**Hương:**

"Đó là một mục tiêu tốt. Nhưng mình sẽ bắt đầu chậm hơn em nghĩ."

## Scene 06 - Luật đầu tiên

**Background picture:** Repo ContentPilot Lite được làm nổi bật. Một lớp overlay hiển thị dòng "Đọc trước khi sửa".

**On screen:** Bạn, Hương, Codex

**Bạn:**

"Không xây tính năng ngay?"

**Hương:**

"Chưa."

**Hương:**

"Bước đầu tiên là yêu cầu Codex đọc repo trước khi sửa bất kỳ thứ gì."

**Codex:**

"Ở bước này, tôi chỉ inspect - không sửa gì cả. Tôi sẽ tóm tắt cấu trúc repo, chỉ ra file quan trọng, rủi ro, và đề xuất bước tiếp theo."

**Hương:**

"Đó là bài học đầu tiên. Trước khi giao Codex việc lớn, em học cách giao một việc nhỏ, rõ, và an toàn."

## Scene 07 - Vai của bạn

**Background picture:** Góc nhìn từ phía sau nhân vật chính nhìn vào laptop. Trên màn hình có ba nhãn: Hương, Codex, Bạn.

**On screen:** Bạn, Hương

**Hương:**

"Trong khóa học này, chị là Teacher. Chị giúp em hiểu tình huống, đặt câu hỏi đúng, và luyện cách ra quyết định."

**Bạn:**

"Còn Codex?"

**Hương:**

"Codex là Executor - khi cần thao tác thật trong repo."

**Bạn:**

"Vậy em là gì? Người ngồi giữa?"

**Hương:**

"Còn em là người giữ mục tiêu. Em duyệt rủi ro. Em quyết định điều gì đủ tốt để đưa vào workflow thật."

**Narration:**

Bạn không cần trở thành kỹ sư.

Nhưng bạn cần học cách dẫn một cộng sự kỹ thuật làm đúng việc.

## Scene 08 - My Workflow Brief

**Background picture:** Một form ngắn trên màn hình laptop, nền vẫn là phòng họp nhưng ánh sáng dịu hơn. Cảm giác vấn đề đã có điểm bắt đầu.

**On screen:** Bạn, Hương

**Hương:**

"Trước khi vào Module 0, em cần viết một brief ngắn cho chính mình."

**Bạn:**

"Brief gì?"

**Hương:**

"Một workflow brief. Nó nhắc em rằng mình học Codex vì một việc thật, không phải vì tò mò công cụ."

**Hương:**

"Đừng viết cho đẹp. Viết để tự nhắc mình sau này."

**On-screen form:**

```text
Vai của tôi trong team:
Workflow nội dung đang rối nhất hiện nay:
Tôi muốn dùng Codex để cải thiện:
Tôi sẽ giữ quyền quyết định bằng cách:
Tín hiệu cho thấy hôm nay tôi đang học đúng hướng:
```

**Narration:**

Bạn nhìn lại folder campaign.

Vấn đề chưa biến mất.

Nhưng bây giờ, nó có bước đầu tiên.
