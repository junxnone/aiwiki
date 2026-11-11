-----

| Title     | ML Op AF Sigmoid                                      |
| --------- | ----------------------------------------------------- |
| Created @ | `2019-11-19T03:01:04Z`                                |
| Updated @ | `2026-11-11T01:07:32Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/280) |

-----

# sigmoid

  - `Sigmoid Function` == `Logistic Function`，逐元素把实数映射到
    $(0,1)$，常用于二分类/多标签的概率输出，以及 LSTM/GRU 等的门控。
  - **二分类时** `sigmoid` 和 `softmax` 等价
  - 总览见 [激活函数](0279_ML_Op_AF)，多分类见 [Softmax](0335_ML_Op_AF_Softmax)。

| Name    | 应用                            | 输出                           |
| ------- | ----------------------------- | ---------------------------- |
| sigmoid | \- 二分类<br>- 多标签分类/Multi-Label | 一个或多个 0∼1 范围内的概率值            |
| softmax | \- 多分类                        | 在 classes\_num 个不同输出类别上的概率分布 |

## Sigmoid

  - 输出: (0, 1)，输入输出 shape 相同（[Elementwise](0620_ML_Op_Elementwise)）
  - 二分类中, 将输入的 `feature`（logit）映射到 (0,1)
  - $sigmoid(x)= \\frac{1}{1 + e^{-x}} = \\frac{e^{x}}{e^{x} + 1} = 1 -
    sigmoid(-x)$
  - 导数：$\\sigma'(x)=\\sigma(x)(1-\\sigma(x))$，最大值
    0.25（$x=0$），可由输出直接算出，反向无需保存输入。

| Name    | 公式                                  | Figure                                                                                                                         |
| ------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| sigmoid | $sigmoid(x)= \\frac{1}{1 + e^{-x}}$ | <img width="500px" src="https://user-images.githubusercontent.com/2216970/150644672-56f10a62-b025-4989-8ca0-05689e12a17f.png"> |

### 与 tanh 的关系

  - $\\tanh(x)=2\\sigma(2x)-1$，即 tanh 是 sigmoid 的平移缩放：输出
    $(-1,1)$，零中心，导数最大 1。
  - 隐藏层若必须用 S 形函数，tanh 通常优于 sigmoid（零中心）；两者都会饱和。

## 梯度消失

  - 导数最大 0.25，且 $|x|$ 较大时趋近 0（两侧饱和）。多层连乘后梯度指数衰减，浅层几乎得不到更新。
  - 输出非零中心，导致下一层权重梯度符号一致、收敛抖动。
  - 现代网络隐藏层基本改用 ReLU 系，见 [ReLU 系](0616_ML_Op_AF_ReLU)；sigmoid
    主要留在输出层和门控。

## 数值稳定实现

直接算 $1/(1+e^{-x})$：$x$ 很负时 $e^{-x}$ 溢出（fp32 约 $x\<-88$，fp16 约
$x\<-11$）。稳定写法按符号分段：

$$ \\sigma(x)=\\begin{cases}\\frac{1}{1+e^{-x}} & x\\ge 0\\
\\frac{e^{x}}{1+e^{x}} & x\<0\\end{cases} $$

### log-sigmoid

$\\log\\sigma(x)=-\\log(1+e^{-x})=-\\mathrm{softplus}(-x)$，稳定形式：

$$\\log\\sigma(x)=\\min(x,0)-\\log\\left(1+e^{-|x|}\\right)$$

PyTorch 中对应 `F.logsigmoid`，不要写成 `torch.log(torch.sigmoid(x))`（sigmoid
下溢为 0 时得到 $-\\infty$）。

### BCEWithLogits

二分类交叉熵 $L=-\[y\\log\\sigma(x)+(1-y)\\log(1-\\sigma(x))\]$，用
$\\log(1-\\sigma(x))=\\log\\sigma(-x)$ 合并后稳定形式：

$$L=\\max(x,0)-xy+\\log\\left(1+e^{-|x|}\\right)$$

梯度为 $\\partial L/\\partial x=\\sigma(x)-y$，简洁且无除法。

``` python
import torch, torch.nn as nn, torch.nn.functional as F
logits = torch.randn(8, 1)
target = torch.randint(0, 2, (8, 1)).float()
# 推荐：模型最后不加 sigmoid，直接用 logits + BCEWithLogitsLoss（内含稳定实现）
loss = nn.BCEWithLogitsLoss()(logits, target)
# 不推荐：nn.BCELoss()(torch.sigmoid(logits), target)，数值上不如前者稳定
prob = torch.sigmoid(logits)   # 仅推理时需要概率才加
```

损失函数更多内容见 [Loss Function](0281_ML_Arch_Func_LossFunction)。

## 推理与硬件实现

  - 需要 exp 和除法，在 NPU/MCU/FPGA 上较贵，常见替代：
      - **LUT 查表**: 利用对称性 $\\sigma(-x)=1-\\sigma(x)$ 只存 $x\\ge0$ 半边，并在
        $|x|$ 较大处（约 8 以上）饱和到 0/1；表项间线性插值提升精度。
      - **分段线性/多项式近似**: 如 PLAN 分段线性（斜率取 2 的幂，只需移位加法）；hard sigmoid
        $\\mathrm{clip}(0.2x+0.5,0,1)$ 或
        $\\mathrm{ReLU6}(x+3)/6$（MobileNetV3 使用）。
      - **fast exp**: 用 $2^x$ 分解整数/小数部分，加多项式逼近。
  - **量化**: 输出恒在 (0,1)，int8/uint8 输出可用固定
    scale=1/256、zero\_point=0（具体取值因框架而异，待核实）；输入侧通常用 LUT
    在量化域直接映射（256 项表），无需反量化。
  - **融合**: sigmoid 常与前面的 Conv/Linear 融合，或与乘法组成
    SiLU（$x\\sigma(x)$）作为融合算子。
  - ONNX 算子：`Sigmoid`；PyTorch 导出时 `torch.sigmoid`、`nn.Sigmoid` 均映射到它。

## 二分类时 `sigmoid` 和 `softmax` 等价

| Name    | Formula                                                               |
| ------- | --------------------------------------------------------------------- |
| sigmoid | $sigmoid(x)= \\frac{1}{1 + e^{-x}}$                                   |
| softmax | $softmax(\\vec{z})*{i}=\\frac{e^{z*{i}}}{\\sum\_{j=1}^{K}e^{z\_{j}}}$ |

  - 当 二分类时 Vector = \[x, 0\]

$softmax(\\vec{z})*{1}=\\frac{e^{z*{1}}}{e^{z\_{1}} +
e^{z\_{2}}}=\\frac{e^{x}}{e^{x} + e^{0}}=\\frac{e^{x}}{e^{x} +
1}=\\frac{1}{1+e^{-x} }$

  - 一般 logits $\[z\_1,z\_2\]$ 时，$softmax\_1=\\sigma(z\_1-z\_2)$，只有差值起作用。

## 对比

  - Sigmoid 与 Softmax 完全等价
  - Sigmoid 与 Softmax 分类器的权值可以相互转换
  - Softmax 会比 Sigmoid 浪费 2 倍的权值空间
  - 多标签（类别不互斥）必须用逐类独立的 sigmoid，不能用 softmax（softmax 强制各类概率和为 1）。

## Reference

  - <http://neuralnetworksanddeeplearning.com/chap3.html#softmax>
  - [logistic函数和softmax函数](http://www.cnblogs.com/maybe2030/p/5678387.html)
  - [详解sigmoid与softmax，
    多分类及多标签分类](https://blog.csdn.net/uncle_ll/article/details/82778750)
  - [Keras - Softmax 与 Sigmoid
    二分类问题分析](https://www.aiuai.cn/aifarm679.html)
  - [Keras深度学习笔记(三)：神经网络入门](https://xiaosheng.me/2018/11/24/article154/)
  - [sigmoid\_and\_softmax.ipynb](https://gist.github.com/ypwhs/6905ebbda99d04621f9fc00417657ae2)
  - [一文详解Softmax函数](https://zhuanlan.zhihu.com/p/105722023)
  - [Softmax Function -
    deepai.org](https://deepai.org/machine-learning-glossary-and-terms/softmax-layer)
  - [torch.nn.BCEWithLogitsLoss](https://pytorch.org/docs/stable/generated/torch.nn.BCEWithLogitsLoss.html)
  - [ONNX Sigmoid](https://onnx.ai/onnx/operators/onnx__Sigmoid.html)
