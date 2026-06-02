# Chương 1: Giới thiệu tổng quan

> Trạng thái: Đã viết đầy đủ các mục 1.1–1.6 theo `source.md`.

## 1.1. Lý do thực hiện đề tài

Thế kỷ 21 đang chứng kiến sự phát triển mạnh mẽ của công nghệ thông tin, trong đó lập trình đã trở thành một trong những kỹ năng nền tảng quan trọng đối với sinh viên ngành kỹ thuật, người làm công nghệ và cả những cá nhân muốn tham gia vào quá trình chuyển đổi số. Việc học lập trình không còn chỉ giới hạn trong phạm vi nhà trường hoặc các chuyên ngành công nghệ thông tin, mà ngày càng mở rộng sang nhiều lĩnh vực khác nhau như kinh tế, giáo dục, y tế, truyền thông, tự động hóa và phân tích dữ liệu.

Tuy nhiên, đối với người mới bắt đầu, lập trình vẫn là một lĩnh vực có rào cản tiếp cận khá lớn. Người học thường phải đối mặt với nhiều khó khăn cùng lúc: chưa biết nên bắt đầu từ ngôn ngữ nào, thiếu lộ trình học rõ ràng, khó cài đặt môi trường thực hành, không hiểu lỗi khi chương trình chạy sai và dễ mất động lực khi không nhận được phản hồi kịp thời. Chính từ thực tế đó, đề tài “Xây dựng website học lập trình đa ngôn ngữ” được thực hiện nhằm tạo ra một nền tảng học tập có định hướng, dễ tiếp cận và phù hợp với người mới bắt đầu.

### 1.1.1. Hiện trạng học lập trình trực tuyến cho người mới bắt đầu

Hiện nay, người học có thể tiếp cận với rất nhiều nguồn tài liệu lập trình trực tuyến, từ video hướng dẫn, bài viết kỹ thuật, tài liệu chính thức của ngôn ngữ lập trình cho đến các khóa học trên nền tảng học trực tuyến. Sự phong phú này giúp việc tự học trở nên thuận tiện hơn, nhưng đồng thời cũng tạo ra một vấn đề lớn: người mới thường bị quá tải thông tin và không biết đâu là hướng đi phù hợp.

Một quy trình tự học lập trình phổ biến của người mới thường diễn ra theo các bước sau:

1. **Tìm kiếm tài liệu học tập:** Người học tra cứu trên Internet, xem video hoặc đọc bài viết để chọn một ngôn ngữ lập trình ban đầu.
2. **Làm quen với cú pháp:** Người học học các khái niệm cơ bản như biến, kiểu dữ liệu, câu lệnh điều kiện, vòng lặp và hàm.
3. **Tự thiết lập môi trường:** Người học phải cài đặt trình biên dịch, trình thông dịch, editor hoặc IDE để có thể viết và chạy chương trình.
4. **Thực hành bằng ví dụ rời rạc:** Người học làm theo các đoạn code mẫu, chỉnh sửa thử và quan sát kết quả.
5. **Tự đánh giá kết quả:** Khi chương trình sai hoặc không ra kết quả mong muốn, người học phải tự đọc lỗi, tự tìm nguyên nhân và tự sửa.

Mặc dù quy trình này có thể hiệu quả với những người đã có nền tảng kỹ thuật hoặc khả năng tự học tốt, nhưng với người mới bắt đầu, nó bộc lộ nhiều điểm nghẽn rõ rệt:

- **Thiếu lộ trình học có định hướng:** Người học dễ bị cuốn vào quá nhiều tài liệu khác nhau nhưng không biết nên học nội dung nào trước, nội dung nào sau.
- **Rào cản thiết lập môi trường:** Việc cài đặt công cụ, cấu hình máy và xử lý lỗi môi trường có thể trở thành trở ngại ngay từ những bước đầu tiên.
- **Thiếu phản hồi tức thời:** Khi viết sai code, người học thường chỉ thấy lỗi kỹ thuật khó hiểu mà không biết lỗi nằm ở đâu hoặc cần sửa theo hướng nào.
- **Khó phân biệt giữa chạy được và làm đúng:** Một chương trình có thể chạy ra kết quả nào đó, nhưng chưa chắc đã đáp ứng đúng yêu cầu bài học. Đây là điểm dễ gây nhầm lẫn nếu hệ thống không có cơ chế kiểm tra rõ ràng.
- **Dễ mất động lực học tập:** Khi không nhìn thấy tiến độ hoặc không biết mình đã hoàn thành đến đâu, người học dễ bỏ dở quá trình học.

### 1.1.2. Thách thức khi người mới tự học lập trình

Đối với người mới, học lập trình không chỉ là học cú pháp của một ngôn ngữ, mà còn là quá trình hình thành tư duy giải quyết vấn đề. Người học phải hiểu yêu cầu bài toán, phân rã vấn đề, viết mã nguồn, chạy thử, đọc lỗi, sửa lỗi và kiểm tra lại kết quả. Đây là một chuỗi thao tác tương đối phức tạp, trong khi phần lớn người mới lại chưa có đủ kinh nghiệm để tự điều hướng quá trình đó.

Các thách thức nổi bật có thể được nhìn nhận ở một số khía cạnh sau:

- **Thách thức về tư duy lập trình:** Người mới thường gặp khó khăn khi chuyển từ cách suy nghĩ tự nhiên sang cách mô tả vấn đề bằng biến, câu lệnh, điều kiện, vòng lặp và hàm.
- **Thách thức về thực hành:** Lập trình là kỹ năng cần luyện tập liên tục. Nếu chỉ đọc lý thuyết hoặc xem video mà không thực hành, người học rất khó hiểu sâu và ghi nhớ lâu.
- **Thách thức về debug:** Khi chương trình phát sinh lỗi, thông báo lỗi thường mang tính kỹ thuật cao. Người mới dễ hoang mang, không biết lỗi đến từ cú pháp, logic hay dữ liệu đầu vào.
- **Thách thức về đánh giá kết quả:** Nhiều hệ thống chỉ cho phép chạy code và hiển thị output, nhưng không kiểm tra xem bài làm có đúng với yêu cầu hay không. Điều này khiến người học khó biết mình đã thật sự hoàn thành bài học chưa.
- **Thách thức về duy trì tiến độ:** Nếu không có cơ chế lưu tiến độ, đánh dấu bài đã hoàn thành và dẫn dắt bài tiếp theo, quá trình học dễ trở nên rời rạc.

Từ những thách thức trên, có thể thấy người mới cần một môi trường học tập không chỉ cung cấp nội dung, mà còn phải đóng vai trò như một người hướng dẫn. Hệ thống cần chia nhỏ bài học, gợi ý từng bước, cho phép chạy thử mã nguồn, kiểm tra bài làm bằng luật hoặc test case rõ ràng, đồng thời lưu lại tiến độ sau khi người học hoàn thành.

### 1.1.3. Tính cần thiết của đề tài

Đối mặt với những khó khăn trong quá trình tự học lập trình, việc xây dựng một website học lập trình đa ngôn ngữ theo hướng có hướng dẫn là cần thiết. Đề tài không đặt mục tiêu tạo ra một kho tài liệu lớn đơn thuần, mà tập trung xây dựng một hệ thống giúp người mới đi qua từng bước học tập một cách rõ ràng, có thực hành, có phản hồi và có ghi nhận tiến độ.

Tính cần thiết của đề tài được thể hiện ở các khía cạnh sau:

- **Hỗ trợ người mới bắt đầu học có định hướng:** Hệ thống cung cấp lộ trình học theo từng ngôn ngữ lập trình, giúp người học biết mình nên bắt đầu từ đâu và tiếp tục như thế nào.
- **Giảm rào cản thực hành:** Người học có thể viết và chạy thử mã nguồn trực tiếp trên trình duyệt, hạn chế phụ thuộc vào việc cài đặt môi trường ban đầu.
- **Phân tách rõ giữa Chạy thử và Kiểm tra:** Chức năng Chạy thử giúp người học quan sát output của chương trình, trong khi chức năng Kiểm tra mới là bước xác thực bài làm bằng rule hoặc test case. Cách phân tách này giúp người học hiểu rằng code chạy được chưa đồng nghĩa với việc bài làm đã đúng.
- **Tăng chất lượng phản hồi học tập:** Thông qua cơ chế kiểm tra bài làm, hệ thống có thể đưa ra trạng thái đạt hoặc chưa đạt, giúp người học biết cần tiếp tục sửa ở đâu trước khi hoàn thành bài.
- **Quản lý tiến độ học tập:** Bài học chỉ được xem là hoàn thành sau khi hệ thống kiểm tra thành công và backend lưu tiến độ. Điều này giúp dữ liệu học tập nhất quán, tránh việc hiển thị hoàn thành khi tiến độ chưa được ghi nhận.
- **Hỗ trợ quản trị và mở rộng nội dung:** Khu vực quản trị giúp quản lý bài học, test case và nội dung giao diện, tạo điều kiện để hệ thống tiếp tục mở rộng thêm bài học, ngôn ngữ lập trình và nội dung hướng dẫn trong tương lai.

Tóm lại, đề tài “Xây dựng website học lập trình đa ngôn ngữ” có ý nghĩa thực tiễn trong việc hỗ trợ người mới tiếp cận lập trình theo hướng dễ hiểu và có hệ thống. Đây không chỉ là một bài toán xây dựng website, mà còn là một nỗ lực thiết kế trải nghiệm học tập có dẫn dắt, kết hợp giữa nội dung, thực hành, kiểm tra và lưu tiến độ để giúp người học duy trì quá trình học một cách bền vững.

### 1.1.4. Phát biểu bài toán

Việc phát biểu bài toán một cách rõ ràng là nền tảng quan trọng để định hướng quá trình phân tích, thiết kế và xây dựng hệ thống. Với đề tài này, bài toán đặt ra không chỉ là tạo một trang web hiển thị bài học lập trình, mà là xây dựng một nền tảng học lập trình có khả năng hướng dẫn người mới từ lúc bắt đầu học cho đến khi hoàn thành từng bài học cụ thể.

Bài toán cần giải quyết có thể được phát biểu như sau: xây dựng một website học lập trình đa ngôn ngữ cho người mới bắt đầu, trong đó người học có thể đăng ký, đăng nhập, chọn ngôn ngữ lập trình, theo dõi lộ trình học, mở bài học, đọc hướng dẫn, viết mã nguồn, chạy thử chương trình, kiểm tra bài làm và lưu tiến độ sau khi hoàn thành. Hệ thống đồng thời cần cung cấp khu vực quản trị để quản lý nội dung học tập, test case, dữ liệu kiểm tra và nội dung giao diện.

Để giải quyết bài toán này, hệ thống cần đáp ứng các yêu cầu chính:

- Xây dựng giao diện học tập rõ ràng, thân thiện với người mới bắt đầu.
- Tổ chức bài học theo lộ trình và theo từng ngôn ngữ lập trình.
- Cung cấp trình soạn thảo mã nguồn và khu vực hiển thị kết quả chạy thử.
- Tách biệt chức năng chạy thử mã nguồn với chức năng kiểm tra bài làm.
- Kiểm tra bài làm bằng cơ chế xác định, dựa trên rule hoặc test case.
- Chỉ ghi nhận hoàn thành bài học sau khi quá trình kiểm tra thành công và tiến độ được backend lưu lại.
- Xây dựng khu vực quản trị để quản lý bài học, test case và nội dung CMS.

Phạm vi của bài toán được giới hạn trong khuôn khổ một đồ án tốt nghiệp, tập trung vào các chức năng cốt lõi của nền tảng học lập trình trực tuyến. Các chức năng nâng cao như cá nhân hóa bằng dữ liệu học tập lớn, gợi ý bài học bằng AI hoặc hệ thống thi đấu lập trình quy mô lớn có thể được xem là hướng phát triển trong tương lai.

## 1.2. Mục tiêu và sản phẩm của đồ án

### 1.2.1. Mục tiêu tổng quát

Mục tiêu tổng quát của đồ án là xây dựng một website học lập trình đa ngôn ngữ, hướng đến nhóm người học mới bắt đầu, giúp họ có thể tiếp cận lập trình theo một lộ trình rõ ràng, có hướng dẫn và có thực hành trực tiếp. Hệ thống không chỉ đóng vai trò là nơi hiển thị tài liệu học tập, mà còn là một môi trường học tương tác, trong đó người học có thể đọc nội dung, viết mã nguồn, chạy thử chương trình, kiểm tra bài làm và theo dõi tiến độ học tập của bản thân.

Đề tài không dừng lại ở việc xây dựng một website dạng danh mục bài học. Mục tiêu quan trọng hơn là thiết kế một luồng học phù hợp với người mới, giảm cảm giác bỡ ngỡ khi bắt đầu học lập trình và giúp người học hiểu rõ từng bước mình cần thực hiện. Trong đó, hệ thống cần phân biệt rõ hai thao tác thường bị nhầm lẫn: **Chạy thử** và **Kiểm tra**. Chạy thử chỉ dùng để thực thi mã nguồn và quan sát output, còn Kiểm tra mới là bước xác thực bài làm bằng rule hoặc test case. Nhờ vậy, người học không chỉ biết chương trình có chạy hay không, mà còn biết bài làm đã đáp ứng yêu cầu hay chưa.

Bên cạnh phía người học, đồ án cũng hướng đến việc xây dựng khu vực quản trị để quản lý bài học, test case, dữ liệu kiểm tra và nội dung giao diện. Đây là cơ sở để hệ thống có thể mở rộng nội dung trong tương lai, thay vì phải chỉnh sửa trực tiếp trong mã nguồn mỗi khi cần thêm bài học hoặc thay đổi nội dung hiển thị.

### 1.2.2. Mục tiêu chức năng

Để hiện thực hóa mục tiêu tổng quát, đồ án được chia thành các mục tiêu chức năng cụ thể, có thể kiểm chứng trong quá trình xây dựng và đánh giá hệ thống:

- **Mục tiêu 1: Xây dựng luồng học dành cho người mới bắt đầu**

  Hệ thống cần cung cấp một trải nghiệm học tập có định hướng, giúp người học biết mình đang học gì, cần làm gì và hoàn thành bài học theo trình tự nào. Luồng học được thiết kế theo 5 bước chính gồm quan sát, thay đổi, chạy thử, sửa lỗi và hoàn thành. Cách tổ chức này giúp bài học được chia nhỏ, giảm tải nhận thức cho người mới và khuyến khích người học thực hành thay vì chỉ đọc lý thuyết.

- **Mục tiêu 2: Xây dựng hệ thống học theo ngôn ngữ và lộ trình**

  Website cần cho phép người học lựa chọn ngôn ngữ lập trình phù hợp, truy cập vào thư viện hoặc lộ trình học tương ứng, xem danh sách bài học và tiếp tục học theo tiến độ của mình. Việc tổ chức nội dung theo ngôn ngữ và lộ trình giúp hệ thống phù hợp với định hướng học đa ngôn ngữ, đồng thời hạn chế tình trạng người học bị lạc giữa nhiều tài liệu rời rạc.

- **Mục tiêu 3: Tích hợp môi trường thực hành mã nguồn trên trình duyệt**

  Hệ thống cần cung cấp khu vực soạn thảo mã nguồn và terminal/output để người học có thể chạy thử chương trình ngay trên trình duyệt. Mục tiêu này giúp giảm rào cản cài đặt môi trường ban đầu, đặc biệt với người mới chưa quen với compiler, interpreter, IDE hoặc cấu hình máy cá nhân.

- **Mục tiêu 4: Xây dựng cơ chế kiểm tra bài làm xác định**

  Bên cạnh chức năng chạy thử, hệ thống cần có cơ chế kiểm tra bài làm bằng rule hoặc test case. Cơ chế này phải cho kết quả rõ ràng, có thể xác định được bài làm đạt hay chưa đạt, từ đó giúp người học hiểu rằng output khi chạy thử chỉ là một phần của quá trình học. Bài học chỉ được xem là hoàn thành khi bước kiểm tra đạt yêu cầu và tiến độ được backend ghi nhận thành công.

- **Mục tiêu 5: Xây dựng hệ thống quản lý tiến độ học tập**

  Hệ thống cần lưu lại trạng thái học tập của người dùng, bao gồm bài đã hoàn thành, tiến độ theo lộ trình và các thông tin liên quan đến quá trình học. Việc lưu tiến độ giúp người học tiếp tục quá trình học ở những lần truy cập sau, đồng thời tạo nền tảng cho các chức năng mở rộng như gợi ý bài tiếp theo hoặc cá nhân hóa lộ trình.

- **Mục tiêu 6: Xây dựng khu vực quản trị nội dung**

  Đồ án cần cung cấp khu vực quản trị để quản lý bài học, test case, nội dung CMS và các dữ liệu phục vụ giao diện. Mục tiêu này giúp việc vận hành hệ thống linh hoạt hơn, giảm phụ thuộc vào chỉnh sửa thủ công trong mã nguồn và tạo điều kiện để bổ sung nội dung học tập trong tương lai.

### 1.2.3. Sản phẩm đầu ra của đồ án

Kết thúc đồ án, các sản phẩm cụ thể cần đạt được bao gồm:

- **Một báo cáo đồ án tốt nghiệp hoàn chỉnh**

  Báo cáo trình bày đầy đủ quá trình thực hiện đề tài, bao gồm lý do chọn đề tài, cơ sở lý thuyết, công nghệ sử dụng, phân tích thiết kế hệ thống, nội dung triển khai, kết quả thực nghiệm, đánh giá hệ thống và định hướng phát triển. Đây là tài liệu tổng hợp toàn bộ quá trình nghiên cứu, xây dựng và kiểm chứng sản phẩm.

- **Một website học lập trình đa ngôn ngữ dành cho người mới bắt đầu**

  Sản phẩm chính của đồ án là hệ thống web cho phép người dùng đăng ký, đăng nhập, chọn ngôn ngữ lập trình, xem lộ trình học, mở bài học, thực hành viết code, chạy thử, kiểm tra bài làm và theo dõi tiến độ học tập.

- **Luồng học 5 bước trong màn hình bài học**

  Hệ thống cung cấp Lesson Viewer với luồng học gồm các bước quan sát, thay đổi, chạy thử, sửa lỗi và hoàn thành. Đây là thành phần quan trọng thể hiện định hướng newbie-first của đồ án, giúp người học được dẫn dắt trong quá trình thực hành.

- **Cơ chế chạy thử và kiểm tra bài làm**

  Sản phẩm bao gồm chức năng chạy mã nguồn để hiển thị output và chức năng kiểm tra bài làm bằng rule/test case. Hai chức năng này được phân tách rõ ràng để đảm bảo người học hiểu đúng bản chất của từng thao tác.

- **Hệ thống lưu và hiển thị tiến độ học tập**

  Sau khi người học kiểm tra bài làm thành công, hệ thống gọi backend để lưu tiến độ. Chỉ khi tiến độ được lưu thành công, bài học mới được ghi nhận là hoàn thành. Đây là cơ chế quan trọng để đảm bảo tính nhất quán của dữ liệu học tập.

- **Khu vực quản trị nội dung và bài học**

  Hệ thống có khu vực dành cho quản trị viên để quản lý bài học, test case, dữ liệu nội dung và các thành phần phục vụ giao diện. Đây là sản phẩm hỗ trợ vận hành, bảo trì và mở rộng nền tảng sau này.

- **Mã nguồn và tài liệu kỹ thuật đi kèm**

  Toàn bộ mã nguồn frontend, backend, cấu trúc dữ liệu, seed content và tài liệu hướng dẫn cần được bàn giao kèm theo. Các tài liệu này giúp người khác có thể đọc hiểu cấu trúc dự án, thiết lập môi trường, chạy hệ thống và tiếp tục phát triển trong tương lai.

## 1.3. Phạm vi của đồ án

Bất kỳ đồ án phần mềm nào cũng cần được xác định phạm vi rõ ràng để đảm bảo quá trình phân tích, thiết kế và triển khai tập trung vào những mục tiêu khả thi nhất. Với đề tài xây dựng website học lập trình đa ngôn ngữ, việc xác định phạm vi càng quan trọng vì lĩnh vực học lập trình trực tuyến có thể mở rộng theo rất nhiều hướng: hệ thống khóa học, luyện thi, thi đấu lập trình, cộng đồng hỏi đáp, cá nhân hóa lộ trình hoặc tích hợp trí tuệ nhân tạo.

Trong khuôn khổ đồ án này, phạm vi được giới hạn ở ba khía cạnh chính: phạm vi người dùng, phạm vi chức năng và phạm vi công nghệ. Cách giới hạn này giúp hệ thống tập trung vào giá trị cốt lõi là hỗ trợ người mới bắt đầu học lập trình theo lộ trình có hướng dẫn, có thực hành và có kiểm tra kết quả.

### 1.3.1. Phạm vi người dùng

Đối tượng sử dụng chính của hệ thống là người mới bắt đầu học lập trình hoặc người đã từng tiếp xúc với lập trình nhưng chưa có lộ trình học rõ ràng. Nhóm người dùng này thường cần một môi trường học đơn giản, dễ hiểu, có hướng dẫn từng bước và không yêu cầu quá nhiều kiến thức kỹ thuật trước khi bắt đầu.

Trong phạm vi đồ án, hệ thống tập trung vào các nhóm người dùng sau:

- **Người học mới bắt đầu:** Đây là nhóm người dùng trọng tâm. Họ cần xem lộ trình học, mở bài học, đọc hướng dẫn, viết code, chạy thử chương trình, kiểm tra bài làm và theo dõi tiến độ học tập.
- **Người học tự ôn lại kiến thức cơ bản:** Nhóm này có thể đã biết một phần cú pháp nhưng cần hệ thống hóa lại kiến thức thông qua các bài học ngắn, có thực hành và có kiểm tra.
- **Quản trị viên hệ thống:** Đây là nhóm người dùng phụ trách quản lý nội dung học tập, bài học, test case, dữ liệu kiểm tra và nội dung CMS phục vụ giao diện.

Ngoài phạm vi của đồ án là các nhóm người dùng nâng cao như giảng viên quản lý lớp học quy mô lớn, doanh nghiệp đào tạo nội bộ, ban tổ chức cuộc thi lập trình hoặc cộng đồng hỏi đáp thời gian thực. Các nhóm này có thể được xem xét trong hướng phát triển sau khi hệ thống hoàn thiện các chức năng nền tảng.

### 1.3.2. Phạm vi chức năng

Về mặt chức năng, đồ án tập trung xây dựng các thành phần cốt lõi để tạo nên một nền tảng học lập trình trực tuyến có tính tương tác. Các chức năng được lựa chọn nhằm phục vụ trực tiếp cho trải nghiệm học của người mới và khả năng quản trị nội dung của hệ thống.

Các chức năng nằm trong phạm vi bao gồm:

- **Đăng ký, đăng nhập và quản lý phiên người dùng:** Cho phép người học có tài khoản riêng để truy cập hệ thống và lưu tiến độ học tập.
- **Xem danh sách ngôn ngữ lập trình và lộ trình học:** Người học có thể chọn nội dung phù hợp, xem các bài học theo lộ trình và tiếp tục quá trình học.
- **Hiển thị bài học theo luồng học 5 bước:** Màn hình học tập cần dẫn dắt người học qua các bước quan sát, thay đổi, chạy thử, sửa lỗi và hoàn thành.
- **Soạn thảo và chạy thử mã nguồn:** Người học có thể viết hoặc chỉnh sửa code trực tiếp trên trình duyệt, sau đó chạy thử để quan sát output.
- **Kiểm tra bài làm bằng rule hoặc test case:** Hệ thống cần có bước kiểm tra riêng biệt để xác định bài làm đạt hay chưa đạt theo yêu cầu bài học.
- **Lưu tiến độ học tập:** Sau khi bài làm được kiểm tra thành công, backend ghi nhận trạng thái hoàn thành để người học có thể tiếp tục ở những lần truy cập sau.
- **Quản trị nội dung học tập:** Quản trị viên có thể quản lý bài học, test case, nội dung CMS và các dữ liệu phục vụ giao diện.

Ngoài phạm vi của đồ án là các chức năng nâng cao như hệ thống chấm bài quy mô lớn giống online judge, thi đấu lập trình thời gian thực, diễn đàn thảo luận, chat cộng đồng, gợi ý bài học bằng AI, phân tích học tập chuyên sâu hoặc cá nhân hóa lộ trình dựa trên dữ liệu lớn. Những chức năng này có giá trị thực tiễn nhưng vượt quá phạm vi cần thiết của phiên bản đồ án.

### 1.3.3. Phạm vi công nghệ

Về mặt công nghệ, đồ án tập trung xây dựng hệ thống web gồm frontend, backend, cơ sở dữ liệu và cơ chế quản lý nội dung. Trọng tâm không phải là tạo ra một nền tảng thương mại hoàn chỉnh với khả năng chịu tải lớn, mà là xây dựng một nguyên mẫu có đầy đủ chức năng cốt lõi, có thể chạy, kiểm thử và chứng minh tính khả thi của giải pháp.

Phạm vi công nghệ của đồ án bao gồm:

- **Frontend:** Xây dựng giao diện người dùng cho trang học tập, thư viện/lộ trình, màn hình bài học, khu vực chạy thử code và các trang quản trị cần thiết.
- **Backend:** Cung cấp API cho xác thực người dùng, lấy dữ liệu bài học, kiểm tra bài làm, lưu tiến độ và phục vụ dữ liệu quản trị.
- **Cơ sở dữ liệu:** Lưu trữ thông tin người dùng, bài học, test case, tiến độ học tập và nội dung CMS.
- **CMS-driven content:** Một phần nội dung giao diện và bài học được quản lý theo hướng dữ liệu, giúp hệ thống dễ cập nhật và mở rộng hơn so với việc hardcode trực tiếp trong frontend.
- **Cơ chế thực thi và kiểm tra mã nguồn:** Hệ thống hỗ trợ chạy thử code và kiểm tra bài làm ở mức phù hợp với phạm vi đồ án, ưu tiên tính rõ ràng, an toàn và dễ kiểm chứng.

Ngoài phạm vi công nghệ là các yêu cầu hạ tầng phức tạp như triển khai production quy mô lớn, tự động mở rộng theo tải, sandbox thực thi code cấp độ online judge chuyên nghiệp, hệ thống chống gian lận, phân tích telemetry học tập nâng cao hoặc tích hợp sâu với các nền tảng học tập bên ngoài.

Việc xác định rõ ba phạm vi trên giúp đề tài giữ được trọng tâm: xây dựng một nền tảng học lập trình trực tuyến có hướng dẫn, có thực hành, có kiểm tra và có lưu tiến độ. Đây là phạm vi phù hợp với thời gian thực hiện đồ án, đồng thời vẫn đủ để thể hiện đầy đủ quá trình phân tích, thiết kế, triển khai và đánh giá một hệ thống web hoàn chỉnh.

## 1.4. Ràng buộc, giả định và phụ thuộc

Trong quá trình xây dựng hệ thống, việc xác định rõ các ràng buộc, giả định và phụ thuộc là cần thiết để đánh giá đúng phạm vi cũng như mức độ khả thi của đồ án. Các yếu tố này giúp làm rõ những điều kiện mà hệ thống phải tuân thủ, những giả định được chấp nhận trong quá trình phát triển và các thành phần bên ngoài có ảnh hưởng trực tiếp đến kết quả triển khai.

### 1.4.1. Ràng buộc trong quá trình xây dựng

Ràng buộc là các giới hạn hoặc điều kiện thực tế mà đồ án cần tuân thủ trong quá trình thiết kế và phát triển. Với hệ thống Loopy, các ràng buộc chính bao gồm:

- **Ràng buộc về phạm vi đồ án:** Hệ thống tập trung vào các chức năng cốt lõi của một nền tảng học lập trình cho người mới, bao gồm học theo lộ trình, thực hành code, chạy thử, kiểm tra bài làm, lưu tiến độ và quản trị nội dung. Các chức năng nâng cao như online judge quy mô lớn, thi đấu lập trình thời gian thực hoặc cá nhân hóa bằng AI không thuộc phạm vi triển khai chính.
- **Ràng buộc về trải nghiệm người mới:** Giao diện và luồng học cần ưu tiên tính dễ hiểu, rõ ràng và có hướng dẫn. Hệ thống không nên giả định rằng người học đã có kinh nghiệm sử dụng IDE, terminal hoặc hiểu sâu về lỗi biên dịch/thực thi.
- **Ràng buộc về kiểm tra bài học:** Chức năng **Chạy thử** chỉ thực thi mã nguồn và hiển thị output. Chức năng **Kiểm tra** mới là bước xác thực bài làm bằng rule hoặc test case. Đây là ràng buộc nghiệp vụ quan trọng để tránh ghi nhận hoàn thành bài học khi người học chỉ mới chạy thử code.
- **Ràng buộc về lưu tiến độ:** Bài học chỉ được xem là hoàn thành sau khi quá trình kiểm tra đạt yêu cầu và backend lưu tiến độ thành công. Hệ thống không hiển thị trạng thái hoàn thành trước khi dữ liệu tiến độ được ghi nhận ổn định.
- **Ràng buộc về tài nguyên và thời gian:** Đồ án được thực hiện trong khuôn khổ thời gian giới hạn, do đó cần ưu tiên triển khai các chức năng có giá trị trực tiếp đối với mục tiêu học tập thay vì mở rộng quá nhiều tính năng phụ.

### 1.4.2. Giả định về người dùng và dữ liệu

Giả định là các điều kiện được chấp nhận là đúng trong phạm vi triển khai đồ án. Nếu các giả định này thay đổi, hệ thống có thể cần điều chỉnh lại thiết kế hoặc cách vận hành.

Các giả định chính của đồ án gồm:

- **Giả định về người học:** Người dùng chính là người mới bắt đầu học lập trình, cần được hướng dẫn rõ ràng theo từng bước và cần môi trường thực hành đơn giản ngay trên trình duyệt.
- **Giả định về nội dung bài học:** Nội dung học tập được tổ chức theo lộ trình và bài học có yêu cầu đủ rõ để có thể xây dựng rule hoặc test case kiểm tra kết quả.
- **Giả định về dữ liệu tiến độ:** Mỗi người học có tài khoản riêng, dữ liệu tiến độ được lưu theo người dùng và có thể truy xuất lại khi người học quay lại hệ thống.
- **Giả định về nội dung CMS:** Các nội dung giao diện và bài học có thể được chuẩn hóa thành dữ liệu để quản lý thông qua CMS, giúp giảm việc chỉnh sửa trực tiếp trong mã nguồn.
- **Giả định về môi trường chạy thử:** Các bài học trong phạm vi đồ án sử dụng những ví dụ và bài tập phù hợp với khả năng thực thi, kiểm tra và hiển thị kết quả trong môi trường web của hệ thống.

### 1.4.3. Phụ thuộc kỹ thuật của hệ thống

Phụ thuộc là các thành phần hoặc điều kiện bên ngoài mà hệ thống cần dựa vào để hoạt động đúng. Đối với Loopy, các phụ thuộc kỹ thuật quan trọng gồm:

- **Frontend:** Phụ thuộc vào ứng dụng giao diện để hiển thị lộ trình, bài học, Lesson Viewer, editor, output và các trạng thái học tập.
- **Backend API:** Phụ thuộc vào backend để xác thực người dùng, cung cấp dữ liệu bài học, xử lý kiểm tra bài làm, ghi nhận hoàn thành bài học và trả về dữ liệu tiến độ.
- **Cơ sở dữ liệu:** Phụ thuộc vào cơ sở dữ liệu để lưu người dùng, bài học, test case, CMS content và trạng thái tiến độ.
- **Cơ chế chạy thử và kiểm tra code:** Phụ thuộc vào module thực thi/kiểm tra mã nguồn để đảm bảo chức năng Chạy thử và Kiểm tra hoạt động ổn định, đúng ý nghĩa và tách biệt rõ ràng.
- **Dữ liệu nội dung:** Phụ thuộc vào chất lượng dữ liệu bài học, test case và seed CMS. Nếu nội dung bài học thiếu rõ ràng hoặc test case chưa đầy đủ, trải nghiệm học và kết quả kiểm tra sẽ bị ảnh hưởng.

Việc xác định rõ các ràng buộc, giả định và phụ thuộc giúp quá trình xây dựng hệ thống có định hướng hơn, đồng thời làm rõ các điều kiện cần được đảm bảo để sản phẩm hoạt động đúng với mục tiêu của đồ án.

## 1.5. Kết quả cần đạt

Phần này trình bày các kết quả cụ thể mà đồ án hướng tới cùng với tiêu chí đánh giá mức độ hoàn thành. Các kết quả này không chỉ thể hiện sản phẩm cuối cùng, mà còn phản ánh quá trình phân tích, thiết kế, triển khai và kiểm chứng hệ thống.

| STT | Kết quả cần đạt | Tiêu chí đánh giá |
| --- | --- | --- |
| 1 | Website học lập trình đa ngôn ngữ | Hệ thống cho phép người dùng đăng ký, đăng nhập, chọn ngôn ngữ/lộ trình học, mở bài học và truy cập các chức năng học tập chính. |
| 2 | Luồng học 5 bước trong Lesson Viewer | Bài học được trình bày theo luồng quan sát, thay đổi, chạy thử, sửa lỗi và hoàn thành; giao diện rõ ràng, phù hợp với người mới bắt đầu. |
| 3 | Chức năng chạy thử mã nguồn | Người học có thể viết hoặc chỉnh sửa code, chạy thử chương trình và xem output trên giao diện. Chức năng này không tự động ghi nhận hoàn thành bài học. |
| 4 | Chức năng kiểm tra bài làm | Hệ thống kiểm tra bài làm bằng rule hoặc test case, trả về trạng thái đạt/chưa đạt rõ ràng và chỉ cho phép hoàn thành khi kết quả kiểm tra đạt yêu cầu. |
| 5 | Hệ thống lưu tiến độ học tập | Sau khi kiểm tra thành công, backend ghi nhận tiến độ; người học có thể xem lại trạng thái hoàn thành và tiếp tục học ở các lần truy cập sau. |
| 6 | Khu vực quản trị nội dung | Quản trị viên có thể quản lý bài học, test case, nội dung CMS và các dữ liệu phục vụ giao diện học tập. |
| 7 | Báo cáo đồ án tốt nghiệp | Báo cáo hoàn thành đầy đủ các chương mục theo cấu trúc đã xây dựng, trình bày logic, đúng phạm vi đề tài và phản ánh đúng sản phẩm Loopy. |
| 8 | Mã nguồn và tài liệu kỹ thuật | Mã nguồn frontend/backend, dữ liệu seed và tài liệu hướng dẫn được tổ chức rõ ràng, có thể dùng để chạy, kiểm tra và tiếp tục phát triển hệ thống. |

**Bảng 1.1. Kết quả cần đạt và tiêu chí đánh giá**

## 1.6. Tính ứng dụng của đề tài

Đề tài “Xây dựng website học lập trình đa ngôn ngữ” không chỉ dừng lại ở phạm vi một bài tập học thuật, mà còn có định hướng ứng dụng thực tiễn rõ ràng trong lĩnh vực giáo dục công nghệ. Giá trị của đề tài nằm ở việc giải quyết một vấn đề phổ biến của người mới học lập trình: có nhiều tài liệu để học nhưng thiếu một môi trường hướng dẫn đủ rõ ràng, có thực hành, có kiểm tra và có ghi nhận tiến độ.

Trong bối cảnh nhu cầu học lập trình ngày càng tăng, đặc biệt với sinh viên, người tự học và những người muốn chuyển hướng sang lĩnh vực công nghệ, một nền tảng như Loopy có thể đóng vai trò như bước khởi đầu thân thiện. Hệ thống giúp người học tiếp cận kiến thức theo cách có cấu trúc, giảm rào cản cài đặt môi trường, đồng thời tạo điều kiện để người học luyện tập ngay trong quá trình đọc bài.

### 1.6.1. Ứng dụng trong hỗ trợ người mới học lập trình

Ứng dụng trực tiếp nhất của đề tài là hỗ trợ người mới bắt đầu học lập trình theo một lộ trình dễ hiểu và có định hướng. Thay vì phải tự tìm kiếm nhiều tài liệu rời rạc, người học có thể bắt đầu từ các bài học cơ bản, đi qua từng bước nhỏ và thực hành trực tiếp trên hệ thống.

Giá trị ứng dụng ở khía cạnh này thể hiện qua các điểm sau:

- **Giảm cảm giác bỡ ngỡ khi bắt đầu:** Người học được dẫn dắt qua luồng học rõ ràng, biết mình cần quan sát gì, thay đổi gì, chạy thử thế nào và khi nào được xem là hoàn thành.
- **Khuyến khích học thông qua thực hành:** Hệ thống không chỉ hiển thị lý thuyết mà còn yêu cầu người học chỉnh sửa, chạy thử và kiểm tra code ngay trong bài học.
- **Giúp phân biệt giữa chạy được và làm đúng:** Việc tách riêng Chạy thử và Kiểm tra giúp người học hiểu rằng một chương trình có output chưa chắc đã đáp ứng đúng yêu cầu bài học.
- **Tạo động lực duy trì quá trình học:** Khi tiến độ được lưu lại, người học có thể thấy mình đã hoàn thành đến đâu và tiếp tục học ở những lần truy cập sau.

### 1.6.2. Ứng dụng trong tổ chức nội dung học tập có hệ thống

Loopy có thể được sử dụng như một nền tảng tổ chức nội dung học lập trình theo lộ trình. Thay vì xây dựng các bài học rời rạc, hệ thống hướng đến cách sắp xếp nội dung theo ngôn ngữ, chủ đề và mức độ phù hợp với người mới.

Điều này giúp quá trình học trở nên có cấu trúc hơn:

- **Đối với người học:** Họ có thể biết nên bắt đầu từ đâu, học bài nào tiếp theo và theo dõi tiến độ của mình theo từng lộ trình.
- **Đối với người quản trị:** Nội dung bài học, test case và dữ liệu giao diện có thể được quản lý tập trung, thuận tiện hơn cho việc chỉnh sửa hoặc bổ sung bài mới.
- **Đối với việc mở rộng hệ thống:** Khi nội dung được tổ chức theo hướng CMS-driven, hệ thống có nền tảng để mở rộng thêm ngôn ngữ lập trình, bài học và nội dung hướng dẫn mà không phải thay đổi toàn bộ cấu trúc giao diện.

### 1.6.3. Ứng dụng trong thực hành và đánh giá kết quả học tập

Một điểm quan trọng của đề tài là hệ thống không chỉ dừng ở việc cho phép người học đọc bài, mà còn hỗ trợ thực hành và đánh giá kết quả. Đây là yếu tố giúp Loopy khác với các trang tài liệu tĩnh hoặc các danh mục bài học đơn thuần.

Trong thực tế, chức năng này có thể hỗ trợ:

- **Thực hành nhanh trên trình duyệt:** Người học có thể viết và chạy thử mã nguồn mà không cần cài đặt môi trường phức tạp ngay từ đầu.
- **Đánh giá bài làm rõ ràng hơn:** Cơ chế kiểm tra bằng rule hoặc test case giúp xác định bài làm đạt hay chưa đạt dựa trên yêu cầu cụ thể.
- **Hạn chế hiểu nhầm trong quá trình học:** Khi hệ thống chỉ ghi nhận hoàn thành sau khi kiểm tra thành công và backend lưu tiến độ, người học có cơ sở rõ ràng để biết mình đã thật sự hoàn thành bài học.
- **Tạo nền tảng cho các hình thức đánh giá nâng cao:** Trong tương lai, cơ chế kiểm tra hiện tại có thể được mở rộng thành hệ thống bài tập phong phú hơn, gồm nhiều test case, mức độ khó và dạng phản hồi chi tiết hơn.

### 1.6.4. Ứng dụng trong phát triển sản phẩm giáo dục công nghệ

Bên cạnh giá trị học thuật, đề tài cũng có ý nghĩa như một nguyên mẫu sản phẩm giáo dục công nghệ. Hệ thống thể hiện cách kết hợp giữa frontend, backend, cơ sở dữ liệu, CMS, quản lý tiến độ và kiểm tra bài làm để tạo thành một nền tảng học tập có khả năng vận hành thực tế.

Từ nền tảng này, có thể phát triển thêm nhiều hướng ứng dụng:

- **Mở rộng thư viện bài học:** Bổ sung thêm ngôn ngữ lập trình, chủ đề thực hành và dự án nhỏ cho người mới.
- **Nâng cao trải nghiệm học tập:** Thêm gợi ý sửa lỗi, phản hồi chi tiết hơn, hoặc hướng dẫn từng bước dựa trên lỗi thường gặp của người học.
- **Phát triển tính năng cộng đồng:** Bổ sung thảo luận, chia sẻ lời giải hoặc hỗ trợ giữa người học với nhau.
- **Ứng dụng trong lớp học hoặc câu lạc bộ lập trình:** Giáo viên hoặc người hướng dẫn có thể dùng hệ thống như một công cụ hỗ trợ thực hành cho các buổi học nhập môn.

Tóm lại, tính ứng dụng của đề tài thể hiện ở việc xây dựng một nền tảng học lập trình có định hướng thực tế, tập trung vào người mới và giải quyết các điểm nghẽn thường gặp khi tự học. Loopy không chỉ là một website hiển thị bài học, mà là một môi trường học tập có hướng dẫn, có thực hành, có kiểm tra và có lưu tiến độ. Đây là nền tảng phù hợp để tiếp tục phát triển thành một sản phẩm giáo dục lập trình hoàn thiện hơn trong tương lai.
