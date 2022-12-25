---
Title | Math RANSAC
-- | --
Created @ | `2022-03-07T02:43:11Z`
Last Modify @| `2022-12-25T03:32:36Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/293)

---
## Reference
- [Random Sample consensus](http://www.ai.sri.com/pubs/files/836.pdf)
- [demo](http://www.visual-experiments.com/demo/ransac.js/)


## Brief
- RANSAC - `RANdom SAmple Consensus` - 随机抽样一致
- 假设：数据由正常数据(inliers)和噪声(outliers)组成
  - **随机性** 根据正确数据出现概率随机选取抽样数据 
  - **假设性**  假设选取的数据都是正确数据
- **应用** 直线拟合/平面拟合/图像点云配准

## 直线拟合

带噪声的数据 | RANSAC 拟合
-- | --
![image](https://user-images.githubusercontent.com/2216970/156961144-fccbc23c-d1c2-4404-a2b2-62ec94cdf064.png) | ![image](https://user-images.githubusercontent.com/2216970/156961163-507c657c-a48a-4786-a146-54a56b3d4aa6.png)

### Steps
- 随机采样两个点
- 拟合模型
- 计算 Score


Steps | Figure
-- | --
① Sample | <img width=300px src="https://user-images.githubusercontent.com/2216970/156963574-ec31b4cc-7a82-4892-9fb6-ea715c8754dc.png">
② Solve |  <img width=300px src="https://user-images.githubusercontent.com/2216970/156963619-1d37b2eb-354e-4a81-bcd4-d09f02ba94ad.png">
③ Score | <img width=300px src="https://user-images.githubusercontent.com/2216970/156963659-8ffee866-4b94-45eb-b575-82f8f0acca59.png">
Repeat ①②③ | <img width=300px src="https://user-images.githubusercontent.com/2216970/156963699-643baaa2-130b-4f8f-908c-04ae52df6a45.png">
demo | <img width=300px src="https://user-images.githubusercontent.com/2216970/156964811-b9a3bcc0-d75a-44f0-934b-46b14234b780.gif">


