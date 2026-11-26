-----

| Title     | Tools OV Security                                     |
| --------- | ----------------------------------------------------- |
| Created @ | `2021-08-10T15:08:09Z`                                |
| Updated @ | `2026-11-26T10:24:07Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/176) |

-----

# Security

OpenVINO 的安全相关方案：一是保护 Workbench 等服务的访问，二是保护模型本身不被未授权使用（模型加密与许可）。

  - DL Workbench
      - 限制只使用 127.0.0.1:port 方式访问
      - 使用 `authentication tokens` 访问
      - TLS 加密 `authentication tokens`
  - Edge Devices
      - Encrypted Model - OpenSSL/...
      - Intel®SGX -`Software Guard Extensions`
  - Security Add-on
      -   - OpenVINO Model Server
    
      - Compoinents
        
          - Tool - 导入 model/产生 License
          - License Service - Verify License
          - Runtime - Client
    
      - KVM - `isolated environment`

## Security Add-on

  - Model Developer 分发 Model 和 License
  - Independent Software Vendor 提供 License 验证服务
  - User 获取 加密过的 Model 和 License 后 在 OpenVINO Model Server 中 Deploy
    Model

### Install & Setup

  - 1 验证 TPM 可用性 (dTPM or fTPM)
  - 2 hardware virtualization - `kvm-on`
  - 3 Install KVM & QEMU(\>=2.12.0)
  - 4 Install libtpm/swtpm and Setup ENV
  - 5 Install tpm2-tss/tpm2-abmrd/tpm2-tools/Docker
  - 6 set proxy
  - 7 setup Network
      - Global IP
      - Host-only
  - 8 Create Guest VM `ovsa_isv`- `Model Developer` & `Independent
    Software Vendor`
  - 9 install additional required software on `ovsa_isv`
  - 10 配置 TPM
  - 11 Create Guest VM `ovsa_runtime` - `User`
  - 12 配置 OVSA
  - 13 Start License Server
  - 14 配置 OVSA\_RUNTIME

## 角色与流程

``` mermaid
flowchart LR
    MD[Model Developer] -- 加密的模型 + License --> U[User]
    ISV[Independent Software Vendor] -- License 验证服务 --> U
    U --> MS[OpenVINO Model Server 部署模型]
```

图中：

  - **Model Developer** 把模型加密并生成许可（License）后分发
  - **Independent Software Vendor（ISV）** 提供 License 验证服务
  - **User** 拿到加密模型和 License，在 OpenVINO Model Server 中部署，运行时向 License
    服务验证
  - 关键结论：模型以密文形式分发，只有持有有效 License 的运行环境才能解密并使用

| 保护对象            | 措施                           |
| --------------- | ---------------------------- |
| DL Workbench    | 只监听本机端口，使用认证令牌并用 TLS 加密      |
| 边缘设备上的模型        | 模型加密（OpenSSL 等）、Intel SGX 隔离 |
| Security Add-on | 用 KVM 虚拟机做隔离环境，结合 TPM 保存密钥   |

表中：对比结论：从「访问控制」到「模型加密」再到「硬件隔离」，保护强度逐级提高。

## Reference

  - [OpenVINO™ Security
    Add-on](https://docs.openvinotoolkit.org/latest/ovsa_get_started.html)
