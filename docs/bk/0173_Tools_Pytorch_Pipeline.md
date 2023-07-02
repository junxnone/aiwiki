-----

| Title         | Tools Pytorch Pipeline                                |
| ------------- | ----------------------------------------------------- |
| Created @     | `2020-08-19T03:16:38Z`                                |
| Last Modify @ | `2022-12-25T04:08:46Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/173) |

-----

## Reference

  - [PyTorch中在反向传播前为什么要手动将梯度清零？](https://www.zhihu.com/question/303070254/answer/573037166)
  - [Gradient
    accumulation](https://github.com/pytorch/pytorch/blob/d927aee312fa95b7803cb976fee9525923ca9ad6/docs/source/notes/amp_examples.rst#gradient-accumulation)

## Brief

| Mode           | Function                          | Description              |
| -------------- | --------------------------------- | ------------------------ |
| **Training**   |                                   |                          |
| ...            | outputs = model(images)           | 输入图像和标签，通过infer计算得到预测值   |
| ...            | loss = criterion(outputs, target) | 计算损失函数                   |
| ...            | optimizer.zero\_grad()            | 清空过往梯度                   |
| ...            | loss.backward()                   | 反向传播，计算当前梯度              |
| ...            | optimizer.step()                  | 根据梯度更新网络参数               |
| ...            | scheduler.step()                  | Learning Rate Scheduler  |
| **Validation** |                                   |                          |
| ...            | `with torch.no_grad()`            | Validation Mode          |
| ...            | outputs = model(images)           | 输入测试图像和标签，通过infer计算得到预测值 |
| ...            | loss = criterion(outputs, target) | 计算损失函数                   |
