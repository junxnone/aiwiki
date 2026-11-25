---
Title | Media Video Streaming
-- | --
Created @ | `2026-11-25T16:16:49Z`
Updated @| `2026-11-25T16:21:19Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/771)

---
# Video Streaming

视频流传输：RTSP/RTP、RTMP、HLS/DASH、WebRTC 的分工和延迟差异，以及网络摄像头 (IP Camera) 取流的常见命令。

## 协议总览

下图按「控制 + 传输」把常见协议放在一起，说明一路 RTSP 摄像头是如何传到播放器的：

```mermaid
flowchart LR
    CAM[IP Camera<br>编码 H.264/H.265] -->|RTSP 控制 TCP 554| CLI[客户端]
    CAM -->|RTP 视频/音频<br>UDP 或 TCP 交织| CLI
    CAM -->|RTCP 统计/同步| CLI
    CLI --> DEC[解复用 + 解码] --> SHOW[显示]
```

图中：

- RTSP (Real Time Streaming Protocol) 只负责控制：建立会话、播放、暂停、停止，默认端口 554
- 真正的音视频数据由 RTP (Real-time Transport Protocol) 承载，可以走 UDP，也可以通过 RTSP 的 TCP 连接交织传输 (防火墙/丢包严重时用)
- RTCP 与 RTP 配套，用于收发统计 (丢包率、抖动) 和多路流的时间同步
- 客户端收到 RTP 包后重新组帧，再解码显示

## RTSP 会话

RTSP 用类似 HTTP 的文本请求，典型握手顺序如下：

```mermaid
sequenceDiagram
    participant C as 客户端
    participant S as 摄像头/服务器
    C->>S: OPTIONS
    S-->>C: 支持的方法
    C->>S: DESCRIBE
    S-->>C: SDP (媒体描述: 编码/payload type/参数集)
    C->>S: SETUP (协商传输方式与端口)
    S-->>C: Session ID
    C->>S: PLAY
    S-->>C: 200 OK
    S-)C: RTP 数据流
    C->>S: TEARDOWN
```

图中：

- `OPTIONS` 询问服务器支持哪些方法；`DESCRIBE` 获取 SDP (Session Description Protocol)，里面声明有几路流、编码名、RTP payload type，H.264 的 SPS/PPS 也通常在这里给出
- `SETUP` 为每一路流协商用 UDP 还是 TCP 交织传输；`PLAY` 之后服务器才开始发送 RTP 数据
- `TEARDOWN` 结束会话；中途的保活通常靠定期发 `GET_PARAMETER` 或 `OPTIONS`

## RTP 包

RTP 头部关键字段：

字段 | 含义 | 作用
-- | -- | --
Sequence Number | 序号，每包加 1 | 检测丢包与乱序
Timestamp | 采样时刻，视频时钟为 90 kHz | 音画同步、重建帧间隔
SSRC | 同步源标识 | 区分不同的流
Payload Type | 载荷类型 | 说明里面是 H.264 还是 AAC 等
Marker | 标记位 | 视频中通常表示一帧的最后一个包

表中：视频使用 90 kHz 时钟，所以 30 fps 的视频相邻帧时间戳相差 $90000/30=3000$ 个时钟周期；同一帧的所有 RTP 包时间戳相同。

- 一帧 H.264 往往大于一个网络包 (MTU 约 1500 字节)，需要按 RFC 6184 做分片 (FU-A) 或聚合 (STAP-A)，接收端用 `rtph264depay` 还原
- 丢一个包可能让整帧甚至整个 GOP 无法解码，直到下一个 IDR 帧才能恢复，这就是花屏的来源，见 [Video Codec](/0770_Media_Video_Codec)

## 协议对比

协议 | 传输层 | 典型延迟 | 主要用途
-- | -- | -- | --
RTSP/RTP | UDP 或 TCP | 约 100 ms~1 s | 监控摄像头、工业相机取流
RTMP | TCP | 约 1~5 s | 直播推流 (主播端到服务器)
HLS | HTTP (TCP) | 约 6~30 s (低延迟 HLS 约 2~5 s) `[经验]` | 点播、大规模直播分发
MPEG-DASH | HTTP (TCP) | 约 6~30 s，同 HLS 量级 `[经验]` | 与 HLS 类似，非苹果生态
WebRTC | UDP (SRTP) | 小于 500 ms | 视频通话、互动直播

表中：`典型延迟` 是量级，实际取决于缓冲、分片时长和网络。HLS/DASH 把流切成数秒的小文件 (ts 或 fMP4，见 [Video Container](/0776_Media_Video_Container))，通过普通 HTTP 服务和 CDN 分发，延迟高但扩展性好；RTSP 和 WebRTC 面向实时，延迟低但不适合大规模分发。

## 延迟的构成

端到端延迟 (见 [低延迟](/0037_Media_Image_Camera_LowLatency)) 可以拆成：

$$
\text{Latency} = T_{cam} + T_{enc} + T_{net} + T_{buf} + T_{dec} + T_{render}
$$

其中：

- $T_{cam}$：相机曝光、读出和 ISP 的延迟
- $T_{enc}$：编码延迟，使用 B 帧和长 GOP 会增加
- $T_{net}$：网络传输延迟，含丢包重传
- $T_{buf}$：接收端抖动缓冲 (jitter buffer)，用来抵抗网络抖动，设置越大越稳但延迟越大
- $T_{dec}$：解码延迟
- $T_{render}$：渲染和显示延迟

降延迟的常见手段：关闭 B 帧、缩短 GOP、减小接收端缓冲、使用 UDP、使用硬件编解码 ([Video HWCodec](/0772_Media_Video_HWCodec))。

## 常用命令

用 FFmpeg 拉取并保存 (TCP 交织更稳定)：

```
ffmpeg -rtsp_transport tcp -i rtsp://user:pass@192.168.1.64:554/stream1 -c copy out.mp4
```

用 GStreamer 播放 (`latency` 是抖动缓冲时长，单位 ms)：

```
gst-launch-1.0 rtspsrc location=rtsp://192.168.1.64:554/stream1 latency=100 ! rtph264depay ! h264parse ! avdec_h264 ! videoconvert ! autovideosink
```

- 用 OpenCV 读取 RTSP 摄像头见 [OpenCV IO RTSPCamera](/0351_OpenCV_IO_RTSPCamera)
- 管线中各 element 的含义见 [GStreamer](/0109_Media_Tools_GStreamer)

## Reference
- [RTP: A Transport Protocol for Real-Time Applications - RFC 3550](https://www.rfc-editor.org/rfc/rfc3550)
- [Real-Time Streaming Protocol Version 2.0 - RFC 7826](https://www.rfc-editor.org/rfc/rfc7826)
- [RTP Payload Format for H.264 Video - RFC 6184](https://www.rfc-editor.org/rfc/rfc6184)
- [HTTP Live Streaming - RFC 8216](https://www.rfc-editor.org/rfc/rfc8216)
- [Low Latency Camera Concepts](https://zhuanlan.zhihu.com/p/281522274)

