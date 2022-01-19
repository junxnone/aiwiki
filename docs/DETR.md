---
Title | DETR
-- | --
Create Date | `2021-02-01T02:14:33Z`
Update Date | `2022-01-19T07:52:08Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/165)

---
## Reference
- 2020-05 **[DETR]** End-to-End Object Detection with Transformers [[Paper](https://arxiv.org/abs/2005.12872v3)] [[Code](https://github.com/facebookresearch/detr)] 
- [Object detection set prediction loss](https://senyang-ml.github.io/2020/06/04/detr/)

## Brief
- **DE**tection **TR**ansformer
- Detection
  - 预测固定数量 `N` 的预测集合
  - `+ no objects`

## Arch
- **CNN** 
  - Feature Map: C x H x W ⇒ 2048 x H/32 x W/32
- **Transformer Encoder** 
  - 1 x 1 Conv -  C: 2048 → d ⇒ d x H/32 x W/32
  - Flatten to one dim(tokens)
  - `+ Positional Encoding`
- **Transformer Decoder**
  - `+ output positional encoding` 即 object queries
 - 同步输入，一次处理(不同于Transformer NLP: 左 → 右)
- **Prediction FFNs** 
  - N x (class prob + (x, y, h, w))


![image](https://user-images.githubusercontent.com/2216970/106407171-5894d700-6476-11eb-94a0-71587ca7e8bd.png)
-- | 
![image](https://user-images.githubusercontent.com/2216970/115985742-d7b22b00-a5df-11eb-83c4-37ac6f0feaa6.png)
![image](https://user-images.githubusercontent.com/2216970/115986077-3035f800-a5e1-11eb-9bb6-1f8c801eddb3.png)
![image](https://user-images.githubusercontent.com/2216970/115987203-9d985780-a5e6-11eb-944c-430ddf10e731.png)

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

```
class_embed = nn.Linear(hidden_dim, num_classes + 1)
bbox_embed = MLP(hidden_dim, hidden_dim, 4, 3)
```

### Segmentation
- **Mask-Head**
  - `Decoder Outputs` ==> `Mask-Head`
  - `Binary mask` for  BBox
- **Training** 
  - 1 - 联合 Training, 
  - 2 - 先Training BBox,然后 fine-tune `Mask Head`
  - Training 结果差不多
  - 第 `2` 种方法更快
- **Outputs**(N=100)
  - **pred_logits** (1, N,  num_classes+1)
  - **pred_boxes** (1, N, 4)
  - **pred_masks** (1, N, H/4, W/4)

![image](https://user-images.githubusercontent.com/2216970/115989359-852d3a80-a5f0-11eb-9b80-0fac1b6523c8.png) | ![image](https://user-images.githubusercontent.com/2216970/115989352-7e062c80-a5f0-11eb-8adc-73041922ed69.png)
-- | --
Original Image | Segmentation Output


Prob > 0.9
-- |
![image](https://user-images.githubusercontent.com/2216970/115989280-367fa080-a5f0-11eb-9ef8-633f51892c60.png) 


## Evaluation
- **Evaluation-1** 对标超越 `Faster RCNN` 系列
- **Evaluation-2**

Num | Evaluation
-- | --
1 | ![image](https://user-images.githubusercontent.com/2216970/115985810-2b247900-a5e0-11eb-9a06-6d820c5b5135.png)
2 | ![image](https://user-images.githubusercontent.com/2216970/115985843-4b543800-a5e0-11eb-807e-02dc200453ed.png)

