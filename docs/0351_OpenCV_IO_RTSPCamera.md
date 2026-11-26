---
Title | OpenCV IO RTSPCamera
-- | --
Created @ | `2018-11-30T09:42:47Z`
Updated @| `2026-11-26T10:11:27Z`
Labels | `ML`
Edit @| [here](https://github.com/junxnone/aiwiki/issues/351)

---
# 读取 RTSP Camera

用 OpenCV 的 `VideoCapture` 读取 IP 摄像头的 RTSP 视频流。RTSP（Real Time Streaming Protocol）是网络摄像头常用的流媒体控制协议。

## Code:
> IP Camera:  IPC-SR3321P-IP 

```
#!/usr/bin/env python
# coding=utf-8
import cv2
cap = cv2.VideoCapture("rtsp://192.168.1.10:554/user=admin&password=&channel=1&stream=0.sdp?")
print (cap.isOpened())
while cap.isOpened():
        success,frame = cap.read()
        cv2.imshow("frame",frame)
        cv2.waitKey(1) 

```

其中：

- `rtsp://IP:端口/路径`：地址的路径部分因厂商而异，这里的 `user=...&password=...&channel=1&stream=0` 是该型号摄像头的写法
- `cap.isOpened()`：是否成功打开流；`cap.read()` 返回 `(是否成功, 帧)`
- `waitKey(1)`：等待 1 毫秒并刷新窗口，没有它画面不会显示

## 改进写法

原代码在读取失败时 `frame` 为 `None`，`imshow` 会报错，也没有退出条件。更稳妥的写法：

```python
import cv2
cap = cv2.VideoCapture(url)
while cap.isOpened():
    success, frame = cap.read()
    if not success:            # 断流或读取失败
        break
    cv2.imshow("frame", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):   # 按 q 退出
        break
cap.release()
cv2.destroyAllWindows()
```

## 常见问题

| 问题 | 原因 | 处理 |
| --- | --- | --- |
| 画面延迟越来越大 | 读取慢于摄像头出帧，缓冲堆积 | 单独线程持续读取只保留最新帧，或减小缓冲 |
| 打不开流 | 地址、账号密码错误，或网络 / 防火墙 | 先用 VLC 或 `ffplay` 验证地址 |
| 花屏或绿屏 | 丢包，UDP 传输 | 改用 TCP 传输 |
| 帧率低 | 解码在 CPU 上 | 使用硬件解码（GStreamer 管道，见 [gst-launch](https://github.com/junxnone/aiwiki/issues/110)） |

表中：对比结论：低延迟需求要避免缓冲堆积，延迟概念见 [低延迟](https://github.com/junxnone/aiwiki/issues/37)。

指定 TCP 传输（FFmpeg 后端）：设置环境变量 `OPENCV_FFMPEG_CAPTURE_OPTIONS="rtsp_transport;tcp"`。

