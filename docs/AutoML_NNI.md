---
Title | AutoML NNI
-- | --
Create Date | `2021-09-08T02:25:24Z`
Update Date | `2021-09-08T02:25:24Z`
---
# Reference
- [[Docs - zh](https://nni.readthedocs.io/zh/latest/)] [[Code - Microsoft ](https://github.com/Microsoft/nni)]

# Brief
- NNI - Neural Network Intelligence
  - FE
  - HPO
  - NAS
  - Model Compression


---

![image](https://user-images.githubusercontent.com/2216970/132436063-9e270555-616a-4c5a-be11-a6776752e6f0.png)


# Install
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

