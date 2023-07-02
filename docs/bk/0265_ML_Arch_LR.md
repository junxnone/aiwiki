-----

| Title     | ML Arch LR                                            |
| --------- | ----------------------------------------------------- |
| Created @ | `2019-12-05T09:03:55Z`                                |
| Updated @ | `2023-02-02T08:54:16Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/265) |

-----

# Learning Rate 学习率

## Reference

  - [网络学习率变化策略](https://www.jianshu.com/p/67232264ffbd)
  - [如何选择最适合你的学习率变更策略](https://www.jianshu.com/p/1f943de39582)

## Brief

  - [Cyclical Learning Rate](/Cyclical_Learning_Rate)
  - [One Cycle Policy](/One_Cycle_Policy)
  - [LRFinder](/LRFinder)

## Learning Rate Policy

| LR Policy Name | Formula                                                            | Figure                                                       | Description                        |
| -------------- | ------------------------------------------------------------------ | ------------------------------------------------------------ | ---------------------------------- |
| step           | `new_lr = base_lr * gamma ^ iter`                                  | ![image](media/6f270f0bcb4d51ed738b1c7516634ce92a5f4f54.png) |                                    |
| multistep      | \`\`                                                               | ![image](media/d71f5e8b22a175eab9ee8490750d4dee140193ab.png) | 采用非均匀降低策略，指定降低的step间隔，每次降低为原来的一定倍数 |
| fixed          | `new_lr = base_lr`                                                 | ![image](media/8757841f3979a708d7ac5d9e85a979e75b97eab2.png) |                                    |
| exp            | \`\`                                                               | ![image](media/f461819ff73533bbbbcfb6afd2053d7d939a5cc8.png) |                                    |
| inv            | `new_lr = base_lr * ( 1 +gamma * iter ) ^ (-power)`                | ![image](media/45d511f8b815d5be1b6a3ba1a0cce75669fa7601.png) |                                    |
| poly           | `new_lr = base_lr * ( 1 - iter / max_iter ) ^ power`               | ![image](media/edccad6fd47056d59e2ee175d5b832d5b64fc73b.png) |                                    |
| signoid        | `new_lr = base_lr * ( 1 / ( 1 +exp(-gamma * ( iter - stepsize))))` | ![image](media/87ab41b052131c21c52f64d81734a8ce520c935a.png) |                                    |
