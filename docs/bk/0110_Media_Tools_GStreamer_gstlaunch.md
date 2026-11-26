-----

| Title     | Media Tools GStreamer gstlaunch                       |
| --------- | ----------------------------------------------------- |
| Created @ | `2018-11-27T15:45:35Z`                                |
| Updated @ | `2026-11-26T09:16:42Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/110) |

-----

# gst-launch

  - 参数为 **pipeline**, 使用特定字符串描述
  - 用命令行快速搭建、测试 GStreamer 管道，不需要写代码

## Pipeline

  - 使用 <kbd>\!</kbd> 分隔 **Element**
  - 可以创建多分支 **Pipeline**

<!-- end list -->

    gst-launch-1.0 playbin uri=file:///home/xxx/xxx.mp4

    gst-launch-1.0 videotestsrc ! videoconvert ! autovideosink

    gst-launch-1.0 videotestsrc pattern=11 ! videoconvert ! autovideosink

    gst-launch-1.0 videotestsrc ! videoconvert ! tee name=t ! queue ! autovideosink t. ! queue ! autovideosink

## 各示例的含义

| 命令                                                                  | 作用                          |
| ------------------------------------------------------------------- | --------------------------- |
| `playbin uri=...`                                                   | 播放文件，自动选择解封装、解码、显示等元素       |
| `videotestsrc ! videoconvert ! autovideosink`                       | 生成测试画面，转换格式后显示              |
| `videotestsrc pattern=11`                                           | 给元素设置属性，`pattern` 选择不同的测试图案 |
| `... tee name=t ! queue ! autovideosink t. ! queue ! autovideosink` | 用 `tee` 把一路视频分成两路，分别显示      |

表中：

  - **Element**：管道中的处理单元（源、转换、编解码、输出）；**属性**写成 `名称=值`
  - `tee` 分叉后的每个分支前要加 `queue`，使各分支在独立线程中运行，避免阻塞
  - `t.` 表示「从名为 `t` 的元素再引出一个分支」
  - 对比结论：简单播放用 `playbin`，需要精细控制时手动写 Element 链

<!-- end list -->

``` mermaid
flowchart LR
    S[videotestsrc 源] --> C[videoconvert 格式转换]
    C --> T{tee 分流}
    T --> Q1[queue] --> V1[autovideosink]
    T --> Q2[queue] --> V2[autovideosink]
```

图中：从左到右是数据流向；`tee` 把同一份数据复制到两个分支，每个分支以 `queue` 起头。

## 常用技巧

  - 查看某个元素的属性和支持的格式：`gst-inspect-1.0 <元素名>`
  - 指定媒体格式（caps）：在两个元素之间写 `video/x-raw,width=640,height=480`
  - 查看日志：环境变量 `GST_DEBUG=3`（数字越大越详细）
  - 查看媒体文件信息：[gst-discoverer](https://github.com/junxnone/aiwiki/issues/111)
  - 常用元素见 [GStreamer
    Plugins](https://github.com/junxnone/aiwiki/issues/143)

## Reference

  - [gstreamer基础教程10-GStreamer
    tools](https://blog.csdn.net/knowledgebao/article/details/82789613)
