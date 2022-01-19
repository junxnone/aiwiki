---
Title | OpenVINO Security
-- | --
Create Date | `2021-08-10T15:08:09Z`
Update Date | `2022-01-19T08:34:07Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/176)

---
## Reference
- [OpenVINO™ Security Add-on](https://docs.openvinotoolkit.org/latest/ovsa_get_started.html)


## Brief
- DL Workbench
  - 限制只使用 127.0.0.1:port 方式访问
  - 使用 `authentication tokens` 访问
  - TLS 加密 `authentication tokens` 
- Edge Devices
  - Encrypted Model - OpenSSL/...
  - Intel®SGX -`Software Guard Extensions`
- Security Add-on
  - + OpenVINO Model Server
  - Compoinents
    - Tool - 导入 model/产生 License
    - License Service - Verify License
    - Runtime - Client
  - KVM - `isolated environment`


## Security Add-on

- Model Developer 分发 Model 和 License
- Independent Software Vendor 提供 License 验证服务
- User 获取 加密过的 Model 和 License 后 在 OpenVINO Model Server 中 Deploy Model

### Install & Setup
- 1 验证 TPM 可用性 (dTPM or fTPM)
- 2 hardware virtualization - `kvm-on`
- 3 Install KVM & QEMU(>=2.12.0)
- 4 Install libtpm/swtpm and Setup ENV
- 5 Install tpm2-tss/tpm2-abmrd/tpm2-tools/Docker
- 6 set proxy
- 7 setup Network
  - Global IP
  - Host-only
- 8 Create Guest VM `ovsa_isv`- `Model Developer` & `Independent Software Vendor`
- 9 install additional required software on `ovsa_isv`
- 10 配置 TPM
- 11 Create Guest VM `ovsa_runtime` - `User`
- 12 配置 OVSA 
- 13 Start License Server
- 14 配置 OVSA_RUNTIME


