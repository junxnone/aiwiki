---
Title | Tools TF
-- | --
Created @ | `2021-11-22T08:48:38Z`
Updated @| `2026-11-26T09:54:46Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/140)

---
# Tensorflow

TensorFlow 是 Google 开源的深度学习框架。常用的高层接口是 `tf.keras`：用几行代码搭建、训练和保存模型。

- [Tensorflow Datasets](https://github.com/junxnone/aiwiki/issues/313)
- Tensorflow Keras API

## 最小示例

```python
import tensorflow as tf

model = tf.keras.Sequential([
    tf.keras.layers.Flatten(input_shape=(28, 28)),
    tf.keras.layers.Dense(128, activation='relu'),
    tf.keras.layers.Dense(10),
])
model.compile(optimizer='adam',
              loss=tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True),
              metrics=['accuracy'])
model.fit(x_train, y_train, epochs=5)
model.save('saved_model_dir')        # 保存为 SavedModel
```

其中：

- `Sequential`：按顺序堆叠层；`Dense`：全连接层；`compile`：配置优化器、损失、评价指标
- `fit`：训练；`from_logits=True` 表示模型输出未经 softmax 的原始得分
- `save`：保存模型，可用于 Serving、TF Lite、转换成 ONNX / OpenVINO

## 生态

| 组件 | 作用 |
| --- | --- |
| `tf.keras` | 高层建模与训练接口 |
| `tf.data` / TFDS | 数据输入管道与数据集（见 [Tensorflow Datasets](https://github.com/junxnone/aiwiki/issues/313)） |
| TensorFlow Lite | 移动端 / 嵌入式推理 |
| TensorFlow.js | 浏览器中推理 |
| TensorFlow Serving | 服务端部署 |

表中：对比结论：训练用 `tf.keras`，部署按平台选择 Lite、JS 或 Serving；转换到 OpenVINO 的方法见 [OpenVINO Model Optimizer](https://github.com/junxnone/aiwiki/issues/181)。

## Reference
- [tf.keras API](https://www.tensorflow.org/api_docs/python/tf/keras)

