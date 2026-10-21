-----

| Title     | Tools OV OneDNN PostOps                               |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-10-21T01:11:11Z`                                |
| Updated @ | `2026-10-21T01:29:29Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/577) |

-----

# oneDNN Post-ops

> 本文是 [算子融合](0563_Tools_OV_MO_Fusion) 一文"机制
> B（post-op）"在代码层面的具体展开——oneDNN（CPU
> 插件底层依赖的算子库）提供的 Post-ops Attribute API，是 CPU
> 侧实现"把下游算子附加到上游算子上一起执行"的直接机制。

## 核心 API：Primitive Attributes 里的 Post-ops

oneDNN 用 **Primitive Attributes** 机制实现算子融合——在创建一个主算子（如
Convolution）的描述时，额外传入一个 `post_ops`
对象，告诉这个算子"算完之后，不要直接写回内存，再顺手做几步额外的运算"。如果附加了多个
post-op，会按照添加的顺序依次执行。

### Eltwise Post-op：最常见的融合——激活函数

``` cpp
dnnl::post_ops po;
po.append_eltwise(
        /* algorithm = */ dnnl::algorithm::eltwise_relu,
        /* alpha     = */ 0.f,
        /* beta      = */ 0.f);

dnnl::primitive_attr attr;
attr.set_post_ops(po);

auto conv_pd = convolution_forward::primitive_desc(conv_d, attr, engine);
```

这就是 Conv+ReLU 融合最底层的实现方式：ReLU 作为一个 eltwise post-op 附加在 Convolution
的描述上，oneDNN 在生成这个 Convolution 的 kernel 时，会直接把 ReLU
计算编译进同一段代码里。注意：eltwise post-op
会**覆盖**主算子的原始输出（不保留中间结果），所以这种融合方式一般不用在训练场景（反向传播需要中间值）。

### Sum Post-op：残差连接

``` cpp
dnnl::post_ops po;
po.append_sum();          // 先把当前结果和已有数据相加
po.append_eltwise(dnnl::algorithm::eltwise_relu, 0.f, 0.f);  // 再做 ReLU

dnnl::primitive_attr attr;
attr.set_post_ops(po);
```

`append_sum()` 会把主算子的计算结果和一块已经存在的数据相加（累加前还可以乘一个缩放系数）——这正是 ResNet
这类带残差连接（Residual Block）的网络结构里"卷积结果 +
跳跃连接"这一步的底层实现方式，`Sum → Eltwise` 的组合顺序能把"卷积
+ 残差相加 + 激活"这一整个 Residual Block 的核心计算压缩进一次算子调用。

### 更多 Post-op 类型

除了最常用的 Eltwise 和 Sum，oneDNN 还支持：

  - **Binary**：对结果做二元运算（如和另一个张量逐元素相乘）；
  - **Depthwise**：在结果上再附加一次深度卷积；
  - **Prelu**：附加 PReLU 激活（带可学习负半轴斜率的 ReLU 变体）。

卷积支持的 post-op 组合是有限制的——浮点卷积支持 `eltwise`、`sum`、`sum→eltwise`；INT8
量化卷积额外支持
`eltwise→sum`。计算过程中间始终用单精度浮点（fp32）进行，只在最终写回目标张量前才转换成实际的输出数据类型（比如
INT8）。

## 和 Snippets 的分工

Post-ops 和 CPU 插件的 [Snippets](0576_Tools_OV_OPs_CPUImpl_Snippets)
都在做"融合"，但覆盖的场景不同：

  - **Post-ops**：针对 oneDNN 已经实现好的主算子（Convolution、MatMul
    等计算密集型算子），附加少量预定义类型的后处理操作，组合方式有限但执行效率极高（oneDNN
    官方针对每种组合都做过专门优化）；
  - **Snippets**：面向更灵活、组合更多样的逐元素运算链（不依赖固定的算子类型搭配），用一个真正的小型编译器现场生成代码，覆盖面更广但不针对某个具体组合做极致优化。

实践中两者经常配合使用：计算密集型算子的融合走 post-ops，更长、更灵活的逐元素链路交给 Snippets 处理。

## Reference

  - [Primitive Attributes: Post-ops - oneDNN
    官方文档](https://docs.oneapi.io/versions/latest/onednn/dev_guide_attributes_post_ops.html)
  - [CNN int8 inference example - oneDNN
    官方示例](https://oneapi-src.github.io/oneDNN/page_cnn_inference_int8_cpp.html)
  - [算子融合](0563_Tools_OV_MO_Fusion)
  - [OpenVINO Ops Impl](0533_Tools_OV_OPs_Impl)
