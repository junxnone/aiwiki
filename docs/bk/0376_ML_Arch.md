-----

| Title     | ML Arch                                               |
| --------- | ----------------------------------------------------- |
| Created @ | `2023-02-03T08:24:58Z`                                |
| Updated @ | `2026-11-26T10:15:31Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/376) |

-----

# ML 架构

机器学习/深度学习任务的整体流程：输入数据经过预处理，训练得到模型，再把模型的输出后处理成最终结果。

``` mermaid

graph TD
    A[Inputs:Images/Text/Audio/Video] -->|Preprocessing| BT
    
    subgraph Model
        B(Init Model)
        B -->  BT[Training]
        BT--> |Tuning Model HyperParameters| BT
        BT --> BE(Final Model)
    end
    subgraph Result
    IC(Classification Result)
    ID(Detection Result)
    IS(Segmentation Result)
    E(QA)
    F(Generated Content)
    end
    BE --> |PostProcessing| Result

```

图中：

  - **Inputs**：图像、文本、音频、视频等原始数据，经过预处理（见
    [PreProcessing](https://github.com/junxnone/aiwiki/issues/369)）进入训练
  - **Model**：初始化模型 B，训练 BT 过程中反复调整超参数（见
    [Hyperparameter](https://github.com/junxnone/aiwiki/issues/368)），得到最终模型
    BE
  - **Result**：模型输出经后处理（见
    [PostProcessing](https://github.com/junxnone/aiwiki/issues/370)）变成分类、检测、分割、问答、生成内容等结果
  - 关键结论：训练循环里的「调参」是自我循环，预处理与后处理分别连接数据和应用

## 训练的目标

训练就是最小化目标函数（见 [Loss/Cost/Object
Function](https://github.com/junxnone/aiwiki/issues/378)）：

$$ \\theta^{\*}=\\arg\\min\_{\\theta}\\
\\frac{1}{N}\\sum\_{i=1}^{N}\\ell\\big(y\_i,f(x\_i;\\theta)\\big)+\\lambda,\\Omega(\\theta)
$$

其中：

  - $\\theta$：模型参数，$\\theta^{\*}$ 为训练得到的最优参数；$f(x;\\theta)$：模型
  - $(x\_i,y\_i)$：第 $i$ 个训练样本及其标签；$N$：样本数；$\\ell$：损失函数
  - $\\Omega(\\theta)$：正则项，$\\lambda$ 为其权重
