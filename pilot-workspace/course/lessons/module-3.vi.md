# Module 3 — Hiện thực hoá sản phẩm cùng coding agent

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

Nếu bạn copy paste ảnh lỗi mà vẫn chưa sửa được, bạn có thể bảo agent add logs vào terminal để kiểm tra. Những dòng log này sẽ cho coding agent biết được tại sao app lại bị lỗi chứ không phải phỏng đoán. Và sau khi lỗi đã được khắc phục thì bạn có thể bảo coding agent xoá những đoạn logs không cần thiết

### Khi lỗi vẫn quay lại

Nếu lỗi vẫn quay lại sau nhiều lần sửa, hãy yêu cầu AI tạm dừng và liệt kê những nguyên nhân có thể khiến lỗi xảy ra. Cách này giúp quá trình điều tra có hệ thống hơn và thường tìm ra nguyên nhân gốc, thay vì chỉ vá những biểu hiện trước mắt.

Sau đó, hãy yêu cầu coding agent kiểm tra từng nguyên nhân và dựa vào bằng chứng để xác định nguyên nhân nào thực sự gây ra lỗi.

## Git và GitHub

### Vì sao cần Git?

Trong quá trình debugging, có thể bạn sẽ cần phải khôi phục phiên bản trước khi có lỗi, để xem lỗi nằm ở đâu. Đó là lúc Git có tác dụng

Git là một hệ thống quản lý phiên bản phân tán. Hệ thống quản lý phiên bản giúp ghi lại những thay đổi của dự án theo thời gian và cho phép quay lại một phiên bản trước đó khi cần.

Repository, hay kho lưu trữ dự án, là nơi Git quản lý các tệp của dự án cùng lịch sử thay đổi của chúng.

“Phân tán” có nghĩa là repository trên máy tính của bạn không chỉ giữ phiên bản mới nhất, mà còn có lịch sử của dự án. Bạn có thể thấy được tất cả phiên bản cũ mà bạn từng làm, cũng như các phiên bản mà hiện tại bạn đang phát triển.

### Git khác GitHub như thế nào?

Git và GitHub thường được nhắc đến cùng nhau, nhưng thực ra chúng là hai khái niệm khác nhau.

Git là một hệ thống hoạt động trên máy tính của bạn. Git theo dõi các tệp trong repository và lưu lại lịch sử thay đổi của chúng. Bạn có thể dùng Git mà không cần kết nối với GitHub.

GitHub là một nền tảng trực tuyến. Bạn có thể đưa repository từ máy tính lên GitHub để lưu thêm một bản trên mạng. Sau đó, bạn có thể truy cập dự án từ máy khác hoặc chia sẻ với người khác.

GitHub cũng cung cấp các công cụ giúp mọi người cùng thảo luận và quản lý công việc.

### Commit: lưu một phiên bản của dự án

Khi bạn thay đổi các tệp trong một repository, Git chưa tự coi những thay đổi đó là một phiên bản đã hoàn thành. Khi dự án đạt đến trạng thái mà bạn muốn lưu lại, bạn có thể tạo một commit.

Commit là một phiên bản của dự án được lưu trong lịch sử Git. Nó ghi lại trạng thái của dự án tại thời điểm đó và đi kèm một lời nhắn ngắn để mô tả thay đổi. Nhiều commit nối tiếp nhau tạo thành lịch sử của dự án.

Mỗi dòng trong hình là một commit. Các commit nối tiếp nhau cho thấy dự án đã được lưu lại qua nhiều phiên bản.

Một commit được lưu trong repository trên máy tính của bạn. Nó không tự động xuất hiện trên GitHub.

Nếu muốn lưu các commit trên GitHub, bạn cần thực hiện một bước riêng. Trang tiếp theo sẽ giải thích bước đó.

### Push: đưa commit lên GitHub

Push là thao tác gửi những commit mới từ repository trên máy tính lên repository của cùng dự án trên GitHub.

Sau khi push thành công, các commit đó sẽ xuất hiện trong lịch sử dự án trên GitHub. Push không tạo commit mới; nó chỉ đưa những commit đã có trên máy tính lên GitHub.

Phần này không giới thiệu câu lệnh, remote hoặc `origin`. Agent sẽ xử lý các thao tác kỹ thuật.

Việc giới thiệu push không có nghĩa là sau mỗi giai đoạn đều phải đưa commit lên GitHub. Push là một hành động đưa dữ liệu ra ngoài và được xử lý riêng, thay vì tự động trở thành một bước trong mỗi vòng triển khai.

### Branch: thử nghiệm mà không ảnh hưởng phiên bản ổn định

Bây giờ, giả sử bạn đang phát triển một tính năng mới. Bạn chưa chắc mình có muốn đưa tính năng đó vào sản phẩm hay không, nhưng vẫn muốn thử nghiệm thêm.

Bạn không nên thử trực tiếp trên phiên bản đang hoạt động ổn định. Những thay đổi chưa hoàn thiện có thể làm hỏng phần đang hoạt động tốt.

Đây là lúc bạn có thể dùng branch. Branch là một hướng phát triển riêng trong cùng repository. Nó cho phép bạn thử nghiệm tính năng mới mà chưa làm thay đổi phiên bản ổn định.

Sau khi thử nghiệm, bạn xem kết quả rồi quyết định có đưa tính năng vào phiên bản ổn định hay không. Agent sẽ thực hiện phần kỹ thuật sau khi bạn lựa chọn.

## Tóm lại

Tóm lại, một số điều bạn cần phải nhớ là:

- Khi debug, đa số bạn chỉ cần chụp screenshot và mô tả kỹ lỗi của bạn cho agent là được. Nếu vẫn không được thì bảo agent add log vào terminal để xem lỗi là gì, paste cái log đó vào coding agent và bảo nó sửa lại lần nữa
- Bạn nên bảo agent hãy commit sau mỗi quyết định lớn, để sau này bạn sẽ dễ quay lại phiên bản cũ hơn nếu gặp bug.
- Mỗi khi muốn phát triển một tính năng mới, hãy tạo một branch mới để lỡ agent có quậy thì cũng không ảnh hưởng đến tính năng hiện tại. Bạn chỉ cần bảo agent tạo branch là nó sẽ tự động hướng dẫn cho bạn
- Bạn có thể tạo một tài khoản github rồi bảo agent push code hiện tại của bạn lên đó nếu bạn muốn hợp tác với một người khác

## Practice: Xây portfolio

Trong phần Practice này, bạn sẽ tiếp tục làm việc trong task Codex đã dùng ở Module 2. Codex sẽ dựa vào PRD và implementation plan đã được duyệt để bắt đầu xây website.

Codex sẽ thực hiện từng phần của plan. Sau mỗi phần, Codex giải thích những gì đã thay đổi và kiểm tra kết quả. Bạn sẽ xem website thực tế rồi quyết định tiếp tục hoặc yêu cầu chỉnh sửa.

Nếu gặp lỗi trong quá trình xây, hãy trao đổi ngay với Codex trong task đang thực hiện. Codex đã có bối cảnh của website và biết những thay đổi vừa được thực hiện.

Khi bạn hài lòng với website hiện tại, hãy bấm **Hoàn thành bài** ngay trên Teacher Triết.

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
