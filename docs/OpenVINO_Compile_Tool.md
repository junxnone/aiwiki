---
Title | OpenVINO Compile Tool
-- | --
Create Date | `2021-01-25T10:07:40Z`
Update Date | `2022-01-19T08:40:38Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/183)

---
## Reference
- [Compile Tool](https://docs.openvinotoolkit.org/latest/openvino_inference_engine_tools_compile_tool_README.html)


## Brief
- Convert xml to blob format
```
compile_tool -m model.xml -d MYRIAD -il NCHW
```
```
Inference Engine:
        API version ............ 2.1
        Build .................. 2021.1.0-1237-bece22ac675-releases/2021/1
        Description ....... API
[Warning][VPU][Config] Deprecated option was used : VPU_MYRIAD_PLATFORM
Done. LoadNetwork time elapsed: 7202 ms
```
```
model.blob
```
> ??     `-il                          <value>     Optional. Specifies layout for all input layers of the network.`

