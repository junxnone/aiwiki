---
Title | RL Robot CSpace
-- | --
Created @ | `2026-11-25T16:30:11Z`
Updated @| `2026-11-25T16:30:11Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/794)

---
# CSpace

位形空间（Configuration Space）中的运动规划：把机器人缩成一个点，在自由空间里为它找一条无碰撞的路径。所属总览见 [RL Robot](https://github.com/junxnone/aiwiki/issues/458)，运动学见 [RL Robot Kinematics](https://github.com/junxnone/aiwiki/issues/768)。

## 从工作空间到位形空间

```mermaid
flowchart LR
    W[工作空间: 机器人有形状, 障碍物有形状] -- 映射 --> C[位形空间: 机器人是一个点, 障碍物膨胀为 C-obstacle]
    C --> P[在自由空间 C_free 中规划路径]
    P --> E[路径映射回关节轨迹并执行]
```

图中：

- 工作空间：机器人和障碍物所在的真实空间
- 位形空间：每个点代表机器人的一个完整位形 $q$
- 箭头：自左向右表示规划流程；关键结论是「带形状的机器人避障」被转化为「一个点避障」

位形空间中的碰撞集与自由空间：

$$
\mathcal{C}_{obs}=\{\,q\in\mathcal{C}\mid \mathcal{A}(q)\cap\mathcal{O}\neq\varnothing\,\},\qquad \mathcal{C}_{free}=\mathcal{C}\setminus\mathcal{C}_{obs}
$$

其中：

- $\mathcal{C}$：位形空间，维数等于自由度数
- $\mathcal{A}(q)$：机器人在位形 $q$ 下占据的空间区域
- $\mathcal{O}$：工作空间中障碍物占据的区域
- $\mathcal{C}_{obs}$：使机器人与障碍物相交的位形集合（C-obstacle）
- $\mathcal{C}_{free}$：无碰撞位形集合；规划器只在其中搜索

例：平面圆盘机器人（半径 $r$）与障碍物，C-obstacle 就是把障碍物向外膨胀 $r$（Minkowski 和）。对于多关节臂，C-obstacle 形状复杂，几乎无法显式求出，所以实践中用碰撞检测函数做「黑盒」查询。

## 规划问题定义

给定起点 $q_{start}$、终点 $q_{goal}$，求连续路径：

$$
\tau:[0,1]\to\mathcal{C}_{free},\quad \tau(0)=q_{start},\ \tau(1)=q_{goal}
$$

其中：

- $\tau$：路径，$s\in[0,1]$ 为路径参数（还不是时间）
- 路径只描述几何，不含速度；带时间的称为轨迹，需要再做时间参数化
- 评价：路径长度、平滑度、与障碍物的安全间距、规划耗时

## 经典方法分类

| 类别 | 代表 | 特点 | 局限 |
| --- | --- | --- | --- |
| 栅格搜索 | A*、Dijkstra | 完备、最优（分辨率内） | 维数灾难，高维不可行 |
| 采样规划 | PRM、RRT、RRT* | 适合高维，概率完备 | 路径不光滑，耗时有随机性 |
| 人工势场 | 引力 + 斥力 | 计算快，可实时 | 局部极小值 |
| 轨迹优化 | CHOMP、TrajOpt | 路径光滑，可加动力学约束 | 依赖初值，非凸 |

表中：

- **完备**：有解必能找到，无解能判定；**概率完备**：只要采样足够多，找到解的概率趋于 1
- PRM：Probabilistic Roadmap；RRT：Rapidly-exploring Random Tree；RRT*：渐近最优的 RRT
- 对比结论：低维用栅格搜索，机械臂等高维用采样规划，需要光滑与动力学约束用轨迹优化

## 采样规划

### PRM（多次查询）

1. 学习阶段：在 $\mathcal{C}$ 中随机采样，保留 $\mathcal{C}_{free}$ 中的点作为节点
2. 近邻连边：对每个节点，与其邻近节点用直线连接，若线段无碰撞则加边，得到路线图
3. 查询阶段：把 $q_{start}$、$q_{goal}$ 接入图，用图搜索（如 A*）求路径

适合障碍物固定、需要反复规划的场景。

### RRT（单次查询）

1. 从 $q_{start}$ 出发建树，随机采样 $q_{rand}$
2. 找树中最近节点 $q_{near}$，朝 $q_{rand}$ 延伸固定步长 $\delta$ 得到 $q_{new}$
3. 若 $q_{near}\to q_{new}$ 无碰撞，则加入树
4. 当 $q_{new}$ 足够接近 $q_{goal}$ 时结束

延伸公式：

$$
q_{new}=q_{near}+\delta\,\frac{q_{rand}-q_{near}}{\lVert q_{rand}-q_{near}\rVert}
$$

其中：

- $q_{rand}$：在位形空间随机采样的点（常以小概率直接取 $q_{goal}$，称目标偏置）
- $q_{near}$：树中离 $q_{rand}$ 最近的节点
- $\delta$：延伸步长，越小越精细但越慢
- $q_{new}$：新节点；RRT 倾向探索未覆盖区域（Voronoi 偏置）
- RRT\*：新增「重新选父节点」和「重连」，路径渐近最优

## 人工势场法

$$
U(q)=U_{att}(q)+U_{rep}(q),\qquad F(q)=-\nabla U(q)
$$

其中：

- $U_{att}$：引力势，如 $\tfrac12 k_a\lVert q-q_{goal}\rVert^2$，把机器人拉向目标
- $U_{rep}$：斥力势，靠近障碍物时趋于无穷，把机器人推开
- $F$：合力，机器人沿 $F$ 方向移动
- 局限：势场可能存在非目标的局部极小值，机器人会卡住，常配合随机扰动或导航函数

## 实际工程

- 碰撞检测：通常是规划的耗时瓶颈，常用库有 FCL、Bullet
- 常用框架：OMPL（规划算法库）、MoveIt（机械臂规划，集成 OMPL）
- 路径后处理：捷径剪枝（shortcut）、样条平滑，再做时间参数化

## Reference

- [入门机器人需要的基础知识](https://zhuanlan.zhihu.com/p/655770237)

