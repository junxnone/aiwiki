-----

| Title     | Media Audio                                           |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-25T16:14:42Z`                                |
| Updated @ | `2026-11-25T16:21:08Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/767) |

-----

# Audio 音频

音频处理的整体入口：声音如何数字化、如何压缩、如何和视频一起封装和传输。

## 文章导航

| 文章                                       | 内容                                                                                   |
| ---------------------------------------- | ------------------------------------------------------------------------------------ |
| [Audio Basics](/0775_Media_Audio_Basics) | 采样、量化、PCM、声道排列、码率计算                                                                  |
| [Audio Codec](/0769_Media_Audio_Codec)   | 无损/有损编码，WAV、FLAC、MP3、AAC、Opus 对比                                                     |
| [FFmpeg](/0774_Media_Tools_FFmpeg)       | 音频转码、重采样、提取音轨                                                                        |
| [MediaInfo](/0773_Media_Tools_MediaInfo) | 查看音频文件的编码、采样率、声道                                                                     |
| [GStreamer](/0109_Media_Tools_GStreamer) | 用 pipeline 处理音频，如 `flacenc/flacdec`，见 [Plugins](/0143_Media_Tools_GStreamer_Plugins) |

表中：每行是系列里的一篇文章，右侧概括其内容。建议按「Basics → Codec → 工具」的顺序阅读。

## 音频处理链路

下图展示一段音频从采集到播放要经过的阶段，以及各阶段对应的文章：

``` mermaid
flowchart LR
    A[麦克风/ADC] --> B[PCM<br>Audio Basics]
    B --> C[编码<br>Audio Codec]
    C --> D[封装<br>Video Container]
    D --> E[传输/存储<br>Video Streaming]
    E --> F[解封装 + 解码]
    F --> G[PCM] --> H[DAC/扬声器]
```

图中：

  - 左边是采集端：模拟信号经 ADC 变成 [PCM](/0775_Media_Audio_Basics)，再经
    [编码](/0769_Media_Audio_Codec) 压缩，和视频一起
    [封装](/0776_Media_Video_Container)，通过文件或
    [网络](/0771_Media_Video_Streaming) 传输
  - 右边是播放端：做相反的操作，最后经 DAC (数模转换) 送到扬声器
  - 带视频时，音频和视频各自编码，靠时间戳 (PTS) 同步；容器负责保存这些时间戳

## 常见问题速查

  - 音频播放速度/音调不对：多半是采样率不匹配，如 44.1 kHz 数据按 48 kHz 播放，见 [Audio
    Basics](/0775_Media_Audio_Basics)
  - 裸 PCM 播放出噪声：格式 (位深、字节序、交错/平面) 或声道数搞错
  - 音画不同步：检查时间戳是否连续，见 [Video Container](/0776_Media_Video_Container)
