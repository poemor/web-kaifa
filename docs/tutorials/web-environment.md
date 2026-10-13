# Web 起步：保存一个文件，看见一次变化

这个检查只需要 VS Code 和一个浏览器。静态 HTML/CSS 起步不需要先装 Node.js、数据库或付费插件；VS Code 已有 HTML 编辑支持。[HTML 官方说明](https://code.visualstudio.com/docs/languages/html)

## 1. 建立自己的文件

先完成“安装 VS Code”中的打开文件夹步骤。在学习仓库的 `exercises/web/setup-check` 新建 `index.html`。如果上一页已经建了空文件，直接打开它；如果其中有旧作品，请换一个新的练习目录。把下面**完整代码**放进这个文件并保存，不要放进终端；只复制代码内容，不包含代码框边界或语言名称。

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>我的环境检查</title>
  <style>
    body { max-width: 48rem; margin: 2rem auto; padding: 1rem; font: 18px/1.7 sans-serif; }
    h1 { color: #9b4c34; }
  </style>
</head>
<body>
  <h1>这是我的第一张网页</h1>
  <p>我能修改文件，并在浏览器里验证变化。</p>
</body>
</html>
```

## 2. 打开、修改、验证

1. 在 VS Code 左侧右键练习里的 `index.html`，选 **Reveal in File Explorer（在文件资源管理器中显示）**，Mac 选 **Reveal in Finder（在访达中显示）**。在打开的系统窗口里右键该文件 → 打开方式 → Edge、Chrome、Firefox 或 Safari。若双击又回到 VS Code，就用“打开方式”明确选浏览器；不需要找编辑器的“运行”三角按钮。
2. 浏览器地址以 `file:` 开始属于本机文件方式，末尾应指向练习文件夹的 `index.html`。它只是电脑上的文件，还没有发布到网上。
3. 预期：浏览器显示陶土色标题“这是我的第一张网页”和一段正文。`<h1>…</h1>` 是页面大标题；`<title>…</title>` 是浏览器标签名称，两者不同。
4. 回到 VS Code，把 `<h1>` 和 `</h1>` 之间的文字改成“我今天学会保存和刷新”，保留两端标签，保存；回浏览器点击地址栏旁的刷新按钮（或 Windows/Linux 的 `Ctrl+R`、Mac 的 `Cmd+R`）。
5. 预期：页面大标题变了，正文和浏览器标签名称保持原样。把浏览器缩窄，确认文字能换行。

**验收证据**：记录文件相对路径、改动前后标题、浏览器实际结果。网页看起来正常不代表所有功能都正确；这里仅验证编辑、保存、打开和刷新这一条链路。

## 3. 看懂这张网页，而不只是把代码贴进去

HTML 描述页面“有什么”：标题、段落、链接等。浏览器读取这些标签，把它们组织成页面。CSS 描述“长什么样”：颜色、字号、留白。JavaScript 才负责点击后改变内容等行为。第一份示例只有 HTML 和 CSS，因此打开文件就能显示，不需要先把它编译成 `.exe`。[HTML 入门解释](https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Your_first_website/Creating_the_content)

先按从外到内的顺序看，不必一次背完所有标签：

| 示例里的代码 | 作用 | 可以怎样验证 |
| --- | --- | --- |
| `<!doctype html>` | 告诉浏览器按现代 HTML 方式解析 | 先原样保留，它不是显示出来的正文 |
| `<html lang="zh-CN">` | 页面最外层元素，标明内容语言 | 里面包住 head 与 body；语言信息也帮助辅助工具 |
| `<head>…</head>` | 放文档设置 | 这里的 title 改浏览器标签名称，通常不改变页面正文 |
| `<meta charset="UTF-8">` | 约定文字编码 | 保留它并用 UTF-8 保存，避免中文被错误解释 |
| `<meta name="viewport" …>` | 告诉手机按设备宽度显示 | 配合可换行布局，缩窄浏览器观察 |
| `<body>…</body>` | 放实际展示内容 | 你看到的大标题和段落都在这里 |
| `<h1>…</h1>` 与 `<p>…</p>` | 一级标题与段落 | 只改标签中间的文字，再保存刷新 |

大多数元素包含开始标签、内容、结束标签。`<p>今天学 HTML</p>` 中，`<p>` 表示段落开始，`</p>` 表示段落结束；斜杠有意义。`lang="zh-CN"` 这类写在开始标签里的信息叫属性。缩进只是为了让人更容易看出嵌套关系，不能代替结束标签。

再看 `h1 { color: #9b4c34; }`：`h1` 选择页面中的一级标题，花括号里是样式规则，`color` 是文字颜色，冒号后是颜色值，分号结束这一项。`body` 规则中 `max-width` 限制正文不要过宽，`margin` 设置外侧空白，`padding` 留出内侧空白，`font` 设置字号、行距与字体。

**只改一处试试**：把 `h1` 的颜色值改为 `#2463a6`，保存并刷新。预期标题变蓝，但文字不变。若文字变了颜色没变，就把“内容”和“样式”分开核对，不要整份替换文件。

## 4. 从看例子到自己做三个小变化

先预测结果，再动手；一次改一处，这样才知道是哪一处产生了变化。

1. 在现有段落后、`</body>` 前加上 `<p>我每天练习二十分钟。</p>`。保存刷新，预期多出第二段文字。
2. 把 `<title>` 中的内容改成“我的学习页”。预期浏览器标签名称改变，页面大标题不变。
3. 改 `h1` 的颜色，浏览器缩窄到手机大小。预期颜色改变、长文字正常换行。颜色没变先查保存与路径；出现横向滚动再查内容和宽度。

做完后说明：哪一步修改结构，哪一步修改文档设置，哪一步修改样式？能说清并再次独立完成，比整段复制后看到页面更能说明你理解了。

### 再试一个可点击的网页（选做）

保持刚才的 `index.html`，在**同一个练习目录**中新建 `click.html`。这次不覆盖第一份成果。把下面完整示例存入新文件，用浏览器打开它：

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>第一次点击交互</title>
</head>
<body>
  <h1>我的练习记录</h1>
  <button id="practice" type="button">记录一次练习</button>
  <p id="result">今天练习了 0 次</p>
  <script>
    let count = 0;
    const button = document.querySelector('#practice');
    const result = document.querySelector('#result');
    button.addEventListener('click', function () {
      count = count + 1;
      result.textContent = '今天练习了 ' + count + ' 次';
    });
  </script>
</body>
</html>
```

**在浏览器里操作**：点击一次应显示 1 次，点击第二次应显示 2 次；刷新应回到 0 次。刷新后归零是这段代码的设计：数字只放在这次页面运行的内存中，没有保存到磁盘或浏览器存储。这和本站的课时完成记录无关。

这里 `id` 给元素一个名字，`querySelector('#practice')` 找到该元素，`addEventListener('click', …)` 约定点击时做什么；`count` 是存放数字的变量，每次把旧值加 1，再用 `textContent` 更新段落。先理解“找到按钮 → 等待点击 → 改数字 → 更新文字”这一条过程，后续再学完整 JavaScript 语法。

若按钮不动，先查看浏览器 Console 是否报错，确认 `id` 与选择器拼写相同，且复制了完整的 script 区域。不要因为点击没反应就重装 VS Code。

## 5. 为什么保存后还没变

按顺序排查，每次只验证一个判断：

1. 编辑器是否已保存？看文件标签是否仍有未保存标记。
2. 浏览器打开的是不是同一个文件？核对地址与文件夹，尤其是复制过多份项目时。
3. 文件名是不是 `index.html`，而不是 `.txt`？
4. 是否刷新了页面？需要时再试强制刷新，但先排除前面的路径问题。

如果看到一整页 `<html>` 源码，先检查地址不是以 `view-source:` 开头，再检查完整文件名是否为 `index.html.txt`。VS Code 左侧右键文件 → Rename（重命名）可核对；看到乱码时，检查编辑器右下角文件编码为 UTF-8，并保留示例的 `meta charset` 行。

**小排错练习**：在自己的新练习里修改标题，先故意不保存，刷新浏览器，观察是否仍是旧文字；然后保存再刷新。若已开启自动保存，变化可能已经出现，如实记录即可。这次只测试保存与刷新，不删除文件、不改系统配置。用你实际观察的结果到“学会问 AI”整理一份问题。

如果出现 JavaScript 错误：Windows/Linux 可按 `F12` 或 `Ctrl+Shift+I` 打开浏览器开发者工具，找到 **Console（控制台）**；macOS Chrome/Edge 常用 `Cmd+Option+I`。复制相关错误文字以及文件名和行号，连同最小相关代码一起提问。

## 6. 准备 Python，启动第一个本地服务器

第一张静态网页可以直接双击 HTML 打开。后面学习 `fetch`、JavaScript 模块和接口时，需要从 HTTP 地址打开。本节把准备工具、启动、访问、停止四步连起来；不用关闭浏览器安全功能。Python 在这里仅提供静态文件，HTML 仍由浏览器显示，不要求先学 Python 语法，也不需要安装 pip 包。

### 先检查，已经能用就不重复安装

在 VS Code 选择“终端 → 新建终端”，按系统选一条版本检查命令：Windows 输入 `py --version`，macOS/Linux 输入 `python3 --version`。看到 `Python 3.x.x` 就说明对应命令能运行 Python 3。`x` 是实际版本数字，不要把示意输出当命令输入。若 Windows 只有 `python --version` 能输出 Python 3，后面的服务器命令可用 `python` 替换 `py`。

命令找不到、只弹出应用商店或没有版本输出，才按下面自己系统的分支安装。Python 扩展只是编辑辅助，不能替代 Python 程序；本节也不需要 VS Code 的 Python 扩展。

### Windows：首次安装与确认

1. 用浏览器打开 [Python 官方下载页](https://www.python.org/downloads/)，选择 Windows 的 **Python install manager（安装管理器）**，下载后双击安装文件，点 Install（安装）。管理器负责安装和选择 Python 版本，它与 Python 运行时是两件事。
2. 安装结束后完全关闭 VS Code，再重新打开练习文件夹和新终端。在新终端执行下面第一条命令，让管理器安装默认稳定运行时；等待下载完成，再执行第二条。已有可用 Python 3 的人跳过这一步。

```powershell
pymanager install default
py --version
```

预期第二条输出 `Python 3.x.x`。旧版 `py` 启动器没有管理器的安装命令，所以安装步骤明确使用 `pymanager`。若 `pymanager` 找不到，检查管理器安装是否成功并重开终端；若版本检查仍失败，把系统版本、安装方式和这两条命令的实际结果带到提问整理器。不要随意删除已有 Python 或整段替换 PATH。Windows 安装细节以 [Python 官方 Windows 说明](https://docs.python.org/3/using/windows.html) 为准。

### macOS：首次安装与确认

打开 [Python 官方 macOS 下载页](https://www.python.org/downloads/macos/)，选择稳定版本的 macOS `.pkg` 安装包，双击后按 Continue（继续）、Agree（同意）、Install（安装）完成，必要时输入自己的系统管理员凭据。官方安装说明还要求运行“应用程序 → Python 版本文件夹”中的 `Install Certificates.command` 完成证书准备；它用于 HTTPS，不是启动本地服务器的命令。

完全关闭并重开 VS Code，在新终端输入：

```sh
python3 --version
```

预期输出 `Python 3.x.x`。系统自带的 Python 与自行安装的 Python 可以共存，不要删除或改写 macOS 的 `/usr/bin/python3`。具体安装界面见 [Python 官方 macOS 说明](https://docs.python.org/3/using/mac.html)。

### Linux：按发行版安装，不混用命令

先执行 `python3 --version`；许多发行版已经提供 Python 3。Ubuntu/Debian 在确实缺少时，可逐条执行以下命令：

```sh
sudo apt update
sudo apt install python3
python3 --version
```

`sudo` 表示使用管理员权限，密码输入时终端通常不显示字符；它与你的代码内容无关。安装会显示待安装软件并要求确认，读清楚后按提示继续。Fedora 使用自己的包管理器：`sudo dnf install python3`，然后同样用 `python3 --version` 验证。其他发行版请按该发行版的官方包管理说明，不把 apt 命令强行套用。依据：[Ubuntu Python 环境说明](https://ubuntu.com/developers/docs/howto/python-setup/)、[Fedora Python 说明](https://fedoraproject.org/wiki/SIGs/Python)。

### 在正确文件夹启动，再去浏览器看结果

1. VS Code 左侧右键含 `index.html` 的练习文件夹（本教程是 `setup-check`），选“在集成终端中打开”。Windows 用 `Get-Location`，macOS/Linux 用 `pwd` 核对最后一级目录；它必须包含你要打开的 `index.html`。
2. 按自己的系统**只选一条**启动命令，在终端中输入、按 Enter，不写进 HTML 文件。

Windows PowerShell：

```powershell
py -m http.server 8744 --bind 127.0.0.1
```

macOS/Linux：

```sh
python3 -m http.server 8744 --bind 127.0.0.1
```

`-m http.server` 表示运行 Python 自带的静态服务器模块；`8744` 是端口；`--bind 127.0.0.1` 只让这台电脑访问。它服务的是**启动时所在目录**的文件，不能处理真实报名或 Go API。预期终端显示服务信息并保持运行，没有新的提示符是正常的。

3. 把 `http://127.0.0.1:8744/` 粘贴到浏览器**地址栏**，不是终端或搜索框。应看见刚才的网页；地址现在以 `http:` 开头，而不是 `file:`。如果出现文件列表，说明服务可达，但当前目录没有对应首页，要回头核对文件位置。
4. 改标题、保存、刷新，应看见变化；终端可能打印一行 GET 请求记录，这是浏览器读取文件的证据，不是编译输出。结束时回终端按 `Ctrl+C`（Mac 此处也是 Control+C）停止。停止后刷新网页应连接失败；重新运行启动命令再刷新，应恢复。

请求状态课使用 **8751** 端口，按那一课的命令和浏览器地址一起替换；不同数字只是为了避免与别的练习服务冲突。

| 现象 | 先查什么 |
| --- | --- |
| `py` / `python3` 找不到 | 先按本节对应系统安装，再重开 VS Code、新终端，先通过版本检查 |
| 浏览器连接被拒绝 | 服务器是否仍运行；地址端口是否与命令完全一致 |
| 看到文件列表或 404 | 终端是否在含 `index.html` 的文件夹；文件名和 URL 路径是否正确 |
| 端口被占用 | 可换成 8745，同时修改浏览器地址；不要结束不认识的系统进程 |
| 请求失败 / CORS | 记录请求 URL、页面是 file 还是 http、Console 完整错误；先核对当前打开方式 |

## 7. 把证据带回课程

环境验证后进入 Web 第 1 课，按任务做社团介绍页。教程示例只是起点，不代替自己的课程作品或验收。

补充工具依据：[Python 静态服务器文档](https://docs.python.org/3/library/http.server.html)。官方链接核对日期：2026-10-13。
