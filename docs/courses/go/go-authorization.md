# 记录归属与对象权限

先验证用户身份，再限制他能访问哪些对象；用两个用户证明所有入口都遵守同一规则。

## 认证和授权分别回答什么

认证（authentication）回答“当前请求是谁”，上节用会话完成。授权（authorization）回答“这个用户能做什么”：成员可管理自己的报名，管理员可管理活动。登录成功不是全系统所有操作都可用。

**每次访问记录都由服务器检查权限，隐藏前端按钮不能当访问控制。** 攻击者可以自己构造HTTP请求。记录归属必须从已经验证的用户身份取得，不能信任请求正文声称的memberId或owner_id。

## 本工程的实际对象，别混字段

[安全会话工程](assets/downloads/web-followup-10.zip)使用members用户、events活动、registrations报名。每份报名有EventID与MemberID。普通成员只能列出和取消自己的报名；公开活动可读取，活动创建/修改/删除要求admin角色。

例如已验证成员u.ID是7，客户端发 `{"eventId":12}`，服务器调用 `Register(ctx, u.ID, 12)`。客户端不负责决定报名归属。这个项目拒绝额外memberId字段，而不是采纳后检查。

## 沿服务端链条读

security.go的authorized先current确认会话，再检查是否需要admin、写操作是否CSRF有效；Handler从该函数拿到Member。identity_store.go的Register/CancelRegistration接收服务端传入的MemberID，存储层再按目标与归属筛选。

在已有SQLSecureStore.CancelRegistration方法中的关键SQL是：

```sql
-- $1是目标报名id，$2是已验证用户id；两个条件一起限定可删对象。
DELETE FROM registrations WHERE id = $1 AND member_id = $2;
```

它是参数化查询片段，psql不能直接执行未绑定的$1/$2。实际Go方法用ExecContext传id/memberID，再读RowsAffected；0行映射为ErrMissing，HTTP合同返回404。内存实现同样检查MemberID，不是数据库版才要授权。

**对象id能被知道或猜到，不能因此允许操作。** 工程对不存在和不属于自己的报名统一404，可减少对象是否存在的信息泄漏；有效会话但非admin访问管理员操作则403，不要把所有拒绝都硬写一个状态。

## 建立具体权限矩阵

| 场景 | 本工程结果 | 必须核对的数据 |
| --- | --- | --- |
| 未登录读取自己的报名 | 401 | 不返回私有记录 |
| A列出自己的报名 | 200 | 只含A的报名 |
| B取消A的报名 | 404 | A的报名仍存在 |
| 普通成员创建活动 | 403 | 活动未新增 |
| A伪造memberId提交报名 | 400 | 未创建伪归属记录 |
| A重复报名相同活动 | 409 | 不产生第二份相同报名 |

409表示与当前资源状态冲突，例如重复报名；不是“请求JSON语法错”。此工程没有单独GET一条报名或PATCH报名接口，不应声称这些未提供入口已通过；新加任何读取/修改入口都必须增加相同授权规则和测试。

## 启动与两用户真实实验

沿上节在followup-10启动HTTP服务。用一个正常浏览器上下文登录A、另一个独立无痕或另一浏览器登录B。**普通两个标签页一般共享Cookie，不能当两个用户。** 管理员先创建虚构活动，两成员分别注册与登录。

A报名后记录实际报名id；B使用自己的Cookie/CSRF取消那个id，应404，再用A列表确认记录未变。检查未登录与非admin失败，同时确认错误操作没有修改存储。命令行操作按 [第10阶段请求步骤](#/followup/web/10) 使用自己的虚构会话，避免记录真实值。

自动测试在同一独立模块：

```sh
go test -v -run TestSessionsOwnershipCSRFAndRoles ./...
```

其中测试B删除A报名404、A伪memberId400、普通成员管理活动403；通过只证明所覆盖接口。补新功能后要补新入口测试。

## 预测再做故障实验

只在自己的临时副本里删去内存CancelRegistration的归属条件，保留id存在检查；预期B能错误取消，权限测试必须FAIL。恢复条件后再通过，核对A的原记录仍存在。

### 参考答案

列表隐藏不是所有权限的证据；对象操作和角色操作分别验证。身份已确认也不能由Body指定其他用户。

## 独立变式

设计“读取单条报名”接口：先写未登录、自己、他人、不存在四种预期，再用服务端用户id约束查询并补测试。先明确合同，不把规划称已实现。

参考：[OWASP授权](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)。
