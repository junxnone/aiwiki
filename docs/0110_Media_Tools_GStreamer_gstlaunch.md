---
Title | Media Tools GStreamer gstlaunch
-- | --
Created @ | `2018-11-27T15:45:35Z`
Updated @| `2023-06-17T15:31:55Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/110)

---
# gst-launch

- 参数为 **pipeline**, 使用特定字符串描述


## Pipeline
- 使用 <kbd>!</kbd> 分隔 **Element**
- 可以创建多分支 **Pipeline**


```
gst-launch-1.0 playbin uri=file:///home/xxx/xxx.mp4
```
```
gst-launch-1.0 videotestsrc ! videoconvert ! autovideosink
```
```
gst-launch-1.0 videotestsrc pattern=11 ! videoconvert ! autovideosink
```
```
gst-launch-1.0 videotestsrc ! videoconvert ! tee name=t ! queue ! autovideosink t. ! queue ! autovideosink
```


## Reference
- [gstreamer基础教程10-GStreamer tools](https://blog.csdn.net/knowledgebao/article/details/82789613)

