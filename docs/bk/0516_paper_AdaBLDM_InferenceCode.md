-----

| Title     | paper AdaBLDM InferenceCode                           |
| --------- | ----------------------------------------------------- |
| Created @ | `2025-05-12T03:25:54Z`                                |
| Updated @ | `2025-05-12T03:36:28Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/516) |

-----

# Inference Code 分析

## Online Decoder Adaption

  - 自适应优化解码器优化图像生成

<iframe frameborder="0" scrolling="no" style="width:100%; height:268px;" allow="clipboard-write" src="https://junxnone.github.io/emgithub/iframe.html?target=https%3A%2F%2Fgithub.com%2Fjunxnone%2FAdaBLDM%2Fblob%2F44a71f07dc62d4477cc6255a96e5defe2c430b3c%2Ftest.py%23L310-L318++&style=default&type=code&showBorder=on&showLineNumbers=on&showFileMeta=on&showFullPath=on&showCopy=on"></iframe>

### Loss

  - 分别计算当前图像在非异常区域(与无缺陷图像对比)和异常区域(和当前优化后的图像对比)的差异

<iframe frameborder="0" scrolling="no" style="width:100%; height:184px;" allow="clipboard-write" src="https://junxnone.github.io/emgithub/iframe.html?target=https%3A%2F%2Fgithub.com%2Fjunxnone%2FAdaBLDM%2Fblob%2F44a71f07dc62d4477cc6255a96e5defe2c430b3c%2Ftest.py%23L303-L307&style=default&type=code&showBorder=on&showLineNumbers=on&showFileMeta=on&showFullPath=on&showCopy=on"></iframe>
