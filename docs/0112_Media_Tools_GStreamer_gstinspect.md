---
Title | Media Tools GStreamer gstinspect
-- | --
Created @ | `2021-02-05T03:20:38Z`
Updated @| `2023-06-17T15:30:26Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/112)

---
# gst-inspect

## Reference
- [GStreamer基础教程12 - 常用命令工具](https://www.cnblogs.com/xleng/p/11791944.html)

## UseCase

Num | UC | Command
-- | -- | --
1 | 列出**当前系统**中支持的所有 **Element** | `gst-inspect-1.0`
2 | 列出指定 **Element** 的 **详细信息** |  `gst-inspect-1.0 vaapi`
3 | 列出**Gstreamer Plugin**包含的 **Element** | `gst-inspect-1.0 /usr/lib/gstreamer-1.0/libgstpng.so`

```
$ gst-inspect-1.0
video4linux2:  v4l2src: Video (video4linux2) Source
video4linux2:  v4l2sink: Video (video4linux2) Sink
video4linux2:  v4l2radio: Radio (video4linux2) Tuner
video4linux2:  v4l2deviceprovider (GstDeviceProviderFactory)
vaapi:  vaapisink: VA-API sink
libav:  avdeinterlace: libav Deinterlace element
libav:  avmux_yuv4mpegpipe: libav YUV4MPEG pipe muxer (not recommended, use y4menc instead)
libav:  avmux_wtv: libav Windows Television (WTV) muxer
...
...
```

```
$ gst-inspect-1.0 avdec_png
Factory Details:
  Rank                     marginal (64)
  Long-name                libav PNG (Portable Network Graphics) image decoder
  Klass                    Codec/Decoder/Video
  Description              libav png decoder
  Author                   Wim Taymans, Ronald Bultje , Edward Hervey 

Plugin Details:
  Name                     libav
  Description              All libav codecs and formats (local snapshot)
  Filename                 /usr/lib/gstreamer-1.0/libgstlibav.so
  Version                  1.16.0
  License                  LGPL
  Source module            gst-libav
  Binary package           GStreamer libav source release
  Origin URL               Unknown package origin

GObject
 +----GInitiallyUnowned
       +----GstObject
             +----GstElement
                   +----GstVideoDecoder
                         +----avdec_png

Pad Templates:
  SINK template: 'sink'
    Availability: Always
    Capabilities:
      image/png

  SRC template: 'src'
    Availability: Always
    Capabilities:
      video/x-raw
...
...
```


```
$ gst-inspect-1.0 /usr/lib/gstreamer-1.0/libgstpng.so
Plugin Details:
  Name                     png
  Description              PNG plugin library
  Filename                 /usr/lib/gstreamer-1.0/libgstpng.so
  Version                  1.16.0
  License                  LGPL
  Source module            gst-plugins-good
  Source release date      2019-04-19
  Binary package           GStreamer Good Plug-ins source release
  Origin URL               Unknown package origin

  pngenc: PNG image encoder
  pngdec: PNG image decoder

  2 features:
  +-- 2 elements
```
