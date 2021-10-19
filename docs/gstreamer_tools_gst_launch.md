---
Title | gstreamer tools gst-launch
-- | --
Create Date | `2021-10-19T16:41:15Z`
Update Date | `2021-10-19T16:41:15Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/110)

---
# Reference
- [gstreamer基础教程10-GStreamer tools](https://blog.csdn.net/knowledgebao/article/details/82789613)

# Brief
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
