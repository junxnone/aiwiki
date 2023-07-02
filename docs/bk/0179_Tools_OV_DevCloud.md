-----

| Title         | Tools OV DevCloud                                     |
| ------------- | ----------------------------------------------------- |
| Created @     | `2020-12-09T07:28:51Z`                                |
| Last Modify @ | `2022-12-24T15:58:47Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/179) |

-----

## Reference

  - [DevCloud](https://devcloud.intel.com/edge/)

## Brief

  - 测试不同 `Device`上的 `Performance`
  - 使用 `Jupyter Notebook`

| Mode  | Inference Time                                               | Throughput                                                   |
| ----- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Sync  | ![image](media/3f8232d5fa30aa3f76fd35fbc07461c6711a7ec5.png) | ![image](media/6c4b9f16cbaa1b420303604e97fa4a52f6a6c6a1.png) |
| Async | ![image](media/d849fbca6aa0d19dd8cf9266c9e6ccd693737cbe.png) | ![image](media/1b5eb6f15fab8b35d5b1114d1ddf645fb48624c9.png) |

| ![image](media/4a271698aaa09cbb170dbea6d4d7537ea2ea07ef.png) |
| ------------------------------------------------------------ |

**Files**

  - jupyter notebook
  - python inference script
  - OpenVINO IR models
  - test images/videos/labels

**Pipeline**

  - *Optional* - Convert Tensorflow/Pytorch model to OpenVINO IR
  - Create shell script to run on Edge Node
  - Create Jobs on jupyter notebook on different devices
  - Summary logs and plot performance

## Details

  - Python
      - qarpo
          - demoutils
              - progressUpdate
          - displayMultiversionURL
      - applicationMetricWriter
  - Shell
      - pbsnodes
      - qsub
