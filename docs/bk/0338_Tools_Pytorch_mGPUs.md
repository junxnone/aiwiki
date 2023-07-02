-----

| Title         | Tools Pytorch mGPUs                                   |
| ------------- | ----------------------------------------------------- |
| Created @     | `2020-08-20T02:04:02Z`                                |
| Last Modify @ | `2022-12-25T04:12:02Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/338) |

-----

# 多 GPUs

## Reference

  - [Optional: Data
    Parallelism](https://pytorch.org/tutorials/beginner/blitz/data_parallel_tutorial.html)
  - [第25章 Pytorch
    如何高效使用GPU](https://www.cnblogs.com/jfdwd/p/11195988.html)

## Brief

| Function                                           | Description                   |
| -------------------------------------------------- | ----------------------------- |
| os.environ\['CUDA\_VISIBLE\_DEVICES'\] = '0,3'     | Setup gpus                    |
| `model = nn.DataParallel(model)`                   | Create Model and DataParallel |
| `torch.save(model.module.state_dict(), save_name)` | 多 gpu 模型保存                    |

**- Examples**

    model = Model(input_size, output_size)
    if torch.cuda.device_count() > 1:
      print("Let's use", torch.cuda.device_count(), "GPUs!")
      model = nn.DataParallel(model)
    
    model.to(device)

## Tips

  - batchsize 有可能影响实际使用的gpu数量

> `batchsize=4` 使用 `gpus = 1,2,3` 导致 只有 `1,2` gpu works `batchsize=6` 即可
> `1,2,3` gpu works

  - tensorboard add\_graph()

<!-- end list -->

    xxxx.add_graph(model.module, images.cuda())

  - 如果保存时，未使用 `model.module.state_dict()`，而是用 `model.state_dict()`

<!-- end list -->

``` 
 from collections import OrderedDict
    new_state_dict = OrderedDict()
    for k, v in state_dict.items():
        name = k[7:] # remove `module.`
        new_state_dict[name] = v
```
