---
Title | Gstreamer
-- | --
Create Date | `2018-11-27T15:44:49Z`
Update Date | `2021-12-11T04:12:03Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/109)

---
## Reference
- [gstreamer blog](https://blog.csdn.net/knowledgebao/article/category/8053683)
- [Gstreamer的安装](https://blog.csdn.net/knowledgebao/article/details/83993255)
- [Docs](https://thiblahute.github.io/GStreamer-doc/index.html?gi-language=c)
- [wiki - wdv4758h](https://wdv4758h.github.io/notes/multimedia/gstreamer.html#)



## Brief
- Gstreamer 是一个通用跨平台的流媒体应用框架
  - 可以处理 Audio/Video/其他数据流
- [Gstreamer Install](/Gstreamer_Install)
- [Command Line Tools](###Command Line Tools)
- [Gstreamer Concepts](/Gstreamer_Concepts)
- [Gstreamer Plugins](/Gstreamer_Plugins)


### Command Line Tools

Tools | Description
-- | --
[gst-inspect-1.0](gstreamer_tools_gst_inspect) | 查看 elements 信息 - src/sink/pad/Capabilities/...
[gst-launch-1.0](/gstreamer_tools_gst_launch) | 创建 pipeline
[gst-device-monitor-1.0]  |  查看当前设备上的 `Device`
[gst-discoverer-1.0](gstreamer_tools_gst_discoverer) | 查看 media 相关信息 - codec/Channels/Sample rate/Bitrate/...
ges-launch-1.0 | 控制 timeline 开始时间/间隔/...


## Arch

![image](https://user-images.githubusercontent.com/2216970/138202047-986a28dc-ede5-4c42-b8c7-f0d802b7512e.png)

---

![image](https://user-images.githubusercontent.com/2216970/138202714-cef78876-0d68-4811-9f57-a5a583e552a7.png)



## Pipeline
- 数据流通的定义(定义组件的顺序)
- source - file/http/rtp/...
- demux - 分离数据 audio/video/...
- decoder - `xxx format -> yuv/pcm`
- sink - 数据输出

![image](https://user-images.githubusercontent.com/2216970/138111410-65ed98b9-82a7-4097-91da-cbaa2c8a47da.png)

![image](https://user-images.githubusercontent.com/2216970/138203169-3e1ebef5-fb7f-4c08-a5d8-5a41159f3be9.png)




