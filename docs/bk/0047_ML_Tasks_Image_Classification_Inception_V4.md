-----

| Title     | ML Tasks Image Classification Inception V4           |
| --------- | ---------------------------------------------------- |
| Created @ | `2019-12-04T10:51:56Z`                               |
| Updated @ | `2023-01-31T06:34:42Z`                               |
| Labels    | \`\`                                                 |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/47) |

-----

# Inception V4

## Reference

  - 2016 **Inception V4 & Inception-ResNet** Inception-v4,
    Inception-ResNet and the Impact of Residual Connections on Learning
    \[[paper](https://arxiv.org/pdf/1602.07261.pdf)\]

## Brief

  - Inception V4 和 Inception-ResNet 是同一篇 paper 提出
  - 修改了Inception的Stem
  - 添加了Reduction Block
  - 添加了 ResNet

## Inception V4

  - Stem
  - Inception-A Block
  - Inception-B Block
  - Inception-C Block
  - Reduction Module A
  - Reduction Module B

![image](media/063fa23c7d0c08e7e660d44f0da6a702fe999d79.png)

### Stem Block

![image](media/fc49381f9e6cdc8a59574fa1872bafe818196a68.png)

### Inception and Reduction Blocks

| Name        | Block                                                        |
| ----------- | ------------------------------------------------------------ |
| Inception-A | ![image](media/13ac11d6c4e252a345c4bcffe9be611a192839d1.png) |
| Inception-B | ![image](media/0782b76210a6ae784579c23d02cacd379b33fc8e.png) |
| Inception-C | ![image](media/b1db95c30534e8774c603e4504823fb9bc16b48f.png) |
| Reduction-A | ![image](media/ad9172e252dabd381c455b3c613db760db9997c9.png) |
| Reduction-B | ![image](media/2d3de9e0bffe9746ff72b9c2f216e1048a9740a4.png) |

## Inception-ResNet

![image](media/4ebcf87753dd919761535fe62c3971a71eec2fb5.png)

### Stem Block

  - Inception-ResNet-V2 同 Inception V4
  - Inception-ResNet-V1 如下

-----

![image](media/39ad844b532e2a162ed7c140c41d4078451d67df.png)

### ResNet v1 Inception and Reduction Blocks

| Name               | Block                                                        |
| ------------------ | ------------------------------------------------------------ |
| Inception-ResNet-A | ![image](media/a99d02a424ca2269b432936d03b00843e944f92d.png) |
| Inception-ResNet-B | ![image](media/89dd4507d72f26630e9462f0eec257b65a4ee20c.png) |
| Inception-ResNet-C | ![image](media/9efcd0b41b1b178b1571449a80a5014def1811aa.png) |
| Reduction-A        | 同 Inception V4                                               |
| Reduction-B        | ![image](media/125a1118359a300413f68e2111d3d5428cc6e0e3.png) |

### ResNet v2 Inception and Reduction Blocks

| Name               | Block                                                        |
| ------------------ | ------------------------------------------------------------ |
| Inception-ResNet-A | ![image](media/0c8b75edb5fc8e9b93a5cdf3abe1a053f70b3479.png) |
| Inception-ResNet-B | ![image](media/2d44ebeefd91616db19c7ed91c3b70f592e5db8e.png) |
| Inception-ResNet-C | ![image](media/d695738de2e2999f3574a4f86b0e036c4a14c5ef.png) |
| Reduction-A        | 同 Inception V4                                               |
| Reduction-B        | ![image](media/16af18ba632e5f2098618bc2013220263b6d0dd3.png) |

> Reduction-B 中的 `wider Inception-ResNet-v1` 应该就是指 `Inception-ResNet-v2`

## Test Result

![image](media/38ad66aa5a0d66ca20d9c5c342b59008f562078d.png)
