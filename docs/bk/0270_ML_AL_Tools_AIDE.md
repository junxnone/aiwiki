-----

| Title     | ML AL Tools AIDE                                      |
| --------- | ----------------------------------------------------- |
| Created @ | `2020-09-30T01:53:27Z`                                |
| Updated @ | `2026-11-26T10:09:29Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/270) |

-----

# AIDE

AIDE（Annotation Interface for Data-driven Ecology）是 Microsoft 开源的基于 Web
的图像标注工具，最初用于航拍图像中的野生动物检测。它把标注界面和**主动学习**结合：模型会挑选最值得标注的图像给标注员，再用新标注重新训练模型。

  - Active learning tools
  - Docker support

<!-- end list -->

``` mermaid
flowchart LR
    A[标注员在网页标注] --> B[训练模型]
    B --> C[模型预测未标注图像]
    C --> D[选出最不确定的图像]
    D --> A
```

图中：标注、训练、预测、选择形成闭环；每轮都把模型最没把握的图像优先给标注员，用较少的标注得到较好的模型。

## Install

  - [install with
    docker](https://github.com/microsoft/aerial_wildlife_detection/tree/multiProject#with-docker)

> TODO: `docker-compose build error`

## 特点

| 特点     | 说明                                                                       |
| ------ | ------------------------------------------------------------------------ |
| Web 界面 | 浏览器标注，支持多人协作                                                             |
| 主动学习   | 模型驱动选择待标注样本，见 [QBC](https://github.com/junxnone/aiwiki/issues/272) 等采样策略 |
| 任务类型   | 图像分类、点标注、边界框、语义分割等                                                       |
| 部署     | 提供 Docker 方式，也可用 Python 手动安装                                             |

表中：对比结论：适合需要标注大量图像、希望减少标注量的场景；工具对比见 [AL
Tools](https://github.com/junxnone/aiwiki/issues/175)。

## Reference

  - [AIDE](https://github.com/microsoft/aerial_wildlife_detection)
