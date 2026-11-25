-----

| Title     | ML Tasks Image Detection YOLO tiny                   |
| --------- | ---------------------------------------------------- |
| Created @ | `2020-02-20T06:02:54Z`                               |
| Updated @ | `2026-11-25T16:51:37Z`                               |
| Labels    | \`\`                                                 |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/52) |

-----

# YOLO tiny

## Model

``` 
   layer   filters  size/strd(dil)      input                output
   0 conv     16       3 x 3/ 1    608 x 608 x   3 ->  608 x 608 x  16 0.319 BF
   1 max                2x 2/ 2    608 x 608 x  16 ->  304 x 304 x  16 0.006 BF
   2 conv     32       3 x 3/ 1    304 x 304 x  16 ->  304 x 304 x  32 0.852 BF
   3 max                2x 2/ 2    304 x 304 x  32 ->  152 x 152 x  32 0.003 BF
   4 conv     64       3 x 3/ 1    152 x 152 x  32 ->  152 x 152 x  64 0.852 BF
   5 max                2x 2/ 2    152 x 152 x  64 ->   76 x  76 x  64 0.001 BF
   6 conv    128       3 x 3/ 1     76 x  76 x  64 ->   76 x  76 x 128 0.852 BF
   7 max                2x 2/ 2     76 x  76 x 128 ->   38 x  38 x 128 0.001 BF
   8 conv    256       3 x 3/ 1     38 x  38 x 128 ->   38 x  38 x 256 0.852 BF
   9 max                2x 2/ 2     38 x  38 x 256 ->   19 x  19 x 256 0.000 BF
  10 conv    512       3 x 3/ 1     19 x  19 x 256 ->   19 x  19 x 512 0.852 BF
  11 max                2x 2/ 1     19 x  19 x 512 ->   19 x  19 x 512 0.001 BF
  12 conv   1024       3 x 3/ 1     19 x  19 x 512 ->   19 x  19 x1024 3.407 BF
  13 conv    256       1 x 1/ 1     19 x  19 x1024 ->   19 x  19 x 256 0.189 BF
  14 conv    512       3 x 3/ 1     19 x  19 x 256 ->   19 x  19 x 512 0.852 BF
  15 conv     39       1 x 1/ 1     19 x  19 x 512 ->   19 x  19 x  39 0.014 BF
  16 yolo
[yolo] params: iou loss: mse (2), iou_norm: 0.75, cls_norm: 1.00, scale_x_y: 1.00
  17 route  13                                     ->   19 x  19 x 256
  18 conv    128       1 x 1/ 1     19 x  19 x 256 ->   19 x  19 x 128 0.024 BF
  19 upsample                 2x    19 x  19 x 128 ->   38 x  38 x 128
  20 route  19 8                                   ->   38 x  38 x 384
  21 conv    256       3 x 3/ 1     38 x  38 x 384 ->   38 x  38 x 256 2.555 BF
  22 conv     39       1 x 1/ 1     38 x  38 x 256 ->   38 x  38 x  39 0.029 BF
  23 yolo
```

## Reference

  - [tiny darknet](https://pjreddie.com/darknet/tiny-darknet/)
  - [YOLOv3-tiny
    cfg](https://github.com/AlexeyAB/darknet/blob/master/cfg/yolov3-tiny.cfg)

## 结构说明

YOLO tiny 是 YOLO 的精简版本，用更少的层和更小的特征图换取速度，适合嵌入式和 CPU 部署。上面的 Darknet
日志展示了一个 YOLOv3-tiny 配置在 $608\\times608$ 输入下的逐层信息：

  - 前 12 层是 $3\\times3$ 卷积 (通道
    $16\\to32\\to64\\to128\\to256\\to512\\to1024$) 与最大池化交替，每次池化后特征图尺寸减半
    ($608\\to304\\to152\\to76\\to38\\to19$)，第 11 层池化步长为 $1$，保持
    $19\\times19$
  - 只有两个检测头：$19\\times19$ (层 15) 和 $38\\times38$ (层 22)，对应步长 $32$ 和
    $16$；$38\\times38$ 的分支把 $19\\times19$ 的特征经 $1\\times1$ 卷积和
    $2\\times$ 上采样后，与第 8 层的 $38\\times38$ 特征拼接 (层 17\~20)，这是简化版的 FPN
  - 输出通道 $39=3\\times(5+8)$：每个格子 $3$ 个 anchor，每个有 $5$ 个框参数和 $8$
    个类别概率，所以这个配置是一个 $8$ 类的自定义模型 (COCO 为
    $255=3\\times85$)
  - 日志里 `BF` 是 BFLOPs (十亿次浮点运算)，各层之和约 $11.7$ BFLOPs，参见
    [YOLOv3](/0056_ML_Tasks_Image_Detection_YOLO_V3) 完整的 Darknet-53
    版本要大得多

## 计算量的计算

$$ \\text{FLOPs}*{conv}=2\\cdot H*{out}W\_{out}\\cdot K^2C\_{in}C\_{out}
$$

其中：

  - $H\_{out},W\_{out}$：输出特征图尺寸；$K$：卷积核边长；$C\_{in},C\_{out}$：输入、输出通道数
  - 系数 $2$：一次乘加算两次浮点运算，所以这里的 FLOPs 是 MACs 的两倍
  - 例：层
    2：$304\\cdot304\\cdot3^2\\cdot16\\cdot32\\cdot2\\approx0.852\\times10^9$，与日志中的
    `0.852 BF` 一致

| 层                                                  | 计算量      | 占比         |
| -------------------------------------------------- | -------- | ---------- |
| 层 12：$3\\times3\\times512\\to1024$ ($19\\times19$) | 3.407 BF | 约 29%      |
| 层 21：$3\\times3\\times384\\to256$ ($38\\times38$)  | 2.555 BF | 约 22%      |
| 层 2/4/6/8/10/14：$3\\times3$ 卷积各                    | 0.852 BF | 约 44% (合计) |
| 其余 (层 0、13、15、18、22 等)                             | 约 0.6 BF | 约 5%       |

表中：计算量集中在少数几个 $3\\times3$ 卷积层，特别是层 12，加速部署时优先对这些层做量化或融合，参见
[Quantization](/0312_MO_Quantization)。占比为各层 BF 除以总计 $11.7$ BF 的近似值。

## 与完整版的对比

| 维度       | YOLOv3                                  | YOLOv3-tiny                              |
| -------- | --------------------------------------- | ---------------------------------------- |
| Backbone | Darknet-53 (残差)                         | 7 层卷积 + 池化的直筒结构                          |
| 检测头数     | 3 ($13/26/52$)                          | 2 ($13/26$ 对应输入 $416$)                   |
| Anchor   | 9                                       | 6                                        |
| 计算量      | 约 $66$ BFLOPs ($416\\times416$) `[待核实]` | 约 $5.6$ BFLOPs ($416\\times416$) `[待核实]` |
| 精度       | 高                                       | 明显较低，小目标尤其差                              |

表中：tiny 版本的取舍是用精度换速度和体积 (权重文件约 $34\\text{MB}$ vs $237\\text{MB}$
`[待核实]`)，比较适合在 CPU 或边缘设备上做实时的简单检测任务。
