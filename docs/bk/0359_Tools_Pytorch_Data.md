-----

| Title     | Tools Pytorch Data                                    |
| --------- | ----------------------------------------------------- |
| Created @ | `2020-12-09T10:46:14Z`                                |
| Updated @ | `2026-10-21T08:03:24Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/359) |

-----

# Pytorch Data

| 图片放置方式                    | Methods                                       |
| ------------------------- | --------------------------------------------- |
| 自带数据集                     | torchvision.datasets 自动下载                     |
| 每个类别图片在一个文件夹              | torchvision.datasets.ImageFolder 从 目录读取       |
| 所有图片都在一个文件夹，图片label 为 csv | 继承 torch.utils.data.Dataset 创建 custom dataset |

## torchvision.datasets.ImageFolder

``` python
idatasets = {x: torchvision.datasets.ImageFolder(
                    os.path.join(data_dir, x),
                    data_transforms[x]) 
                    for x in ['train', 'val']}

idataloders = {x: torch.utils.data.DataLoader(idatasets[x],     
                                            batch_size=4, 
                                            shuffle=True,
                                            num_workers=4) 
                                            for x in ['train', 'val']}
```

## torch.utils.data.Dataset

  - **Define Custom Dataset**

<!-- end list -->

``` python
class custom_dataset(torch.utils.data.Dataset):
  def __init__(self, ...):
    xxx
    xxx

  def __len__(self):
    return len(self.img_list)

  def __getitem__(self, item):
    xxxx
    xxxx
    return img, label

```

  - **Augmentation**

<!-- end list -->

``` python
data_transforms = {
    'train': transforms.Compose([
        transforms.RandomSizedCrop(224),
        transforms.RandomHorizontalFlip(),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ]),
    'val': transforms.Compose([
        transforms.Scale(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ]),
}
```

  - **Define dataset**

<!-- end list -->

``` python
 idatasets = {x: custom_dataset(images=xxx,
                                    labels=xxx,
                                    data_transforms=data_transforms)
                                    for x in ['train', 'val']}

idataloders = {x: torch.utils.data.DataLoader(idatasets[x],     
                                            batch_size=4, 
                                            shuffle=True,
                                            num_workers=4) 
                                            for x in ['train', 'val']}
```

## 更大规模/流式数据：IterableDataset

当数据集规模大到不适合用 `__getitem__` 随机访问（比如从网络流式读取、数据分散在多个分片文件里），可以继承
`torch.utils.data.IterableDataset`，实现 `__iter__` 而不是
`__getitem__`/`__len__`：

``` python
class MyIterableDataset(torch.utils.data.IterableDataset):
    def __iter__(self):
        for sample in load_from_shards():
            yield sample
```

## DataLoader 的几个易漏参数

  - `persistent_workers=True`：避免每个 epoch 结束后销毁 worker 进程、下个 epoch
    重新创建的开销，在 worker 数较多、单 epoch 较短时收益明显；
  - `prefetch_factor`：控制每个 worker 预取多少个 batch，配合 `pin_memory=True`
    使用效果更好；
  - 更多加速手段详见 [加速](0169_Tools_Pytorch_Speed)。

## 新版本数据增强：torchvision.transforms.v2

`torchvision` 较新版本提供了 `transforms.v2`，在原有图像变换基础上，统一支持同时变换图像、bbox、mask
等多种标注类型（检测/分割任务常用），用法和旧版 `transforms` 基本兼容，是官方推荐的新项目首选。

## 加速提取Data方式

  - 更多 workers， 增加 dataloader 线程
  - `数据读取预处理` 与 `训练` 分离进程
  - `persistent_workers=True` 避免每个 epoch 重建 worker
  - LMDB
  - `opencv` \> `PIL`
  - `bmp` 减少解码时间
  - TFRecord/RecordIO/hdf5/pth/n5

## Reference

  - [folder2lmdb.py](https://github.com/Lyken17/Efficient-PyTorch/tree/master/tools)
  - [PyTorch
    Dataloader自定义数据读取](https://www.cnblogs.com/kk17/p/10105862.html)
  - [torchvision.transforms.v2
    官方文档](https://docs.pytorch.org/vision/stable/transforms.html)
  - [加速](0169_Tools_Pytorch_Speed)
