---
Title | Tools OV Debug
-- | --
Created @ | `2026-01-29T01:47:14Z`
Updated @| `2026-01-29T01:58:52Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/527)

---
# OpenVINO Debug
- 编译为 DEBUG 版本，使用环境变量控制打印相关 DEBUG 信息
- 通过 `add_outputs()` 添加模型中间量作为输出 来 Debug

## 环境变量 来 Debug 
- 按 官方文档编译版本

> 例如，debug python wheel, 

```
mkdir build
cd build
cmake -DENABLE_PYTHON=ON -DENABLE_WHEEL=ON -DENABLE_DEBUG_CAPS=ON   -G "Visual Studio 17 2022" ..
cmake --build . --config Release --verbose -j14 
```

### 相关的环境变量

- **GPU DEBUG**

```
set OV_VERBOSE=1
set OV_HELP=

set OV_GPU_DUMP_TENSORS_PATH=dump_gpu_tensors/
set OV_GPU_DUMP_SOURCES_PATH=
set OV_GPU_DUMP_LAYER_NAMES=.+layer2.+
set OV_GPU_DUMP_TENSORS=

set OV_GPU_LIST_LAYERS=

```

- **CPU DEBUG**

```

set OV_CPU_VERBOSE=11
set OV_CPU_SUMMARY_PERF=
set OV_CPU_BLOB_DUMP_DIR=dump_cpu_blob/
set OV_CPU_BLOB_DUMP_FORMAT=TEXT
set OV_CPU_BLOB_DUMP_NODE_PORTS=ALL
set OV_CPU_BLOB_DUMP_NODE_EXEC_ID=
set OV_CPU_BLOB_DUMP_NODE_NAME=.+layer2.+
set OV_CPU_BLOB_DUMP_NODE_TYPE=
```


## `add_outputs()` 打印中间层值

- 例如：添加最后几层的输出

```
  ov_model = core.read_model(args.model_path)

  nodes = ov_model.get_ordered_ops()
  add_layers = []
  for node in nodes[-10:]:
        add_layers.append(node.output(0))
  ov_model.add_outputs(add_layers)

  ov_cmodel_cpu= core.compile_model(ov_model, device_name="CPU", config=config)
  ov_cmodel_gpu = core.compile_model(ov_model, device_name="GPU", config=config)

```
