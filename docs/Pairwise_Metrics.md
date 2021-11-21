---
Title | Pairwise Metrics
-- | --
Create Date | `2021-11-21T16:27:48Z`
Update Date | `2021-11-21T16:27:48Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/139)

---
## Reference
- [Pairwise metrics - scikit-learn](https://scikit-learn.org/stable/modules/metrics.html#pairwise-metrics-affinities-and-kernels)


## Brief

Pairwise Metrics | Formula | Description
-- | -- | --
Cosine similarity | $k(x, y) = \frac{x y^\top}{\|x\| \|y\|}$
Linear kernel | $k(x, y) = x^\top y$
Polynomial kernel | $k(x, y) = x^\top y$
Sigmoid kernel | $k(x, y) = (\gamma x^\top y +c_0)^d$
RBF kernel | $k(x, y) = \exp( -\gamma \| x-y \|^2)$
Laplacian kernel | $k(x, y) = \exp( -\gamma \| x-y \|_1)$
Chi-squared kernel | $k(x, y) = \exp \left (-\gamma \sum_i \frac{(x[i] - y[i]) ^ 2}{x[i] + y[i]} \right )$

