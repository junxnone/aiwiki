---
Title | RL Robot Simulation
-- | --
Created @ | `2026-11-25T16:33:43Z`
Updated @| `2026-11-25T16:34:13Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/797)

---
# Simulation

机器人仿真：用物理引擎在计算机里模拟机器人与环境，是强化学习训练和算法验证的基础设施。所属总览见 [RL Robot](https://github.com/junxnone/aiwiki/issues/458)，动力学见 [RL Robot Dynamics](https://github.com/junxnone/aiwiki/issues/795)。

## 为什么需要仿真

- 安全：真机训练易损坏，仿真中摔倒无成本
- 速度：可比实时快几十到几千倍，并行成百上千个环境
- 可复现：状态可任意重置、种子固定
- 代价：仿真与现实存在差距（见 [RL Robot Sim2Real](https://github.com/junxnone/aiwiki/issues/798)）

## 仿真流程

```mermaid
flowchart LR
    M[机器人模型 URDF / MJCF] --> W[加载场景]
    W --> S[物理引擎 step]
    A[动作 / 力矩] --> S
    S --> O[观测 状态 接触]
    O --> P[策略或控制器]
    P --> A
```

图中：

- 模型文件描述连杆、关节、惯量、碰撞体；场景加入地面、障碍物、物体
- 物理引擎每步 `step` 根据动作推进状态，输出观测（关节状态、接触力、传感器）
- 控制器或强化学习策略读取观测并产生下一步动作，形成闭环
- 关键结论：仿真器就是一个「动力学方程 + 接触求解器」的数值积分器

## 物理引擎的核心

前向动力学积分（见 Dynamics）：

$$
\ddot{q}=M(q)^{-1}\left(\tau - C(q,\dot{q})\dot{q}-g(q)+J_c^{\top}\lambda\right),\qquad
\dot{q}_{t+1}=\dot{q}_t+\Delta t\,\ddot{q},\quad q_{t+1}=q_t+\Delta t\,\dot{q}_{t+1}
$$

其中：

- $M,C,g,\tau$：质量矩阵、科氏项、重力项、关节力矩，含义见 Dynamics
- $J_c$：接触点雅可比；$\lambda$：接触力（由接触求解器得到）
- $\Delta t$：仿真时间步长，越小越精确但越慢；第二、三式为半隐式欧拉积分
- 接触求解：把摩擦锥和不穿透约束转成互补问题（LCP/NCP）或软约束求解，是引擎之间差异最大、也是仿真误差的主要来源

## 机器人描述格式

| 格式 | 常用于 | 特点 |
| --- | --- | --- |
| URDF | ROS、PyBullet、Isaac | XML，描述连杆、关节、惯量、视觉与碰撞体；不描述执行器与传感器细节 |
| MJCF | MuJoCo | XML，更灵活，可定义执行器、传感器、接触参数 |
| USD | Isaac Sim / Omniverse | 场景描述格式，支持材质与层级 |
| SDF | Gazebo | 描述整个世界，含光照与物理参数 |

表中：

- URDF：Unified Robot Description Format；MJCF：MuJoCo XML Format；USD：Universal Scene Description；SDF：Simulation Description Format
- 对比结论：机器人本体建模多用 URDF，MuJoCo 项目用 MJCF，GPU 大规模仿真用 USD

## 常见仿真器

| 仿真器 | 特点 | 适用 |
| --- | --- | --- |
| MuJoCo | 接触模型好、精度高、速度快，已开源；MJX / Warp 支持 GPU 加速 | 控制研究、RL 基准 |
| PyBullet | 易上手，Python 接口，CPU | 入门、原型 |
| Isaac Gym / Isaac Lab | GPU 上并行数千环境，端到端 GPU | 大规模 RL，足式机器人 |
| Gazebo | 与 ROS 集成好，传感器丰富 | 系统级仿真、导航 |
| Drake | 优化友好，可微，支持高精度接触 | 规划与控制研究 |

表中：

- **适用**：该仿真器最擅长的场景
- 选型：快速验证用 MuJoCo / PyBullet；需要数千并行环境用 Isaac Lab；需要 ROS 全栈用 Gazebo

## 强化学习中的并行仿真

$$
\text{吞吐量}\approx \frac{N_{env}}{t_{step}}\ (\text{步/秒})
$$

其中：

- $N_{env}$：同时运行的环境数量；GPU 仿真可达数千到数万
- $t_{step}$：并行批量推进一步的耗时
- 把物理计算与神经网络都放在 GPU 上，避免 CPU-GPU 数据搬运，是 Isaac Gym 等训练速度大幅提升的关键

## 选择与实践要点

- 时间步长：控制频率与仿真步长应成整数倍（如控制 50 Hz、物理 200 Hz）
- 模型质量：惯量、摩擦、关节限位、执行器模型要尽量准确
- 先做确定性复现，再加随机化
- 记录引擎版本与参数，不同版本接触行为可能不一致

## Reference

- [入门机器人需要的基础知识](https://zhuanlan.zhihu.com/p/655770237)

