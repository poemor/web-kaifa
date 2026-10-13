# Web后续全栈阶段07–11教学与真实运行审核

本轮针对用户指出“后面只有清单、没有实质教学”的问题重写，不把原materials改成新教材。阶段07/08/09/10/11分别补充10/12/12/13/14个原知识点，共61项；每一项均有术语与因果、对应章节、实际源码、操作及预期/失败结果，逐项对应表放在各篇正文末尾，不以总字数或标题数量代替审核。

## 交付与知识点对应

| 阶段 | 完整讲义 | 独立源码起点 | 原知识点具体覆盖 |
| --- | --- | --- | --- |
| 07 全栈前端 | [web-07](followups/web-07.md) | [README](../exercises/web/followup-07/README.md) | React/Vue选择实际入口、Vite模块与构建、TS运行时校验、四组件、状态事件、hash/API路由、fetch取消/超时、双端校验、Network/断点、公开VITE配置 |
| 08 自己的API | [web-08](followups/web-08.md) | [README](../exercises/web/followup-08/README.md) | 请求链路、CRUD方法与部分PATCH、状态码、JSON格式/8KiB限制、Unicode输入、HTTP/业务/Store分层、I/O错误与Context、环境、CORS预检、统一错误、独立HTTP测试、具体API合同；另有真实Express/FastAPI可跑分支并说明合同差别 |
| 09 真实SQL | [web-09](followups/web-09.md) | [README](../exercises/web/followup-09/README.md) | 三表主外键、CRUD、未来排序分页、LEFT JOIN零报名/count区别、既有复合索引与EXPLAIN、UNIQUE/FK/CHECK、失败事务回滚、带版本迁移/旧数据、参数化、repository/连接池、SQLite/PG选择、逻辑备份恢复 |
| 10 安全身份 | [web-10](followups/web-10.md) | [README](../exercises/web/followup-10/README.md) | 认证/授权矩阵、成熟Argon2id哈希/盐、Cookie/过期/退出、服务器角色、A/B归属、严格输入、参数化SQL、textContent/CSP、CSRF+Origin、429与资源上限、HTTPS/秘密、requestId分类日志、依赖审计 |
| 11 交付运维 | [web-11](followups/web-11.md) | [README](../exercises/web/followup-11/README.md) | 四层联调、测试矩阵、真实HTTP正常/失败、E2E五步、独立SQL库/schema、环境区分、三层部署图、DNS/TLS/Caddy入口、健康/监控、备份恢复脚本、兼容迁移与安全回滚、真实CI命令/故意失败、交接文档、容量/流量/连接/哈希预算 |

各阶段独立目录包含起点所需完整源码，不要求拼未定义authenticate/req.user/handler。正文完整文件围栏经逐字对照源文件：07 15文件、08 12文件、09 13文件、10 15文件、11 30文件。Go sum与npm lock随源码提供，手工重建步骤说明生成方式。

## 实际执行的证据

环境：Windows、Node26.7、Edge/Playwright、独立Go1.26.9工具链，隔离临时PostgreSQL18.6（仅本机QA、不安装用户系统服务、不用用户业务库）。数据库实际测试用followup_09/09_test、followup_10、followup_11/11_test和新restore测试库；本机QA连接机制不是教程用户的认证方案，正文要求用户自己的非超级用户与密码。

- 07在自己的模块执行npm ci/test/typecheck/build。真实HTTP mock正常创建/详情、empty、500、错误shape、6秒slow→5秒客户端取消均通过；失败不伪造数据成功。npm官方审计0告警。
- 08 Go fmt/vet与三项测试通过；CRUD创建→部分PATCH→读取→删除→404、空/数组/未知字段/非法ID/分页/多JSON/超体积、精确来源CORS、内部500不泄漏信息均有断言。另真实启动Express5.3做HTTP CRUD/部分PATCH；FastAPI0.143使用独立venv/TestClient跑CRUD/400/422/404通过，说明它与主例合同不同。
- 09真实数据库001/002迁移、practice.sql插入/查询/未来排序、LEFT JOIN报名1/0/0、UPDATE/ROLLBACK、EXPLAIN与索引执行通过。TestRealDatabase真实运行：带引号参数、重复值23505后事务回滚计数0、外键拒绝；Go进程重启后之前创建id4仍可读取。实际浏览器新增后DB可读、375px无横溢出。
- 10安全会话三项测试通过：匿名401、成员管理员操作403、CSRF403、伪memberId400、报名201/重复409、B删A404且A仍能取消204、注销旧Cookie401、时钟推进过期401、第六次429、同密码不同盐和正确/错误验证。两次哈希同时执行上限与会话/桶容量有明确边界。
- 11所有五项Go测试在真实_test库通过，包括SQL账户/报名归属、迁移、失败事务、会话/权限/限速。Playwright真实完整注册→登录→报名→键盘取消→退出通过，并断言取消后焦点留在常驻重新获取。管理员浏览器真实创建含标签标题按文字输出，无img执行；375px无横溢出。
- 11 pg_dump custom文件→新库pg_restore实际通过；本次有4活动、3成员、1报名，不只恢复空关系。恢复库JOIN核对报名指向原活动/成员，迁移版本3；原库未覆盖。备份产物仅.qa，不提交。
- 故意加入“匿名POST期望201”的错误HTTP断言，实际测试FAIL（收到401），移除错误实验后测试通过。证明本地真实测试能拒绝错误预期，不称远程CI已经执行。
- Compose开发/production配置用quiet解析通过。init-app-role为应用建立非超级用户，owner仅迁移/备份，DB不公开端口，18版本volume路径已按官方说明，生产覆盖去掉app端口。

## 实跑中发现并修复的问题

1. 表单按钮id=reset遮蔽原生form.reset方法，服务端POST已201但页面未清空/刷新；统一改cancel-edit，再用真实浏览器验证新增/编辑与状态。
2. React成功异步分支未确认已取消，补signal.aborted条件，与失败分支一致，防旧请求改新页面。
3. 重建报名/活动列表会把键盘焦点丢到body；成功操作移到常驻refresh，失败保留原控件，E2E按Enter并检查焦点。
4. 原固定“详诊留服务端”日志实际上缺诊断；补X-Request-ID和request_id/错误类别/SQLSTATE/类型，仍不打印可能含秘密的错误字符串。
5. 全栈安全模块与系统Go1.26.2一起扫描时发现16项标准库已修复问题；核验官方受支持补丁后，新08–11模块要求至少1.26.9，Docker固定1.26.9，独立工具链复验。govulncheck结果为0个被代码调用的漏洞，仍有1项未被调用的module层提醒；不把扫描当完整安全证明，也未覆盖系统Go安装。

## 明确没有冒称验收的部分

当前审核机Dockerdaemon未运行，故只解析Compose配置，未宣称镜像构建/容器运行完成。云主机购买、DNS/公网TLS、远程GitHub CI、本机数据库系统服务重启未执行。完整入口、预期、操作与故障边界写入讲义；完成这些需要自己的真实环境与证据。

此单实例教学会话/限速留在进程内，Caddy下IP会聚合，生产前须补可信代理策略/共享限速和会话、账户恢复/监控/备份预算。capacity字段未实现售罄并发规则。没有把教学闭环当真实用户产品，也不据此更新用户学习完成状态。
