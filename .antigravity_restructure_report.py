from pathlib import Path

path = Path(r'D:\Loopy\baocao_final_text.md')
text = path.read_text(encoding='utf-8')
marker = '# CHƯƠNG 2. CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ SỬ DỤNG'
head = text.split(marker)[0].rstrip() + '\n\n'

new = '''# CHƯƠNG 2. CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ SỬ DỤNG

## 2.1. Tổng quan về website học lập trình trực tuyến

### 2.1.1. Khái niệm website học lập trình trực tuyến

Website học lập trình trực tuyến là hệ thống phần mềm hỗ trợ người học tiếp cận kiến thức lập trình thông qua môi trường web. Người học có thể xem nội dung bài học, thực hành viết mã nguồn, chạy chương trình và nhận phản hồi ngay trên trình duyệt.

Một nền tảng học lập trình trực tuyến thường bao gồm các thành phần chính:

- Nội dung bài học được tổ chức theo lộ trình.
- Trình soạn thảo mã nguồn để người học thực hành.
- Khu vực hiển thị kết quả chạy chương trình.
- Cơ chế kiểm tra bài làm hoặc test case tự động.
- Hệ thống lưu tiến độ học tập của người dùng.

### 2.1.2. Vai trò trong quá trình tự học lập trình

So với cách học chỉ dựa trên tài liệu hoặc video, website học lập trình có ưu điểm là kết hợp giữa lý thuyết và thực hành. Người học có thể đọc hướng dẫn, thử sửa code và quan sát kết quả ngay trong cùng một môi trường.

Đối với người mới bắt đầu, mô hình này giúp giảm một số rào cản ban đầu:

- Không cần tự cài đặt môi trường lập trình ngay từ đầu.
- Có lộ trình rõ ràng để biết nên học gì trước.
- Có phản hồi khi code chạy lỗi hoặc chưa đạt yêu cầu.
- Có thể theo dõi tiến độ học tập qua từng bài.

### 2.1.3. Định hướng áp dụng trong đề tài

Trong đề tài này, website học lập trình được định hướng theo mô hình học có hướng dẫn. Người học không chỉ xem danh sách bài học, mà được dẫn dắt qua một hành trình gồm lựa chọn ngôn ngữ, xem lộ trình, mở bài học, thực hành, chạy thử, kiểm tra và lưu tiến độ.

[Gợi ý chèn ảnh: Chèn ảnh trang Library hoặc Journey Map để minh họa mô hình học theo lộ trình sau mục 2.1.]

## 2.2. Đặc điểm của người mới học lập trình

### 2.2.1. Khó khăn về tư duy và cú pháp

Người mới học lập trình thường gặp khó khăn vì phải làm quen đồng thời với nhiều khái niệm mới như biến, kiểu dữ liệu, câu lệnh điều kiện, vòng lặp, hàm, nhập xuất dữ liệu và lỗi chương trình. Ngoài cú pháp, người học còn cần rèn luyện tư duy giải quyết vấn đề bằng thuật toán.

Các khó khăn phổ biến gồm:

- Không biết nên bắt đầu từ ngôn ngữ lập trình nào.
- Không hiểu mối liên hệ giữa code và output.
- Dễ nhầm lẫn giữa lỗi cú pháp và lỗi logic.
- Không biết cách đọc thông báo lỗi.
- Thiếu lộ trình học tập rõ ràng.

### 2.2.2. Nhu cầu về phản hồi rõ ràng

Trong quá trình học lập trình, phản hồi nhanh có vai trò rất quan trọng. Nếu chương trình sai nhưng người học không biết sai ở đâu, họ dễ nản chí hoặc chỉ sao chép lời giải mà không hiểu bản chất.

Do đó, hệ thống cần hỗ trợ:

- Hiển thị output khi chạy chương trình.
- Hiển thị lỗi khi code không thực thi được.
- Cho biết bài làm đã đạt hay chưa đạt yêu cầu.
- Phân biệt rõ thao tác thử nghiệm và thao tác đánh giá.

### 2.2.3. Nhu cầu về lộ trình học có cấu trúc

Người mới thường không phù hợp với một danh mục bài học quá dài và thiếu định hướng. Thay vào đó, nội dung nên được chia thành các phần nhỏ, có thứ tự từ cơ bản đến nâng cao.

Trong Loopy, định hướng này được thể hiện qua luồng học theo từng bước:

1. Quan sát ví dụ.
2. Thay đổi một phần nhỏ trong code.
3. Chạy thử để xem output.
4. Sửa lỗi để rèn kỹ năng debug.
5. Hoàn thành bài học sau khi tiến độ được lưu.

## 2.3. Kiến trúc ứng dụng web

### 2.3.1. Mô hình phân tách frontend, backend và database

Ứng dụng web hiện đại thường được xây dựng theo mô hình phân tách giữa giao diện, xử lý nghiệp vụ và lưu trữ dữ liệu. Trong đề tài này, hệ thống được chia thành ba thành phần chính:

| Thành phần | Vai trò chính |
|---|---|
| Frontend | Hiển thị giao diện, nhận thao tác của người dùng và gọi API |
| Backend | Xử lý nghiệp vụ, xác thực, kiểm tra bài làm và lưu tiến độ |
| Database | Lưu người dùng, bài học, test case, tiến độ và nội dung giao diện |

### 2.3.2. Lợi ích của kiến trúc phân tách

Cách tổ chức này phù hợp với đồ án vì mỗi thành phần có trách nhiệm rõ ràng:

- Frontend có thể tập trung vào trải nghiệm học tập.
- Backend tập trung vào logic nghiệp vụ và tính đúng đắn dữ liệu.
- Database lưu trữ dữ liệu tập trung, thuận tiện mở rộng nội dung.
- Các thành phần có thể phát triển và kiểm thử tương đối độc lập.

### 2.3.3. Áp dụng vào hệ thống Loopy

Trong Loopy, frontend cung cấp các trang như Landing, Languages, Library, Learn, Playground, Profile và Admin. Backend cung cấp API cho xác thực, bài học, chạy code, kiểm tra bài làm, lưu tiến độ và quản trị nội dung. Database lưu trữ các dữ liệu cốt lõi phục vụ quá trình học.

[Gợi ý chèn ảnh: Chèn sơ đồ kiến trúc tổng quan gồm Frontend, Backend, Database và dịch vụ chạy code sau mục 2.3.]

## 2.4. Frontend và trải nghiệm người dùng

### 2.4.1. Vai trò của frontend

Frontend là phần người dùng trực tiếp nhìn thấy và tương tác. Đối với website học lập trình, frontend không chỉ hiển thị nội dung mà còn điều phối trải nghiệm học tập qua từng thao tác.

Các nhiệm vụ chính của frontend gồm:

- Hiển thị trang giới thiệu và điều hướng ban đầu.
- Hiển thị danh sách ngôn ngữ và lộ trình học.
- Cung cấp màn hình học bài với editor và terminal.
- Gửi yêu cầu chạy thử, kiểm tra và hoàn thành bài học.
- Hiển thị trạng thái loading, lỗi, kết quả và tiến độ.

### 2.4.2. Yêu cầu trải nghiệm cho người mới

Vì đối tượng chính là người mới học lập trình, giao diện cần rõ ràng và hạn chế gây nhiễu. Người học phải biết mình đang ở bước nào, cần làm gì tiếp theo và kết quả thao tác vừa thực hiện là gì.

Một số yêu cầu quan trọng:

- Nút thao tác cần có nhãn dễ hiểu.
- Kết quả chạy code cần hiển thị gần khu vực thực hành.
- Lỗi cần được trình bày rõ ràng, tránh gây hoang mang.
- Trạng thái hoàn thành chỉ hiển thị sau khi backend lưu tiến độ thành công.

### 2.4.3. Các giao diện tiêu biểu

Các giao diện frontend quan trọng trong hệ thống gồm:

- Landing Page: giới thiệu định hướng sản phẩm.
- Languages Page: hiển thị các ngôn ngữ lập trình.
- Library Page: hiển thị lộ trình và tiến độ học.
- Learn Page: màn hình học bài và thực hành code.
- Playground: khu vực chạy thử code tự do.
- Profile: thông tin cá nhân và tiến độ.

[Gợi ý chèn ảnh: Chèn ảnh Landing, Library hoặc Learn sau mục 2.4.]

## 2.5. Backend và API

### 2.5.1. Vai trò của backend

Backend là thành phần xử lý nghiệp vụ phía sau giao diện. Khi người dùng đăng nhập, mở bài học, chạy code, kiểm tra bài làm hoặc lưu tiến độ, frontend sẽ gửi request đến backend để xử lý.

Backend có các vai trò chính:

- Xác thực người dùng và phân quyền.
- Cung cấp dữ liệu bài học cho frontend.
- Điều phối việc chạy mã nguồn.
- Kiểm tra bài làm theo luật hoặc test case.
- Lưu tiến độ học tập.
- Cung cấp API quản trị nội dung.

### 2.5.2. Các nhóm API chính

| Nhóm API | Mục đích |
|---|---|
| Auth API | Đăng ký, đăng nhập, lấy thông tin người dùng hiện tại |
| Lesson API | Lấy danh sách ngôn ngữ, chương và bài học |
| Execute API | Chạy thử mã nguồn và trả output/lỗi |
| Check API | Kiểm tra bài làm theo rule hoặc test case |
| Progress API | Lưu và truy xuất tiến độ học tập |
| Admin API | Quản lý bài học, test case và nội dung CMS |

### 2.5.3. Nguyên tắc dữ liệu đúng đắn

Một nguyên tắc quan trọng của hệ thống là không chỉ dựa vào trạng thái tạm thời trên frontend. Bài học chỉ được xem là hoàn thành khi backend lưu tiến độ thành công. Điều này giúp dữ liệu không bị sai lệch khi người dùng tải lại trang hoặc đăng nhập ở thiết bị khác.

[Gợi ý chèn ảnh: Chèn sơ đồ luồng gọi API giữa Frontend và Backend sau mục 2.5.]

## 2.6. Cơ sở dữ liệu trong hệ thống học lập trình

### 2.6.1. Vai trò của cơ sở dữ liệu

Cơ sở dữ liệu lưu trữ toàn bộ dữ liệu quan trọng của hệ thống. Đối với website học lập trình đa ngôn ngữ, dữ liệu không chỉ là tài khoản người dùng mà còn bao gồm nội dung học tập, test case, tiến độ và nội dung giao diện.

### 2.6.2. Các nhóm dữ liệu chính

| Nhóm dữ liệu | Ý nghĩa |
|---|---|
| Người dùng | Phục vụ đăng nhập, hồ sơ và cá nhân hóa |
| Ngôn ngữ lập trình | Đại diện cho các lộ trình học khác nhau |
| Chương học | Nhóm các bài học theo chủ đề |
| Bài học | Lưu nội dung, yêu cầu, mã nguồn ban đầu và metadata |
| Test case/luật kiểm tra | Dùng để đánh giá bài làm của người học |
| Tiến độ học tập | Ghi nhận bài học đã hoàn thành hoặc đang học |
| CMS content | Lưu nội dung giao diện theo khóa và ngôn ngữ |

### 2.6.3. Ý nghĩa đối với khả năng mở rộng

Khi dữ liệu học tập được tổ chức trong database, hệ thống có thể bổ sung ngôn ngữ, chương hoặc bài học mới mà không cần thay đổi lớn ở frontend. Đây là nền tảng quan trọng để Loopy phát triển thành một nền tảng học lập trình có nhiều nội dung hơn trong tương lai.

[Gợi ý chèn ảnh: Chèn ERD gồm User, Language, Chapter, Lesson, TestCase, Progress và CMS Content sau mục 2.6.]

## 2.7. Thực thi mã nguồn trực tuyến

### 2.7.1. Khái niệm thực thi mã nguồn trực tuyến

Thực thi mã nguồn trực tuyến cho phép người học viết hoặc chỉnh sửa code trên trình duyệt, sau đó gửi lên hệ thống để chạy và nhận kết quả. Chức năng này giúp người học thực hành ngay mà không cần cài đặt môi trường lập trình ban đầu.

### 2.7.2. Yêu cầu kỹ thuật

Việc chạy code do người dùng nhập cần được xử lý cẩn thận vì có thể phát sinh lỗi hoặc gây rủi ro cho hệ thống. Một môi trường thực thi phù hợp cần quan tâm đến:

- Giới hạn thời gian chạy.
- Giới hạn tài nguyên sử dụng.
- Cách ly môi trường thực thi với hệ thống chính.
- Trả về output hoặc lỗi một cách rõ ràng.

### 2.7.3. Phân biệt chạy thử và hoàn thành bài học

Trong phạm vi đề tài, chạy thử chỉ dùng để quan sát kết quả chương trình. Một chương trình có thể chạy được nhưng chưa chắc đã đáp ứng yêu cầu bài học. Vì vậy, chạy thử không đồng nghĩa với hoàn thành.

| Tiêu chí | Chạy thử |
|---|---|
| Mục đích | Xem chương trình có output gì |
| Dữ liệu đầu vào | Code và ngôn ngữ lập trình |
| Kết quả | Output hoặc lỗi thực thi |
| Tác động đến tiến độ | Không lưu hoàn thành bài học |

[Gợi ý chèn ảnh: Chèn ảnh Playground hoặc terminal trong Learn sau mục 2.7.]

## 2.8. Kiểm tra bài làm tự động

### 2.8.1. Khái niệm kiểm tra bài làm

Kiểm tra bài làm tự động là chức năng giúp hệ thống đánh giá code của người học mà không cần người hướng dẫn kiểm tra thủ công. Kết quả kiểm tra cần dựa trên tiêu chí rõ ràng để đảm bảo tính nhất quán.

### 2.8.2. Các hình thức kiểm tra

Một số hình thức kiểm tra có thể áp dụng trong hệ thống học lập trình:

- So sánh output thực tế với output mong đợi.
- Chạy chương trình với nhiều test case input/output.
- Kiểm tra sự xuất hiện của cú pháp hoặc cấu trúc code cần thiết.
- Áp dụng rule xác định cho từng bài học.

### 2.8.3. So sánh Chạy thử và Kiểm tra

| Tiêu chí | Chạy thử | Kiểm tra |
|---|---|---|
| Mục đích | Quan sát output | Đánh giá bài làm |
| Cơ sở xử lý | Thực thi code | Rule/test case/checker |
| Kết quả | Output hoặc lỗi | Đạt/chưa đạt và phản hồi |
| Ảnh hưởng tiến độ | Không ảnh hưởng | Có thể dẫn tới hoàn thành bài |
| Ý nghĩa học tập | Thử nghiệm và sửa lỗi | Xác nhận đạt yêu cầu |

### 2.8.4. Áp dụng trong đề tài

Trong Loopy, chức năng kiểm tra được định hướng theo hướng xác định và có thể lặp lại. Khi người học gửi bài, backend đánh giá theo luật hoặc test case, sau đó trả kết quả cho frontend. Nếu bài làm đạt, người học có thể chuyển sang bước hoàn thành và lưu tiến độ.

[Gợi ý chèn ảnh: Chèn sơ đồ luồng kiểm tra bài làm sau mục 2.8.]

## 2.9. Quản lý nội dung và hỗ trợ đa ngôn ngữ giao diện

### 2.9.1. Nhu cầu quản lý nội dung động

Nếu toàn bộ chữ hiển thị trên giao diện được viết cố định trong mã nguồn, việc cập nhật nội dung hoặc dịch sang ngôn ngữ khác sẽ khó khăn. Vì vậy, hệ thống cần có cơ chế quản lý nội dung động thông qua khóa nội dung.

### 2.9.2. Cơ chế CMS key-value

Trong hệ thống, nội dung giao diện có thể được lưu theo dạng khóa và giá trị. Frontend sử dụng khóa để lấy nội dung tương ứng. Cách làm này giúp người quản trị chỉnh sửa một số nội dung mà không cần sửa trực tiếp component frontend.

Ví dụ khái quát:

| Thành phần | Ý nghĩa |
|---|---|
| Content key | Định danh nội dung cần hiển thị |
| Value tiếng Việt | Nội dung hiển thị bằng tiếng Việt |
| Value tiếng Anh | Nội dung hiển thị bằng tiếng Anh |
| Frontend hook | Lấy nội dung theo key để render giao diện |

### 2.9.3. Phân biệt hai khái niệm đa ngôn ngữ

Trong đề tài cần phân biệt rõ:

- **Đa ngôn ngữ giao diện**: website có thể hiển thị nội dung bằng tiếng Việt hoặc tiếng Anh.
- **Đa ngôn ngữ lập trình**: hệ thống hỗ trợ học nhiều ngôn ngữ lập trình như Python, JavaScript hoặc các ngôn ngữ khác.

Đề tài hướng tới cả hai khía cạnh, nhưng trọng tâm chính là xây dựng nền tảng học được nhiều ngôn ngữ lập trình.

[Gợi ý chèn ảnh: Chèn ảnh Content Manager hoặc sơ đồ CMS key-value sau mục 2.9.]

## 2.10. Xác thực người dùng và quản lý phiên đăng nhập

### 2.10.1. Vai trò của xác thực người dùng

Xác thực người dùng giúp hệ thống xác định ai đang sử dụng website. Đây là điều kiện cần để lưu tiến độ học tập, hiển thị hồ sơ cá nhân và bảo vệ các chức năng cần quyền truy cập.

### 2.10.2. Quản lý phiên và điều hướng

Quản lý phiên đăng nhập cần đảm bảo người dùng có thể tiếp tục học sau khi tải lại trang, đồng thời vẫn bảo vệ các route riêng tư. Các trang như hồ sơ, tiến độ học tập và khu vực quản trị cần được kiểm soát quyền truy cập.

### 2.10.3. Phân quyền quản trị

Khu vực quản trị có quyền tác động đến nội dung bài học, test case và nội dung giao diện. Vì vậy, hệ thống cần tách biệt quyền của người học thông thường và quản trị viên để tránh thao tác sai hoặc truy cập trái phép.

## 2.11. Kết luận chương

Chương 2 đã trình bày các cơ sở lý thuyết và công nghệ nền tảng liên quan đến đề tài. Các nội dung chính gồm:

- Tổng quan website học lập trình trực tuyến.
- Đặc điểm của người mới học lập trình.
- Kiến trúc ứng dụng web gồm frontend, backend và database.
- Vai trò của API, cơ sở dữ liệu và xác thực người dùng.
- Chức năng chạy thử mã nguồn và kiểm tra bài làm tự động.
- Cơ chế quản lý nội dung động và hỗ trợ đa ngôn ngữ giao diện.

Những nội dung này là cơ sở để Chương 3 đi vào phân tích và thiết kế hệ thống Loopy cụ thể hơn.

---

# CHƯƠNG 3. PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG

## 3.1. Tổng quan hệ thống

### 3.1.1. Mục tiêu thiết kế hệ thống

Hệ thống được xây dựng trong đề tài là một website học lập trình đa ngôn ngữ, hướng tới nhóm người dùng mới bắt đầu. Mục tiêu thiết kế là tạo ra một môi trường học có lộ trình, có hướng dẫn, có thực hành code, có chạy thử, có kiểm tra bài làm và có lưu tiến độ.

### 3.1.2. Các nhóm người dùng chính

Hệ thống gồm hai nhóm người dùng chính:

| Nhóm người dùng | Vai trò |
|---|---|
| Người học | Học lập trình, thực hành code, kiểm tra bài làm và theo dõi tiến độ |
| Quản trị viên | Quản lý bài học, test case, nội dung giao diện và dữ liệu vận hành |

Ngoài ra, hệ thống còn tương tác với dịch vụ thực thi mã nguồn. Đây không phải là người dùng trực tiếp, nhưng là thành phần kỹ thuật quan trọng giúp chạy code và trả kết quả cho người học.

### 3.1.3. Các thành phần tổng quan

Về tổng thể, hệ thống gồm các thành phần:

- Frontend: giao diện và tương tác người dùng.
- Backend: xử lý nghiệp vụ và cung cấp API.
- Database: lưu trữ dữ liệu người dùng, bài học, test case, tiến độ và CMS.
- Code Execution Service: thực thi mã nguồn và trả output/lỗi.

[Gợi ý chèn ảnh: Chèn sơ đồ tổng quan hệ thống gồm Người học, Quản trị viên, Frontend, Backend, Database và dịch vụ chạy code sau mục 3.1.]

## 3.2. Tác nhân của hệ thống

### 3.2.1. Người học

Người học là đối tượng sử dụng chính của website. Các thao tác chính của người học gồm:

- Xem trang giới thiệu để hiểu mục tiêu hệ thống.
- Đăng ký, đăng nhập và duy trì phiên học tập.
- Lựa chọn ngôn ngữ lập trình phù hợp.
- Xem chương, bài học và trạng thái tiến độ.
- Mở bài học, đọc hướng dẫn và thực hành code.
- Chạy thử chương trình để quan sát output.
- Kiểm tra bài làm theo yêu cầu của bài học.
- Hoàn thành bài học và lưu tiến độ.

### 3.2.2. Quản trị viên

Quản trị viên là người có quyền truy cập khu vực quản trị. Các thao tác chính gồm:

- Quản lý ngôn ngữ lập trình, chương học và bài học.
- Cập nhật nội dung bài học, mã nguồn ban đầu và yêu cầu thực hành.
- Quản lý test case hoặc luật kiểm tra.
- Rà soát chất lượng nội dung học tập.
- Cập nhật nội dung giao diện thông qua Content Manager.

### 3.2.3. Dịch vụ thực thi mã nguồn

Dịch vụ thực thi mã nguồn nhận code từ backend, chạy trong môi trường được kiểm soát và trả kết quả. Thành phần này giúp website hỗ trợ thực hành trực tiếp thay vì chỉ cung cấp nội dung lý thuyết.

## 3.3. Yêu cầu chức năng

### 3.3.1. Chức năng dành cho người học

Các chức năng dành cho người học gồm:

- Xem trang giới thiệu và định hướng sản phẩm.
- Đăng ký, đăng nhập và duy trì phiên làm việc.
- Hoàn thành onboarding để chọn mục tiêu học.
- Xem danh sách ngôn ngữ lập trình.
- Xem lộ trình học theo chương và bài.
- Mở bài học và thực hành trong editor.
- Chạy thử mã nguồn để xem output.
- Kiểm tra bài làm bằng rule hoặc test case.
- Lưu tiến độ sau khi hoàn thành bài học.
- Xem hồ sơ và trạng thái học tập.

### 3.3.2. Chức năng dành cho quản trị viên

Các chức năng dành cho quản trị viên gồm:

- Đăng nhập vào khu vực quản trị.
- Xem dashboard tổng quan.
- Quản lý danh sách bài học.
- Chỉnh sửa nội dung bài học.
- Quản lý test case của từng bài.
- Nhập nội dung hàng loạt khi cần.
- Quản lý nội dung giao diện qua CMS.
- Theo dõi một số dữ liệu phục vụ vận hành.

### 3.3.3. Chức năng kỹ thuật hỗ trợ

Ngoài chức năng trực tiếp cho người dùng, hệ thống cần các chức năng kỹ thuật:

- API chạy code.
- API kiểm tra bài làm.
- API lưu tiến độ học tập.
- API lấy nội dung CMS.
- Cơ chế phân quyền người học/quản trị viên.

[Gợi ý chèn ảnh: Chèn sơ đồ Use Case tổng quát gồm tác nhân Người học và Quản trị viên sau mục 3.3.]

## 3.4. Yêu cầu phi chức năng

### 3.4.1. Yêu cầu về tính dễ sử dụng

Vì hệ thống hướng tới người mới học lập trình, giao diện cần dễ hiểu, thao tác rõ ràng và hạn chế gây nhầm lẫn. Đặc biệt, các nút như “Chạy thử”, “Kiểm tra” và “Hoàn thành” cần được phân biệt rõ.

### 3.4.2. Yêu cầu về tính đúng đắn dữ liệu

Tiến độ học tập chỉ được ghi nhận khi backend lưu thành công. Nếu chỉ cập nhật trạng thái ở frontend, dữ liệu có thể bị sai khi người dùng tải lại trang hoặc đăng nhập trên thiết bị khác.

### 3.4.3. Yêu cầu về khả năng mở rộng

Hệ thống cần có khả năng mở rộng nội dung học tập mà không phải sửa nhiều mã nguồn. Việc thêm ngôn ngữ, chương, bài học hoặc test case nên được hỗ trợ thông qua database và khu vực quản trị.

### 3.4.4. Yêu cầu về an toàn khi chạy code

Code do người dùng nhập cần được xử lý trong môi trường có kiểm soát. Hệ thống cần chú ý đến giới hạn thời gian chạy, giới hạn tài nguyên và trả lỗi rõ ràng nếu chương trình không thực thi được.

## 3.5. Thiết kế kiến trúc hệ thống

### 3.5.1. Kiến trúc nhiều lớp

Hệ thống được thiết kế theo kiến trúc nhiều lớp:

| Lớp | Vai trò |
|---|---|
| Lớp giao diện | Hiển thị trang, nhận thao tác và gọi API |
| Lớp nghiệp vụ | Xử lý xác thực, bài học, kiểm tra và tiến độ |
| Lớp dữ liệu | Lưu trữ thông tin hệ thống |
| Lớp dịch vụ phụ trợ | Thực thi mã nguồn và trả kết quả |

### 3.5.2. Luồng tương tác tổng quát

Một luồng tương tác điển hình trong hệ thống diễn ra như sau:

1. Người dùng thao tác trên frontend.
2. Frontend gửi request đến backend.
3. Backend kiểm tra dữ liệu và quyền truy cập.
4. Backend truy xuất database hoặc gọi dịch vụ thực thi code.
5. Backend trả kết quả cho frontend.
6. Frontend hiển thị kết quả cho người dùng.

### 3.5.3. Lý do lựa chọn kiến trúc này

Kiến trúc nhiều lớp giúp hệ thống:

- Dễ phân chia trách nhiệm giữa các thành phần.
- Dễ kiểm thử từng nhóm chức năng.
- Dễ mở rộng nội dung và nghiệp vụ trong tương lai.
- Phù hợp với mô hình website học lập trình có cả người học và quản trị viên.

[Gợi ý chèn ảnh: Chèn sơ đồ kiến trúc nhiều lớp sau mục 3.5.]

## 3.6. Thiết kế luồng học bài

### 3.6.1. Mục tiêu của luồng học

Luồng học bài là phần quan trọng nhất của hệ thống. Mục tiêu là giúp người mới tiếp cận bài học từng bước thay vì phải viết toàn bộ chương trình ngay từ đầu.

### 3.6.2. Các bước trong luồng học

Luồng học gồm 5 bước:

| Bước | Ý nghĩa |
|---|---|
| Quan sát | Xem code mẫu và hướng dẫn |
| Thay đổi | Sửa một phần code theo yêu cầu |
| Chạy thử | Thực thi code để xem output |
| Sửa lỗi | Thực hành đọc lỗi và debug |
| Hoàn thành | Lưu tiến độ sau khi đạt yêu cầu |

### 3.6.3. Nguyên tắc hoàn thành bài học

Bài học không được xem là hoàn thành ngay khi người học bấm nút hoặc khi code chạy ra output. Bài học chỉ hoàn thành khi:

1. Bài làm đạt yêu cầu kiểm tra.
2. Người học gửi yêu cầu hoàn thành.
3. Backend lưu tiến độ thành công.
4. Frontend cập nhật trạng thái sau khi nhận kết quả thành công.

[Gợi ý chèn ảnh: Chèn flowchart Mở bài → Sửa code → Chạy thử → Kiểm tra → Lưu tiến độ sau mục 3.6.]

## 3.7. Thiết kế luồng chạy thử mã nguồn

### 3.7.1. Mục đích của chạy thử

Chạy thử giúp người học quan sát chương trình hoạt động như thế nào. Đây là bước thử nghiệm, không phải bước đánh giá hoàn thành bài học.

### 3.7.2. Trình tự xử lý

Luồng chạy thử gồm các bước:

1. Người học nhập hoặc chỉnh sửa code.
2. Người học bấm “Chạy thử”.
3. Frontend gửi code và ngôn ngữ lập trình đến backend.
4. Backend chuyển code tới dịch vụ thực thi.
5. Dịch vụ thực thi trả output hoặc lỗi.
6. Frontend hiển thị kết quả trong terminal.

### 3.7.3. Kết quả trả về

Kết quả chạy thử có thể gồm:

- Output khi chương trình chạy thành công.
- Lỗi cú pháp hoặc lỗi runtime.
- Thông báo khi chương trình vượt giới hạn thời gian hoặc tài nguyên.

[Gợi ý chèn ảnh: Chèn sơ đồ tuần tự cho chức năng Chạy thử sau mục 3.7.]

## 3.8. Thiết kế luồng kiểm tra bài làm

### 3.8.1. Mục đích của kiểm tra bài làm

Kiểm tra bài làm dùng để xác định code của người học có đáp ứng yêu cầu bài học hay không. Đây là bước đánh giá dựa trên tiêu chí xác định.

### 3.8.2. Trình tự xử lý

Luồng kiểm tra gồm các bước:

1. Người học bấm “Kiểm tra”.
2. Frontend gửi code, ngôn ngữ và thông tin bài học đến backend.
3. Backend lấy rule hoặc test case tương ứng.
4. Backend đánh giá bài làm.
5. Backend trả kết quả đạt/chưa đạt và phản hồi.
6. Nếu đạt, người học có thể chuyển sang bước hoàn thành.

### 3.8.3. Lưu tiến độ sau kiểm tra

Khi bài làm đạt, hệ thống chưa nên tự coi bài học là hoàn thành nếu progress chưa được lưu. Bước lưu tiến độ cần được xử lý qua backend để đảm bảo dữ liệu học tập chính xác.

[Gợi ý chèn ảnh: Chèn sơ đồ tuần tự cho chức năng Kiểm tra và Hoàn thành bài học sau mục 3.8.]

## 3.9. Thiết kế dữ liệu

### 3.9.1. Các thực thể chính

Dữ liệu hệ thống xoay quanh các thực thể:

- User.
- Language.
- Chapter.
- Lesson.
- TestCase hoặc ValidationRule.
- Progress.
- CMS Content.

### 3.9.2. Quan hệ giữa các thực thể

Các quan hệ chính có thể mô tả như sau:

| Quan hệ | Ý nghĩa |
|---|---|
| Language - Chapter | Một ngôn ngữ có nhiều chương |
| Chapter - Lesson | Một chương có nhiều bài học |
| Lesson - TestCase | Một bài học có thể có nhiều test case |
| User - Progress | Một người dùng có nhiều bản ghi tiến độ |
| Lesson - Progress | Tiến độ gắn với từng bài học cụ thể |
| CMS Content - Language UI | Nội dung giao diện theo từng ngôn ngữ hiển thị |

### 3.9.3. Ý nghĩa của thiết kế dữ liệu

Thiết kế dữ liệu theo cấu trúc này giúp hệ thống dễ mở rộng nội dung học tập. Khi cần thêm ngôn ngữ hoặc bài học, quản trị viên có thể cập nhật dữ liệu thay vì phải thay đổi nhiều logic giao diện.

[Gợi ý chèn ảnh: Chèn ERD hoặc sơ đồ quan hệ dữ liệu sau mục 3.9.]

## 3.10. Thiết kế giao diện chính

### 3.10.1. Nhóm giao diện dành cho người học

Các giao diện dành cho người học gồm:

- Landing Page: giới thiệu sản phẩm.
- Auth Page: đăng nhập và đăng ký.
- Onboarding Page: chọn mục tiêu và lộ trình.
- Languages Page: chọn ngôn ngữ lập trình.
- Library Page: xem hành trình học.
- Learn Page: học bài và thực hành code.
- Playground: chạy thử code tự do.
- Profile Page: xem hồ sơ và tiến độ.

### 3.10.2. Nhóm giao diện dành cho quản trị viên

Các giao diện quản trị gồm:

- Admin Dashboard.
- Lessons Management.
- Lesson Editor.
- Test Case Manager.
- Content Manager.
- Bulk Import hoặc các công cụ hỗ trợ nội dung.

### 3.10.3. Nguyên tắc thiết kế giao diện

Giao diện cần đảm bảo:

- Dễ hiểu với người mới.
- Hành động chính rõ ràng.
- Trạng thái loading/error/success dễ nhận biết.
- Màn học ưu tiên không gian cho editor và terminal.
- Không gây nhầm lẫn giữa chạy thử và kiểm tra.

[Gợi ý chèn ảnh: Chèn ảnh Landing, Languages, Library, Learn, Playground, Profile và Admin sau mục 3.10.]

## 3.11. Kết luận chương

Chương 3 đã trình bày phần phân tích và thiết kế hệ thống. Nội dung chính bao gồm:

- Tổng quan hệ thống và các tác nhân.
- Yêu cầu chức năng và phi chức năng.
- Kiến trúc nhiều lớp.
- Luồng học bài, chạy thử và kiểm tra.
- Thiết kế dữ liệu và giao diện chính.

Các nội dung này là cơ sở để Chương 4 trình bày quá trình xây dựng và triển khai hệ thống.

---

# CHƯƠNG 4. XÂY DỰNG VÀ TRIỂN KHAI HỆ THỐNG

## 4.1. Tổng quan quá trình xây dựng

### 4.1.1. Định hướng triển khai

Sau khi xác định mục tiêu và thiết kế hệ thống, đề tài được triển khai theo hướng phát triển từng module. Các luồng phục vụ người học được ưu tiên trước, sau đó mở rộng sang khu vực quản trị và quản lý nội dung.

### 4.1.2. Các thành phần được xây dựng

Hệ thống gồm các thành phần triển khai chính:

- Frontend cho giao diện người học và quản trị viên.
- Backend cung cấp API và xử lý nghiệp vụ.
- Database lưu dữ liệu người dùng, nội dung học và tiến độ.
- Dịch vụ thực thi mã nguồn phục vụ chạy thử và kiểm tra.

### 4.1.3. Các luồng ưu tiên

Trong quá trình xây dựng, các luồng được ưu tiên gồm:

1. Truy cập trang giới thiệu.
2. Đăng nhập/đăng ký.
3. Chọn ngôn ngữ lập trình.
4. Xem thư viện bài học.
5. Mở bài học và thực hành.
6. Chạy thử code.
7. Kiểm tra bài làm.
8. Lưu tiến độ.
9. Quản trị nội dung học tập.

[Gợi ý chèn ảnh: Chèn ảnh cấu trúc thư mục hoặc sơ đồ các thành phần triển khai sau mục 4.1.]

## 4.2. Xây dựng frontend

### 4.2.1. Các trang chính của frontend

Frontend được xây dựng để người dùng tương tác trực tiếp với hệ thống. Các trang chính gồm:

- Trang giới thiệu.
- Trang đăng nhập/đăng ký.
- Trang onboarding.
- Trang danh sách ngôn ngữ.
- Trang thư viện bài học.
- Màn hình học bài.
- Playground.
- Trang hồ sơ người dùng.
- Trang tài liệu.
- Khu vực quản trị.

### 4.2.2. Tổ chức trải nghiệm học tập

Frontend không chỉ hiển thị nội dung mà còn dẫn dắt người học theo hành trình. Người học bắt đầu từ trang giới thiệu, chọn lộ trình, mở bài học và thực hành trong màn hình Learn.

Các yếu tố được chú trọng:

- Điều hướng rõ ràng.
- Trạng thái bài học dễ hiểu.
- Editor và terminal đặt trong cùng luồng học.
- Phản hồi sau mỗi thao tác chạy thử hoặc kiểm tra.

### 4.2.3. Màn hình học bài

Màn hình học bài là giao diện quan trọng nhất. Giao diện này kết hợp:

- Nội dung hướng dẫn.
- Trình soạn thảo code.
- Terminal hiển thị output/lỗi.
- Các bước học.
- Nút chạy thử, kiểm tra và hoàn thành.

[Gợi ý chèn ảnh: Chèn ảnh Landing, Languages, Library và Learn sau mục 4.2.]

## 4.3. Xây dựng luồng học 5 bước

### 4.3.1. Lý do xây dựng luồng 5 bước

Luồng 5 bước được xây dựng để giúp người mới học lập trình tiếp cận bài học từng phần. Thay vì yêu cầu người học viết toàn bộ chương trình ngay, hệ thống cho phép họ quan sát, thay đổi, chạy thử, sửa lỗi và hoàn thành.

### 4.3.2. Mô tả từng bước

| Bước | Mô tả |
|---|---|
| Quan sát | Người học xem code mẫu và hướng dẫn |
| Thay đổi | Người học chỉnh sửa code theo yêu cầu nhỏ |
| Chạy thử | Người học chạy chương trình để xem output |
| Sửa lỗi | Người học xử lý lỗi và rèn kỹ năng debug |
| Hoàn thành | Hệ thống lưu tiến độ sau khi đạt yêu cầu |

### 4.3.3. Ý nghĩa đối với người học

Luồng này giúp người học:

- Không bị quá tải khi bắt đầu bài mới.
- Hiểu code mẫu trước khi sửa.
- Có cơ hội thử sai qua thao tác chạy thử.
- Rèn kỹ năng debug từ sớm.
- Hiểu rằng hoàn thành bài học cần có kiểm tra và lưu tiến độ.

[Gợi ý chèn ảnh: Chèn ảnh màn hình Learn thể hiện 5 bước hoặc sơ đồ 5 bước sau mục 4.3.]

## 4.4. Xây dựng backend và API

### 4.4.1. Các nhóm API đã triển khai

Backend cung cấp các nhóm API chính:

| Nhóm API | Chức năng |
|---|---|
| Auth | Xác thực và lấy thông tin người dùng |
| Lessons | Lấy dữ liệu ngôn ngữ, chương và bài học |
| Execute | Chạy thử mã nguồn |
| Check | Kiểm tra bài làm |
| Progress | Lưu và đọc tiến độ học tập |
| Admin | Quản lý nội dung, bài học và test case |
| CMS | Quản lý nội dung giao diện động |

### 4.4.2. Xử lý nghiệp vụ học tập

Các nghiệp vụ quan trọng được xử lý ở backend gồm:

- Kiểm tra người dùng đã xác thực hay chưa.
- Lấy bài học và tiêu chí kiểm tra từ database.
- Điều phối việc chạy code.
- Kiểm tra bài làm theo rule hoặc test case.
- Lưu tiến độ học tập sau khi hoàn thành.

### 4.4.3. Vai trò của backend trong tính nhất quán dữ liệu

Backend giữ vai trò quyết định trong việc lưu tiến độ. Frontend chỉ hiển thị hoàn thành sau khi backend trả về kết quả lưu thành công. Cách làm này giúp tránh trạng thái sai lệch giữa giao diện và dữ liệu thực tế.

[Gợi ý chèn ảnh: Chèn sơ đồ nhóm API backend sau mục 4.4.]

## 4.5. Xây dựng chức năng chạy thử mã nguồn

### 4.5.1. Mục tiêu chức năng

Chức năng chạy thử giúp người học thực thi code và quan sát output. Đây là công cụ để người học thử nghiệm, phát hiện lỗi và hiểu cách chương trình hoạt động.

### 4.5.2. Quy trình thực hiện

Quy trình chạy thử gồm:

1. Người học viết hoặc sửa code.
2. Người học bấm “Chạy thử”.
3. Frontend gửi code đến backend.
4. Backend chuyển yêu cầu đến dịch vụ thực thi.
5. Kết quả được trả về terminal.

### 4.5.3. Phân biệt với kiểm tra bài làm

Chạy thử không đánh giá bài làm đạt hay chưa đạt. Người học có thể chạy thử nhiều lần mà không ảnh hưởng đến tiến độ. Đây là điểm khác biệt quan trọng so với chức năng kiểm tra.

[Gợi ý chèn ảnh: Chèn ảnh Playground hoặc terminal hiển thị output sau mục 4.5.]

## 4.6. Xây dựng chức năng kiểm tra bài làm và lưu tiến độ

### 4.6.1. Kiểm tra bài làm

Khi người học bấm “Kiểm tra”, backend đánh giá bài làm theo tiêu chí của bài học. Tiêu chí có thể là output mong đợi, test case hoặc rule kiểm tra.

### 4.6.2. Các dạng kiểm tra

| Dạng kiểm tra | Ý nghĩa |
|---|---|
| Output | So sánh kết quả chương trình |
| Test case | Chạy nhiều bộ input/output |
| Rule | Kiểm tra điều kiện cụ thể trong code hoặc kết quả |
| Regex/exact | So khớp kết quả hoặc nội dung theo mẫu |

### 4.6.3. Lưu tiến độ

Sau khi bài làm đạt, người học chuyển sang bước hoàn thành. Hệ thống gửi yêu cầu lưu tiến độ đến backend. Nếu backend lưu thành công, frontend mới cập nhật trạng thái hoàn thành.

Nguyên tắc này giúp đảm bảo:

- Không ghi nhận sai tiến độ.
- Không celebration trước khi dữ liệu được lưu.
- Trạng thái học tập vẫn đúng khi người dùng tải lại trang.

[Gợi ý chèn ảnh: Chèn ảnh kết quả kiểm tra bài làm hoặc sơ đồ lưu tiến độ sau mục 4.6.]

## 4.7. Xây dựng cơ sở dữ liệu

### 4.7.1. Nhóm dữ liệu học tập

Dữ liệu học tập được tổ chức theo cấu trúc:

- Ngôn ngữ lập trình.
- Chương học.
- Bài học.
- Nội dung hướng dẫn.
- Mã nguồn ban đầu.
- Yêu cầu bài học.

### 4.7.2. Nhóm dữ liệu kiểm tra và tiến độ

Dữ liệu kiểm tra gồm test case hoặc luật kiểm tra tương ứng với từng bài học. Backend sử dụng dữ liệu này để đánh giá bài làm.

Dữ liệu tiến độ lưu trạng thái học tập của từng người dùng. Đây là cơ sở để hiển thị bài đã hoàn thành, bài đang học và bài tiếp theo.

### 4.7.3. Nhóm dữ liệu nội dung giao diện

Dữ liệu nội dung giao diện được lưu theo dạng key-value. Nhờ đó, một số nội dung trên giao diện có thể được cập nhật thông qua Content Manager hoặc file seed.

[Gợi ý chèn ảnh: Chèn ERD hoặc ảnh các bảng dữ liệu chính sau mục 4.7.]

## 4.8. Xây dựng khu vực quản trị

### 4.8.1. Mục tiêu khu vực quản trị

Khu vực quản trị giúp quản trị viên cập nhật nội dung học tập và vận hành hệ thống mà không cần chỉnh sửa trực tiếp mã nguồn.

### 4.8.2. Các chức năng quản trị chính

Các chức năng chính gồm:

- Dashboard tổng quan.
- Quản lý danh sách bài học.
- Chỉnh sửa nội dung bài học.
- Quản lý test case.
- Nhập dữ liệu hàng loạt.
- Quản lý nội dung giao diện.
- Theo dõi một số dữ liệu phục vụ kiểm tra chất lượng nội dung.

### 4.8.3. Ý nghĩa đối với vận hành

Khu vực quản trị giúp hệ thống dễ mở rộng và bảo trì hơn. Khi cần sửa bài học, cập nhật test case hoặc thay đổi nội dung giao diện, quản trị viên có thể thao tác qua giao diện thay vì sửa trực tiếp trong code.

[Gợi ý chèn ảnh: Chèn ảnh Admin Dashboard, Lessons Page, Lesson Editor, Test Case Manager hoặc Content Manager sau mục 4.8.]

## 4.9. Xây dựng chức năng onboarding và điều hướng sau đăng nhập

### 4.9.1. Mục tiêu onboarding

Onboarding giúp người dùng mới chọn mục tiêu, kinh nghiệm và lộ trình ban đầu. Điều này phù hợp với định hướng newbie-first của hệ thống.

### 4.9.2. Luồng xử lý

Luồng onboarding có thể mô tả như sau:

1. Người dùng chọn mục tiêu học tập.
2. Người dùng chọn mức độ kinh nghiệm.
3. Hệ thống gợi ý hoặc điều hướng đến lộ trình phù hợp.
4. Nếu chưa đăng nhập, người dùng được chuyển đến trang xác thực.
5. Sau khi đăng nhập, người dùng quay lại nội dung phù hợp.

### 4.9.3. Ý nghĩa trải nghiệm

Việc giữ đúng ngữ cảnh sau đăng nhập giúp người dùng không phải lặp lại các bước đã chọn. Đây là yếu tố quan trọng để giảm ma sát trong trải nghiệm ban đầu.

[Gợi ý chèn ảnh: Chèn flowchart Onboarding → Auth → Library/Lộ trình đã chọn sau mục 4.9.]

## 4.10. Xây dựng chức năng quản lý nội dung động

### 4.10.1. Cơ chế hoạt động

Các nội dung giao diện được định danh bằng key. Frontend sử dụng key để lấy nội dung tương ứng từ dữ liệu đã đồng bộ.

### 4.10.2. Lợi ích

Cơ chế này giúp:

- Giảm hardcode nội dung trong component.
- Cập nhật câu chữ nhanh hơn.
- Chuẩn bị nền tảng cho đa ngôn ngữ giao diện.
- Cho phép quản trị viên chỉnh sửa một số nội dung mà không cần deploy frontend.

### 4.10.3. Giới hạn trong phạm vi đồ án

Trong phạm vi đồ án, CMS chủ yếu phục vụ nội dung giao diện và một số nội dung quản trị. Hệ thống vẫn cần tiếp tục hoàn thiện nếu muốn hỗ trợ đầy đủ workflow biên tập nội dung ở quy mô lớn.

[Gợi ý chèn ảnh: Chèn ảnh Content Manager hoặc sơ đồ key-value CMS sau mục 4.10.]

## 4.11. Kiểm thử trong quá trình xây dựng

### 4.11.1. Kiểm thử frontend

Frontend được kiểm tra qua:

- Lint để phát hiện lỗi cú pháp/quy tắc code.
- Build để kiểm tra khả năng đóng gói.
- Kiểm thử thủ công các luồng chính trên giao diện.

### 4.11.2. Kiểm thử backend

Backend được kiểm tra qua:

- Lint.
- Build.
- Unit/integration test cho các chức năng quan trọng.
- Kiểm tra API chạy code, kiểm tra bài làm và lưu tiến độ.

### 4.11.3. Các luồng được chú ý

Các luồng cần kiểm thử kỹ gồm:

- Đăng nhập và duy trì phiên.
- Onboarding và điều hướng sau đăng nhập.
- Chạy thử code.
- Kiểm tra bài làm.
- Lưu tiến độ sau khi hoàn thành.
- Quản lý bài học và test case trong admin.

[Gợi ý chèn ảnh: Chèn ảnh terminal chạy lệnh kiểm thử/build thành công hoặc bảng kết quả kiểm thử sau mục 4.11.]

## 4.12. Kết luận chương

Chương 4 đã trình bày quá trình xây dựng các thành phần chính của hệ thống:

- Frontend phục vụ trải nghiệm người học.
- Backend xử lý nghiệp vụ và API.
- Database lưu nội dung, test case và tiến độ.
- Dịch vụ thực thi mã nguồn.
- Khu vực quản trị và CMS.
- Các bước kiểm thử trong quá trình phát triển.

Từ kết quả xây dựng này, Chương 5 sẽ trình bày kết quả đạt được và đánh giá hệ thống.

---

# CHƯƠNG 5. KẾT QUẢ THỰC HIỆN VÀ ĐÁNH GIÁ HỆ THỐNG

## 5.1. Tổng quan kết quả thực hiện

### 5.1.1. Kết quả chung

Sau quá trình phân tích, thiết kế và xây dựng, đề tài đã hoàn thành một website học lập trình đa ngôn ngữ ở mức nguyên mẫu hoàn chỉnh. Hệ thống đáp ứng các mục tiêu cơ bản: có lộ trình học, có thực hành code, có chạy thử, có kiểm tra bài làm, có lưu tiến độ và có khu vực quản trị.

### 5.1.2. Kết quả theo nhóm người dùng

| Nhóm | Kết quả đạt được |
|---|---|
| Người học | Có thể đăng nhập, chọn lộ trình, học bài, chạy thử, kiểm tra và lưu tiến độ |
| Quản trị viên | Có thể quản lý bài học, test case và nội dung giao diện |
| Hệ thống | Có kiến trúc frontend/backend/database và API phục vụ các luồng chính |

### 5.1.3. Ý nghĩa của kết quả

Kết quả này cho thấy hệ thống đã thể hiện được định hướng xây dựng một nền tảng học lập trình có tính thực hành và có phản hồi, thay vì chỉ là một website liệt kê nội dung học tập.

[Gợi ý chèn ảnh: Chèn ảnh tổng hợp các màn hình chính hoặc Landing Page sau mục 5.1.]

## 5.2. Kết quả giao diện người dùng

### 5.2.1. Các giao diện đã xây dựng

Các giao diện chính đã được xây dựng gồm:

- Landing Page.
- Auth Page.
- Onboarding Page.
- Languages Page.
- Library Page.
- Learn Page.
- Playground.
- Profile Page.
- Docs Page.
- Admin Pages.

### 5.2.2. Đánh giá giao diện người học

Giao diện người học được tổ chức theo hành trình. Người dùng mới có thể đi từ trang giới thiệu đến lựa chọn lộ trình và mở bài học cụ thể.

Các điểm đáng chú ý:

- Trang giới thiệu làm rõ định hướng học có hướng dẫn.
- Trang thư viện hiển thị trạng thái bài học.
- Màn hình Learn gom nội dung, editor, terminal và thao tác chính.
- Playground hỗ trợ thử nghiệm code ngoài bài học.

### 5.2.3. Gợi ý hình ảnh minh họa

Nên ưu tiên chèn các ảnh:

1. Landing Page.
2. Library/Journey Map.
3. Learn Page.
4. Playground.
5. Admin Dashboard hoặc Lesson Editor.

[Gợi ý chèn ảnh: Chèn lần lượt ảnh Landing, Library, Learn và Playground sau mục 5.2.]

## 5.3. Kết quả chức năng học bài

### 5.3.1. Luồng học 5 bước

Chức năng học bài đã được triển khai theo 5 bước:

| Bước | Kết quả |
|---|---|
| Quan sát | Người học xem code mẫu và hướng dẫn |
| Thay đổi | Người học chỉnh sửa code theo yêu cầu |
| Chạy thử | Người học xem output hoặc lỗi |
| Sửa lỗi | Người học thực hành debug |
| Hoàn thành | Tiến độ được lưu sau khi backend xử lý thành công |

### 5.3.2. Ý nghĩa học tập

Luồng này giúp người học tiếp cận kiến thức theo từng bước nhỏ. Thay vì chỉ đọc lý thuyết, người học được tương tác với mã nguồn và nhận phản hồi trong quá trình học.

### 5.3.3. Điểm cần lưu ý

Bài học chỉ được xem là hoàn thành khi backend lưu tiến độ thành công. Đây là nguyên tắc quan trọng để đảm bảo dữ liệu học tập chính xác.

[Gợi ý chèn ảnh: Chèn ảnh Learn Page hiển thị 5 bước hoặc trạng thái hoàn thành bài học sau mục 5.3.]

## 5.4. Kết quả chức năng chạy thử và kiểm tra bài làm

### 5.4.1. Kết quả chức năng chạy thử

Chức năng chạy thử cho phép người học gửi code để thực thi và nhận output. Kết quả có thể là output chương trình hoặc thông báo lỗi.

### 5.4.2. Kết quả chức năng kiểm tra

Chức năng kiểm tra đánh giá bài làm theo luật hoặc test case. Nếu bài làm chưa đạt, hệ thống trả phản hồi để người học tiếp tục sửa. Nếu đạt, người học có thể chuyển sang bước hoàn thành.

### 5.4.3. So sánh kết quả hai chức năng

| Nội dung | Chạy thử | Kiểm tra |
|---|---|---|
| Mục đích | Quan sát output | Đánh giá bài làm |
| Kết quả chính | Output/lỗi | Đạt/chưa đạt |
| Tác động tiến độ | Không ảnh hưởng | Có thể dẫn tới lưu tiến độ |
| Vai trò trong học tập | Thử nghiệm | Xác nhận đáp ứng yêu cầu |

[Gợi ý chèn ảnh: Chèn ảnh terminal chạy thử và ảnh kết quả kiểm tra bài làm sau mục 5.4.]

## 5.5. Kết quả chức năng quản lý tiến độ học tập

### 5.5.1. Cách lưu tiến độ

Tiến độ học tập được lưu thông qua backend sau khi người học hoàn thành bài học. Dữ liệu này được sử dụng để hiển thị trạng thái bài học trong thư viện và hồ sơ người dùng.

### 5.5.2. Ý nghĩa của tiến độ học tập

Chức năng này giúp người học:

- Biết bài nào đã hoàn thành.
- Biết bài nào đang học.
- Tiếp tục hành trình học ở lần truy cập sau.
- Không bị mất dữ liệu khi tải lại trang.

### 5.5.3. Đảm bảo tính đúng đắn

Hệ thống không ghi nhận hoàn thành nếu backend chưa lưu tiến độ thành công. Điều này giúp tránh sai lệch giữa giao diện và dữ liệu thực tế.

[Gợi ý chèn ảnh: Chèn ảnh Library hiển thị bài đã hoàn thành/đang học hoặc ảnh Profile hiển thị tiến độ sau mục 5.5.]

## 5.6. Kết quả khu vực quản trị

### 5.6.1. Các chức năng đã có

Khu vực quản trị hỗ trợ:

- Xem dashboard tổng quan.
- Quản lý danh sách bài học.
- Tìm kiếm và rà soát bài học.
- Mở trình chỉnh sửa bài học.
- Quản lý test case.
- Quản lý nội dung giao diện.
- Nhập dữ liệu nội dung khi cần.

### 5.6.2. Ý nghĩa đối với quản lý nội dung

Khu vực quản trị giúp quá trình cập nhật nội dung học tập thuận tiện hơn. Quản trị viên có thể chỉnh sửa bài học hoặc test case mà không cần thao tác trực tiếp trong cơ sở dữ liệu.

### 5.6.3. Ý nghĩa đối với mở rộng hệ thống

Khi số lượng bài học tăng, khu vực quản trị là nền tảng quan trọng để duy trì chất lượng nội dung, cập nhật bài học và kiểm tra các tiêu chí đánh giá.

[Gợi ý chèn ảnh: Chèn ảnh Admin Dashboard, Admin Lessons, Lesson Editor, Test Case Manager và Content Manager sau mục 5.6.]

## 5.7. Kết quả kiểm thử hệ thống

### 5.7.1. Kiểm thử frontend

Frontend được kiểm thử thông qua:

- Kiểm tra giao diện và điều hướng.
- Kiểm tra các trạng thái loading/error/success.
- Chạy lint để phát hiện lỗi quy tắc code.
- Chạy build để kiểm tra khả năng đóng gói.

### 5.7.2. Kiểm thử backend

Backend được kiểm thử thông qua:

- Lint.
- Build.
- Test các service/API quan trọng.
- Kiểm tra luồng chạy code, kiểm tra bài làm và lưu tiến độ.

### 5.7.3. Bảng kiểm thử chức năng tiêu biểu

| Chức năng | Kết quả mong muốn |
|---|---|
| Đăng nhập | Người dùng vào được khu vực cần xác thực |
| Onboarding | Người dùng được điều hướng đến lộ trình phù hợp |
| Chạy thử | Terminal hiển thị output hoặc lỗi |
| Kiểm tra | Hệ thống trả đạt/chưa đạt theo tiêu chí |
| Hoàn thành bài | Backend lưu tiến độ thành công |
| Admin lesson | Quản trị viên xem và chỉnh sửa bài học |
| CMS content | Nội dung giao diện có thể cập nhật theo key |

[Gợi ý chèn ảnh: Chèn ảnh kết quả chạy lệnh kiểm thử frontend/backend hoặc bảng kiểm thử sau mục 5.7.]

## 5.8. Đánh giá ưu điểm của hệ thống

### 5.8.1. Ưu điểm về trải nghiệm học tập

Hệ thống có định hướng rõ ràng cho người mới học lập trình. Người học được dẫn dắt qua lộ trình và từng bước thực hành thay vì phải tự chọn từ danh sách nội dung rời rạc.

### 5.8.2. Ưu điểm về logic học tập

Các ưu điểm nổi bật gồm:

- Phân biệt rõ `Chạy thử` và `Kiểm tra`.
- Có luồng học 5 bước phù hợp với người mới.
- Có kiểm tra bài làm dựa trên tiêu chí xác định.
- Chỉ hoàn thành bài học sau khi lưu tiến độ thành công.

### 5.8.3. Ưu điểm về khả năng mở rộng

Hệ thống có khu vực quản trị và cơ chế CMS, giúp việc cập nhật nội dung linh hoạt hơn. Cấu trúc dữ liệu theo ngôn ngữ, chương và bài học cũng tạo nền tảng để mở rộng nội dung sau này.

## 5.9. Hạn chế của hệ thống

### 5.9.1. Hạn chế về quy mô nội dung

Số lượng bài học và ngôn ngữ lập trình trong giai đoạn đồ án vẫn cần được mở rộng thêm. Một nền tảng hoàn chỉnh cần nhiều lộ trình, nhiều cấp độ và nhiều dạng bài thực hành hơn.

### 5.9.2. Hạn chế về kiểm tra bài làm

Bộ kiểm tra hiện chủ yếu dựa trên rule hoặc test case được định nghĩa sẵn. Với bài tập phức tạp hơn, hệ thống cần thêm các dạng kiểm tra chặt chẽ hơn để đánh giá nhiều tình huống.

### 5.9.3. Hạn chế về chức năng debug

Chức năng sửa lỗi trong luồng học còn có thể cải tiến. Mỗi bài học nên có dữ liệu debug riêng như mã nguồn lỗi, mô tả lỗi, gợi ý và luật kiểm tra tương ứng.

### 5.9.4. Hạn chế về kiểm thử thực tế

Hệ thống vẫn cần được kiểm thử thêm với nhiều người dùng, nhiều dữ liệu bài học và nhiều tình huống sử dụng khác nhau để đánh giá độ ổn định và khả năng mở rộng.

## 5.10. Kết luận chương

Chương 5 đã trình bày kết quả thực hiện và đánh giá hệ thống. Các kết quả chính gồm:

- Hoàn thành các giao diện chính cho người học.
- Triển khai luồng học 5 bước.
- Phân biệt rõ chạy thử và kiểm tra.
- Lưu tiến độ học tập qua backend.
- Có khu vực quản trị bài học, test case và nội dung giao diện.

Bên cạnh đó, chương cũng chỉ ra các hạn chế về quy mô nội dung, độ sâu kiểm tra bài làm, dữ liệu debug và kiểm thử thực tế. Đây là cơ sở để đề xuất hướng phát triển trong Chương 6.

---

# CHƯƠNG 6. KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

## 6.1. Kết luận

### 6.1.1. Tổng kết mục tiêu đề tài

Đề tài “Xây dựng website học lập trình đa ngôn ngữ” được thực hiện nhằm xây dựng một nền tảng học lập trình trực tuyến phù hợp với người mới bắt đầu. Hệ thống tập trung vào học theo lộ trình, thực hành trực tiếp, chạy thử mã nguồn, kiểm tra bài làm và lưu tiến độ.

### 6.1.2. Tổng kết quá trình thực hiện

Trong quá trình thực hiện, đề tài đã triển khai các phần chính:

- Phân tích nhu cầu của người mới học lập trình.
- Xác định chức năng cốt lõi của hệ thống.
- Thiết kế kiến trúc frontend, backend và database.
- Xây dựng giao diện người học và quản trị viên.
- Xây dựng chức năng chạy thử, kiểm tra và lưu tiến độ.
- Kiểm thử các luồng chính của hệ thống.

### 6.1.3. Nhận định chung

Nhìn chung, đề tài đã đạt được mục tiêu cơ bản đề ra. Sản phẩm tuy vẫn còn hạn chế, nhưng đã thể hiện được định hướng xây dựng một môi trường học lập trình có tính thực hành, có phản hồi và có khả năng mở rộng.

[Gợi ý chèn ảnh: Có thể chèn ảnh tổng hợp giao diện hệ thống hoặc ảnh Learn/Library ở cuối mục 6.1.]

## 6.2. Những kết quả đạt được

### 6.2.1. Kết quả về chức năng người học

Hệ thống đã xây dựng được các chức năng:

- Truy cập trang giới thiệu.
- Đăng ký và đăng nhập.
- Hoàn thành onboarding.
- Chọn ngôn ngữ lập trình.
- Xem lộ trình học.
- Mở bài học và thực hành code.
- Chạy thử mã nguồn.
- Kiểm tra bài làm.
- Lưu tiến độ học tập.

### 6.2.2. Kết quả về quản trị nội dung

Khu vực quản trị đã hỗ trợ:

- Quản lý bài học.
- Chỉnh sửa nội dung bài học.
- Quản lý test case.
- Quản lý nội dung giao diện.
- Hỗ trợ nhập/cập nhật nội dung linh hoạt hơn.

### 6.2.3. Kết quả về kỹ thuật

Về mặt kỹ thuật, đề tài đã vận dụng nhiều kiến thức:

- Thiết kế giao diện web.
- Xây dựng API backend.
- Tổ chức cơ sở dữ liệu.
- Xác thực và phân quyền.
- Thực thi mã nguồn trực tuyến.
- Kiểm tra bài làm tự động.
- Kiểm thử và hoàn thiện hệ thống.

## 6.3. Hạn chế của đề tài

### 6.3.1. Hạn chế về nội dung học tập

Số lượng bài học và ngôn ngữ lập trình cần tiếp tục được mở rộng. Nội dung hiện tại phù hợp để chứng minh luồng học và kiến trúc hệ thống, nhưng chưa đủ để trở thành một nền tảng học tập hoàn chỉnh.

### 6.3.2. Hạn chế về kiểm tra bài làm

Các tiêu chí kiểm tra vẫn cần được bổ sung để xử lý nhiều dạng bài tập phức tạp hơn. Trong tương lai, hệ thống nên có bộ test case phong phú và khả năng đánh giá nhiều trường hợp khác nhau.

### 6.3.3. Hạn chế về debug challenge

Bước sửa lỗi trong luồng học hiện còn có khả năng mở rộng. Mỗi bài học nên có dữ liệu debug riêng để thử thách sửa lỗi gắn chặt hơn với nội dung đang học.

### 6.3.4. Hạn chế về đánh giá thực tế

Hệ thống cần được triển khai thử nghiệm với nhiều người dùng hơn để thu thập phản hồi thực tế về giao diện, nội dung bài học, hiệu năng và độ ổn định.

## 6.4. Hướng phát triển trong tương lai

### 6.4.1. Mở rộng nội dung học tập

Hệ thống có thể bổ sung:

- Nhiều ngôn ngữ lập trình hơn.
- Nhiều chương và bài học hơn.
- Bài tập theo cấp độ từ cơ bản đến nâng cao.
- Ví dụ minh họa và bài thực hành phong phú hơn.

### 6.4.2. Hoàn thiện bộ kiểm tra bài làm

Hệ thống có thể phát triển thêm:

- Nhiều test case cho mỗi bài.
- Kiểm tra nhiều input/output.
- Kiểm tra cấu trúc code.
- Kiểm tra hiệu năng cơ bản với một số bài phù hợp.
- Phản hồi chi tiết hơn khi bài làm chưa đạt.

### 6.4.3. Cải tiến chức năng debug

Mỗi bài học có thể có phần thử thách sửa lỗi riêng, gồm:

- Mã nguồn có lỗi.
- Mô tả hiện tượng lỗi.
- Gợi ý từng bước.
- Rule hoặc test case để kiểm tra phần sửa lỗi.

### 6.4.4. Phát triển cá nhân hóa và gamification

Trong tương lai, hệ thống có thể bổ sung:

- Gợi ý bài học tiếp theo.
- Mục tiêu học tập hằng ngày.
- Thống kê tiến độ.
- Chuỗi ngày học liên tiếp.
- Điểm kinh nghiệm hoặc huy hiệu hoàn thành.

Các yếu tố này cần được thiết kế để hỗ trợ việc học thực chất, không làm người học mất tập trung khỏi mục tiêu chính.

### 6.4.5. Cải thiện khu vực quản trị

Khu vực quản trị có thể được mở rộng với:

- Lịch sử chỉnh sửa nội dung.
- Công cụ kiểm tra chất lượng bài học.
- Thống kê bài học có tỷ lệ hoàn thành thấp.
- Theo dõi lỗi thường gặp khi người học chạy code.
- Công cụ nhập/xuất dữ liệu nội dung tốt hơn.

### 6.4.6. Triển khai và đánh giá thực tế

Sau khi hoàn thiện thêm nội dung và kiểm thử, hệ thống có thể được triển khai thử nghiệm cho một nhóm người học. Phản hồi thực tế sẽ giúp đánh giá mức độ dễ dùng, độ phù hợp của bài học và các điểm cần cải tiến.

## 6.5. Kết luận chung

### 6.5.1. Ý nghĩa của đề tài

Đề tài có ý nghĩa thực tiễn trong bối cảnh nhu cầu học lập trình ngày càng tăng. Việc xây dựng một website học lập trình có thực hành trực tiếp giúp người học tiếp cận lập trình chủ động hơn so với việc chỉ đọc tài liệu.

### 6.5.2. Giá trị đạt được

Thông qua đề tài, hệ thống đã hình thành nền tảng ban đầu cho một website học lập trình theo hướng thực hành. Các chức năng cốt lõi như lộ trình học, màn hình học bài, chạy thử mã nguồn, kiểm tra bài làm, lưu tiến độ và quản trị nội dung đã được xây dựng.

### 6.5.3. Khả năng phát triển tiếp

Nếu tiếp tục được bổ sung nội dung, cải tiến bộ kiểm tra, hoàn thiện dữ liệu debug và triển khai thử nghiệm thực tế, hệ thống có thể phát triển thành một nền tảng hỗ trợ học lập trình hữu ích cho người mới bắt đầu.
'''

path.write_text(head + new + '\n', encoding='utf-8')
