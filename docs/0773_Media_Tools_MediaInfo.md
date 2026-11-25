---
Title | Media Tools MediaInfo
-- | --
Created @ | `2026-11-25T16:17:22Z`
Updated @| `2026-11-25T16:21:25Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/773)

---
# MediaInfo

查看媒体文件信息的三种常用工具：MediaInfo、ffprobe、gst-discoverer。拿到一个陌生的视频或音频文件，先用它们确认容器、编码、分辨率、帧率、码率等信息。

## 为什么要先看信息

- 后缀名不可靠：`.mp4` 里可能是 H.264 也可能是 H.265，播放失败常常是因为编码或 Profile 不被支持
- 排查问题时需要确认：编码/Profile/Level、像素格式、色度采样、位深、帧率 (定帧率还是变帧率)、码率、时长、音频采样率与声道数
- 相关概念见 [Video Container](/0776_Media_Video_Container)、[Video Codec](/0770_Media_Video_Codec)、[Audio Basics](/0775_Media_Audio_Basics)

## MediaInfo

跨平台，提供命令行 (`mediainfo`) 和图形界面，读取信息最全面。

```
mediainfo in.mp4
mediainfo --Output=JSON in.mp4
mediainfo --Inform="Video;%Width%x%Height% %FrameRate%fps %Format%/%Format_Profile%\n" in.mp4
```

输出分成几个段 (示意，字段会因文件而异)：

段 | 常见字段
-- | --
General | Format (容器)、Duration、Overall bit rate、File size
Video | Format、Format profile、Codec ID、Width/Height、Frame rate、Frame rate mode (CFR/VFR)、Bit rate、Color space (YUV/RGB)、Chroma subsampling (4:2:0)、Bit depth、Scan type
Audio | Format、Channel(s)、Sampling rate、Bit rate、Bit depth
Text | 字幕格式与语言

表中：每一行是输出中的一个段，右边列出该段下排查问题时最常用的字段；`Frame rate mode` 为 VFR 时说明帧间隔不固定，剪辑和同步时要特别注意。

## ffprobe

FFmpeg 自带的探测工具，适合脚本使用，输出可以是 JSON：

```
ffprobe -v error -show_format -show_streams in.mp4
ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,profile,width,height,r_frame_rate,pix_fmt -of json in.mp4
ffprobe -v error -show_packets -select_streams v:0 in.mp4      # 每个包的 pts/dts/大小/是否关键帧
```

- `-select_streams v:0` 只看第一路视频；`-show_entries` 只输出指定字段
- `-show_packets`/`-show_frames` 可以查看每个包或帧的时间戳和类型，用来分析 GOP 结构和 B 帧，见 [Video Codec](/0770_Media_Video_Codec)

## gst-discoverer

GStreamer 自带，输出该文件在 GStreamer 里的拓扑 (容器、各路编码)，方便确认 GStreamer 能否解析，见 [gst-discoverer](/0111_Media_Tools_GStreamer_gstdiscoverer)。

```
gst-discoverer-1.0 in.mp4
```

## 对比

工具 | 来源 | 输出详细程度 | 脚本友好 | 适用
-- | -- | -- | -- | --
MediaInfo | MediaArea | 最详细，字段最全 | 支持 JSON/XML/自定义模板 | 人工快速检查、取技术参数
ffprobe | FFmpeg | 详细，可按包/帧深入 | 支持 JSON/CSV | 脚本批量处理、分析码流结构
gst-discoverer | GStreamer | 基本拓扑、tag | 文本输出 | 确认 GStreamer 管线能否处理

表中：`输出详细程度` 是相对比较。日常人工看一眼用 MediaInfo，写脚本或要分析时间戳用 ffprobe，调试 GStreamer 管线时用 gst-discoverer。

## Reference
- [MediaInfo](https://mediaarea.net/en/MediaInfo)
- [ffprobe Documentation](https://ffmpeg.org/ffprobe.html)
- [gst-discoverer](https://gstreamer.freedesktop.org/documentation/tools/gst-discoverer.html)

