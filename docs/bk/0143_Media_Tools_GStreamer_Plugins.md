-----

| Title         | Media Tools GStreamer Plugins                         |
| ------------- | ----------------------------------------------------- |
| Created @     | `2021-12-11T04:02:35Z`                                |
| Last Modify @ | `2022-12-23T13:16:06Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/143) |

-----

## Reference

  - [GStreamer Plug-ins
    splitup](https://gstreamer.freedesktop.org/documentation/additional/splitup.html#)

## Brief

  - plugins
      - source plugin
      - transform plugin
      - sink plugin
  - gst-plugins-base
  - gst-plugins-good
  - gst-plugins-ugly
  - gst-plugins-bad

## 常用 Plugins

  - video encoder/decoder
  - image encoder/decoder
  - audio encoder/decoder

### Video

| Plugins Name        | Description    |
| ------------------- | -------------- |
| bayer2rgb/rgb2bayer | rgb & bayer 转换 |
| videoconvert        |                |
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
| queue                |                                                     |
| ffmpeg               |                                                     |
| opencv               |                                                     |
| appsink              |                                                     |
| ximagesrc/ximagesink | Capture X Display/ Renders video frames to X Window |

### Network

| Plugins Name | Description |
| ------------ | ----------- |
| curl         |             |
| tcp          |             |
| udp          |             |
| rtp          |             |
