-----

| Title     | paper AnomalyAny cn                                   |
| --------- | ----------------------------------------------------- |
| Created @ | `2025-06-03T02:04:27Z`                                |
| Updated @ | `2025-06-03T02:04:27Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/520) |

-----

# AnomalyAny CN

  - 2024.6 **Anomaly Anything: Promptable Unseen Visual Anomaly
    Generation**

<!-- end list -->

``` 
Han Sun  EPFL, Switzerland  Yunkang Cao   HUST, China   Hao Dong  ETH Zurich, Switzerland  Olga Fink  EPFL, Switzerland

{han.sun, olga.fink}@epfl.ch, cyk hust@hust.edu.cn, hao.dong@ibk.baug.ethz.ch

```

## Abstract

由于异常数据样本的稀缺，视觉异常检测（AD）面临着巨大挑战。尽管已有许多工作致力于合成异常样本，但这些合成的异常往往缺乏真实性，或者需要大量的训练数据，这限制了它们在现实场景中的应用。在这项工作中，我们提出了Anomaly
Anything（AnomalyAny），这是一个新颖的框架，它利用Stable
Diffusion（SD）的图像生成能力来生成多样且逼真的未知异常。通过在测试时以单个正常样本为条件，AnomalyAny能够针对任意物体类型，结合文本描述生成未知的异常。在AnomalyAny框架内，我们**提出了注意力引导的异常优化方法，以引导SD将注意力集中在生成关键的异常概念上**。此外，我们还**引入了提示引导的异常细化方法，通过融入详细的描述来进一步提升生成质量**。在MVTec
AD和VisA数据集上进行的大量实验表明，AnomalyAny具备生成高质量未知异常的能力，并且在提升下游异常检测任务的性能方面效果显著。我们的演示和代码可在<https://hansunhayden.github.io/AnomalyAny.github.io/>
获取。
