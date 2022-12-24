---
Title | ML AutoML
-- | --
Created @ | `2021-09-06T09:22:58Z`
Last Modify @| `2022-12-24T13:18:02Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/12)

---
# Reference
- 2018 [Taking Human out of Learning Applications: A Survey on Automated Machine Learning](https://arxiv.org/pdf/1810.13306.pdf)
- 2019 [AutoML: A Survey of the State-of-the-Art](https://arxiv.org/pdf/1908.00709.pdf)  --  [update - website](https://marsggbo.github.io/automl_a_survey_of_state_of_the_art/)
- [awesome-automl-papers](https://github.com/hibayesian/awesome-automl-papers)
- [AutoML综述更新 【AutoML：Survey of the State-of-the-Art】](https://www.cnblogs.com/marsggbo/p/13275480.html)
- [从Google Visor到Microsoft NNI再到Advisor调参服务接口发展史](https://blog.csdn.net/u010159842/article/details/83043229)
- [自动机器学习简述（AutoML）](https://my.oschina.net/taogang/blog/3011686)
- [AutoML：机器学习的下一波浪潮](https://www.jiqizhixin.com/articles/2019-04-30-2)
- [AutoML challenge ](http://automl.chalearn.org/)
- [Using Meta-Learning to Initialize Bayesian Optimization of Hyperparameters](https://pdfs.semanticscholar.org/681e/518fd8e3e986ba25bc1fb33aac8873b521e7.pdf)
- [简述目前AutoML类型与模式](https://zhuanlan.zhihu.com/p/57896464)


# Brief

- AutoML 将特征、模型、优化、评价有关的步骤进行自动化地学习，使得机器学习模型无需人工干预。
- AutoML 目标
  - Better performance
  - No human assistance
  - Lower computation budgets
- HAO - `Joint Hyper-parameter and Architecture Optimization` - 参数和架构联合优化
- [HPO](/HPO)
- [NAS](/NAS)

## Pipelines

AutoML Steps | Description
-- | --
DP | Data Preparation = `Data Cleaning` + `AutoAugment` + `...`
[Feature Engineering](/Feature_Engineering) | `DL` 中常用于时间或者结构数据
HPO | HyperParameter Optimization
NAS | Neural Architecture Search
Model Compression | 

![image](https://user-images.githubusercontent.com/2216970/87015747-6647ee00-c200-11ea-8af5-3e61ad1eefea.png) |
--  |
![image](https://user-images.githubusercontent.com/2216970/87122485-9605fd00-c2b7-11ea-8955-c8f5d551ef62.png) |


## Tools

Projects | Author | DP | FE | HPO | NAS
-- | -- | -- | -- | -- | -- 
[vega](https://github.com/huawei-noah/vega) | HuaWei
[NNI](/AutoML_NNI) |  Microsoft 
[AutoGluon](https://github.com/awslabs/autogluon) | Amazon AWS
[autokeras](https://github.com/keras-team/autokeras) | keras-team
[auto-sklearn](https://github.com/automl/auto-sklearn) | AutoML -xxx
[Advisor](https://github.com/tobegit3hub/advisor) | 
[Google Cloud AutoML](https://cloud.google.com/automl/docs) | Google
[katib](https://github.com/kubeflow/katib) | Kubeflow

