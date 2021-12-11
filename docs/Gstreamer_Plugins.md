---
Title | Gstreamer Plugins
-- | --
Create Date | `2021-12-11T04:02:35Z`
Update Date | `2021-12-11T04:40:54Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/143)

---
## Reference
- [GStreamer Plug-ins splitup](https://gstreamer.freedesktop.org/documentation/additional/splitup.html#)


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

Plugins Name | Description
-- | --
bayer2rgb/rgb2bayer | rgb & bayer 转换



### Image

Plugins Name | Description
-- | --
jpegenc/dec | jpeg 编解码
pngenc/dec | png 编解码


### Audio

Plugins Name | Description
-- | --
adpcmenc/dec | pcm 编解码
flacenc/dec/tag | flac 编解码


### Others

Plugins Name | Description
-- | --
aesenc/dec | aes 编解码
filesrc/filesink | 读写文件 `filesrc/filesink location=path/to/your/file`
queue |
ffmpeg | 
opencv | 

### Network

Plugins Name | Description
-- | --
curl |
tcp |
udp | 
rtp |


