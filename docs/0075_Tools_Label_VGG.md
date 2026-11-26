---
Title | Tools Label VGG
-- | --
Created @ | `2019-01-18T02:14:53Z`
Updated @| `2026-11-26T09:54:55Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/75)

---
# VIA - VGG Image Annotator

VIA（VGG Image Annotator）是牛津大学 VGG 组开发的开源图像标注工具：一个独立的 HTML 页面，在浏览器里离线运行，不需要安装和服务器。

## Download

```
wget https://gitlab.com/vgg/via/-/archive/via-2.0.5/via-via-2.0.5.zip
```

## UseCase

### Start
Open the file via.html to start the app.

![image](https://user-images.githubusercontent.com/2216970/51712410-a695c980-2069-11e9-8be7-e30149c594f5.png)

图中：该图为原文档附带的 VIA 主界面截图，对应上面「打开 via.html」后的界面。

### Attributes

![image](https://user-images.githubusercontent.com/2216970/51713334-8ca9b600-206c-11e9-8426-b5d3143cdba8.png)

图中：该图为原文档附带的属性（Attributes）设置界面，用于给标注区域添加自定义属性。

## 标注流程

| 步骤 | 操作 |
| --- | --- |
| 1 | 加载图片（Add Files） |
| 2 | 选择区域形状（矩形、圆、椭圆、多边形、折线、点） |
| 3 | 在图片上绘制区域 |
| 4 | 在 Attributes 里定义属性（如类别），给每个区域填写 |
| 5 | 导出标注（CSV 或 JSON） |

表中：

- **区域**：图片中被标注的形状；**属性**：区域对应的类别或其他信息
- 对比结论：VIA 适合小规模、需要灵活属性和多种形状的标注任务；标注框的目标检测可用 [LabelImg](https://github.com/junxnone/aiwiki/issues/250)，工具总览见 [标注工具](https://github.com/junxnone/aiwiki/issues/6)

## Reference
- [VGG Image Annotator (VIA)](http://www.robots.ox.ac.uk/~vgg/software/via/)
- [Gitlab repo](https://gitlab.com/vgg/via/tags/via-2.0.5)

