# Module 3 — Bản thiết kế nội dung đang soạn

- **Trạng thái:** Đang lên kế hoạch nội dung
- **Phạm vi:** Nội dung Module 3 dành cho người học
- **Triển khai vào Course Companion:** Chưa bắt đầu theo bản thiết kế này
- **Mức duyệt:** Một số định hướng và câu chữ đã được chủ sở hữu thống nhất; các trang còn lại vẫn phải được bàn lần lượt
- **Nhánh làm việc:** `practice-disabled-content-development`

Tài liệu này lưu lại những nội dung đã bàn để có thể tiếp tục trong một task khác mà không phụ thuộc vào lịch sử hội thoại. Đây chưa phải kịch bản hoàn chỉnh của Module 3 và không thay thế cổng nghiệm thu trong kế hoạch triển khai toàn khóa học.

## 1. Mục đích của Module 3

Module 3 giúp người học chuyển từ một implementation plan đã được duyệt sang một sản phẩm hoạt động được. Người học không giao toàn bộ sản phẩm cho agent trong một prompt lớn. Thay vào đó, họ cùng agent thực hiện từng giai đoạn nhỏ của plan.

Cuối mỗi giai đoạn, agent chạy các kiểm tra phù hợp và trình bày kết quả bằng ngôn ngữ dễ hiểu. Người học xem hành vi thực tế của sản phẩm, đối chiếu với plan rồi mới quyết định có chuyển sang giai đoạn tiếp theo hay không.

Cách làm này có thể lâu hơn việc yêu cầu agent tạo toàn bộ sản phẩm trong một lần. Đổi lại, người học dễ phát hiện khi sản phẩm đi sai hướng, giữ lại những phần đã làm đúng và có nhiều quyền kiểm soát hơn đối với kết quả cuối cùng.

Module này cũng dạy người học cách xử lý lỗi cùng agent và dùng Git như một lớp bảo vệ trong quá trình xây dựng. Portfolio chỉ là sản phẩm thực hành; kỹ năng có thể chuyển sang dự án khác là biết giao việc theo từng phần, kiểm tra kết quả, điều tra lỗi và quay lại một phiên bản ổn định khi cần.

## 2. Nguyên tắc thiết kế đã thống nhất

1. Giới thiệu một khái niệm quan trọng tại một thời điểm; không cần vội.
2. Không giả định người học biết lập trình, terminal, Git, GitHub, repository hoặc checkpoint.
3. Người học đánh giá kết quả qua hành vi quan sát được, ảnh chụp màn hình và phần giải thích dễ hiểu. Không bắt họ đọc code hoặc diff.
4. Khi thực hiện plan, chia sản phẩm thành nhiều giai đoạn nhỏ. Chỉ chuyển sang giai đoạn sau khi giai đoạn hiện tại đã được kiểm tra.
5. Agent thực hiện thao tác kỹ thuật. Người học cần hiểu mục đích và hệ quả để có thể quyết định bước tiếp theo, nhưng không phải ghi nhớ câu lệnh.
6. Tất cả câu hỏi dành cho người học được đặt ở cuối bài, không chen câu hỏi sau từng trang giải thích.
7. Nội dung được bàn và duyệt hết trước khi chỉnh sửa các trang Module 3 trong Course Companion.

## 3. Cấu trúc nội dung hiện tại

Module 3 được chia thành ba phần lớn:

1. **Thực hiện implementation plan theo từng giai đoạn.**
2. **Debug cùng agent khi sản phẩm gặp lỗi.**
3. **Dùng Git và GitHub để lưu phiên bản, khôi phục và thử nghiệm an toàn.**

Thứ tự chi tiết giữa ba phần sẽ được chốt sau khi từng trang đã được duyệt. Các câu hỏi tổng kết sẽ được thiết kế sau cùng.

## 4. Thực hiện implementation plan theo từng giai đoạn

### Ý chính đã thống nhất

- Chọn một phần nhỏ trong implementation plan.
- Trước khi làm, xác nhận phạm vi của phần đó và những gì chưa được làm.
- Agent chỉ thực hiện phần đã thống nhất.
- Cuối giai đoạn, agent chạy kiểm tra kỹ thuật và cho người học xem kết quả thực tế.
- Người học đối chiếu kết quả với plan.
- Chỉ khi kết quả đạt yêu cầu mới lưu một phiên bản ổn định và chuyển sang giai đoạn tiếp theo.

### Ví dụ sẽ sử dụng

Không dùng một ví dụ tự nghĩ ra về phần Hero của portfolio. Sử dụng một phần trong implementation plan công khai của dự án CrawlSEO làm ví dụ thực tế:

- Nguồn: [CrawlSEO Phase 1 Implementation Plan](https://github.com/crawlseo/crawlseo/blob/main/PLAN.md)
- Phần minh họa dự kiến: `T1.1 — Initialize Next.js Project`

Nội dung bài học sẽ chỉ ra một task cụ thể trong plan, cách giới hạn phạm vi của task đó và cách kiểm tra kết quả trước khi tiếp tục. Cần phân biệt rõ đâu là nội dung từ nguồn bên ngoài và đâu là cách diễn giải phục vụ bài học.

## 5. Debug cùng agent

### Quy trình dành cho người mới

1. Nếu nhìn thấy lỗi trên màn hình, người học chụp lại màn hình và gửi cho agent để agent điều tra, giải thích rồi sửa.
2. Nếu vẫn chưa tìm được lỗi, yêu cầu agent thêm log và quan sát thông tin xuất hiện trong terminal.
3. Nếu lỗi tiếp tục quay lại sau nhiều lần sửa, yêu cầu agent tạm dừng và liệt kê các nguyên nhân có thể xảy ra.

Quy trình này phải được trình bày như một cách làm thực tế, dễ nhớ. Không biến phần mở đầu thành một quy trình điều tra kỹ thuật phức tạp.

### Câu chữ đã thống nhất

#### Yêu cầu AI liệt kê các nguyên nhân có thể xảy ra

Nếu lỗi vẫn quay lại sau nhiều lần sửa, hãy yêu cầu AI tạm dừng và liệt kê những nguyên nhân có thể khiến lỗi xảy ra. Cách này giúp quá trình điều tra có hệ thống hơn và thường tìm ra nguyên nhân gốc, thay vì chỉ vá những biểu hiện trước mắt.

### Điều người học cần hiểu

Agent có thể thực hiện phần lớn việc debug, nhưng người học vẫn cần biết lỗi nhìn thấy là gì, agent đã dựa vào thông tin nào và kết quả sau khi sửa có thực sự giải quyết lỗi hay không.

## 6. Git và GitHub

Git và GitHub sẽ có một cụm trang riêng. Nội dung không bị nhét vào một trang dài.

### Thứ tự trang đã thống nhất

| Trang | Chủ đề | Trạng thái nội dung |
| --- | --- | --- |
| 1 | Vì sao cần Git? | Đã thống nhất định hướng và câu giải thích về “phân tán” |
| 2 | Git khác GitHub như thế nào? | Đã thống nhất định hướng và cách giải thích đơn giản |
| 3 | Commit: lưu một phiên bản của dự án | Bản nháp, đang chờ bàn tiếp |
| 4 | Clone, push và pull | Chưa thiết kế |
| 5 | Branch: thử nghiệm mà không ảnh hưởng phiên bản ổn định | Chưa thiết kế |

Commit phải được giới thiệu trước clone, push và pull.

### Trang 1 — Vì sao cần Git?

Mục đích của trang này là giới thiệu Git như một công cụ giúp người học lưu lịch sử và có đường quay lại khi công việc sau đó gây lỗi. Đây chưa phải bài học về câu lệnh hoặc cộng tác nhóm.

Git là một hệ thống quản lý phiên bản phân tán. Hệ thống quản lý phiên bản giúp ghi lại những thay đổi của dự án theo thời gian và cho phép quay lại một phiên bản trước đó khi cần.

Đoạn giải thích đã được duyệt nguyên văn:

> “Phân tán” có nghĩa là repository trên máy tính của bạn không chỉ giữ phiên bản mới nhất, mà còn có lịch sử của dự án. Bạn có thể thấy được tất cả phiên bản cũ mà bạn từng làm, cũng như các phiên bản mà hiện tại bạn đang phát triển.

Không dùng từ `clone` trên trang này vì khái niệm đó chưa được giới thiệu. Khái niệm `repository` phải được giải thích bằng ngôn ngữ đơn giản trước hoặc ngay khi người học cần hiểu nó.

### Trang 2 — Git khác GitHub như thế nào?

Câu mở đầu đã được duyệt nguyên văn:

> Git và GitHub thường được nhắc đến cùng nhau, nhưng thực ra chúng là hai khái niệm khác nhau.

Hướng giải thích hiện tại:

Git là một hệ thống hoạt động trên máy tính. Git theo dõi các tệp trong dự án và lưu lại lịch sử thay đổi của chúng.

Nơi Git quản lý các tệp cùng lịch sử thay đổi được gọi là repository, hay kho lưu trữ dự án. Bạn có thể dùng Git trên máy tính mà không cần kết nối với GitHub.

GitHub là một nền tảng trực tuyến. Bạn có thể đưa repository từ máy tính lên GitHub để lưu một bản trên mạng. Sau đó, bạn có thể truy cập dự án từ máy khác hoặc chia sẻ với người khác.

GitHub cũng cung cấp các công cụ giúp mọi người cùng thảo luận và quản lý công việc. Vì vậy, GitHub làm được nhiều việc hơn một máy chủ chỉ dùng để lưu Git repository.

Không nhắc đến checkpoint ở trang này. Checkpoint chỉ được giải thích sau khi người học đã biết commit là gì.

### Trang 3 — Commit: lưu một phiên bản của dự án

Đây là bản nháp đang chờ người dùng xem xét, chưa phải câu chữ cuối cùng.

Khi bạn sửa các tệp trong một repository, Git không tự coi mọi thay đổi là một phiên bản đã hoàn thành. Bạn cần chọn thời điểm phù hợp để lưu lại một phiên bản. Phiên bản được lưu đó gọi là một commit.

Mỗi commit ghi lại trạng thái của những tệp đã chọn tại một thời điểm và đi kèm một lời nhắn ngắn để mô tả thay đổi. Nhiều commit nối tiếp nhau tạo thành lịch sử của dự án.

Commit là cơ chế Git dùng để lưu một phiên bản. Checkpoint là một commit mà chúng ta chủ động chọn làm điểm an toàn để quay lại. Trong Module 3, agent chỉ tạo checkpoint sau khi một giai đoạn đã hoàn thành, các kiểm tra đã chạy và người học đã chấp nhận kết quả.

Commit trước hết được lưu trong repository trên máy tính. Nó chưa tự động xuất hiện trên GitHub. Trang tiếp theo mới giới thiệu cách đưa commit lên GitHub và nhận các thay đổi từ đó.

### Trang 4 — Clone, push và pull

Chưa thiết kế. Trang này sẽ chỉ được viết sau khi Trang 3 được duyệt.

### Trang 5 — Branch: thử nghiệm mà không ảnh hưởng phiên bản ổn định

Định hướng ban đầu:

- Nếu chưa chắc một tính năng có phù hợp hay không, có thể tạo một branch để thử nghiệm.
- Nếu thử nghiệm tốt, thay đổi có thể được hợp nhất vào phiên bản chính.
- Nếu thử nghiệm không đạt, có thể bỏ branch thử nghiệm mà không làm mất phiên bản ổn định.
- Branch không đồng nghĩa với một thư mục riêng. Git worktree có thể tạo một thư mục làm việc riêng cho branch, nhưng đây là kiến thức tùy chọn và agent có thể xử lý thay người học.

Câu chữ đầy đủ của trang này chưa được thiết kế.

## 7. Những nội dung chưa chốt

- Câu chữ cuối cùng của Trang 3 về commit và checkpoint.
- Nội dung Trang 4 về clone, push và pull.
- Nội dung Trang 5 về branch và cách thử nghiệm an toàn.
- Vị trí chính xác của cụm trang Git và GitHub trong mạch Module 3.
- Các câu hỏi tổng kết đặt ở cuối bài.
- Cách nối nội dung giải thích với hoạt động Practice và bằng chứng hoàn thành.
- Giá trị viewport desktop và mobile dùng thống nhất trong hướng dẫn và kiểm tra.

Không được coi các mục này là đã được chủ sở hữu duyệt.

## 8. Nguồn tham khảo

Nguồn chính thức dùng để kiểm tra khái niệm:

- [Git — About Version Control](https://git-scm.com/book/en/v2/Getting-Started-About-Version-Control)
- [Git — What is Git?](https://git-scm.com/book/en/v2/Getting-Started-What-is-Git%3F)
- [Git — Branches in a Nutshell](https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell)
- [Git — git-restore](https://git-scm.com/docs/git-restore)
- [Git — git-worktree](https://git-scm.com/docs/git-worktree)
- [GitHub — What is GitHub?](https://docs.github.com/en/get-started/start-your-journey/what-is-github)
- [GitHub — About remote repositories](https://docs.github.com/en/get-started/git-basics/about-remote-repositories)
- [GitHub — About repositories](https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories)

Nguồn bổ sung do người dùng cung cấp:

- [Git Tutorial P1 trên Viblo](https://viblo.asia/p/git-tutorial-p1-5y8Rr7oAMob3)

Bài Viblo được dùng để tham khảo danh sách khái niệm cần thiết, không dùng làm nguồn duy nhất cho câu lệnh hoặc hành vi hiện tại của Git.

## 9. Bước tiếp theo được phép

Tiếp tục bàn **Trang 3 — Commit: lưu một phiên bản của dự án**, mỗi lần chỉ xử lý một khái niệm quan trọng. Chưa chỉnh sửa nội dung Course Companion cho đến khi toàn bộ thiết kế Module 3 được chủ sở hữu duyệt.
