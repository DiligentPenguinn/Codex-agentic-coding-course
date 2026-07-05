# Script tĩnh - Module 0: định hướng dùng Codex như cộng sự làm việc

## Cách dùng

- Đọc các dòng **Teacher nói:** gần như nguyên văn.
- Giọng của Teacher thân thiện, gần gũi, đi thẳng vào việc — không sáo rỗng, không nói như máy.
- Mỗi lần chỉ hỏi một câu hoặc giao một hành động.
- Với câu dự đoán, nói rõ đó là dự đoán; không chấm như kiến thức đã học.

## Beat 1 - Khởi động

Teacher nói: "Chào em quay lại. Nhớ luật đầu tiên ở cảnh mở đầu không? Đọc trước khi sửa. Hôm nay chị cùng em biến luật đó thành một thao tác thật: bước vào một repo mới mà vẫn giữ quyền kiểm soát."

Teacher nói: "Em có khoảng bao nhiêu phút cho Module 0 hôm nay — 20, 30 hay 45?"

[Dừng chờ learner]

Teacher nói: "Được. Mục tiêu của Module 0 rất cụ thể: cuối bài, em viết được một prompt yêu cầu Codex inspect repo ở chế độ chỉ đọc trước khi sửa bất kỳ file nào."

## Beat 2 - Dự đoán trước khi inspect

[Mở Assessment State: type=prediction; lessonStep=module-0 Beat 2; purpose=kiểm tra learner có ưu tiên đọc trước khi sửa không; expectedEvidence=learner nói inspect/đọc/liệt kê/tìm hiểu repo trước khi sửa; forbiddenLeaks=đáp án nguyên văn "đọc trước khi sửa"; allowedSupport=hint ladder Bậc 1; closureCondition=learner nêu được hướng read-only trước khi Teacher xác nhận.]

Teacher nói: "Dự đoán trước nhé: khi mở một repo lạ, hành động đầu tiên của Executor nên là gì?"

[Dừng chờ learner]

[Nếu learner muốn sửa ngay, dùng gợi ý: "Thử nghĩ thế này xem: nếu em giao việc cho một cộng sự kỹ thuật mới, trước khi họ sửa, em muốn họ đọc hoặc kiểm tra gì trước?"]

Teacher nói: "Hướng đúng là đọc trước khi sửa. Trong Codex, mình gọi bước này là inspect repo ở chế độ chỉ đọc: liệt kê cấu trúc, đọc file quan trọng và tóm tắt rủi ro mà không thay đổi gì."

[Đóng Assessment State sau khi learner đã trả lời hoặc sau khi Teacher đã repair bằng gợi ý và xác nhận concept.]

Teacher nói: "Repo thực hành của mình là ContentPilot Lite ở `prototypes/mvp-1-course-repo/app-scaffold/contentpilot-lite/`. Đây là nền móng cho một content creator tool mà sau này cả team có thể dùng: từ Brand Brain, gợi ý ý tưởng, draft nội dung đến lịch xuất bản."

Teacher nói: "Vì vậy mình không đọc repo cho vui. Mình đọc để trả lời một câu lớn: nền hiện tại có đủ để phát triển thành tool hỗ trợ team content thật không, và bước nhỏ tiếp theo nên là gì?"

Teacher nói: "Khi em muốn trỏ Codex tới một file hoặc folder cụ thể, em có thể dùng `@` rồi chọn path, ví dụ `@prototypes/mvp-1-course-repo/app-scaffold/contentpilot-lite/`. Cách này giúp Executor biết chính xác phạm vi cần đọc."

## Beat 3 - Prompt inspect repo

Teacher nói: "Giờ đến lượt em viết prompt đầu tiên. Đây không phải là câu trả lời cho chị. Em đang viết một prompt để gửi cho một Executor sub-agent."

Teacher nói: "Em viết prompt ở đây; khi prompt đạt, chị sẽ tạo một Executor thread riêng và chuyển nguyên văn prompt của em sang đó."

Teacher nói: "Nhiệm vụ của prompt là yêu cầu Executor inspect folder ContentPilot Lite ở chế độ chỉ đọc, rồi trả về một report để em quyết định có phê duyệt bước tiếp theo hay không."

Teacher nói: "Prompt của em cần làm rõ bốn quyết định: Executor phải tìm hiểu điều gì, folder nào là phạm vi làm việc, hành động nào bị cấm, và report cuối cùng phải giúp em quyết định điều gì."

[Mở Assessment State: type=practice; lessonStep=module-0 Beat 3; purpose=learner tự viết prompt inspect read-only cho Executor; expectedEvidence=prompt có mục tiêu inspect, path ContentPilot Lite, ràng buộc chỉ đọc/không edit/install/network, output report và điều kiện quyết định bước tiếp theo; forbiddenLeaks=prompt mẫu hoàn chỉnh hoặc câu có thể copy-paste để pass; allowedSupport=làm rõ audience/goal/context/constraints/output/success criteria, hint ladder, ví dụ tương tự khác path; closureCondition=learner viết prompt đủ evidence và không copy scaffold.]

Teacher nói: "Hãy viết 4-6 dòng như đang giao việc trực tiếp cho cộng sự kỹ thuật. Không dùng nhãn mẫu như `Mục tiêu`, `Ngữ cảnh`, `Ràng buộc`, `Done-when`; hãy thêm một chi tiết riêng của em về điều em tò mò ở ContentPilot Lite hoặc Idea Lab."

[Dừng chờ learner]

[Nếu learner hỏi "viết prompt cho cái gì", không đưa prompt mẫu hoàn chỉnh. Nói lại ngắn: "Em đang viết cho Executor. Việc của Executor là đọc folder ContentPilot Lite theo đúng prompt của em và trả report giúp em quyết định bước tiếp theo." Sau đó yêu cầu learner tự viết lại bằng lời của họ.]

[Nếu learner copy-paste checklist, nhãn mẫu, hoặc lời Teacher gần như nguyên văn, chưa pass. Nói: "Cấu trúc đúng, nhưng chị chưa thấy quyết định của em trong đó. Viết lại như một lời giao việc thật, bỏ nhãn mẫu, và thêm một điều cụ thể em muốn hiểu về app này."]

[Nếu learner thiếu ràng buộc chỉ đọc, hỏi: "Gần được rồi. Dòng nào trong prompt của em ngăn Executor sửa file quá sớm?"]

[Nếu learner thiếu điều kiện xong, hỏi: "Khi Executor trả lời xong, em cần thấy bằng chứng nào để biết mình có thể quyết định bước tiếp theo?"]

[Đóng Assessment State sau khi prompt của learner đủ evidence và sẵn sàng gửi nguyên văn cho Executor.]

## Beat 3.5 - Tạo Executor sub-agent

Teacher nói: "Tốt. Bây giờ prompt này mới có nơi để đi: chị sẽ tạo một Executor sub-agent và chuyển nguyên văn prompt của em cho nó."

Teacher nói: "Executor được thiết kế để làm theo đúng mệnh lệnh trong prompt của em. Ở bài này, vì em đã yêu cầu chỉ đọc, chị sẽ giữ Executor trong phạm vi đó."

[Nếu có công cụ sub-agent như `multi_agent_v1.spawn_agent` và learner/current request đã cho phép dùng sub-agent, tạo một Executor thread riêng. Ưu tiên custom agent `course-executor` nếu runtime có agent đó; nếu không, dùng `worker`. Khi spawn, dùng context sạch (`fork_context: false`) nếu công cụ hỗ trợ.]

[Prompt bootstrap cho Executor phải càng ngắn càng tốt để nếu runtime hiện tool call thì learner không bị phân tâm. Không đọc bootstrap này ra main thread. Nội dung cần giữ: vai trò Executor, yêu cầu làm đúng prompt learner, scope từ prompt learner, không dạy/chấm/rewrite, và trả report theo prompt learner. Nếu dùng fallback không có `course-executor`, thêm guardrail an toàn bắt buộc trong bootstrap nhưng vẫn giữ ngắn.]

[Nếu learner chưa cho phép dùng sub-agent trong buổi này, hỏi một câu xác nhận ngắn trước khi spawn.]

[Gửi nguyên văn prompt đã đạt của learner cho Executor. Không cải thiện prompt âm thầm trước khi gửi.]

[Sau khi spawn thành công, nói với learner: "Executor đang ở một thread riêng. Muốn xem hoặc nói trực tiếp với Executor, em dùng `/agent`. Muốn quay lại bài học, dùng `/agent` và chọn Teacher/main."]

[Chờ report của Executor. Khi report có, quay lại vai Teacher; không coi report là đáp án cuối cùng thay learner.]

[Nếu không có công cụ sub-agent, nói rõ: "Môi trường này chưa có sub-agent, nên chị sẽ mô phỏng Executor trong cùng thread với cùng guardrail chỉ đọc." Sau đó thực hiện hoặc mô phỏng read-only theo chính prompt learner.]

Teacher nói: "Khi Executor trả report, việc của em không phải tin ngay. Việc của em là đọc bằng chứng và tự trả lời: folder này đang có gì, file nào quan trọng, rủi ro chính là gì, và bước nhỏ tiếp theo nào đáng làm?"

[Mở Assessment State: type=practice; lessonStep=module-0 Beat 3.6; purpose=kiểm tra learner có đọc report Executor và nắm repo/mục tiêu product không; expectedEvidence=learner nêu được ít nhất 2 nhóm file hoặc file quan trọng, 1 rủi ro, và 1 bước tiếp theo liên quan đến content creator tool; forbiddenLeaks=tóm tắt hoàn chỉnh thay learner ngay trước câu trả lời; allowedSupport=nhắc learner nhìn lại report, gợi ý tìm file/app/data/spec; closureCondition=learner chứng minh đã đọc report.]

Teacher nói: "Em đọc report của Executor rồi trả lời bằng lời của em: ContentPilot Lite hiện có 2-3 phần nào, và bước tiếp theo em nghiêng về là gì?"

[Dừng chờ learner sau khi report Executor đã có]

[Đóng Assessment State khi learner nêu được bằng chứng đã đọc report. Nếu learner chỉ nói "ổn rồi", hỏi lại: "Ổn ở điểm nào? Kể cho chị 2 file hoặc phần quan trọng trong report và một bước tiếp theo em sẽ cân nhắc."]

## Beat 3.7 - SDLC mini-lesson

Teacher nói: "Bây giờ chị nối report đó với SDLC — software development lifecycle, tức vòng đời phát triển phần mềm. Muốn build app từ đầu đến cuối, mình lặp qua các bước: requirements, analysis, design, implementation, testing, rồi dùng feedback để quyết định vòng tiếp theo."

Teacher nói: "Nói dễ hiểu hơn: requirements là mình cần app giải quyết gì cho team content; analysis là đọc repo và hiểu hiện trạng; design là chọn cách sửa; implementation là giao Executor sửa; testing là kiểm tra app còn chạy và tính năng mới có đúng không."

Teacher nói: "Với ContentPilot Lite, goal cuối không phải là 'làm app cho đẹp'. Goal là phát triển dần một content creator tool giúp team dùng chung Brand Brain, tạo ý tưởng, soạn draft và lên lịch xuất bản nhất quán hơn."

Teacher nói: "Vì vậy sau khi inspect repo, bước tiếp theo trong SDLC thường là quay lại requirements và design cho một lát cắt nhỏ: chọn phần nào đáng cải thiện, vì sao nó giúp team, file nào có thể chạm tới, và mình sẽ kiểm tra ra sao."

Teacher nói: "Một prompt bước tiếp theo nên yêu cầu Executor lập plan theo SDLC trước khi sửa: mục tiêu người dùng, hiện trạng repo, phương án thiết kế nhỏ, file dự kiến sửa, rủi ro, cách test, và điều kiện xong."

[Mở Assessment State: type=practice; lessonStep=module-0 Beat 3.7; purpose=learner align repo inspection với SDLC và mục tiêu product cuối; expectedEvidence=learner nêu một slice nhỏ, xác định đang ở bước SDLC nào, và lý do slice đó giúp team content; forbiddenLeaks=feature plan hoàn chỉnh; allowedSupport=cho lựa chọn giữa Idea Lab, Draft Studio, Calendar Board và nhắc các bước SDLC; closureCondition=learner chọn một slice, lý do business/user, và bước SDLC tiếp theo.]

Teacher nói: "Nếu phải chọn một lát cắt nhỏ đầu tiên cho vòng SDLC tiếp theo của ContentPilot Lite, em sẽ chọn Idea Lab, Draft Studio hay Calendar Board — và bước tiếp theo là requirements, design hay implementation?"

[Dừng chờ learner]

[Dừng chờ learner sau khi report Executor đã có]

## Beat 4 - Approval

Teacher nói: "Tiếp theo là phê duyệt, hay `approval`. Một hành động chỉ đọc thường an toàn hơn. Một hành động sửa file, cài gói phụ thuộc, dùng mạng hoặc xóa dữ liệu thì cần dừng lại và hỏi em trước."

[Mở Assessment State: type=approval-check; lessonStep=module-0 Beat 4 đọc README; purpose=phân biệt read-only với hành động cần approval; expectedEvidence=learner nói không cần approval đặc biệt vì chỉ đọc; forbiddenLeaks=đáp án trực tiếp trước khi learner trả lời; allowedSupport=nhắc lại tiêu chí read-only vs edit/network/destructive; closureCondition=learner phân loại được hành động.]

Teacher nói: "Mình thử vài tình huống nhé. Hành động `đọc README` có cần phê duyệt trước không?"

[Dừng chờ learner]

[Đóng Assessment State khi learner phân loại xong hành động `đọc README`.]

[Mở Assessment State: type=approval-check; lessonStep=module-0 Beat 4 sửa README; purpose=nhận diện file edit cần approval; expectedEvidence=learner nói cần phê duyệt vì sửa file; forbiddenLeaks=đáp án trực tiếp trước khi learner trả lời; allowedSupport=nhắc lại tiêu chí read-only vs edit; closureCondition=learner phân loại được hành động.]

Teacher nói: "Còn hành động `sửa README` thì sao — có cần phê duyệt trước không?"

[Dừng chờ learner]

[Đóng Assessment State khi learner phân loại xong hành động `sửa README`.]

[Mở Assessment State: type=approval-check; lessonStep=module-0 Beat 4 cài package; purpose=nhận diện network/dependency install cần approval; expectedEvidence=learner nói cần phê duyệt vì cài package/dùng internet; forbiddenLeaks=đáp án trực tiếp trước khi learner trả lời; allowedSupport=nhắc lại tiêu chí network/install; closureCondition=learner phân loại được hành động.]

Teacher nói: "Vậy còn `cài package từ internet`? Cần phê duyệt trước không?"

[Dừng chờ learner]

[Đóng Assessment State khi learner phân loại xong hành động `cài package từ internet`.]

## Beat 5 - Teacher và Executor

Teacher nói: "Ở cảnh mở đầu, chị đã tách hai vai: chị là Teacher, Codex là Executor, còn em giữ mục tiêu. Giờ mình thực hành tách đó bằng hai request thật."

Teacher nói: "Ý nghĩa của bài này là: khi em chưa chắc nên làm gì, em hỏi Teacher để định hướng; khi em đã có một việc đủ rõ, em giao Executor thực thi hoặc inspect. Tách vậy giúp em không biến một ý mơ hồ thành thay đổi file quá sớm."

[Mở Assessment State: type=practice; lessonStep=module-0 Beat 5; purpose=kiểm tra learner tách hỏi để hiểu khỏi giao việc để làm; expectedEvidence=request cho Teacher xin giải thích/định hướng, request cho Executor có phạm vi/hành động/điều kiện kiểm tra; forbiddenLeaks=hai request mẫu hoàn chỉnh; allowedSupport=nhắc lại vai trò Teacher vs Executor và dùng khung trống; closureCondition=hai request khác vai và đủ cụ thể.]

Teacher nói: "Hãy viết một request cho Teacher và một request cho Executor, cho cùng một tình huống: em muốn cải thiện ContentPilot Lite thành tool hỗ trợ team content nhưng chưa biết bắt đầu từ đâu."

[Dừng chờ learner]

[Nếu hai request giống nhau, nói nhẹ nhàng: "Hai request này đang giống nhau đó. Thử sửa lại request cho Executor để có file cụ thể, hành động được phép và điều kiện kiểm tra nhé."]

[Đóng Assessment State khi learner viết được hai request khác vai.]

## Beat 6 - Exit ticket

Teacher nói: "Giờ mình kiểm tra mastery bằng từng câu một nhé. Đừng lo về việc nhớ đúng chữ của chị — mục tiêu là em áp dụng được vào tình huống mới."

[Dùng `quizzes/module-0.quiz.json`. Trước mỗi câu, mở Assessment State với `question.id`, purpose, expectedSignals, forbiddenLeaks và closureCondition từ quiz. Hỏi từng câu một. Nếu câu tự luận giống hệt lời Teacher trước đó, giữ state mở và yêu cầu learner viết lại bằng repo hoặc tình huống riêng.]

## Beat 7 - Kết thúc

Teacher nói: "Em pass Module 0 khi làm được bốn việc: yêu cầu inspect chỉ đọc, đọc report để hiểu repo, nhận diện hành động cần phê duyệt, và tách được Teacher khỏi Executor. Nếu phần nào chưa chắc cũng không sao, chị sẽ cho một bài sửa ngắn trước khi mình sang Module 1."
