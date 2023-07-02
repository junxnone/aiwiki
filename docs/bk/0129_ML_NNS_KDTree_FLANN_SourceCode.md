-----

| Title         | ML NNS KDTree FLANN SourceCode                        |
| ------------- | ----------------------------------------------------- |
| Created @     | `2021-10-27T08:25:28Z`                                |
| Last Modify @ | `2022-12-23T15:16:38Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/129) |

-----

# Source Code Structure

## Source Code 结构

### 文件夹

    flann/
    ├── bin ##一些脚本工具
    ├── cmake
    ├── doc ##文档
    ├── examples ##用例
    ├── src ##源码
    │   ├── cpp
    │   │   └── flann
    │   │       ├── algorithms ## Index 不同算法的实现
    │   │       ├── io ##hdf5 读写 API
    │   │       ├── mpi ##Server/Client 远程 search 实现
    │   │       ├── nn ##evaluate 相关 ？？
    │   │       └── util ##功能函数
    │   │           └── cuda ##cuda 相关声明
    │   ├── matlab ##matlab API
    │   ├── python ##python API
    │   └── ruby ##ruby API
    └── test ##unit tests

### Code

``` 
.
├── algorithms
│   ├── all_indices.h
│   ├── autotuned_index.h
│   ├── center_chooser.h
│   ├── composite_index.h
│   ├── dist.h
│   ├── hierarchical_clustering_index.h
│   ├── kdtree_cuda_3d_index.cu ##CUDA Implementation
│   ├── kdtree_cuda_3d_index.h
│   ├── kdtree_cuda_builder.h
│   ├── kdtree_index.h
│   ├── kdtree_single_index.h
│   ├── kmeans_index.h
│   ├── linear_index.h
│   ├── lsh_index.h
│   └── nn_index.h
├── config.h
├── config.h.in
├── defines.h
├── flann.cpp
├── flann_cpp.cpp
├── flann.h  ## C API
├── flann.hpp ## C++ API
├── general.h
├── io
│   └── hdf5.h
├── mpi
│   ├── client.h
│   ├── flann_mpi_client.cpp
│   ├── flann_mpi_server.cpp
│   ├── index.h
│   ├── matrix.h
│   ├── queries.h
│   └── server.h
├── nn
│   ├── ground_truth.h
│   ├── index_testing.h
│   └── simplex_downhill.h
└── util
    ├── allocator.h
    ├── any.h
    ├── cuda
    │   ├── heap.h
    │   └── result_set.h
    ├── cutil_math.h
    ├── dynamic_bitset.h
    ├── heap.h
    ├── logger.h
    ├── lsh_table.h
    ├── matrix.h
    ├── object_factory.h
    ├── params.h
    ├── random.h
    ├── result_set.h
    ├── sampling.h
    ├── saving.h
    ├── serialization.h
    └── timer.h

```
