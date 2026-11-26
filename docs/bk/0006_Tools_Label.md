-----

| Title     | Tools Label                                         |
| --------- | --------------------------------------------------- |
| Created @ | `2021-08-31T08:56:52Z`                              |
| Updated @ | `2026-11-26T10:09:34Z`                              |
| Labels    | \`\`                                                |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/6) |

-----

# 标注工具

数据标注是训练监督模型的前提。选择工具时主要看：标注的任务类型（分类、检测、分割、文本）、输出格式、是否支持协作与自动辅助标注。

## Image 标注工具

  - [CVAT](/CVAT)
  - [VIA](/VGG_Image_Annotator)
  - [Labelme](/Labelme)
  - [LabelImg](/LabelImg)

-----

  - [Vatic](https://github.com/cvondrick/vatic/tree/contrib)
  - [Yolo\_mark](https://github.com/AlexeyAB/Yolo_mark)
  - [VoTT - Microsoft](https://github.com/Microsoft/VoTT)
  - [精灵标注助手 - Ali](http://www.jinglingbiaozhu.com/)
  - [LabelMe -
    web](https://github.com/CSAILVision/LabelMeAnnotationTool) -----
    [Labelme - python](https://github.com/wkentaro/labelme)
  - [AnnoSystem](https://github.com/liruilong940607/AnnoSystem)
  - [PixelAnnotationTool](https://github.com/abreheret/PixelAnnotationTool/)

## 常用工具对比

| 工具                                                        | 标注类型       | 特点                                                          |
| --------------------------------------------------------- | ---------- | ----------------------------------------------------------- |
| [LabelImg](https://github.com/junxnone/aiwiki/issues/250) | 矩形框        | 轻量桌面应用，输出 Pascal VOC / YOLO 格式                              |
| Labelme                                                   | 多边形、矩形、点等  | 适合分割，输出 JSON                                                |
| [VIA](https://github.com/junxnone/aiwiki/issues/75)       | 多种形状       | 单个 HTML 离线运行，输出 CSV / JSON                                  |
| CVAT                                                      | 框、多边形、视频跟踪 | Web 平台，多人协作                                                 |
| VoTT                                                      | 框、多边形      | Microsoft 开源，支持视频                                           |
| 带主动学习的工具                                                  | 视工具而定      | 见 [AL Tools](https://github.com/junxnone/aiwiki/issues/175) |

表中：

  - **标注类型**：工具支持的标注形状；**输出**：生成的标注文件格式
  - 对比结论：目标检测用 LabelImg 最简单；分割用 Labelme；多人协作、视频用 CVAT

## 常见标注格式

| 格式         | 文件           | 框的表示                                         |
| ---------- | ------------ | -------------------------------------------- |
| Pascal VOC | 每图一个 XML     | $(x\_{min},y\_{min},x\_{max},y\_{max})$，像素坐标 |
| YOLO       | 每图一个 txt     | $(c,x\_c,y\_c,w,h)$，相对图像宽高归一化                |
| COCO       | 整个数据集一个 JSON | $(x,y,w,h)$，左上角加宽高，像素坐标                      |

表中：$c$ 为类别编号；$(x\_c,y\_c)$ 为框中心；$w,h$ 为框宽高。不同格式之间需要换算，如 VOC 转 YOLO 的公式见
[LabelImg](https://github.com/junxnone/aiwiki/issues/250)。

## NLP标注工具

  - [BRAT](http://brat.nlplab.org/installation.html)
  - [VGG Image Annotator
    (VIA)](http://www.robots.ox.ac.uk/~vgg/software/via/)

## Reference

  - [标注工具](https://www.cnblogs.com/alexanderkun/p/6936732.html)
