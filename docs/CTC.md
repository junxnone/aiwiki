---
Title | CTC
-- | --
Create Date | `2020-05-09T06:33:21Z`
Update Date | `2022-01-19T09:35:56Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/189)

---
## Reference

- [CTC算法详解](https://www.jianshu.com/p/0cca89f64987)
- [paper - 2014 - First-Pass Large Vocabulary Continuous Speech Recognition using Bi-Directional Recurrent DNNs](https://arxiv.org/pdf/1408.2873.pdf)
- [paper - 2006 - Connectionist temporal classification: Labelling unsegmented sequence data with recurrent neural networks.](http://people.idsia.ch/~santiago/papers/icml2006.pdf)
- [论文笔记：Connectionist Temporal Classification: Labelling Unsegmented Sequence](https://blog.csdn.net/w5688414/article/details/77855262)
- [谁给讲讲语音识别中的CTC方法的基本原理？](https://www.zhihu.com/question/47642307)
- [Sequence Modeling With CTC](https://distill.pub/2017/ctc/)
- [详解CTC](https://zhuanlan.zhihu.com/p/42719047)
- [warp-ctc - pytorch - Github](https://github.com/SeanNaren/warp-ctc)  ---- [Baidu - Warp-CTC](https://github.com/baidu-research/warp-ctc)
- [CCTC](https://github.com/tmbarchive/cctc)
- [深度学习-CTC算法原理](http://xiaofengshi.com/2019/02/14/%E6%B7%B1%E5%BA%A6%E5%AD%A6%E4%B9%A0-CTC%E7%AE%97%E6%B3%95%E5%8E%9F%E7%90%86/)
- [OCR之ctc资源汇总](https://zhuanlan.zhihu.com/p/145427498)
- [How to build e2e recognition system - CTC loss](https://docs.google.com/presentation/d/12gYcPft9_4cxk2AD6Z6ZlJNa3wvZCW1ms31nhq51vMk/pub?start=false&loop=false&delayms=3000&slide=id.g24e9f0de4f_0_332)


## Brief
- CTC - `Connectionist Temporal Classification`
- 解决输入输出对齐问题
- Greedy Search
- Beam Search


# Install warp-ctc
```
git clone https://github.com/SeanNaren/warp-ctc.git
cd warp-ctc
mkdir build; cd build
cmake ..
make warpctc
../pytorch_binding/
python setup.py install
```


