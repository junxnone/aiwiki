-----

| Title         | Tools Pytorch VIS                                     |
| ------------- | ----------------------------------------------------- |
| Created @     | `2020-01-06T01:54:50Z`                                |
| Last Modify @ | `2022-12-25T04:52:06Z`                                |
| Labels        | `index`                                               |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/171) |

-----

# Visualization 可视化

## Reference

  - [torch.utils.tensorboard.writer.SummaryWriter](https://pytorch.org/docs/stable/tensorboard.html)
  - [Using TensorBoard with PyTorch 1.1
    or 1.2](https://www.endtoend.ai/blog/pytorch-tensorboard/)
  - [pytorch\_graph.ipynb -
    hiddenlayer](https://github.com/waleedka/hiddenlayer/blob/master/demos/pytorch_graph.ipynb)
  - [Python库 - Pytorch 模型的网络结构可视化
    pytorchviz](https://www.aiuai.cn/aifarm467.html)

## Brief

| Package Name                                                                       | Description            |
| ---------------------------------------------------------------------------------- | ---------------------- |
| torch.utils.tensorboard.writer.SummaryWriter                                       | pytorch 支持 Tensorboard |
| [hiddenlayer](https://github.com/waleedka/hiddenlayer)                             | 网络结构图绘制                |
| [tensorboardX](https://github.com/lanpa/tensorboardX)                              | 类似 tensorboad 工具       |
| [pytorchviz](https://github.com/szagoruyko/pytorchviz/blob/master/torchviz/dot.py) |                        |

## torch.utils.tensorboard.writer.SummaryWriter

| Function             | Description                    |
| -------------------- | ------------------------------ |
| add\_scalar          | 添加一个标量                         |
| add\_scalars         | 添加一组标量                         |
| add\_histogram       | 添加直方图                          |
| add\_image           | 添加一张图片                         |
| add\_images          | 添加一组图片                         |
| add\_figure          | 添加 `matplotlib figure`         |
| add\_video           | 添加 video                       |
| add\_audio           | 添加 audio                       |
| add\_text            | 添加文本                           |
| add\_graph           | 添加 model                       |
| add\_embedding       | 添加 `embedding projector`       |
| add\_pr\_curve       | 添加 `precision recall curve`    |
| add\_custom\_scalars | 特定标量, training 之前或者之后调用        |
| add\_mesh            | 添加 `meshes or 3D point clouds` |
| add\_hparams         | 添加 超参数                         |
| flush                | 保存 event 到 硬盘                  |
| close                |                                |
