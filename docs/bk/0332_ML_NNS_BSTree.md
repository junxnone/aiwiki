-----

| Title     | ML NNS BSTree                                         |
| --------- | ----------------------------------------------------- |
| Created @ | `2021-05-24T06:49:28Z`                                |
| Updated @ | `2026-11-26T09:28:17Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/332) |

-----

# BSTree 二叉排序树

  - 二叉排序树/二叉查找树 - `Binary Sort Tree`/`Binary Search Tree`
  - **特性**(`左小右大`)
      - 每个节点**左**子树所有节都比此节点**小**
      - 每个节点**右**子树所有节都比此节点**大**
  - 对二叉排序树做**中序遍历**，得到的是从小到大的有序序列

<!-- end list -->

``` mermaid
flowchart TB
    N8((8)) --> N3((3))
    N8 --> N10((10))
    N3 --> N1((1))
    N3 --> N6((6))
    N10 --> N14((14))
```

图中：以 8 为根，左子树的 3、1、6 都小于 8，右子树的 10、14 都大于 8；每个子树内部同样满足左小右大。

## UseCase

### 插入节点

从根开始比较：小于当前节点走左子树，大于走右子树，直到找到空位插入。

### 查找节点

与插入的比较过程相同：相等则找到，否则向左或向右，走到空仍未找到则不存在。

``` python
class Node:
    def __init__(self, key):
        self.key, self.left, self.right = key, None, None

def insert(root, key):
    if root is None:
        return Node(key)
    if key < root.key:
        root.left = insert(root.left, key)
    elif key > root.key:
        root.right = insert(root.right, key)
    return root

def search(root, key):
    while root and root.key != key:
        root = root.left if key < root.key else root.right
    return root
```

### 删除节点

  - **删除节点为 `叶节点`**：直接删除
  - **删除节点为 `单孩子节点`**：用它的孩子顶替它的位置
  - **删除节点为
    `根节点`**（或有两个孩子的节点）：用它的中序后继（右子树最小的节点）或中序前驱（左子树最大的节点）的值替换，再删除那个后继/前驱节点

## 复杂度

| 操作 | 平均           | 最坏     |
| -- | ------------ | ------ |
| 查找 | $O(\\log n)$ | $O(n)$ |
| 插入 | $O(\\log n)$ | $O(n)$ |
| 删除 | $O(\\log n)$ | $O(n)$ |

表中：

  - $n$：节点数；操作耗时与树的高度 $h$ 成正比，平均 $h\\approx\\log n$
  - 最坏情况：按有序顺序插入会退化成一条链，$h=n$
  - 对比结论：为避免退化，实践中使用自平衡的变体，如 AVL 树和红黑树

## Reference

  - [算法08
    五大查找之：二叉排序树(BSTree)](https://www.cnblogs.com/nnngu/p/8294714.html)
