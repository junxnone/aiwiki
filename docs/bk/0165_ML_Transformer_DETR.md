-----

| Title         | ML Transformer DETR                                   |
| ------------- | ----------------------------------------------------- |
| Created @     | `2021-02-01T02:14:33Z`                                |
| Last Modify @ | `2022-12-24T15:51:27Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/165) |

-----

## Reference

  - 2020-05 **\[DETR\]** End-to-End Object Detection with Transformers
    \[[Paper](https://arxiv.org/abs/2005.12872v3)\]
    \[[Code](https://github.com/facebookresearch/detr)\]
  - [Object detection set prediction
    loss](https://senyang-ml.github.io/2020/06/04/detr/)

## Brief

  - **DE**tection **TR**ansformer
  - Detection
      - 预测固定数量 `N` 的预测集合
      - `+ no objects`

## Arch

  - **CNN**
      - Feature Map: C x H x W ⇒ 2048 x H/32 x W/32
  - **Transformer Encoder**
      - 1 x 1 Conv - C: 2048 → d ⇒ d x H/32 x W/32
      - Flatten to one dim(tokens)
      - `+ Positional Encoding`
  - **Transformer Decoder**
      - `+ output positional encoding` 即 object queries
  - 同步输入，一次处理(不同于Transformer NLP: 左 → 右)
  - **Prediction FFNs**
      - N x (class prob + (x, y, h, w))

| ![image](media/48c70106ae1eadd24ed43d07e8cd59d0e143a2f7.png) |
| ------------------------------------------------------------ |
| ![image](media/da8af0339da6f5d7d338a13c1a31edc367f0592d.png) |
| ![image](media/40ff77ec7620c24f07a14053b08c3102a2b73235.png) |
| ![image](media/6c5c3f4872b8ff41f924e3e1779d3899475aca9b.png) |

### Positional Encoding

  - **Spatial positional encoding**
      - 每一层 encoder attention layer 都加
      - decoder attention layer 除了 bottom layer 都加
      - Sine / Learned
  - **Output positional encoding**
      - 即 Object queries
      - 每一层 decoder attention layer 都加
      - 通过学习得到
      - Inference 时为固定值

### Detection Output/Prediction FFNs

    class_embed = nn.Linear(hidden_dim, num_classes + 1)
    bbox_embed = MLP(hidden_dim, hidden_dim, 4, 3)

### Segmentation

  - **Mask-Head**
      - `Decoder Outputs` ==\> `Mask-Head`
      - `Binary mask` for BBox
  - **Training**
      - 1 - 联合 Training,
      - 2 - 先Training BBox,然后 fine-tune `Mask Head`
      - Training 结果差不多
      - 第 `2` 种方法更快
  - **Outputs**(N=100)
      - **pred\_logits** (1, N, num\_classes+1)
      - **pred\_boxes** (1, N, 4)
      - **pred\_masks** (1, N, H/4, W/4)

| ![image](media/d1b95fa7ed8437a0fe4b66a9ae12e3620e446f51.png) | ![image](media/e5b660a10b449ce4ce2636eb0a6d98241da6fe9b.png) |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| Original Image                                               | Segmentation Output                                          |

| Prob \> 0.9                                                  |
| ------------------------------------------------------------ |
| ![image](media/d48b5b9b6a98fc3215f31f68fce57da11d52a484.png) |

## Evaluation

  - **Evaluation-1** 对标超越 `Faster RCNN` 系列
  - **Evaluation-2**

| Num | Evaluation                                                   |
| --- | ------------------------------------------------------------ |
| 1   | ![image](media/981ad850ffe7a3c7aafec32fd1155bd51746adf9.png) |
| 2   | ![image](media/42d59f1df1b360efbe6b1bd4e491f1db17246ef3.png) |
