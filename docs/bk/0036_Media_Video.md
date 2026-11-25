-----

| Title     | Media Video                                          |
| --------- | ---------------------------------------------------- |
| Created @ | `2019-03-21T05:38:36Z`                               |
| Updated @ | `2026-11-25T16:21:29Z`                               |
| Labels    | \`\`                                                 |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/36) |

-----

# Video 视频

视频是按时间顺序排列的一组图像 (加上同步的音频)。处理视频时要分清三层概念：原始数据格式、编码 (codec)、容器 (container)。

## 三层概念

下图说明从相机采集到文件/网络传输，视频数据经过的三个层次：

``` mermaid
flowchart LR
    A[相机/传感器] --> B[原始视频<br>yuv/rgb 每帧完整像素]
    B --> C[编码 codec<br>H.264/H.265/M-JPEG]
    C --> D[容器 container<br>mp4/mkv/ts]
    D --> E[文件]
    D --> F[网络流<br>RTSP/HLS]
```

图中：

  - `原始视频` 没有压缩，每帧都是完整图像，格式见
    [像素格式](/0119_Media_Image_Camera_PixelFormat) 和
    [YUV](/0121_Media_Image_Color_Model_YUV)，数据量很大 (1080p30 约 746 Mbps)
  - `编码` 利用帧内和帧间冗余压缩数据，见 [Video Codec](/0770_Media_Video_Codec)
  - `容器` 把编码后的视频、音频和字幕打包并保存时间戳与索引，见 [Video
    Container](/0776_Media_Video_Container)
  - 最后既可以存成文件，也可以按 [Video Streaming](/0771_Media_Video_Streaming)
    里的协议通过网络传输

## 文章导航

| 文章                                             | 内容                                    |
| ---------------------------------------------- | ------------------------------------- |
| [Video Codec](/0770_Media_Video_Codec)         | 压缩原理、I/P/B 帧、GOP、码率控制、H.264/H.265/AV1 |
| [Video Container](/0776_Media_Video_Container) | mp4/mkv/ts 结构，转封装                     |
| [Video Streaming](/0771_Media_Video_Streaming) | RTSP/RTP、HLS、WebRTC，延迟构成              |
| [Video HWCodec](/0772_Media_Video_HWCodec)     | VA-API/QSV/NVENC，零拷贝                  |
| [FFmpeg](/0774_Media_Tools_FFmpeg)             | 转码、截取、抽帧、取流                           |
| [MediaInfo](/0773_Media_Tools_MediaInfo)       | 查看编码、分辨率、帧率等信息                        |
| [GStreamer](/0109_Media_Tools_GStreamer)       | 实时 pipeline 框架                        |
| [低延迟相机](/0037_Media_Image_Camera_LowLatency)   | 端到端延迟的构成                              |
| [OpenCV IO Video](/0352_OpenCV_IO_Video)       | OpenCV 读写视频                           |

表中：每行是一篇相关文章，右侧是它覆盖的内容；先读 Codec、Container，再按需读流传输、硬件加速和工具。

## Video Format

| 格式     | 层次 | 说明                    |
| ------ | -- | --------------------- |
| yuv    | 原始 | 未压缩的原始帧序列，无文件头        |
| M-JPEG | 编码 | 逐帧 JPEG，仅帧内压缩，延迟低     |
| H.264  | 编码 | 最通用的视频编码              |
| avi    | 容器 | 老旧的 RIFF 容器，常装 M-JPEG |
| mp4    | 容器 | 最通用的容器                |
| mkv    | 容器 | 灵活，支持多音轨与字幕           |

表中：`层次` 说明该格式属于上面三层概念里的哪一层。同一个文件名后缀可能对应不同编码，所以 `mp4` 和 `H.264` 不是同一个概念。

## Reference

  - [codecs - fourcc](http://www.fourcc.org/codecs.php)
  - [M-JPEG和H.264压缩性能比较（V4L2采集+编码压缩）](https://blog.csdn.net/qq_41248872/article/details/83590337)
