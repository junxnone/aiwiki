---
Title | OpenCV IO
-- | --
Created @ | `2023-06-17T16:43:00Z`
Updated @| `2026-11-26T10:15:17Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/426)

---
# OpenCV 读写
- Images
- Videos
- Stream
- ...

| 对象 | 读取 | 写出 | 说明 |
| --- | --- | --- | --- |
| 图像 | `cv2.imread` | `cv2.imwrite` | 返回 `Mat`（ndarray），默认 BGR 顺序 |
| 视频文件 | `cv2.VideoCapture(path)` | `cv2.VideoWriter` | 逐帧读取，写出时需指定编码、帧率、尺寸 |
| 网络流 | `cv2.VideoCapture(url)` | | RTSP 等，见 [RTSP Camera](https://github.com/junxnone/aiwiki/issues/351) |
| 摄像头 | `cv2.VideoCapture(0)` | | 参数为设备编号 |

表中：对比结论：图像一次读写；视频和流是逐帧读取，要在循环里处理每一帧。

```python
import cv2
img = cv2.imread("a.jpg", cv2.IMREAD_COLOR)        # 读图，失败返回 None
cv2.imwrite("b.png", img)                          # 写图，按扩展名决定格式

cap = cv2.VideoCapture("in.mp4")
fps = cap.get(cv2.CAP_PROP_FPS)
w, h = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
out = cv2.VideoWriter("out.mp4", cv2.VideoWriter_fourcc(*"mp4v"), fps, (w, h))
while True:
    ok, frame = cap.read()
    if not ok:
        break
    out.write(frame)
cap.release(); out.release()
```

其中：`imread` 的第二个参数决定读取方式（彩色、灰度、保持原样）；`VideoWriter` 的 `fourcc` 指定编码；`read()` 返回 `(是否成功, 帧)`，失败时跳出循环。读入的图像数据结构见 [OpenCV Mat](https://github.com/junxnone/aiwiki/issues/473)。

