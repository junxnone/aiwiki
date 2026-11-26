-----

| Title     | LM Deploy Kubernetes                                  |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-26T15:40:05Z`                                |
| Updated @ | `2026-11-26T15:40:05Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/850) |

-----

# Kubernetes

在 Kubernetes 上运行大模型推理：GPU 调度、模型权重的加载与缓存、扩缩容、按前缀的路由，以及 KServe、vLLM
production stack、llm-d 等方案。服务架构的通用部分见 [Service](@@DSVC@@)。

## 为什么不同于普通服务

| 特点    | 普通 Web 服务      | 大模型推理                    |
| ----- | -------------- | ------------------------ |
| 单实例资源 | 几核 CPU、几 GB 内存 | 一到多张 GPU，几十到几百 GB 显存     |
| 启动时间  | 秒级             | 拉镜像 + 下载权重 + 加载编译，分钟级    |
| 请求时长  | 毫秒级            | 秒到分钟级 (流式)               |
| 状态    | 无状态            | KV Cache 与前缀缓存是有价值的「软状态」 |
| 负载均衡  | 轮询即可           | 需要看队列长度、KV 使用率和前缀命中      |

表中：这些差异决定了大模型推理不能直接套用通用的部署方式：扩容慢、实例贵、路由要感知缓存。

## 部署结构

``` mermaid
flowchart TB
    U[客户端] --> GW[网关 / Ingress]
    GW --> RT[路由层<br>按负载 + 前缀亲和]
    RT --> P1[推理 Pod 1<br>vLLM + GPU]
    RT --> P2[推理 Pod 2<br>vLLM + GPU]
    P1 --> PV[(模型缓存<br>节点本地盘 / PVC)]
    P2 --> PV
    M[监控 Prometheus] -.抓取 /metrics.-> P1
    A[扩缩容 HPA/KEDA] -.读取指标.-> M
    A -.调整副本数.-> P1
```

图中：

  - 推理 Pod 通过资源请求申请 GPU，读取挂载的模型缓存，暴露 OpenAI 兼容接口和 `/metrics`
  - 路由层把请求分给合适的 Pod：负载低的、或者已经缓存了相同前缀的 (提高前缀缓存命中率)
  - 扩缩容组件根据推理指标 (而不是 CPU 利用率) 调整副本数

## GPU 调度

``` yaml
resources:
  limits:
    nvidia.com/gpu: 1          # Intel GPU 使用 gpu.intel.com/i915 或 gpu.intel.com/xe 等资源名
```

  - 需要在节点上安装设备插件 (NVIDIA device plugin / Intel GPU device plugin)，GPU
    才会作为可调度资源出现 `[待核实]` Intel 资源名以所用插件版本为准
  - 多卡张量并行的 Pod 要申请同一节点上的多张卡，并确认它们之间有 NVLink 等高速互联，否则 TP 性能会很差，见
    [Parallel](@@IPAR@@)
  - 共享 GPU：MIG (把一张卡切成多个实例) 或时间片共享，适合多个小模型共用一张卡
  - 跨节点的大模型 (TP × PP 跨多个节点) 需要能把一组 Pod 作为一个整体调度的机制 (如 LeaderWorkerSet)

## 模型权重与启动时间

启动时间 $\\approx$ 拉镜像 + 下载权重 + 加载到显存 + 编译/预热，其中下载权重通常最慢：

$$ t\_{download}=\\frac{N\\cdot b\_w}{\\text{BW}\_{storage}} $$

其中：

  - $N\\cdot b\_w$：权重的字节数
  - $\\text{BW}\_{storage}$：从存储到节点的有效带宽

例：70B BF16 权重 $141$ GB，从 $1$ GB/s 的对象存储下载约 $141$ s；从节点本地 NVMe ($\\sim5$
GB/s) 读约 $28$ s。

降低启动时间的做法：

  - 把权重预先缓存在节点本地盘，或用共享的高速文件系统挂载，避免每次都从远端下载
  - 使用已量化的权重 (体积小几倍)，见 [Format](@@DFMT@@)
  - 镜像只包含运行时，不打包权重
  - 保留最小副本数，不要缩到 $0$ (除非能接受冷启动)

## 扩缩容

  - 指标：等待中的请求数、正在运行的请求数、KV Cache 使用率、TTFT 的 p95；可以用 Prometheus Adapter
    接入 HPA，或用 KEDA 基于 Prometheus 查询扩缩容，指标名见 [Ops](@@DOPS@@)
  - 扩容要提前：因为启动慢，扩容阈值要留余量，或按时间规律做预测扩容
  - 缩容要平滑：先摘掉流量，等进行中的流式请求结束再终止 Pod (设置足够长的
    `terminationGracePeriodSeconds`)

## 方案

| 方案                    | 定位                                               |
| --------------------- | ------------------------------------------------ |
| KServe                | 通用的模型服务平台，支持 vLLM 等运行时、自动扩缩、金丝雀发布                |
| vLLM production stack | vLLM 官方的 Helm 部署方案，带前缀感知路由、KV 缓存共享 (LMCache) 和监控 |
| llm-d                 | 面向 Kubernetes 的分布式推理方案，支持 PD 分离和缓存感知的调度          |
| AIBrix 等              | 其他的 LLM 专用控制平面                                   |
| OpenVINO Model Server | 提供容器镜像，可按普通 Deployment 部署，见 [OpenVINO](@@DOV@@)  |

表中：这些方案都在解决同样的几个问题：GPU 调度、冷启动、缓存感知路由和基于推理指标的扩缩容；功能与成熟度变化很快，选型前查看最新版本
`[待核实]`。

## Reference

  - [Kubernetes: Schedule
    GPUs](https://kubernetes.io/docs/tasks/manage-gpus/scheduling-gpus/)
  - [KServe](https://kserve.github.io/website/)
  - [vLLM production
    stack](https://github.com/vllm-project/production-stack)
  - [llm-d](https://github.com/llm-d/llm-d)
  - [Intel Device Plugins for
    Kubernetes](https://github.com/intel/intel-device-plugins-for-kubernetes)
  - [LeaderWorkerSet](https://github.com/kubernetes-sigs/lws)
