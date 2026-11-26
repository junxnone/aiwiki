---
Title | Tools Pytorch VIS
-- | --
Created @ | `2020-01-06T01:54:50Z`
Updated @| `2026-11-26T10:09:40Z`
Labels | `index`
Edit @| [here](https://github.com/junxnone/aiwiki/issues/171)

---
# Visualization 可视化

训练时需要观察损失曲线、指标、图像、网络结构，PyTorch 里常用 TensorBoard 和网络结构绘制工具。

Package Name |  Description
-- | --
torch.utils.tensorboard.writer.SummaryWriter | pytorch 支持 Tensorboard
[hiddenlayer](https://github.com/waleedka/hiddenlayer) | 网络结构图绘制
[tensorboardX](https://github.com/lanpa/tensorboardX) | 类似 tensorboad 工具
[pytorchviz](https://github.com/szagoruyko/pytorchviz/blob/master/torchviz/dot.py)  | 绘制计算图（基于 Graphviz），可看到反向传播的梯度流

表中：对比结论：记录训练过程用 SummaryWriter（官方自带）；画网络结构图用 hiddenlayer 或 pytorchviz；tensorboardX 是官方支持之前的第三方实现，新项目直接用官方版即可。

## 使用 SummaryWriter

```python
from torch.utils.tensorboard import SummaryWriter

writer = SummaryWriter("runs/exp1")                     # 日志目录
for step in range(100):
    writer.add_scalar("loss/train", loss.item(), step)  # 标量曲线
writer.add_graph(model, example_input)                  # 模型结构
writer.add_image("sample", img_tensor, 0)               # 图片
writer.close()
```

```
tensorboard --logdir runs        # 浏览器打开 http://localhost:6006
```

其中：

- `add_scalar(tag, value, step)`：在名为 `tag` 的曲线上，第 `step` 步记录值 `value`
- `logdir`：日志目录，下面每个子目录是一次实验，可在同一界面对比多次实验

## torch.utils.tensorboard.writer.SummaryWriter

Function | Description
-- | --
add_scalar | 添加一个标量
add_scalars | 添加一组标量
add_histogram | 添加直方图
add_image | 添加一张图片
add_images | 添加一组图片
add_figure | 添加 `matplotlib figure`
add_video | 添加 video
add_audio | 添加 audio
add_text | 添加文本
add_graph | 添加 model
add_embedding | 添加 `embedding projector`
add_pr_curve | 添加 `precision recall curve`
add_custom_scalars | 特定标量, training 之前或者之后调用
add_mesh | 添加 `meshes or 3D point clouds`
add_hparams | 添加 超参数
flush | 保存 event 到 硬盘
close | 关闭 writer，并保存未写入的数据

表中：对比结论：最常用的是 `add_scalar`（曲线）、`add_histogram`（权重分布）、`add_image`（样例图片）和 `add_graph`（结构）。

## Reference

- [torch.utils.tensorboard.writer.SummaryWriter](https://pytorch.org/docs/stable/tensorboard.html)
- [Using TensorBoard with PyTorch 1.1 or 1.2](https://www.endtoend.ai/blog/pytorch-tensorboard/)
- [pytorch_graph.ipynb - hiddenlayer](https://github.com/waleedka/hiddenlayer/blob/master/demos/pytorch_graph.ipynb)
- [Python库 - Pytorch 模型的网络结构可视化 pytorchviz](https://www.aiuai.cn/aifarm467.html)

