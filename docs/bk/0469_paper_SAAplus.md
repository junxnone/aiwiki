-----

| Title     | paper SAAplus                                         |
| --------- | ----------------------------------------------------- |
| Created @ | `2024-06-18T06:40:02Z`                                |
| Updated @ | `2024-06-18T06:40:02Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/469) |

-----

# SAA+

  - SAA - Segment Any Anomaly \[Naive prompt\] = `anomaly` 存在语言歧义
  - SAA+ \[hybrid prompt\] = `Domain Expert Knowledge` + `Target Image
    Context`
  - Anomaly Region Generator 异常区域生成器 \[Grounding DINO\] - 找到目标区域生成坐标
    Score
  - Anomaly Region Refiner 异常区域细化器 \[SAM\] - 根据前一步的结果实现分割
  - 减少语言歧义的的方法
      - Domain Expert Knowledge : 专家手动设计提示词
      - Target Image Context

# Hybrid Prompt Regularization

  - General Prompts \[Class-agnostic prompts\]
  - Manual Prompts (Domain Expert Knowledge) \[Class-specific prompts\]
  - Object Property Prompts

## Domain Expert Knowledge

  - 专家领域知识
  - Language Prompt 语言提示，异常描述，类别，颜色
  - Property Prompt 属性提示，位置和大小 \[面积 IoU\]

## Target Image Context

  - Anomaly Sailency Prompt
    使用预训练卷积网络(`wide_resnet50_2`)提取特征，计算特征点与近邻的余弦相似度获取显著图
  - Anomaly Confidence Prompt
  - 从图片中提取
