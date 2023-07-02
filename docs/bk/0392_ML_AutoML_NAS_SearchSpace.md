-----

| Title     | ML AutoML NAS SearchSpace                             |
| --------- | ----------------------------------------------------- |
| Created @ | `2020-07-17T06:25:15Z`                                |
| Updated @ | `2023-03-25T14:50:08Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/392) |

-----

# Search Space

| Search Space     | Description                                          |
| ---------------- | ---------------------------------------------------- |
| Entire Structure | 完整的网络结构，每层的结构从 search space 中选择，`skip-connection` 可选 |
| Cell-Based       | 先搜索表现好的 `Cell`, 再堆叠 `Cell`                           |
| Hierarchical 分层  | 增加 `Cell` 的多样性                                       |
| Morphism Based   | 在深度宽度等可变操作上扩展现有模型                                    |

## Entire & Cell

| Search Space | Entire-Structured                                            | Cell-Based                                                   |
| ------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Figure       | ![image](media/7c90a8b972d100a6c3a2cc302487323fc75820d9.png) | ![image](media/abcd5de73a63744d082664d3583a1b55eab7546e.png) |
| 优缺点          | 耗时                                                           | 特征图的大小和通道数变化固定                                               |

## Hierarchical & Morphism

| Search Space | Hierarchical (Progressive?)                                                                                                   | Morphism based                                               |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Figure       | ![image](media/5111e4a441b87d2d924505108dd5183914c087ae.png) <br>![image](media/71ca981c274ff700a9ce6cba77411356750e84c4.png) | ![image](media/006d31435d4b1ff2db4c33c89609cb5a7cd8556e.png) |

## chain & multi-branch

| chain-structured neural networks                             | multi-branch networks                                        |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| ![image](media/b3ac9fa8b8bc0a5b12639c72c6a6a7c787037c40.png) | ![image](media/03b6551e7ed58a833fa12342ae3f415aba5ce165.png) |
