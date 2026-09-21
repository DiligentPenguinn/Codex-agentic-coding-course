# Module 4 — Kiểm chứng, phát hành và chứng minh quyền sở hữu

## Hosting là gì?

Bạn đã làm xong portfolio và mở được nó trên máy. Bây giờ, bạn muốn gửi cho một người bạn xem. Nhưng đường dẫn `localhost` bạn đang dùng chỉ trỏ về máy đang mở nó, nên gửi đường dẫn này chưa giúp người kia xem được portfolio.

Bạn cần đặt website ở một nơi có thể truy cập qua Internet. Dịch vụ cung cấp nơi đó được gọi là **hosting**.

Khi website đã được đưa lên đó, người khác có thể mở bằng đường link, kể cả khi bạn đã tắt máy. Trong khóa học này, chúng ta sẽ dùng Vercel để làm việc đó.

## Máy tính, GitHub và Vercel làm gì?

Trong bài thực hành này, mỗi nơi có một vai trò:

| Nơi | Vai trò trong bài thực hành |
|---|---|
| Máy tính của bạn | Nơi bạn cùng agent xây và sửa portfolio. |
| GitHub | Nơi lưu code và lịch sử thay đổi của dự án trên mạng. |
| Vercel | Lấy code của dự án và đưa website lên để người khác truy cập. |

GitHub lưu code của bạn, còn Vercel giúp người khác mở website.

## Milestone 1 — Hosting, Vercel và bản chuẩn bị phát hành

### Vercel giúp bạn làm gì?

Hãy xem video để biết cách đưa portfolio lên Vercel.

[Xem video hướng dẫn](../../../course-companion/src/renderer/src/assets/lesson-visuals/module-4/vercel-portfolio-captioned.mp4)

### Mở portfolio vừa đưa lên mạng

Bạn đã làm theo video để đưa portfolio lên Vercel. Bây giờ, hãy mở đường link website của chính bạn.

Xem nội dung đã hiện đúng chưa, ảnh có tải được không và các liên kết chính có mở được không. Thử cả trên máy tính và điện thoại. Dòng Ready trên Vercel chỉ cho biết quá trình triển khai đã xong; bạn vẫn cần mở website để kiểm tra.

Lưu lại đường link này. Nếu website chưa mở được hoặc còn lỗi, nhờ agent tìm nguyên nhân trước khi thử thay đổi tiếp theo.

## Milestone 2 — Bảo mật và quyền truy cập

### Ai đang xem được website của bạn?

Bản website chính trên Vercel được gọi là Production. Repo Private trên GitHub chỉ giới hạn người xem code, không quyết định ai được mở website.

Hãy mở địa chỉ chính trong cửa sổ riêng tư của trình duyệt. Nếu bạn muốn chia sẻ công khai, người xem cần mở được portfolio mà không phải đăng nhập. Nếu chỉ muốn tự xem, người chưa có quyền cần gặp yêu cầu đăng nhập.

Nếu kết quả khác với ý định của bạn, kiểm tra Settings → Deployment Protection trong project Vercel. Vercel Authentication yêu cầu đăng nhập; All Deployments bảo vệ cả địa chỉ chính, còn Standard Protection không bảo vệ địa chỉ đó. Nhờ agent giải thích nếu chưa rõ trước khi đổi quyền.

## Milestone 3 — Thực hành cập nhật một thay đổi nhỏ

### Chọn một thay đổi nhỏ

Portfolio đã lên mạng rồi. Bây giờ, hãy thử sửa một câu giới thiệu để học cách cập nhật website. Chọn câu muốn sửa và viết rõ nội dung mới.

Bạn sẽ xem thay đổi trên máy trước, sau đó xem thử trên Internet, rồi mới quyết định đưa lên website chính. Cách này giúp bạn kiểm tra bản sửa trước khi người khác nhìn thấy nó.

Chỉ sửa một câu trong lần thực hành này để dễ nhận ra điều gì đã thay đổi.

### Sửa và xem trên máy

Nhờ agent kiểm tra Production Branch, tức branch mà Vercel dùng để cập nhật website chính. Branch này thường là main, nhưng cần xem cấu hình thực tế của project.

Yêu cầu agent tạo một branch khác để sửa đúng câu bạn đã chọn và giữ nguyên các phần còn lại. Sau đó, nhờ agent mở bản Local, tức website đang chạy trên máy bạn, để bạn xem. Chưa cho phép push code lên GitHub.

Đọc lại câu mới trên trang. Khi bạn thấy đúng ý, hãy duyệt bản sửa để chuyển sang bước xem thử trên Internet. Việc sửa trên máy chưa làm website chính thay đổi.

### Đưa bản sửa lên Preview

Preview là bản xem thử trên Internet để bạn kiểm tra trước khi cập nhật website chính.

Trước khi đưa code lên, nhờ agent kiểm tra bản dựng và bảo đảm phần sắp gửi cùng lịch sử Git không chứa mật khẩu, token hay API key. Đây là các mã có thể cấp quyền dùng tài khoản hoặc dịch vụ. Nếu phát hiện mã đã lộ, dừng để thu hồi hoặc thay mã trước.

Khi đã sẵn sàng, cho phép agent commit và push branch vừa sửa lên GitHub để Vercel tạo Preview. Nói rõ chỉ cho phép tạo bản xem thử, chưa được merge vào Production Branch hoặc cập nhật website chính.

### Kiểm tra bản xem thử

Mở project trên Vercel → Deployments, tức danh sách các lần triển khai. Chọn bản mới có trạng thái Ready, môi trường Preview và đúng branch, commit vừa push. Nếu thấy Production, dừng và nhờ agent kiểm tra lại cấu hình.

Mở đường link của bản Preview đó. Câu mới cần giống bản bạn đã duyệt trên máy, ảnh và các liên kết liên quan vẫn phải hoạt động. Sau đó mở địa chỉ website chính để xác nhận câu cũ vẫn còn.

Kiểm tra quyền truy cập của Preview bằng cửa sổ riêng tư; tên Preview không có nghĩa là riêng tư. Lưu link, commit và kết quả kiểm tra. Nếu còn lỗi, sửa và kiểm tra lại Preview mới trước khi duyệt.

## Milestone 4 — Công bố, cập nhật và khôi phục

### Duyệt bản cập nhật

Bạn đã kiểm tra Preview. Bây giờ, hãy quyết định có đưa câu mới lên website chính hay chưa.

Trước khi duyệt, nhờ agent tóm tắt câu nào sẽ thay đổi, kết quả kiểm tra và phiên bản có thể quay lại nếu gặp lỗi. Nếu còn điều chưa đúng, giữ bản hiện tại và sửa tiếp trên branch riêng.

Nếu đồng ý, cho phép agent cập nhật Production bằng bản bạn vừa kiểm tra. Nếu website đang được bảo vệ, lần cập nhật này vẫn giữ quyền truy cập hiện tại. Việc mở cho mọi người xem cần quyết định riêng.

### Đưa bản đã duyệt vào website chính

Nhờ agent xác nhận lại Production Branch, rồi merge thay đổi đã duyệt vào branch đó và push lên GitHub. Merge là gộp thay đổi từ branch đang sửa vào branch đích. Nếu có xung đột, agent cần giải thích để bạn chọn cách xử lý trước khi gộp.

Chờ bản Production mới trên Vercel đạt Ready. Đối chiếu commit rồi mở địa chỉ website chính đã lưu sau video để kiểm tra câu mới. Link Preview chưa chứng minh website chính đã cập nhật.

Nếu website đang giới hạn người xem, hãy giữ quyền đó trừ khi bạn đã quyết định công khai. Khi đổi quyền truy cập, chỉ đổi trong đúng project và thử lại địa chỉ chính bằng cửa sổ riêng tư.

### Kiểm tra sau khi công bố

Mở địa chỉ chính bằng cửa sổ riêng tư, nơi bạn chưa đăng nhập Vercel. Nếu muốn ai cũng xem được mà trang vẫn yêu cầu đăng nhập, hãy kiểm tra lại quyền và xem bạn có đang dùng nhầm link deployment không.

Thử lại ảnh, liên kết dự án, tải CV và cách liên hệ. Mở một trang con rồi tải lại trang; trang chủ chạy được chưa chứng minh mọi đường dẫn đều hoạt động. Xem trên điện thoại và thử Tab, Enter như trước.

Lưu địa chỉ chính cùng commit vừa phát hành vào ghi chú dự án. Chỉ đưa link vào CV hoặc hồ sơ cá nhân sau khi các bước này đạt. Nếu gặp lỗi chặn, ngừng chia sẻ thêm và xử lý hoặc khôi phục bản trước.

### Để đường link sẵn sàng chia sẻ

Nhờ agent đối chiếu tiêu đề tab, mô tả ngắn, biểu tượng nhỏ trên tab và ảnh đại diện khi chia sẻ link với phiên bản đã chốt. Nếu bản online hiển thị khác, kiểm tra đúng deployment và đường dẫn tệp. Ảnh hoặc mô tả cũ có thể được ứng dụng nhắn tin lưu tạm nên không phải lúc nào cũng đổi ngay.

Địa chỉ dạng tên-project.vercel.app đã đủ để bắt đầu. Tên miền riêng, chẳng hạn tên-của-bạn.com, là lựa chọn thêm và thường có phí gia hạn. Nếu mua sau này, thêm tại Settings → Domains rồi làm theo đúng hướng dẫn của Vercel và nơi mua tên miền.

Website công khai không đồng nghĩa Google sẽ hiện ngay. Cũng đừng dùng “chưa tìm thấy trên Google” hay một đường link khó đoán để giữ bí mật nội dung.

### Muốn chỉnh portfolio thì làm thế nào?

Bạn có một dự án mới để thêm vào portfolio. Hãy mở đúng thư mục code trong Codex. Nếu task cũ không còn, tạo task mới ở thư mục này và cho agent đọc ghi chú dự án. Nói phần cần thêm, tư liệu thật và phần cần giữ nguyên.

Làm theo vòng quen thuộc: tạo branch riêng → sửa trên Local → xem và kiểm tra → commit, push để tạo Preview → duyệt Preview → merge, push vào Production Branch → kiểm tra website chính.

Việc sửa trên máy chưa làm website ngoài Internet thay đổi. Ngược lại, push vào Production Branch có thể tự cập nhật website chính. Vì vậy, đừng nói “push hết lên” khi bạn chỉ muốn thử một ý tưởng.

Mỗi lần chỉ nên thay một phần đủ nhỏ để bạn nhận ra điều gì đã đổi và biết quay lại đâu nếu gặp lỗi.

### Giao một lần sửa có điểm dừng

Bạn có thể nói với agent:

“Thêm dự án mới từ tư liệu tôi cung cấp. Trước khi sửa, kiểm tra đúng repo và Production Branch, rồi tạo branch khác. Giữ nguyên các phần còn lại. Mở bản Local và tóm tắt thay đổi để tôi xem. Khi tôi duyệt, hãy commit và push branch này để tạo Preview. Chưa merge hoặc cập nhật Production.”

Ở Preview, bạn xác nhận thay đổi đã duyệt trên Local xuất hiện đúng và các phần liên quan vẫn hoạt động. Khi đã chấp nhận, mới cho phép cập nhật Production rồi thử lại địa chỉ chính.

Nếu website vẫn hiện bản cũ, đối chiếu commit trên GitHub và deployment trước. Kiểm tra đúng branch, trạng thái Ready và đúng đường link; tải lại trang chưa sửa được việc chưa push code.

### Khi Vercel báo lỗi

Nếu deployment báo Error, mở bản bị lỗi và phần Build Logs, tức nhật ký tạo bản dựng. Gửi agent đoạn lỗi liên quan, tên branch, commit và thao tác vừa làm; che mã bí mật nếu có. Yêu cầu agent nêu nguyên nhân có bằng chứng, sửa một phần nhỏ rồi thử lại.

Nếu báo Ready nhưng trang trống, ảnh mất hoặc đường dẫn báo 404, hãy chụp màn hình kèm đúng URL và cách tái hiện. Agent cần so sánh với bản Local, kiểm tra cấu hình và đường dẫn tệp.

Nếu không thấy deployment mới, xem commit đã lên đúng branch GitHub và Vercel còn quyền đọc repo không. Không cần tạo một project mới mỗi lần lỗi. Mọi lần sửa vẫn cần kiểm tra lại bản mới trước khi chia sẻ.

### Khi cần quay lại bản đang hoạt động

Rollback là đưa website chính trở lại một deployment trước đó. Nếu bản mới làm nút liên hệ hỏng, bạn có thể dùng cách này để người xem tạm dùng lại bản đã ổn.

Mở project → Deployments, tìm bản Production đã kiểm tra trước đó. Mở menu của bản đó và chọn Instant Rollback nếu khả dụng. Kiểm tra đúng bản và xác nhận, rồi mở lại địa chỉ chính để thử. Gói Hobby chỉ cho quay lại bản Production ngay trước; nếu không có bản phù hợp, nhờ agent sửa và triển khai bản mới.

Rollback trên Vercel không tự sửa code trên GitHub. Nhờ agent đưa phần sửa lỗi vào code và kiểm tra lại trước lần phát hành tiếp theo, nếu không lỗi có thể quay lại. Rollback cũng không thu hồi được tệp đã bị tải về hay mã bí mật đã lộ.

### Tiếp tục phát hành sau khi khôi phục

Sau Instant Rollback, Vercel tạm ngừng tự gắn các bản mới vào địa chỉ Production chính. Vì vậy, push bản đã sửa chưa chắc làm địa chỉ chính đổi ngay.

Sửa code cùng agent, kiểm tra Local và Preview, rồi tạo bản đã sửa trên Production Branch. Khi đã sẵn sàng, mở trang tổng quan project, chọn Undo Rollback, đối chiếu và chọn đúng deployment đã sửa, rồi xác nhận. Đây là một lần thay đổi website chính nên cần bạn đồng ý.

Mở lại địa chỉ chính để kiểm tra. Vercel sẽ bật lại việc tự cập nhật địa chỉ Production cho những lần push tiếp theo. Ghi lại commit đã sửa và kết quả để không nhầm bản vừa khôi phục với bản đã giải quyết nguyên nhân lỗi.

## Milestone 5 — Làm chủ portfolio và áp dụng cho dự án khác

### Bạn cần nắm gì về portfolio của mình?

Bạn không cần tự viết mọi dòng code để làm chủ portfolio. Bạn cần chỉ được repo nằm ở đâu, website chính dùng đường link nào, bản đang chạy lấy từ commit nào và ai có quyền quản lý tài khoản GitHub và Vercel.

Một quyết định phát hành cần gắn với bằng chứng, chẳng hạn giữ website được bảo vệ vì chưa muốn công khai, hoặc khôi phục bản trước vì bản mới bị lỗi đường dẫn. Phần kiểm tra cuối bài sẽ dùng quyết định và bằng chứng từ lần triển khai của bạn.

Lời giải thích dựa trên việc bạn đã làm có giá trị hơn một đoạn tổng kết do agent viết hộ. Giữ lại cả giới hạn chưa giải quyết để lần cập nhật sau có điểm bắt đầu rõ ràng.

### Lưu lại để lần sau tiếp tục được

Tạo một ghi chú ngắn trong dự án: link repo, tên project Vercel, địa chỉ chính, Production Branch, commit đang chạy, cách mở Local, cách tạo Preview và bản có thể khôi phục.

Thêm những việc còn lại, nơi sửa nội dung và các lần gia hạn cần nhớ nếu bạn mua tên miền hoặc dùng gói trả phí. Ghi chú giúp cả bạn trong vài tháng tới và người hỗ trợ sau này tiếp tục được công việc.

Tài khoản GitHub, Vercel và tên miền nên thuộc quyền quản lý của bạn. Bật xác thực hai bước nếu có và giữ thông tin khôi phục ở nơi riêng tư. Không ghi mật khẩu, token hay mã khôi phục trong repo.

### Thử áp dụng cho một việc khác

Bạn có thể áp dụng quy trình vừa học cho một ứng dụng nhỏ khác portfolio, chẳng hạn một trang giúp sắp xếp sách muốn đọc. Bước đầu là xác định người dùng, vấn đề, việc phiên bản đầu cần làm và cách quan sát kết quả.

Nhiệm vụ đầu tiên cho agent cần nêu rõ phạm vi, phần chưa làm, cách kiểm tra và lúc dừng để bạn duyệt. Cách xác định yêu cầu, làm từng phần và xem bằng chứng vẫn dùng được ở dự án mới.

Phần kiểm tra cuối bài sẽ yêu cầu bạn tự áp dụng cách này cho một ứng dụng khác. Bạn chưa cần xây ứng dụng đó.

## Thực hành và kết quả cần giữ lại

Thực hành trên repo và tài khoản của bạn. Giữ lại các kết quả sau:

1. Phiên bản đã hoàn thiện ở Module 3, kết quả tạo bản dựng và giới hạn triển khai còn lại.
2. Repo, branch, commit, cài đặt quyền truy cập và quyết định đưa nội dung lên Vercel.
3. Bản triển khai đầu được bảo vệ và một Preview đã kiểm tra, gồm URL, commit, trạng thái và quan sát thực tế.
4. Quyết định có công khai địa chỉ chính hay chưa. Nếu công khai, thử lại bằng cửa sổ riêng tư.
5. Một thay đổi nhỏ đi qua Local và Preview. Chỉ cập nhật Production khi bạn đã duyệt; ghi cách khôi phục và tiếp tục phát hành.
6. Ghi chú để tiếp tục quản lý portfolio và bản kế hoạch đầu tiên cho một ứng dụng khác.

Preview đã kiểm chứng là điều kiện bắt buộc của bài thực hành dự kiến. Công khai Production là lựa chọn của bạn. Trong luồng import này, Vercel vẫn tạo deployment Production đầu tiên nhưng bạn giữ nó được bảo vệ; điều đó khác với cho mọi người xem website.

Bạn không cần gây lỗi hoặc rollback website thật để làm bài. Chỉ ra bản có thể khôi phục và giải thích các bước là đủ ở phần nội dung này.

## Kiểm tra cuối bài

Chỉ làm bài kiểm tra sau khi học hết các phần hướng dẫn. Trả lời lần lượt sáu tình huống và hai câu tự viết trong bài kiểm tra Module 4. Hai câu tự viết phải dùng quyết định và bằng chứng của chính bạn, không chép ví dụ trong bài.

## Trạng thái bản duyệt nội dung

Phiên bản này chỉ để đọc và thử câu hỏi. Bài thực hành phát hành chưa hoạt động, nên xem hết nội dung chưa được tính là hoàn thành. Khi bài thực hành được mở, bạn sẽ dùng repo, tài khoản và portfolio của chính mình.

## Tài liệu để đối chiếu khi cần

Các bước và hình được đối chiếu ngày 14/09/2026. Giao diện có thể thay đổi; hãy đọc tên mục và kiểm tra dự án thật trước khi làm theo. Ảnh trong bài không chứng minh portfolio của bạn đã triển khai thành công.

- [Vercel: bắt đầu và import từ dashboard](https://vercel.com/docs/getting-started-with-vercel).
- [Vercel: Local, Preview, Production và lần triển khai đầu](https://vercel.com/docs/deployments/environments).
- [Vercel: gói Hobby](https://vercel.com/docs/plans/hobby).
- [Vercel: quyền truy cập và quyền mặc định](https://vercel.com/docs/deployment-protection).
- [Vercel: cài đặt bản dựng](https://vercel.com/docs/builds/configure-a-build).
- [Vercel: nối GitHub và tự triển khai khi push](https://vercel.com/docs/git/vercel-for-github).
- [Vercel: đọc nhật ký lỗi bản dựng](https://vercel.com/docs/deployments/logs).
- [Vercel: khôi phục và Undo Rollback](https://vercel.com/docs/instant-rollback).
- [Vercel: thêm tên miền](https://vercel.com/docs/domains/working-with-domains/add-a-domain).
