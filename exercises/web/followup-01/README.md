# 原生 JavaScript 活动搜索

需要 HTTP 静态服务器；不能双击 file: 后期待 fetch 正常。VS Code 打开此目录，终端 Windows 运行 `py -m http.server 8761 --bind 127.0.0.1`，macOS/Linux 用 `python3 -m http.server 8761 --bind 127.0.0.1`，访问 http://127.0.0.1:8761/ 。Ctrl+C 停止。

操作：点读取得到3条，关键词算法得到2条，Web分类得到1条；收藏与展开可使用键盘。相同地址刷新后再次读取，收藏仍在。选择空数据、404、坏JSON、错误结构分别观察反馈。DevTools Network Offline 后读取显示失败；请求8秒超时后允许重试。

故意向 Application / Local Storage 的 `club-followup-favorites-v1` 写 `{"broken":`，刷新后应保留原文、提示损坏且停止自动写入；可以先导出，再重建、撤销。字段变化只撤销旧条件提示，重新“应用条件”后更新列表；这与实时筛选不同。

边界：仅本地收藏，按origin隔离，刷新损失未持久化内存变更；不存用户密码、不提供报名/共享数据库。 JSON 夹具是教学数据，其中broken.json故意有语法错误，missing.json故意不存在。撤销快照仅当前页面一次重建有效，不跨刷新。完整讲解见 [阶段讲义](../../../docs/followups/web-01.md)。
