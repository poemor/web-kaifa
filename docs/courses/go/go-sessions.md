# 登录会话、过期与注销

让每次请求由服务器查证身份，观察Cookie如何携带会话以及注销后如何拒绝旧凭据。

## 为什么登录成功后还要有会话

HTTP请求本身不会自动记住“上次是谁登录”。每次都重新发送密码也不合适。登录通过后，服务器产生随机会话标识，记录它对应的用户与过期时间；客户端后续带回这个标识，服务器查询记录确认身份。

**会话是服务器保存的身份关联；Cookie只是浏览器保存并携带标识的一种方式。** Cookie是名称和值等信息，不是密码，也不是“随便写一个userId就被信任”。页面显示已登录或localStorage保存true，不能授权服务器操作。

```text
POST登录并校验密码 → 服务器记录会话、响应Set-Cookie
下一次请求带Cookie → 服务器查会话和有效期 → 返回当前用户
注销 → 服务器撤销会话 → 旧Cookie再用也应失败
```

## 从已有项目启动，先观察浏览器

打开 [安全会话工程](assets/downloads/web-followup-10.zip) followup-10，工具链满足go.mod，已准备依赖。PowerShell中设置自己的虚构管理员账户：

```powershell
$env:ADMIN_USER='club_admin'
$env:ADMIN_PASSWORD='替换成自己的至少12字符练习密码'
go run .
```

macOS/Linux用export，不要原样把占位密码当真实配置。默认服务是 `http://127.0.0.1:8770/`；终端保持运行，Ctrl+C停止。默认内存模式重启丢账户、报名和会话，日志会明确说明，不代表数据库持久化已完成。

页面注册虚构成员后登录，F12进入Network：登录POST响应中查看Set-Cookie；下一次GET `/api/me`请求带Cookie，响应200与用户、csrfToken。不要把真实Cookie值复制到笔记或AI提问。

## 跟踪 security.go 中具体对象

1. credentials校验输入与密码，randomToken生成难预测的标识；session结构体存UserID、CSRF、Expires。
2. SetCookie让浏览器保存club_session；浏览器通常按属性自动在合适请求中带回。
3. current读取请求Cookie，查sessions map；不存在或过期就拒绝，存在则向存储查该用户。
4. `/api/me`返回公开身份字段和当前会话CSRF值，不返回密码哈希。
5. `/api/logout`是写操作，先验证会话与CSRF，再从服务器map删除标识、响应使浏览器Cookie失效。

**注销必须撤销服务器端会话，不是只隐藏按钮或删除浏览器Cookie。** 已复制的旧标识也应不再被接受。

## 先解释 Cookie 的属性

| 属性 | 作用 | 不能代替什么 |
| --- | --- | --- |
| HttpOnly | 限制脚本直接读取Cookie | 不消除所有脚本攻击或代替授权 |
| Secure | 只在安全传输条件下发送 | 不把普通HTTP自动变成HTTPS |
| SameSite | 调整浏览器跨站发送Cookie的规则 | 不构成所有写操作的完整保护 |
| Path与过期 | 约束发送路径/存放时间 | 服务端仍检查有效期和撤销 |

本机开发用HTTP，生产配置要求HTTPS并设置Secure。服务器会话15分钟过期。不能只改浏览器时间或页面提示当过期验收；要验证服务器确实拒绝。

## CSRF 是什么，为什么多一个头

浏览器自动带Cookie有好处，也可能被别的页面诱导发写请求，这类跨站请求伪造称CSRF。本项目在登录或/me返回本会话的csrfToken，合法页面写请求要在 `X-CSRF-Token` **请求头**里带回，服务器比较；同时检查不允许的Origin（请求来源）。

这个头由客户端提交，不是Content-Type，也不是新密码。Token要绑定当前会话、难预测；不能把“带一个任意头”当保护。无Cookie或过期会话应401；身份有效但CSRF不符应403。401表示需要可用身份，403表示请求被拒绝。

## 正常与失败验证

同一工程目录运行：

```sh
go test -v -run TestSessionsOwnershipCSRFAndRoles ./...
```

测试先建立虚构用户与会话；注销后用旧Cookie请求/me应401；测试时替换now函数到16分钟后，另一个会话应401。测试直接调用处理器，不打开8770，浏览器实验另外验证真实通信。

预测：删除前端登录提示但不撤销会话，旧Cookie还可能200；正确注销则401。若写请求漏csrfToken，预期403，而非继续成功。独立测试每种失败，不在真实账号上实验。

### 参考答案

Cookie存在不保证会话有效；没过期还需会话未撤销、用户存在。当前单实例内存sessions/限速不共享，多实例部署需另外设计，不应把这里叫完整分布式身份服务。

## 独立变式

新增一个受保护读取入口，只返回当前会话的用户名。测试未登录401、登录200、注销后401，响应不含hash字段；授权处理留到下一节。

参考：[OWASP会话管理](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)、[MDN Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies)。
