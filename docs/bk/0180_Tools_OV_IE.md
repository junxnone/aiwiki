-----

| Title         | Tools OV IE                                           |
| ------------- | ----------------------------------------------------- |
| Created @     | `2018-11-11T15:07:02Z`                                |
| Last Modify @ | `2022-12-24T15:59:37Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/180) |

-----

# Inference Engine

## Reference

  - [Python
    API](https://docs.openvinotoolkit.org/2019_R3/ie_python_api.html)
  - [Build
    IE](https://github.com/opencv/dldt/tree/2019/inference-engine)
  - [IE Developer
    Guide](https://docs.openvinotoolkit.org/latest/_docs_IE_DG_Deep_Learning_Inference_Engine_DevGuide.html)
  - [IE Supported
    Devices](https://docs.openvinotoolkit.org/latest/_docs_IE_DG_supported_plugins_Supported_Devices.html)
  - [Integrate the Inference Engine with Your
    Application](https://docs.openvinotoolkit.org/latest/_docs_IE_DG_Integrate_with_customer_application_new_API.html)
  - [Benchmark C++
    Tool](https://docs.openvinotoolkit.org/latest/_inference_engine_samples_benchmark_app_README.html)
  - [Benchmark Python\*
    Tool](https://docs.openvinotoolkit.org/latest/_inference_engine_tools_benchmark_tool_README.html)

## Brief

## API & Libraries

  - C++ API
  - Python API

-----

  - Core IE Library
      - Linux\* OS: libinference\_engine.so
      - Windows\* OS: inference\_engine.dll
  - Device-specific Plugin Libraries

## Supported Devices

  - CPU
  - GPU
  - VPU
  - HDDL
  - FPGA
  - **Heterogeneous**: 优先使用第一个 Device 运行，若遇到不支持的 Layers, 则不支持的 Layers
    放在第二个 Device 运行
  - **Multi-Device**: 多个 Devices 共同运行，因为一些共同资源的消耗，所以实际 performance
    会比理论值略低
  - GNA

-----

**Uesed Plugins**

| PLUGIN | LIBRARY NAME FOR LINUX  | DEPENDENCY LIBRARIES FOR LINUX                      |
| ------ | ----------------------- | --------------------------------------------------- |
| CPU    | libMKLDNNPlugin.so      | libmklml\_tiny.so, libiomp5md.so                    |
| GPU    | libclDNNPlugin.so       | libclDNN64.so                                       |
| FPGA   | libdliaPlugin.so        | libdla\_compiler\_core.so, libdla\_runtime\_core.so |
| MYRIAD | libmyriadPlugin.so      | No dependencies                                     |
| HDDL   | libHDDLPlugin.so        | libbsl.so, libhddlapi.so, libmvnc-hddl.so           |
| GNA    | libGNAPlugin.so         | libgna\_api.so                                      |
| HETERO | libHeteroPlugin.so      | Same as for selected plugins                        |
| MULTI  | libMultiDevicePlugin.so | Same as for selected plugins                        |

| PLUGIN | LIBRARY NAME FOR WINDOWS | DEPENDENCY LIBRARIES FOR WINDOWS                                                             |
| ------ | ------------------------ | -------------------------------------------------------------------------------------------- |
| CPU    | MKLDNNPlugin.dll         | mklml\_tiny.dll, libiomp5md.dll                                                              |
| GPU    | clDNNPlugin.dll          | clDNN64.dll                                                                                  |
| FPGA   | dliaPlugin.dll           | dla\_compiler\_core.dll, dla\_runtime\_core.dll                                              |
| MYRIAD | myriadPlugin.dll         | No dependencies                                                                              |
| HDDL   | HDDLPlugin.dll           | bsl.dll, hddlapi.dll, json-c.dll, libcrypto-1\_1-x64.dll, libssl-1\_1-x64.dll, mvnc-hddl.dll |
| GNA    | GNAPlugin.dll            | gna.dll                                                                                      |
| HETERO | HeteroPlugin.dll         | Same as for selected plugins                                                                 |
| MULTI  | MultiDevicePlugin.dll    | Same as for selected plugins                                                                 |

## Pipeline

![image](media/0841608b84f7f46c2c36f4f4560287b1d2532f18.png)

| Steps                  | C++ Classes                       | Python Classes |
| ---------------------- | --------------------------------- | -------------- |
| 读取IR                   | CNNNetReader<br>CNNNetwork        |                |
| 指定 IO 格式               | CNNNetwork                        |                |
| 创建 IE Core 对象          | Core                              |                |
| 编译并载入 Network 到 Device | Core                              |                |
| 设置输入 Data              | ExecutableNetwork<br>InferRequest |                |
| 执行 Inference           | InferRequest                      |                |
| 获取输出                   | InferRequest                      |                |

## Benchmark Tool

  - Benchmark C++ Tool
  - Benchmark Python\* Tool
