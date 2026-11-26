---
Title | Tools TF Datasets
-- | --
Created @ | `2022-07-16T10:03:54Z`
Updated @| `2026-11-26T10:09:42Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/313)

---
# Tensorflow Datasets

TensorFlow Datasets（TFDS）是一个现成数据集的集合：用统一的 API 下载、缓存并加载，返回 `tf.data.Dataset`，可以直接用于 `tf.keras` 训练（见 [Tensorflow](https://github.com/junxnone/aiwiki/issues/140)）。

- 可以通过API 直接下载预定义数据集 - mnist/cifar/coco/...

## 使用

```python
import tensorflow_datasets as tfds

print(tfds.list_builders()[:5])                        # 查看可用数据集

ds_train, info = tfds.load('mnist', split='train',     # 下载并加载训练集
                           as_supervised=True, with_info=True)
ds_train = ds_train.shuffle(1000).batch(32).prefetch(1)

print(info.features, info.splits['train'].num_examples)
```

其中：

- `tfds.load(name, split, ...)`：按名称下载并加载数据集，第一次会下载到本地缓存目录，之后直接读取
- `split`：数据划分，如 `'train'`、`'test'`、`'train[:80%]'`
- `as_supervised=True`：返回 `(图像, 标签)` 二元组，而不是字典；`with_info=True`：同时返回数据集元信息 `info`
- `shuffle`、`batch`、`prefetch`：`tf.data` 的常用管道操作（打乱、分批、预取）

## 常见数据集

| 类别 | 例子 |
| --- | --- |
| 图像分类 | mnist、cifar10、cifar100、imagenet2012 |
| 目标检测 | coco、voc |
| 文本 | imdb_reviews、glue |

表中：对比结论：小数据集（mnist、cifar）用来快速验证流程；大数据集（imagenet、coco）需要先手动下载原始文件放到指定目录。常见数据集说明见 [Datasets](https://github.com/junxnone/aiwiki/issues/17)。

## Reference
- [Tensorflow Datasets](https://www.tensorflow.org/datasets)

