---
Title | Pytorch Visualization
-- | --
Create Date | `2020-01-06T01:54:50Z`
Update Date | `2022-01-19T08:18:02Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/171)

---
## Reference

- [torch.utils.tensorboard.writer.SummaryWriter](https://pytorch.org/docs/stable/tensorboard.html)
- [Using TensorBoard with PyTorch 1.1 or 1.2](https://www.endtoend.ai/blog/pytorch-tensorboard/)
- [pytorch_graph.ipynb - hiddenlayer](https://github.com/waleedka/hiddenlayer/blob/master/demos/pytorch_graph.ipynb)
- [Python库 - Pytorch 模型的网络结构可视化 pytorchviz](https://www.aiuai.cn/aifarm467.html)

## Brief

Package Name |  Description
-- | --
torch.utils.tensorboard.writer.SummaryWriter | pytorch 支持 Tensorboard
[hiddenlayer](https://github.com/waleedka/hiddenlayer) | 网络结构图绘制
[tensorboardX](https://github.com/lanpa/tensorboardX) | 类似 tensorboad 工具
[pytorchviz](https://github.com/szagoruyko/pytorchviz/blob/master/torchviz/dot.py)  | 

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
close | 


