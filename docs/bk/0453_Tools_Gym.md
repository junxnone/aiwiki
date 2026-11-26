-----

| Title     | Tools Gym                                             |
| --------- | ----------------------------------------------------- |
| Created @ | `2023-10-30T10:03:49Z`                                |
| Updated @ | `2026-11-26T08:07:36Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/453) |

-----

# Gym -\> Gymnasium

Gym 是 RL 环境的统一接口库：把「环境」抽象成 `reset` / `step`，让算法与环境解耦。所属背景见 [RL
Tools](https://github.com/junxnone/aiwiki/issues/454)，任务类型见 [RL
Tasks](https://github.com/junxnone/aiwiki/issues/457)。

## 演进

  - `Gym (OpenAI)` =\> `Gymnasium (Farama Foundation)` `@2022.10`：OpenAI
    停止维护后由 Farama 基金会接手，API 在 0.26 起有变化
  - \=\> `IsaacGym` - NVIDIA：GPU 上大规模并行的仿真环境

## 接口

``` mermaid
flowchart LR
    A[Agent 智能体] -- action --> E[Env 环境]
    E -- observation reward terminated truncated --> A
```

图中：

  - 智能体向环境发送 `action`，环境返回新的 `observation`、`reward`，并用
    `terminated`（任务自然结束）和 `truncated`（超时截断）标志回合是否结束
  - 关键结论：只要环境实现这一接口，任意算法就能直接训练，不需要知道物理细节

<!-- end list -->

``` python
import gymnasium as gym

env = gym.make("CartPole-v1")
obs, info = env.reset(seed=0)
for _ in range(1000):
    action = env.action_space.sample()
    obs, reward, terminated, truncated, info = env.step(action)
    if terminated or truncated:
        obs, info = env.reset()
env.close()
```

其中：

  - `gym.make`：按名字创建环境；`reset`：初始化回合，返回初始观测
  - `step`：执行动作，返回五元组（Gymnasium 与旧 Gym 的主要区别：旧版只有 `done`，新版拆成
    `terminated` 和 `truncated`）
  - `action_space` / `observation_space`：声明动作与观测的类型和范围（`Discrete`、`Box`
    等）

## 包含内容

  - **Classic Control**: 经典控制任务，主要是基于现实世界的问题
      - Acrobot
      - CartPole
      - Mountain Car
      - Continuous Mountain Car
      - Pendulum
  - Box2D
      - Bipedal Walker
      - Car Racing
      - Lunar Lander
  - Toy Text
  - MuJoCo
  - Atari
  - ...

## 向量化环境

为提高采样效率，可同时运行多个环境实例（`gym.vector`），一次 `step` 返回 $N$ 个环境的批量结果，与 A2C 的并行
Worker 思想一致（见 [RL A2C](https://github.com/junxnone/aiwiki/issues/460)）。

## Reference

  - [gym - OpenAI](https://github.com/openai/gym)
    \[[docs](https://www.gymlibrary.dev/content/vectorising/#vectorized-environments)\]
  - [Gymnasium - Farama
    Foundation](https://github.com/Farama-Foundation/Gymnasium)
    \[[docs](https://gymnasium.farama.org/)\]
