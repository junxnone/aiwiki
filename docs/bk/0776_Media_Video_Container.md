-----

| Title     | Media Video Container                                 |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-25T16:20:42Z`                                |
| Updated @ | `2026-11-25T16:21:17Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/776) |

-----

# Video Container

视频容器：mp4、mkv、ts 等格式和编码 (codec) 的区别，容器内部结构，以及封装、转封装时的常见问题。

## 容器与编码的区别

  - 编码 (codec)：决定视频/音频数据怎么压缩，如 H.264、AAC，见 [Video
    Codec](/0770_Media_Video_Codec)、[Audio
    Codec](/0769_Media_Audio_Codec)
  - 容器 (container)：决定多路数据 (视频、音频、字幕) 怎么打包进一个文件或流，并保存时间戳、索引、元数据
  - 一个 `.mp4` 文件里可能是 H.264 + AAC，也可能是 H.265 + AAC；只看后缀无法知道里面是什么编码，需要用
    [MediaInfo](/0773_Media_Tools_MediaInfo) 或
    [gst-discoverer](/0111_Media_Tools_GStreamer_gstdiscoverer) 查看

下图展示 GStreamer/FFmpeg 里常见的「解封装 → 解码」与「编码 → 封装」两个方向：

``` mermaid
flowchart LR
    F1[a.mp4] --> D[demux<br>解封装]
    D -->|H.264 码流| DEC1[video decoder]
    D -->|AAC 码流| DEC2[audio decoder]
    DEC1 --> RAW1[yuv]
    DEC2 --> RAW2[pcm]
    RAW1 --> ENC1[video encoder]
    RAW2 --> ENC2[audio encoder]
    ENC1 --> M[mux<br>封装]
    ENC2 --> M
    M --> F2[b.mkv]
```

图中：

  - demux 把容器拆成各路独立的编码码流 (带时间戳)，mux 做相反的事，把多路码流打包到容器
  - 只做 demux 再 mux、中间不经过 decoder/encoder，就是转封装 (remux)，不损失画质、速度很快，FFmpeg
    里写作 `-c copy`
  - 经过 decoder 和 encoder 就是转码 (transcode)，会重新压缩，耗时且有损

## 常见容器

| 容器   | 全称/来源                        | 支持的编码                   | 特点                                    | 典型场景          |
| ---- | ---------------------------- | ----------------------- | ------------------------------------- | ------------- |
| mp4  | MPEG-4 Part 14 (基于 ISO BMFF) | H.264/H.265/AV1、AAC 等   | 兼容性最好，索引在文件里，需完整才能边下边播 (除非 faststart) | 点播、手机、网页      |
| mkv  | Matroska                     | 几乎所有编码，多音轨/字幕           | 灵活、开放                                 | 影视收藏、录制       |
| webm | 基于 Matroska 的子集              | VP8/VP9/AV1、Vorbis/Opus | 面向网页                                  | 网页视频          |
| avi  | 微软 RIFF                      | MJPEG、MPEG-4 等          | 老旧，不支持 B 帧时间戳等新特性                     | 旧设备、M-JPEG 相机 |
| ts   | MPEG Transport Stream        | H.264/H.265、AAC 等       | 188 字节固定包，容错好，可从任意位置开始解码              | 数字电视、HLS 分片   |
| flv  | Flash Video                  | H.264、AAC               | 结构简单                                  | RTMP 推流       |
| 裸流   | `.h264`/`.hevc`/`.yuv`       | 单一路                     | 无时间戳和索引，用 Annex B 起始码分隔               | 调试、编码器输出      |

表中：`支持的编码` 列出该容器常搭配的编码，而不是全部限制；ts 和 flv 偏向流式传输，mp4 和 mkv
偏向文件存储。裸流没有帧率信息，用 FFmpeg 读取时必须指定，例如
`-framerate 30`。

## MP4 结构

MP4 由一个个 box (也叫 atom) 组成，每个 box 有 4 字节长度和 4 字节类型：

``` mermaid
flowchart TB
    subgraph MP4[mp4 文件]
        FT[ftyp<br>文件类型/兼容品牌]
        MV[moov<br>元数据]
        MD[mdat<br>实际的音视频数据]
    end
    MV --> TRK[trak<br>每路流一个]
    TRK --> STBL[stbl<br>采样表]
    STBL --> S1[stts: 每帧时间]
    STBL --> S2[stsz: 每帧大小]
    STBL --> S3[stco: 每帧在 mdat 中的偏移]
    STBL --> S4[stss: 关键帧列表]
```

图中：

  - `ftyp` 声明文件类型；`mdat` 存放压缩后的帧数据；`moov` 存放所有索引信息
  - `moov` 里每路流有一个 `trak`，其 `stbl` 采样表记录每一帧的时间 (`stts`)、大小 (`stsz`)、偏移
    (`stco`) 和哪些是关键帧 (`stss`)；播放器靠这些表才能定位和拖动
  - 默认情况下 `moov` 在文件末尾，录制结束才写出，如果程序中途崩溃，文件无法播放
  - 网络点播需要把 `moov` 移到文件前面 (`faststart`)：`ffmpeg -i in.mp4 -c copy
    -movflags +faststart out.mp4`
  - 直播/录制可使用分片 mp4 (fragmented mp4, fMP4)：用多个 `moof`+`mdat`
    对，边录边写，不依赖末尾的 `moov`，是 HLS/DASH 的常用分片格式

## MPEG-TS 结构

  - 固定 188 字节的包，包头同步字节为 `0x47`，用 PID 区分视频、音频和节目表 (PAT/PMT)
  - 没有全局索引，每个包都自带足够信息，丢包后很快能恢复，所以适合广播和网络传输
  - HLS 把流切成一个个 `.ts` 小文件，见 [Video
    Streaming](/0771_Media_Video_Streaming)

## 转封装常见问题

  - 裸流转 mp4 时帧率信息缺失，导致时长/速度不对，需要显式指定输入帧率
  - Annex B 与 AVCC/HVCC 格式不同，把 mp4 里的 H.264 导出为裸流时需要转换，FFmpeg 的 `-bsf:v
    h264_mp4toannexb` 做这件事 (FFmpeg 导出 `.h264` 时通常自动处理)
  - 不是所有容器都能装所有编码，例如 webm 不能装 H.264，avi 对 B 帧支持差；遇到 `Could not write
    header` 一类错误时先检查编码与容器是否匹配
  - 时间戳不连续 (如多段拼接) 会造成音画不同步，需要重新生成时间戳 (`-fflags +genpts`)

## Reference

  - [MP4 file format -
    Wikipedia](https://en.wikipedia.org/wiki/MP4_file_format)
  - [ISO base media file format -
    Wikipedia](https://en.wikipedia.org/wiki/ISO_base_media_file_format)
  - [Matroska](https://www.matroska.org/)
  - [MPEG transport stream -
    Wikipedia](https://en.wikipedia.org/wiki/MPEG_transport_stream)
  - [FFmpeg Formats
    Documentation](https://ffmpeg.org/ffmpeg-formats.html)
