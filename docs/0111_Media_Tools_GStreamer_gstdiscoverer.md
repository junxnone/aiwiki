---
Title | Media Tools GStreamer gstdiscoverer
-- | --
Created @ | `2021-02-05T03:30:10Z`
Updated @| `2026-11-26T09:16:44Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/111)

---
# gst-discoverer

- 查看媒体文件信息
- 不需要播放，直接分析文件的容器格式、编码、时长等

```
$ gst-discoverer-1.0 a.wav
Analyzing file:///home/root/tmp/a.wav
Done discovering file:///home/root/tmp/a.wav

Topology:
  audio: WAV

Properties:
  Duration: 0:00:27.220000000
  Seekable: yes
  Live: no
  Tags:
      container format: WAV
      bitrate: 2048000
      audio codec: Uncompressed 32-bit IEEE float audio
```
```
$ gst-discoverer-1.0 b.h264
Analyzing file:///home/root/tmp/b.h264
Done discovering file:///home/root/tmp/b.h264

Topology:
  video: H.264 (Constrained Baseline Profile)

Properties:
  Duration: 0:00:00.166000000
  Seekable: yes
  Live: no
  Tags:
      video codec: H.264 (Constrained Baseline Profile)
```

```
$ gst-discoverer-1.0 c.hevc

Analyzing file:///home/root/tmp/c.hevc
Done discovering file:///home/root/tmp/c.hevc

Topology:
  video: H.265 (Main Profile)

Properties:
  Duration: 0:00:00.000000000
  Seekable: yes
  Live: no
  Tags:
      video codec: H.265 (Main Profile)
```

## 输出字段

| 字段 | 含义 |
| --- | --- |
| Topology | 媒体流的结构：容器、音频流、视频流及其编码 |
| Duration | 时长 |
| Seekable | 是否可以跳转（拖动进度） |
| Live | 是否为直播流 |
| Tags: container format | 容器格式，如 WAV、MP4 |
| Tags: bitrate | 码率（bit/s） |
| Tags: audio / video codec | 音视频编码格式及档次 |

表中：

- **Topology** 是核心信息，说明文件里有哪些流
- 示例 1 是未压缩的 WAV 音频；示例 2、3 是裸的 H.264 / H.265 视频流，没有容器，所以 Duration 很短或为 0（裸流没有时间信息，需要解码后才能得知）
- 对比结论：裸码流的信息比带容器的文件（如 MP4）少

## 用法

- 详细输出：`gst-discoverer-1.0 -v file.mp4`
- 与 [gst-launch](https://github.com/junxnone/aiwiki/issues/110) 搭配：先用 discoverer 看编码格式，再选择对应的解码器写 pipeline
- 类似的工具：ffprobe、MediaInfo

