-----

| Title         | Tools Pytorch Optimizer                               |
| ------------- | ----------------------------------------------------- |
| Created @     | `2020-01-06T09:22:23Z`                                |
| Last Modify @ | `2022-12-25T04:08:16Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/174) |

-----

## Reference

  - [module-torch.optim](https://pytorch.org/docs/stable/optim.html#module-torch.optim)
  - [torch\_optim\_lr\_scheduler.ipynb](https://github.com/junxnone/examples/blob/master/pytorch/torch_optim_lr_scheduler.ipynb)
  - [Parameter optimization in neural
    networks](https://www.deeplearning.ai/ai-notes/optimization/)

## Brief

  - Optimezer - `torch.optim`
  - Learning Rate Scheduler

## Optimizer

| Optimizer  | Description |
| ---------- | ----------- |
| Adadelta   |             |
| Adagrad    |             |
| Adam       |             |
| AdamW      |             |
| SparseAdam |             |
| Adamax     |             |
| ASGD       |             |
| LBFGS      |             |
| RMSprop    |             |
| Rprop      |             |
| SGD        |             |

## Learning Rate Scheduler

| Learning Rate Scheduler     | Description                                                  |
| --------------------------- | ------------------------------------------------------------ |
| StepLR                      | ![image](media/12ecd4aea5e83b155e7c5803102c2982047540a6.png) |
| MultiStepLR                 | ![image](media/94c00bb20a6b77bfd55984a3145d9cb9bc481c84.png) |
| ExponentialLR               | ![image](media/f478f3b05b0097cbf333c1330a81655ec8f15163.png) |
| CyclicLR                    | ![image](media/ae85342b36d18fdfcbc3ba418d29ed5ba35b78aa.png) |
| OneCycleLR                  | ![image](media/750aa913ac760874f3209c984c2ab3a14a86cdd7.png) |
| CosineAnnealingLR           | ![image](media/bb5b6d9ddc889795b23de0fa5d22973bcf282c9b.png) |
| CosineAnnealingWarmRestarts | ![image](media/12b1f0328673c3209660bc0754f49728929dca85.png) |
| MultiplicativeLR            | ![image](media/087f814e7838d28f4fbfda3aee7c5b853b46a3e8.png) |
| LambdaLR                    |                                                              |
| ReduceLROnPlateau           | 当 metrics 不再提升时减少学习率                                         |

## Tips

CIFAR10 example 用 GPU 的话需要在 `net.to(device)` 后重新定义一次 `optimizer`

    net = net.to(device)
    optimizer = optim.SGD(net.parameters(), lr=0.0001, momentum=0.9)
    for epoch in range(2):  # loop over the dataset multiple times
    
        running_loss = 0.0
        for i, data in enumerate(trainloader, 0):
            # get the inputs
            inputs, labels = data[0].to(device), data[1].to(device)
    
            # zero the parameter gradients
            optimizer.zero_grad()
    
            # forward + backward + optimize
            outputs = net(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
    
            # print statistics
            running_loss += loss.item()
            if i % 2000 == 1999:    # print every 2000 mini-batches
                print('[%d, %5d] loss: %.3f' %
                      (epoch + 1, i + 1, running_loss / 2000))
                running_loss = 0.0

  - [torch.optim](https://pytorch.org/docs/stable/optim.html) 也提到了需要把
    optimizer 定义放在 `.cuda()` 之后
