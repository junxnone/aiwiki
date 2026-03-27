-----

| Title     | Tools anomalib                                        |
| --------- | ----------------------------------------------------- |
| Created @ | `2022-11-30T08:23:26Z`                                |
| Updated @ | `2026-03-27T02:20:46Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/321) |

-----

# anomalib

Anomalib 是由 Intel 开源、专注于 视觉异常检测（Visual Anomaly Detection） 的 Python
深度学习库，核心面向工业质检、缺陷检测等场景，主打 无监督 / 半监督学习——只需要正常样本即可训练，无需大量缺陷标注。

**内置十几种 SOTA 算法，直接可用：**

  - 经典：PatchCore、PaDiM、GANomaly、FastFlow、DFM、STFPM
  - 最新：UniNet、Dinomaly、Draem、Reverse Distillation

全部基于 PyTorch Lightning，代码简洁、易二次开发

**全流程工具链**

  - 配置驱动：YAML 配置文件，一键改模型 / 数据 / 参数
  - 命令行工具：anomalib train / test / infer 直接运行
  - 可视化：自动生成异常热力图、对比图
  - 评估：AUROC、F1、精确率 / 召回率、像素级指标
  - 部署：导出 TorchScript / ONNX / OpenVINO，支持边缘加速

**模块化、易扩展**

  - backbone、采样、损失、后处理均可插拔；支持自定义数据集、自定义模型。

## Reference

  - [Github](https://github.com/openvinotoolkit/anomalib)
