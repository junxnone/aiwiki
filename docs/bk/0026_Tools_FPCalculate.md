-----

| Title     | Tools FPCalculate                                    |
| --------- | ---------------------------------------------------- |
| Created @ | `2021-09-13T08:22:04Z`                               |
| Updated @ | `2026-10-13T05:33:36Z`                               |
| Labels    | \`\`                                                 |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/26) |

-----

# FLOPs Parameters 计算

计算模型的 FLOPs（浮点运算次数）与 Parameters（参数量），常用于评估模型的计算复杂度和存储开销。

## FLOPs 说明

  - **FLOPs**（Floating Point
    Operations，浮点运算次数）：模型完成一次前向推理所需的浮点运算总量，用来衡量模型的计算复杂度，数值越大代表推理越耗算力。
  - 注意区分 **FLOPs**（次数，衡量模型）与 **FLOPS**（Floating Point Operations Per
    Second，每秒浮点运算次数，衡量硬件算力），两者容易混淆。
  - **FLOPs 与 MACs 的关系**：MAC（Multiply-Accumulate，乘加运算）是一次"乘法+加法"，通常 `1
    MAC ≈ 2 FLOPs`。不同工具报告口径不一样——有的直接给 MACs（如 torchscan 的
    Multiply-Accumulations），有的给 FLOPs（乘以 2 后的结果），对比不同工具数字时要注意，否则容易出现"相差
    2 倍"的误解。
  - **常见层的计算方式**（忽略 bias 带来的少量加法）：
      - 卷积层 Conv2d：`FLOPs = 2 × C_in × C_out × K_h × K_w × H_out ×
        W_out`
      - 全连接层 Linear：`FLOPs = 2 × In_features × Out_features`
      - BatchNorm、激活函数（ReLU 等）的计算量相对卷积/全连接层小几个数量级，通常忽略不计
  - 举例：输入 `1×3×224×224`，经过 `Conv2d(3, 64, kernel_size=7, stride=2)` 后输出为
    `1×64×112×112`，则 `FLOPs = 2 × 3 × 64 × 7 × 7 × 112 × 112 ≈ 2.36G`

## Pytorch

  - [thop](https://github.com/Lyken17/pytorch-OpCounter)
    
    ``` python
    from thop import profile, clever_format
    flops, params = profile(model, inputs=(input,))
    flops, params = clever_format([flops, params], "%.3f")
    print(flops, params)
    ```
    
    示例输出：
    
        4.109G 25.557M

  - [torchsummary](https://github.com/sksq96/pytorch-summary)
    
    ``` python
    from torchsummary import summary
    summary(model, input_size=(3, 224, 224))
    ```
    
    示例输出：
    
        ----------------------------------------------------------------
                Layer (type)               Output Shape         Param #
        ================================================================
                    Conv2d-1         [-1, 64, 112, 112]           9,408
               BatchNorm2d-2         [-1, 64, 112, 112]             128
                      ...
        ================================================================
        Total params: 25,557,032
        Trainable params: 25,557,032
        Non-trainable params: 0
        ----------------------------------------------------------------
        Params size (MB): 97.49
        Estimated Total Size (MB): 316.65
        ----------------------------------------------------------------

  - [torchscan](https://github.com/frgfm/torch-scan)
    
    ``` python
    from torchscan import summary
    summary(model, (3, 224, 224))
    ```
    
    示例输出：
    
        ========================================================================================
        Trainable params: 25,557,032
        Non-trainable params: 0
        Total params: 25,557,032
        ----------------------------------------------------------------------------------------
        Floating Point Operations on forward: 4.09 GFLOPs
        Multiply-Accumulations on forward: 2.04 GMACs
        ----------------------------------------------------------------------------------------

  - [torchinfo](https://github.com/TylerYep/torchinfo)（torchsummary
    的继任者，支持更多模型结构）
    
    ``` python
    from torchinfo import summary
    summary(model, input_size=(1, 3, 224, 224))
    ```
    
    示例输出：
    
        ==========================================================================================
        Total params: 25,557,032
        Trainable params: 25,557,032
        Non-trainable params: 0
        Total mult-adds (G): 4.09
        ==========================================================================================

## Tensorflow

  - `model.summary()`：Keras 自带，输出各层参数量，但不含 FLOPs
    
        Total params: 25,636,712
        Trainable params: 25,583,592
        Non-trainable params: 53,120

  - [keras-flops](https://github.com/tokusumi/keras-flops)：基于 TF
    Profiler 计算 Keras 模型 FLOPs
    
    ``` python
    from keras_flops import get_flops
    flops = get_flops(model, batch_size=1)
    print(f"FLOPS: {flops / 10 ** 9:.03} G")
    ```
    
    示例输出：
    
        FLOPS: 4.09 G

  - `tf.profiler.experimental.Profile`：TensorFlow 原生 profiler，可同时统计
    FLOPs 与内存占用
