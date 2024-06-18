-----

| Title     | paper SAAplus                                         |
| --------- | ----------------------------------------------------- |
| Created @ | `2024-06-18T06:40:02Z`                                |
| Updated @ | `2024-06-18T06:53:28Z`                                |
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

## General Prompts

<iframe frameborder="0" scrolling="no" style="width:100%; height:142px;" allow="clipboard-write" src="https://junxnone.github.io/emgithub/iframe.html?target=https%3A%2F%2Fgithub.com%2Fcaoyunkang%2FSegment-Any-Anomaly%2Fblob%2F23acbd9072086ac510ea9028fe7fe1af02bb2b39%2FSAA%2Fprompts%2Fgeneral_prompts.py%23L2-L4&style=agate&type=code&showBorder=on&showLineNumbers=on&showFileMeta=on&showFullPath=on&showCopy=on"></iframe>

## Domain Expert Knowledge

  - 专家领域知识
  - Language Prompt 语言提示，异常描述，类别，颜色
  - Property Prompt 属性提示，位置和大小 \[面积 IoU\]

### Language Prompt

<iframe frameborder="0" scrolling="no" style="width:100%; height:163px;" allow="clipboard-write" src="https://junxnone.github.io/emgithub/iframe.html?target=https%3A%2F%2Fgithub.com%2Fcaoyunkang%2FSegment-Any-Anomaly%2Fblob%2F23acbd9072086ac510ea9028fe7fe1af02bb2b39%2FSAA%2Fprompts%2Fmvtec_parameters.py%23L28-L31&style=agate&type=code&showBorder=on&showLineNumbers=on&showFileMeta=on&showFullPath=on&showCopy=on"></iframe>

### Property Prompt

<iframe frameborder="0" scrolling="no" style="width:100%; height:100px;" allow="clipboard-write" src="https://junxnone.github.io/emgithub/iframe.html?target=https%3A%2F%2Fgithub.com%2Fcaoyunkang%2FSegment-Any-Anomaly%2Fblob%2F23acbd9072086ac510ea9028fe7fe1af02bb2b39%2FSAA%2Fprompts%2Fmvtec_parameters.py%23L82&style=agate&type=code&showBorder=on&showLineNumbers=on&showFileMeta=on&showFullPath=on&showCopy=on"></iframe>

#### 提取信息

  - `object_prompt` - 目标名称
  - `object_number` - 目标数量
  - `k_mask` - 最大缺陷数量
  - `defect_area_threshold` - 缺陷区域大小
  - `object_max_area` - 缺陷最大面积
  - `object_min_area` - 最小面积
  - `similar` - 多个目标是否相似

<iframe frameborder="0" scrolling="no" style="width:100%; height:226px;" allow="clipboard-write" src="https://junxnone.github.io/emgithub/iframe.html?target=https%3A%2F%2Fgithub.com%2Fcaoyunkang%2FSegment-Any-Anomaly%2Fblob%2F23acbd9072086ac510ea9028fe7fe1af02bb2b39%2FSAA%2Fmodel.py%23L131-L137&style=agate&type=code&showBorder=on&showLineNumbers=on&showFileMeta=on&showFullPath=on&showCopy=on"></iframe>

## Target Image Context

  - Anomaly Sailency Prompt
    使用预训练卷积网络(`wide_resnet50_2`)提取特征，计算特征点与近邻的余弦相似度获取显著图
  - Anomaly Confidence Prompt
  - 从图片中提取

## Reference

  - [Code](https://github.com/caoyunkang/Segment-Any-Anomaly/tree/SAA-plus)
  - [paper - Segment Any Anomaly without Training via Hybrid Prompt
    Regularization](https://arxiv.org/abs/2305.10724)
