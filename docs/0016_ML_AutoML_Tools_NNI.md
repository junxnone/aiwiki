---
Title | ML AutoML Tools NNI
-- | --
Created @ | `2019-03-10T11:35:45Z`
Updated @| `2026-11-26T10:11:36Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/16)

---
# NNI

NNI（Neural Network Intelligence）是 Microsoft 开源的自动机器学习工具包，覆盖特征工程、超参数优化、神经网络结构搜索和模型压缩。

- NNI - Neural Network Intelligence
  - FE
  - HPO
  - NAS
  - Model Compression

| 功能 | 说明 | 相关 |
| --- | --- | --- |
| FE | Feature Engineering，特征工程 | |
| HPO | Hyperparameter Optimization，超参数优化（TPE、SMAC 等 Tuner） | [SMAC](https://github.com/junxnone/aiwiki/issues/220)、[BO](https://github.com/junxnone/aiwiki/issues/22) |
| NAS | Neural Architecture Search，网络结构搜索 | [Search Space](https://github.com/junxnone/aiwiki/issues/392)、[NAS Metrics](https://github.com/junxnone/aiwiki/issues/394) |
| Model Compression | 模型压缩（剪枝、量化） | |

表中：对比结论：NNI 把「试验（trial）运行 + Tuner 搜索 + 实验管理」做成统一框架。

---
![image](https://user-images.githubusercontent.com/2216970/132436063-9e270555-616a-4c5a-be11-a6776752e6f0.png)


## Install

```
python3 -m pip install --upgrade nni
```

**mnist example**

```
nnictl create --config examples/trials/mnist/config.yml
```

```
You can use these commands to get more information about the experiment
-----------------------------------------------------------------------
         commands                       description
1. nnictl experiment show        show the information of experiments
2. nnictl trial ls               list all of trial jobs
3. nnictl top                    monitor the status of running experiments
4. nnictl log stderr             show stderr log content
5. nnictl log stdout             show stdout log content
6. nnictl stop                   stop an experiment
7. nnictl trial kill             kill a trial job by id
8. nnictl --help                 get help information about nnictl
```

![image](https://user-images.githubusercontent.com/2216970/54084656-7468ce80-436e-11e9-887e-7ad29537d4ec.png)


其中：`nnictl create` 按配置文件启动一个实验；命令行表中的 `nnictl experiment show`、`trial ls`、`stop` 用于查看和管理实验；Web 界面默认可在浏览器查看各 trial 的结果。

## Reference
- [[Docs - zh](https://nni.readthedocs.io/zh/latest/)] [[Code - Microsoft ](https://github.com/Microsoft/nni)]

