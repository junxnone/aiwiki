---
Title | Gstreamer
-- | --
Create Date | `2018-11-27T15:44:49Z`
Update Date | `2021-10-21T02:48:23Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/109)

---
# Reference
- [gstreamer blog](https://blog.csdn.net/knowledgebao/article/category/8053683)
- [Gstreamer的安装](https://blog.csdn.net/knowledgebao/article/details/83993255)
- [Docs](https://thiblahute.github.io/GStreamer-doc/index.html?gi-language=c)
- [wiki - wdv4758h](https://wdv4758h.github.io/notes/multimedia/gstreamer.html#)



# Brief
- Gstreamer 是一个通用跨平台的流媒体应用框架
  - 可以处理 Audio/Video/其他数据流
- element
- pad
- bin
- pipeline




Tools | Description
-- | --
[gst-inspect-1.0](gstreamer_tools_gst_inspect)
[gst-launch-1.0](/gstreamer_tools_gst_launch)
[gst-device-monitor-1.0] | 查看当前设备上的 `Device`
[gst-discoverer-1.0](gstreamer_tools_gst_discoverer)
ges-launch-1.0

## Install
### Install with Ubuntu
```


```

### build from source
```
sudo apt install autopoint gtk-doc-tools
```


## Arch

![image](https://user-images.githubusercontent.com/2216970/138202047-986a28dc-ede5-4c42-b8c7-f0d802b7512e.png)

---

![image](https://user-images.githubusercontent.com/2216970/138202714-cef78876-0d68-4811-9f57-a5a583e552a7.png)



## Pipeline
- source - file/http/rtp/...
- demux - 分离数据 audio/video/...
- decoder - `xxx format -> yuv/pcm`
- sink - 数据输出

![image](https://user-images.githubusercontent.com/2216970/138111410-65ed98b9-82a7-4097-91da-cbaa2c8a47da.png)





