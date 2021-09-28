---
Title | CMU 15-418 Lecture 2 Instruction-Level Parallelism
-- | --
Create Date | `2021-09-28T07:28:32Z`
Update Date | `2021-09-28T07:28:32Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/62)

---
# Brief
- 多样的处理器 CPU/GPU/FPGA/VPU/...
- 不同处理器的并行方法
- ILP
  - Pipelining & Superscalar - 同时执行多条指令
  - Out of order execution - 动态调度执行指令
  - Speculation - 预测下条指令


Processors | 用途 | 并行方法 | 调度 | Cores | Hardware | 编程困难度
-- | -- | -- | -- | -- | -- | --
CPU | 序列化的 code | ILP | 硬件调度 | <100 | 昂贵复杂 | 容易
GPU | 很多独立的 task | 线程及数据并行| 软件调度 | > 1000 | 简单便宜 | 困难
FPGA | 信号处理/神经网络/... 
VPU | 神经网络


### CPU ILP - `instruction-level parallelism`

- **Simple CPU Model**
  - **Fetch** – get the next instruction from memory
  - **Decode** – figure out what to do & read inputs
  - **Execute** – perform the necessary operations
  - **Commit** – write the results back to registers / memory
- **Pipelining**
  - 𝑁-stage pipeline gives up to 𝑁 × speedup
- **Data hazards:** 并行需要是独立的任务, 而许多指令之间并不独立(寄存器读写依赖)
  - **Forwarding data:** CPU在一个时钟周期内，把一个单元的输出值内容拷贝到另一个单元的输入值中
  - Forwarding is expensive in deep pipelines
- **Pipeline Flushes:** Fetch 到错误的指令，需要重新 Fetch 新的指令
  - Pipeline flushes are expensive in deep pipelines
- **Speculation:** CPU 猜测下一条要执行的指令
- **Dataflow:** 根据寄存器依赖并行执行
  - Critical path limits maximum performance
- **Out-Of-Order(OoO):** 乱序执行
- **Structural hazard**: 浮点数/整数/Memory 特殊硬件资源有限
- **结论:** 
  - ILP & Pipeline 扩展性不好/动态调度 & OoO代价比较高
  - Multicore 更 Efficient


![InkedFoxitReader_BXqXJmKJV8_LI](https://user-images.githubusercontent.com/2216970/134797100-9067690d-c506-4d52-a52b-1b2a8e996499.jpg) | Simple CPU Model
-- | --
![Inkedchrome_k49UtilsYB_LI](https://user-images.githubusercontent.com/2216970/134641857-12563821-6c02-4628-986e-d656c8f76b82.jpg) | Pipelining<br> 4X Speedup
![Inkedchrome_lKvXLJsrqG_LI](https://user-images.githubusercontent.com/2216970/134646854-ac0014f9-d3e9-4263-a6a2-a0c652f192b3.jpg) | **Data hazards** 当后一条指令需要用到前一条指令的寄存器时会填充 `NOP` 指令, 以等到前一条指令 `commit` <br> **解决方案**: Forwarding data(部分解决)
![InkedFoxitReader_VtCwFCBeQv_LI](https://user-images.githubusercontent.com/2216970/134799251-a9966841-0923-4adf-a5e7-5cfa216cd237.jpg) | Fetch 到错误的指令, 需要重新 Fetch
![image](https://user-images.githubusercontent.com/2216970/135018839-ab2c87e6-3183-435d-ae35-b14d0926b037.png) | Dataflow
![image](https://user-images.githubusercontent.com/2216970/135019570-42f01b5a-b3e9-4319-85ac-6a8848183d60.png) | OoO
![InkedFoxitReader_lUNIOkZCSc_LI](https://user-images.githubusercontent.com/2216970/135020663-6b36341d-bc37-4710-ae94-2a324e7605b5.jpg) | OoO 
![InkedFoxitReader_K5l8eERM5G_LI](https://user-images.githubusercontent.com/2216970/135027900-51413562-821e-4735-83a7-a62ad350430b.jpg) | Structural Hazards



