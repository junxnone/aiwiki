---
Title | paper Uformer
-- | --
Created @ | `2026-04-24T05:54:33Z`
Updated @| `2026-04-24T06:07:35Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/539)

---
# Uformer
- Uformer 是中科大等提出的通用 U 型 Transformer 图像复原模型，把 CNN 的 U-Net 结构和 Transformer 的全局建模能力融合，主打去噪、去雨、去模糊、去反光 / 炫光等低层视觉任务。


## 模型结构
- 沿用 U-Net 经典**编码器-解码器-跳跃连接**对称结构
- 核心：LeWin Transformer Block（非重叠窗口自注意力 W-MSA + 局部增强前馈网络 LeFF），兼顾效率与局部细节。
- 特点：分层编解码 + 多尺度跳跃连接，工业场景（金属 / 玻璃反光、焊点炫光）表现强。

<img width="1572" height="567" alt="Image" src="https://github.com/user-attachments/assets/41643802-b6f7-43a2-813a-b303e5c1d953" />

### U-Shaped Transformer
沿用 U-Net 经典**编码器-解码器-跳跃连接**对称结构：
- 编码器：多尺度下采样，提取浅层纹理+深层全局反光特征
- 瓶颈层：深层大感受野建模强反光、大范围光晕
- 解码器：上采样还原分辨率，跳跃连接补全细节
> 把CNN卷积块 全部替换为 **自研LeWin Transformer Block**

 ### 核心模块：LeWin Transformer Block
- LeWin Transformer Block（非重叠窗口自注意力 W-MSA + 局部增强前馈网络 LeFF），兼顾效率与局部细节。

全称：**Local Enhanced Window Transformer Block**
由两部分组成：
1. **限制窗口自注意力 W-MSA**
   不做全局注意力，只在局部窗口内计算，**大幅降低算力**，解决Transformer慢、显存高问题；
2. **LeFF 局部增强前馈网络**
   标准MLP只做全局映射，LeFF 加入**局部卷积约束**，强制保留边缘、纹理、工件细节；
> 这也是 Uformer 做**工业去反光不抹除划痕、瑕疵**的关键。

### 3多尺度分层特征融合
编码器4级下采样、解码器4级上采样，
不同尺度特征跳跃拼接：
- 浅层：保留工件边缘、纹理、字符
- 深层：抑制大面积高光、镜面反射、炫光光晕

### 通用大一统复原框架
单网络结构不改动，仅换训练数据集，即可适配多种低层任务：
去噪、运动模糊、夜景增强、**镜面高光去除（工业反光）**、去雾


## 网络整体结构流程

1. 输入RGB图像 → 浅层卷积嵌入映射为高维特征
2. 编码器：逐层下采样 + LeWin Transformer 提取多尺度特征
3. 中间瓶颈：深层窗口注意力，建模**大范围连续反光区域**
4. 解码器：逐层上采样 + 跳跃连接融合浅层细节
5. 末端卷积映射回RGB，输出修复后无反光图像

## Reference

- [paper 2022 ](https://arxiv.org/abs/2106.03106)
- [github](https://github.com/ZhendongWang6/Uformer)
