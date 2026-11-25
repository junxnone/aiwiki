-----

| Title     | Media Audio Codec                                     |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-25T16:15:02Z`                                |
| Updated @ | `2026-11-25T16:21:12Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/769) |

-----

# Audio Codec

音频编码：把 [PCM](/0775_Media_Audio_Basics) 压缩成更小的码流，以及常见格式
WAV、FLAC、MP3、AAC、Opus 的区别与选用。

## 无损与有损

  - 无损 (lossless)：解码后与原始 PCM 逐位相同，靠消除统计冗余压缩 (线性预测 + 熵编码)，压缩比通常不到 2:1
  - 有损 (lossy)：丢掉人耳不易察觉的信息，靠心理声学模型决定丢什么，压缩比可达 10:1 以上
  - 有损编码利用的是掩蔽效应：强信号附近的弱信号、以及高频的细微成分很难被听到，可以用更粗的精度量化甚至丢弃

## 有损编码流程

下图是一个典型变换编码器的结构，MP3、AAC 都属于这一类：

``` mermaid
flowchart LR
    A[PCM] --> B[分帧加窗]
    B --> C[MDCT<br>时域到频域]
    C --> D[量化]
    D --> E[熵编码<br>霍夫曼/算术编码]
    E --> F[码流]
    A --> G[心理声学模型<br>计算掩蔽阈值]
    G -->|决定每个频带的量化精度| D
```

图中：

  - 主路径从左到右：PCM 先分成帧并加窗，再用 MDCT (Modified Discrete Cosine
    Transform，改进离散余弦变换) 转到频域，量化后用熵编码得到码流
  - 下方分支是心理声学模型：根据信号分析每个频带的掩蔽阈值，阈值以下的成分可以粗量化或丢弃
  - 量化是唯一有损的一步；码率越低，量化越粗，失真越明显
  - 解码是逆过程：熵解码 → 反量化 → IMDCT → 重叠相加，得到 PCM

## 帧长与延迟

$$ T\_{frame} = \\frac{N}{f\_s} $$

其中：

  - $N$：一帧包含的采样点数 (每个编码器固定，如 MP3 为 1152，AAC-LC 为 1024)
  - $f\_s$：采样率 (Hz)
  - $T\_{frame}$：一帧对应的时长；编码器至少要攒够一帧才能开始编码，因此帧长是算法延迟的下限

例：AAC-LC 在 $48\\text{kHz}$ 下
$T\_{frame}=1024/48000\\approx21.3\\text{ms}$；MP3 在 $44.1\\text{kHz}$ 下
$1152/44100\\approx26.1\\text{ms}$。实时通话需要更短的帧，Opus 支持 2.5/5/10/20/40/60
ms 的帧。

## 常见格式

### WAV

  - 容器 (基于 RIFF)，通常装未压缩 PCM，也可以装其他编码
  - 文件头记录采样率、位深、声道数，适合作为中间格式

### FLAC

  - 开源无损编码，典型压缩后大小约为原始 PCM 的一半 `[经验]`，随音乐类型而变
  - 解码速度快，支持标签 (tag)；GStreamer 有 `flacenc/flacdec/flactag` 插件，见
    [Plugins](/0143_Media_Tools_GStreamer_Plugins)

### MP3

  - MPEG-1 Audio Layer III，1990 年代初发布，兼容性最好
  - 典型码率 128\~320 kbps，高频截止较早，低码率下失真明显

### AAC

  - MPEG-2/MPEG-4 的 Advanced Audio Coding，MP3 的后继，同码率下音质通常优于 MP3
  - 常见子类型：AAC-LC (最常用)、HE-AAC (低码率，使用 SBR/PS 技术)
  - 常装在 mp4/m4a 容器里，或用 ADTS 格式裸流传输

### Opus

  - IETF 标准 (RFC 6716)，由 SILK (语音) 和 CELT (音乐) 两种技术结合，可自动或手动切换
  - 码率范围 6~~510 kbps，帧长 2.5~~60 ms，延迟低，WebRTC 的默认音频编码

## 方法对比

| 格式      | 类型  | 典型码率                    | 帧长/延迟        | 常用容器             | 典型场景          |
| ------- | --- | ----------------------- | ------------ | ---------------- | ------------- |
| PCM/WAV | 无压缩 | 1411 kbps (CD)          | 无            | wav              | 录音、中间格式       |
| FLAC    | 无损  | 约 700\~1000 kbps `[经验]` | 较低           | flac、mkv         | 音乐存档          |
| MP3     | 有损  | 128\~320 kbps           | 26 ms 帧      | mp3              | 通用音乐          |
| AAC-LC  | 有损  | 96\~256 kbps            | 约 21 ms 帧    | mp4/m4a、ts       | 视频伴音、流媒体      |
| Opus    | 有损  | 6\~510 kbps             | 2.5\~60 ms 帧 | ogg、webm、mkv、RTP | 通话、WebRTC、低延迟 |

表中：`类型` 指无损/有损；`典型码率` 是常见取值范围而非标准规定；`帧长/延迟`
是编码器一帧的时长，实际端到端延迟还要加上网络和缓冲；`常用容器`
见 [Video Container](/0776_Media_Video_Container)。选用建议：存档用 FLAC，兼容性优先用
AAC 或 MP3，实时通信用 Opus。

## 工具

  - 查看一个音频文件用了哪种编码：[gst-discoverer](/0111_Media_Tools_GStreamer_gstdiscoverer)、[MediaInfo](/0773_Media_Tools_MediaInfo)
  - 转码：[FFmpeg](/0774_Media_Tools_FFmpeg)，例如 `ffmpeg -i in.wav -c:a
    libopus -b:a 64k out.opus`

## Reference

  - [Opus Interactive Audio Codec -
    RFC 6716](https://www.rfc-editor.org/rfc/rfc6716)
  - [FLAC format](https://xiph.org/flac/format.html)
  - [Advanced Audio Coding -
    Wikipedia](https://en.wikipedia.org/wiki/Advanced_Audio_Coding)
  - [MP3 - Wikipedia](https://en.wikipedia.org/wiki/MP3)
