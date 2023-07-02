-----

| Title         | Math BT                                               |
| ------------- | ----------------------------------------------------- |
| Created @     | `2020-07-14T06:08:46Z`                                |
| Last Modify @ | `2022-12-25T04:36:08Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/217) |

-----

# 贝叶斯定理

## Reference

  - [一个例子搞清楚（先验分布/后验分布/似然估计）](https://blog.csdn.net/qq_23947237/article/details/78265026)
  - [贝叶斯定理](https://blog.csdn.net/qq_41529692/article/details/84105315)

## Brief

  - **先验/Prior** - 原因 ==\> 结果, 事情发生之前, 根据以往经验和分析得到的
      - **先验概率/Prior Probability**
          - `e.g. 抛硬币正面向上的概率`
      - **先验分布/Prior Distribution** - 已知结果, 估计分布
  - **后验/Posterior** - 结果 ==\> 原因 事情发生, 在相关结果或者背景给定并纳入考虑之后的
      - **后验概率/Posterior Probability**
      - **后验分布/Posterior Distribution** - 已知历史, 估计分布
  - \*\*似然估计/Likelihood \*\* - 已知原因, 估计分布

| Name               | Details                                                      |
| ------------------ | ------------------------------------------------------------ |
| 贝叶斯推断              | ![image](media/9c3ee34a18ed1f1ddcab14ce7a1cfe2a80459dac.png) |
| x                  | 结果 - 观察得到的数据                                                 |
| θ                  | 原因 - 决定数据分布的参数                                               |
| 后验/Posterior       | ![image](media/90d91c026a2415b098f7c406978490d49e5e7080.png) |
| 先验/Prior           | ![image](media/a8d8d976135d2dc8b53983729c48e5e5b0e55633.png) |
| 似然估计/Likelihood    | ![image](media/6a4ff9d22b14619f08cf983149f56dcf7af238d0.png) |
| 证据因子/边缘似然/Evidence | ![image](media/3c21f7dfdd15f647e2521eb9bf4a1415867e66bc.png) |

## 贝叶斯公式

| 推理                                                           |
| ------------------------------------------------------------ |
| ![image](media/a5397b26e02051ae84376a1ad4ab83e6fec1849a.png) |
| ![image](media/8ff3f77a177fcbdb6c39d5e5fce21c01936c02a3.png) |

  - P(A|B) - 事件 B 发生后 A 发生的概率 - 条件概率 - 后验概率
  - P(B|A) - 事件 A 发生后 B 发生的概率
  - P(A) / P(B) - A/B 发生的概率 - 先验概率
