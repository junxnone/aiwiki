-----

| Title     | Media Tools GStreamer Plugins                         |
| --------- | ----------------------------------------------------- |
| Created @ | `2021-12-11T04:02:35Z`                                |
| Updated @ | `2026-11-26T09:16:46Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/143) |

-----

# Plugins

GStreamer 的功能全部由插件（plugin）提供。每个插件里包含若干个元素（element），在 pipeline
中把元素连接起来完成处理。

  - plugins
      - source plugin：产生数据（读文件、相机、网络）
      - transform plugin：转换数据（编解码、格式转换、滤镜）
      - sink plugin：消费数据（显示、写文件、网络发送）

<!-- end list -->

``` mermaid
flowchart LR
    S[source] --> T[transform] --> K[sink]
```

图中：数据从 source 流向 sink，中间可经过多个 transform。

## 插件集

| 插件集              | 说明                |
| ---------------- | ----------------- |
| gst-plugins-base | 基础、维护良好的核心插件      |
| gst-plugins-good | 质量好、许可友好（LGPL）的插件 |
| gst-plugins-ugly | 质量好，但可能有许可或专利问题   |
| gst-plugins-bad  | 质量或稳定性尚不足，仍在完善    |

表中：

  - 名称并不代表「好坏」本身，而是质量与许可情况的分类
  - 对比结论：常用功能多在 base / good；H.264 编码（x264）等有专利问题的在 ugly；新特性和硬件加速常出现在 bad

## 常用 Plugins

  - video encoder/decoder
  - image encoder/decoder
  - audio encoder/decoder

### Video

| Plugins Name        | Description    |
| ------------------- | -------------- |
| bayer2rgb/rgb2bayer | rgb & bayer 转换 |
| videoconvert        | 视频像素格式转换       |
| x264enc/x265enc     | 编码器            |

### Image

| Plugins Name | Description |
| ------------ | ----------- |
| jpegenc/dec  | jpeg 编解码    |
| pngenc/dec   | png 编解码     |

### Audio

| Plugins Name    | Description |
| --------------- | ----------- |
| adpcmenc/dec    | pcm 编解码     |
| flacenc/dec/tag | flac 编解码    |

### Others

| Plugins Name         | Description                                         |
| -------------------- | --------------------------------------------------- |
| aesenc/dec           | aes 编解码                                             |
| filesrc/filesink     | 读写文件 `filesrc/filesink location=path/to/your/file`  |
| queue                | 缓冲队列，并在前后元素之间建立独立线程                                 |
| ffmpeg               | 基于 libav 的编解码插件                                     |
| opencv               | 使用 OpenCV 做图像处理的插件                                  |
| appsink              | 让应用程序从 pipeline 里取出数据                               |
| ximagesrc/ximagesink | Capture X Display/ Renders video frames to X Window |

### Network

| Plugins Name | Description                        |
| ------------ | ---------------------------------- |
| curl         | 通过 HTTP 等协议收发数据                    |
| tcp          | TCP 客户端/服务端的收发                     |
| udp          | UDP 收发                             |
| rtp          | RTP 打包/解包（payloader / depayloader） |

## 使用

  - 查看有哪些插件和元素：`gst-inspect-1.0`；查看某个元素的详细信息：`gst-inspect-1.0 x264enc`
  - 搭建 pipeline 的方法见
    [gst-launch](https://github.com/junxnone/aiwiki/issues/110)
  - 安装：不同插件集通常对应不同的软件包（如 `gstreamer1.0-plugins-good`）

## Reference

  - [GStreamer Plug-ins
    splitup](https://gstreamer.freedesktop.org/documentation/additional/splitup.html#)
