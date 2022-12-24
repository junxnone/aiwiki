---
Title | Tools OV POT
-- | --
Created @ | `2021-02-02T03:09:49Z`
Last Modify @| `2022-12-24T16:01:06Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/177)

---
## Reference
- [Post-Training Optimization Toolkit](https://docs.openvinotoolkit.org/latest/pot_README.html)
- [Post-Training Optimization Toolkit Installation Guide](https://docs.openvinotoolkit.org/latest/pot_InstallationGuide.html)


## Brief
- POT - `Post-Training Optimization Toolkit`
- POT Command Line
- POT API
- OpenVINO Deep Learning Workbench


## Pipeline

Num | Steps | Description
-- | -- | --
1 | Install `requirments` & `accuracy_checker` & `POT` | 
2 | MO ==> FP32 Model |
3 | Prepare Dataset |
4 | Prepare `accuracy checker` config file | yaml format
5 | Prepare `POT` config file | json format
6 | Run `POT` | Gen INT8 Model
7 | `Optional` Convert Blob | compile_tool junxnone/tech-io#911 


## Algos
- [DefaultQuantization Algorithm](https://docs.openvinotoolkit.org/latest/pot_compression_algorithms_quantization_default_README.html)
- [AccuracyAwareQuantization Algorithm](https://docs.openvinotoolkit.org/latest/pot_compression_algorithms_quantization_accuracy_aware_README.html)
- [Tree-Structured Parzen Estimator (TPE)](https://docs.openvinotoolkit.org/latest/pot_compression_optimization_tpe_README.html)



![image](https://user-images.githubusercontent.com/2216970/106547092-83029500-6547-11eb-9693-be8caa2ef23e.png)
![image](https://user-images.githubusercontent.com/2216970/106547106-8a29a300-6547-11eb-92b5-755a887c3807.png)



