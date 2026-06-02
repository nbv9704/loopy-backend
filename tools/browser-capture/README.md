# Browser Capture Tool

Tool này mở Chrome/Edge bằng remote debugging để bạn tự đi tới trang cần tham khảo, sau đó capture HTML của tab hiện tại thành file local.

## Cách dùng

Mở browser capture:

```powershell
powershell -ExecutionPolicy Bypass -File tools/browser-capture/open-capture-browser.ps1 -Url "https://coddy.tech/"
```

Điều hướng trong browser tới trang muốn lấy HTML.

Capture tab hiện tại:

```powershell
node tools/browser-capture/capture-current-page.mjs
```

File sẽ được lưu vào:

```text
references/captured/
```

## Tuỳ chọn

Dùng port khác:

```powershell
powershell -ExecutionPolicy Bypass -File tools/browser-capture/open-capture-browser.ps1 -Port 9333 -Url "https://coddy.tech/"
node tools/browser-capture/capture-current-page.mjs --port=9333
```

Đổi output folder:

```powershell
node tools/browser-capture/capture-current-page.mjs --out=references/coddy
```

## Lưu ý

- HTML capture là DOM sau khi trang đã render, phù hợp để phân tích UI/reference.
- Không nên copy nguyên giao diện/asset/copywriting có bản quyền vào sản phẩm chính.
- Dùng file capture để dựng Loopy v2 sandbox route, rồi biến đổi thành design riêng của Loopy.
