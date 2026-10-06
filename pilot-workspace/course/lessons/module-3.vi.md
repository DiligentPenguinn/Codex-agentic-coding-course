# Module 3 — Hiện thực hoá sản phẩm cùng coding agent

## Mở portfolio trên máy

Để mở portfolio trên máy, bạn có thể nhắn cho agent: “Hãy chạy portfolio và gửi tôi đường dẫn để xem trên trình duyệt.”

Agent sẽ kiểm tra cách chạy của dự án và khởi động website cho bạn. Bạn có thể thấy agent dùng lệnh `npm run dev`. Hiểu đơn giản, đây là lệnh khởi động website ngay trên máy tính của bạn để bạn kiểm tra thành quả.

Bạn có thể nhờ agent thiết lập một lần và hướng dẫn cách mở terminal tại thư mục dự án. Những lần sau, bạn chỉ cần mở terminal ở thư mục đó, gõ `npm run dev`, rồi mở đường dẫn hiện ra để xem website. Đây là cách xem dự án trong môi trường local, tức là chạy ngay trên máy của bạn.

## Debug cùng coding agent

Okay, bây giờ bạn đã có một implementation plan và bắt đầu thực hiện nó. Đến giai đoạn này, có một điều mình chắc chắn bạn sẽ không thể tránh khỏi. Đó chính là gặp bug (lỗi phần mềm). Hiện tại coding agent chưa phát triển đến mức làm hoàn hảo mọi yêu cầu của bạn mà không có tí lỗi nào.

Thực ra hồi mới bắt đầu code với Coding agents, đâu đó tầm 40% thời gian mình dành để lên kế hoạch và xây sản phẩm thôi, 60% thời gian còn lại mình dành cho debugging (khắc phục lỗi). Thực ra hoàn thành tốt giai đoạn planning và implementation plan đã giúp bạn giảm khá khá bugs rồi. Nhưng vẫn khó tránh khỏi việc bạn sẽ gặp bug trong quá trình xây sản phẩm.

Vậy khi gặp bug thì xử lý thế nào?

### Khi lỗi xuất hiện trên màn hình

Khi gặp một bug có thể nhìn thấy trên màn hình, hãy chụp lại bug đó và gửi ảnh cho coding agent.

Đừng chỉ gửi ảnh. Hãy nói thêm bạn đang làm gì, bạn mong đợi điều gì và kết quả thực tế ra sao. Từ những thông tin này, agent có thể kiểm tra code, tìm nguyên nhân và giải thích lỗi bằng ngôn ngữ dễ hiểu trước khi sửa.

Sau khi agent sửa xong, hãy thực hiện lại đúng thao tác đã gây lỗi. Nếu lỗi không còn xuất hiện, chúng ta có thể tiếp tục.

Trên đây là ví dụ của một prompt bạn có thể áp dụng. Trong trường hợp này, lỗi có thể thấy ngay ở trên trang web, nên bạn chỉ việc cắt screenshot và nhắn prompt như trên là được.

### Khi ảnh chụp chưa cho thấy nguyên nhân

Đôi khi ảnh chụp chỉ cho thấy kết quả bị sai, nhưng chưa cho biết vì sao lỗi xảy ra.

Nếu bạn đã gửi ảnh lỗi mà agent vẫn chưa sửa được, bạn có thể yêu cầu agent thêm log, tức là thông tin ghi lại những hoạt động diễn ra khi ứng dụng đang chạy. Log có thể giúp agent có thêm thông tin về nguyên nhân gây ra lỗi, thay vì chỉ đoán mò

**Prompt mẫu:** “Hãy thêm log cần thiết để tìm nguyên nhân lỗi. Nếu cần tôi thực hiện lại thao tác gây lỗi, hãy hướng dẫn tôi. Sau khi sửa, hãy kiểm tra lại và xóa những log tạm không còn cần thiết.”

### Khi lỗi vẫn quay lại

Nếu lỗi vẫn quay lại sau nhiều lần sửa, hãy yêu cầu AI tạm dừng và liệt kê những nguyên nhân có thể khiến lỗi xảy ra. Cách này giúp quá trình điều tra có hệ thống hơn và thường tìm ra nguyên nhân gốc, thay vì chỉ vá những biểu hiện trước mắt.

Sau đó, hãy yêu cầu coding agent kiểm tra từng nguyên nhân và dựa vào bằng chứng để xác định nguyên nhân nào thực sự gây ra lỗi.

## Git và GitHub

### Vì sao cần Git?

Trong quá trình debugging, có thể bạn sẽ cần phải khôi phục phiên bản trước khi có lỗi, để xem lỗi nằm ở đâu. Đó là lúc Git có tác dụng

Git là một hệ thống quản lý phiên bản phân tán. Hệ thống quản lý phiên bản giúp ghi lại những thay đổi của dự án theo thời gian và cho phép quay lại một phiên bản trước đó khi cần.

### Git khác GitHub như thế nào?

Git và GitHub thường được nhắc đến cùng nhau, nhưng thực ra chúng là hai khái niệm khác nhau.

Git là một hệ thống hoạt động trên máy tính của bạn. Git theo dõi các tệp trong repository và lưu lại lịch sử thay đổi của chúng. Bạn có thể dùng Git mà không cần kết nối với GitHub.

GitHub là một nền tảng trực tuyến. Bạn có thể đưa repository từ máy tính lên GitHub để lưu thêm một bản trên mạng. Sau đó, bạn có thể truy cập dự án từ máy khác hoặc chia sẻ với người khác.

GitHub cũng cung cấp các công cụ giúp mọi người cùng thảo luận và quản lý công việc.

### Commit: lưu một phiên bản của dự án

Bây giờ, mình sẽ giới thiệu thêm một số khái niệm để bạn hiểu thêm về cách Git hoạt động.

Đầu tiên là Commit.

Về căn bản, Commit là một phiên bản của dự án mà bạn đã lưu lại tại một thời điểm cụ thể. Giả dụ sau khi bạn sửa xong hiệu ứng animation của portfolio thấy đẹp quá nên bạn muốn lưu nó lại để sau này nếu lỡ phá code thì vẫn tìm lại phiên bản cũ được. Commit sẽ giúp bạn làm điều đó.

Hình ở góc bên phải màn hình chính là git tree, biểu đồ để minh hoạ lịch sử của dự án. Các bạn có thể thấy mỗi chấm là một commit, và nhiều chấm nối lại với nhau tạo thành lịch sử phát triển dự án.

Các bạn nên tạo commit ngay sau mỗi thay đổi lớn trong dự án, hoặc thay đổi nào mà bạn thấy thích, để có thể tìm lại phiên bản đã lưu nếu lỡ sửa hỏng code. Bạn chỉ cần bảo agents là "commit all the current changes with appropriate messages" là được.

### Push: đưa commit lên GitHub

![Danh sách commit của dự án trên GitHub sau khi push](../../../course-companion/src/renderer/src/assets/lesson-visuals/m3-github-pushed-commits.png)

commit của dự án khi được push lên github

Khi bạn muốn chuyển một commit từ môi trường máy tính của bạn lên GitHub, bạn sẽ sử dụng lệnh 'git push' (cụ thể như nào thì bạn có thể nhờ agent làm). Sau khi push thành công, lịch sử commit của bạn cũng sẽ được lưu trên github và bạn có thể chia sẻ nó cho người khác.

### Branch: thử nghiệm mà không ảnh hưởng phiên bản ổn định

Một khái niệm nữa mà mình muốn giới thiệu cho bạn là **branch**, hay còn gọi là nhánh.

Giả sử portfolio của bạn đang hoạt động ổn, nhưng bạn muốn thử tạo thêm một khối 3D. Tính năng này khá phức tạp, và bạn chưa chắc làm xong có đẹp hay không. Nếu sửa trực tiếp trên nhánh chính, bạn có thể làm hỏng cả những phần đang chạy tốt.

Lúc này, bạn có thể tạo một branch riêng để phát triển tính năng 3D. Cứ hình dung đó là một “vùng riêng” để quậy. Những thay đổi bạn thực hiện và commit trên branch này sẽ không ảnh hưởng đến nhánh chính, cho đến khi bạn quyết định gộp chúng vào.

Nếu thử nghiệm không ổn, bạn có thể nhờ agent xử lý phần đang làm dở và quay lại nhánh chính. Bạn không bắt buộc phải đưa tính năng 3D vào portfolio, cũng không cần xóa branch ngay nếu muốn giữ lại để thử tiếp sau này.

Để bắt đầu, bạn chỉ cần bảo agent:

> Tạo và chuyển sang branch `feature/3d-development` (hoặc bất kỳ tên nào bạn thích) để phát triển tính năng 3D.

### Merge: gộp nhánh và xử lý xung đột

![Danh sách các branch của một dự án trên GitHub](../../../course-companion/src/renderer/src/assets/lesson-visuals/m3-github-branches.png)

ảnh các branches trong một dự án trên github của mình

Sau khi đã xem và kiểm tra tính năng, nếu muốn đưa nó vào nhánh chính, bạn có thể bảo:

> Gộp branch hiện tại vào nhánh chính `main`. Nếu có xung đột, hãy giải thích và đề xuất cách xử lý để tôi quyết định. Sau khi gộp, kiểm tra lại tính năng một lần nữa để chắc không có lỗi gì xảy ra

Thao tác gộp nhánh này được gọi là **merge**.

Ngoài ra, khi merge hai nhánh lại với nhau, đôi khi sẽ có những vùng xung đột xảy ra. Ví dụ, file hiệu ứng 3D của nhanh a quy định khối 3D xoay sang trái, trong khi nhánh b sửa cùng dòng đó để khối 3D xoay sang phải. Git sẽ không biết phải chọn cái nào, khiến xung đột (conflict) xảy ra

Xử lý conflict là một chủ đề khá rộng nên mình sẽ không đi sâu trong khóa này. Tạm thời bạn có thể nhờ agent xử lý là sẽ ổn thoả trong 85% trường hợp.

## Tóm lại

4 điều cần nhớ trước khi bắt đầu Practice:

- Khi debug, đa số bạn chỉ cần chụp screenshot và mô tả kỹ lỗi của bạn cho agent là được. Nếu vẫn không được thì bảo agent add log vào terminal để xem lỗi là gì, paste cái log đó vào coding agent và bảo nó sửa lại lần nữa
- Bạn nên bảo agent hãy commit sau mỗi quyết định lớn, để sau này bạn sẽ dễ quay lại phiên bản cũ hơn nếu gặp bug.
- Mỗi khi muốn phát triển một tính năng mới, hãy tạo một branch mới để lỡ agent có quậy thì cũng không ảnh hưởng đến tính năng hiện tại. Bạn chỉ cần bảo agent tạo branch là nó sẽ tự động hướng dẫn cho bạn
- Bạn có thể tạo một tài khoản github rồi bảo agent push code hiện tại của bạn lên đó nếu bạn muốn hợp tác với một người khác

## Practice: Xây portfolio

Trong phần Practice này, bạn sẽ tiếp tục làm việc trong task Codex đã dùng ở Module 2. Codex sẽ dựa vào PRD và implementation plan đã được duyệt để bắt đầu xây website.

Codex sẽ thực hiện từng phần của plan. Sau mỗi phần, Codex giải thích những gì đã thay đổi và kiểm tra kết quả. Bạn sẽ xem website thực tế rồi quyết định tiếp tục hoặc yêu cầu chỉnh sửa.

Nếu gặp lỗi trong quá trình xây, hãy trao đổi ngay với Codex trong task đang thực hiện. Codex đã có bối cảnh của website và biết những thay đổi vừa được thực hiện.

Khi bạn hài lòng với website hiện tại, hãy bấm **Hoàn thành bài** ngay trên Teacher Triết.

## Publish repo trước bài tổng kết

Trước khi kết thúc bài học, bạn hãy nhờ agent publish repo của bạn lên github. Sau khi hoàn thành, chúng ta sẽ cùng làm một vài câu hỏi để ôn tập nhé.

## Điều kiện hoàn thành

Course Companion kiểm tra các phần bắt buộc của website, kết quả kiểm tra hiện tại và bằng chứng trong workspace. Sau khi các phần này đã đầy đủ, bạn xem lại website lần cuối rồi xác nhận chấp nhận phiên bản hiện tại.

Cuối cùng, bạn trả lời năm câu hỏi tổng kết về cách thực hiện plan, báo lỗi, dùng log, điều tra lỗi quay lại và thử nghiệm trên branch.

## Nguồn phương pháp

- [OpenAI — Introducing Codex](https://openai.com/index/introducing-codex/)
- [Git — About Version Control](https://git-scm.com/book/en/v2/Getting-Started-About-Version-Control)
- [Git — What is Git?](https://git-scm.com/book/en/v2/Getting-Started-What-is-Git%3F)
- [Git — Branches in a Nutshell](https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell)
- [GitHub — What is GitHub?](https://docs.github.com/en/get-started/start-your-journey/what-is-github)
- [GitHub — About remote repositories](https://docs.github.com/en/get-started/basics/about-remote-repositories)
