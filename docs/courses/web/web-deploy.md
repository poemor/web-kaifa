# 构建产物、静态发布与回滚

分清开发服务器与发布文件，验证真实地址上的资源与操作。

## 源码、开发服务、产物与部署

源码是 src 中自己编辑的 TS/TSX/CSS；dev 服务给本机开发提供处理与刷新能力；build 将源码和依赖处理成静态 HTML/CSS/JS 等产物；部署把产物放到用户可访问的托管服务。**build 成功只是生成文件，不等于已发布，也不等于 Go API 已启动。** 静态托管不能替你运行数据库和后端进程。

## 先在独立项目验证生产文件

下载 [followup-06 完整源码 ZIP](../../../assets/downloads/web-followup-06.zip)，解压后用 VS Code 打开 followup-06 目录，阅读 [对应 README](../../../exercises/web/followup-06/README.md)。当前项目根目录应含 package.json、package-lock.json、index.html、src、public、vite.config.ts；在这个目录的终端按 README 安装 npm.cmd ci。保留原版与锁文件，不使用前面替换小组件的副本，也不在只有讲义片段的空目录执行 npm ci。Node 要求见 package.json/README，macOS/Linux 使用 npm。

```powershell
# build 脚本会先检查类型，再生成 dist 发布文件。
npm.cmd run build
# preview 读取已经生成的 dist，不直接使用源码。
npm.cmd run preview
```

访问 http://127.0.0.1:8906/，Ctrl+C 停止。dist 内有 index.html、vue.html 和 assets 中的处理后资源，具体文件名由构建生成。修改源码后不重新 build，preview 仍可能显示旧产物；不要以 dev 正常代替生产文件验证。

## 先验证地址和路由

打开列表、进入详情，直接刷新当前详情地址；本项目使用 #/events/数字 的 hash 路由，# 后的部分由浏览器页面程序解释，不作为 HTTP 资源路径发送。若改成没有 # 的客户端路径，静态托管可能需要单独回退配置；这不是只改一个链接就完成。

在部署到 /仓库名/ 子目录时检查图片、CSS、JS 的完整 Request URL。./ 与 Vite BASE_URL 可按基路径定位，/image.png 则从网站根目录取，容易在项目页 404。服务器通常区分文件名大小写，本机不报错也要核对。Network 的资源应是对应内容类型，不能把返回首页 HTML 的 200 当 JS 加载成功。

## 工作流要放在哪里，何时执行

下面是配套 .github/workflows/pages.yml 的完整参考，注释用于读懂任务。只有把独立作品的内容放在自己的 GitHub 仓库根目录、配置 Pages 的发布来源并实际触发后，远程工作流才会运行。这个文件位于学习仓库的练习目录中，不代表本轮已经替你部署了作品。

```yaml
# 在自己的独立作品仓库中使用，不会因阅读这份讲义自动执行。
name: publish-frontend
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  # build 先检查源码并生成 dist，失败时不进入部署。
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  # deploy 等 build 成功，发布上一任务上传的静态产物。
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deploy.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deploy
```

## 按顺序读 YAML 配置

YAML 用缩进表示层级，键和值用冒号分开，- 表示列表项，# 是注释。on 指触发条件，push 的 main 指向主分支推送，workflow_dispatch 允许手动触发；jobs 定义任务。build/deploy 是任务名称，runs-on 指远程执行机器；steps 中 uses 复用指定版本的 Action，run 执行命令，with 提供参数。

checkout 取得源码，setup-node 准备 Node，ci 依据锁安装，lint/typecheck/test/build 各自检查。upload-pages-artifact 上传 dist 产物，deploy 的 needs:build 等待构建成功，environment 关联 Pages 环境，permissions 提供这次工作流需要的仓库读取与发布权限。url 的 ${{ ... }} 是 Actions 读取任务输出的表达式，不是本机 PowerShell 变量。

## 真实发布后的验收

在自己的独立仓库按 [Git与Pages完整说明](#/followup/web/2) 配置并触发后，查看 Actions 是否所有检查通过，再打开给出的真实地址。验证首页、详情刷新、搜索、空结果、失败与重试、资源路径、320/768/1440px 和键盘路径；静态 JSON 场景仍是演示数据，不是线上用户服务。公开部署涉及托管账号和配置，不能把模板存在或本机预览成功写成已经上线。

## 失败时恢复哪一份

发布前记录提交版本和已验收的产物/地址。若新版本坏了，恢复上一份已验收源码或构建产物，重新走同一发布与主要验收流程；只有生成旧文件却没再次部署，用户仍看不到回退。浏览器可能缓存旧资源，确认实际下载的版本。前端回滚不能恢复服务端数据，数据库结构改变需要独立迁移与备份方案。参考：[GitHub Pages 自定义工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

## 独立变式：保留可验收的旧版并本机恢复

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。只做自己作品或followup-06独立副本的源码/构建/preview流程；未执行远程发布就不记录“线上回滚”。

不照抄命令序列，自行保留已验收版本A，制作文字不同的版本B，随后刻意让一项资源路径错误。分别检查源码、dev、生产产物与真实请求，再恢复A并重新生成/预览；记录版本、地址与实际检查。

自查：A、B能由可见文字区分；坏版本的资源错误可在Network定位；恢复A后preview再次显示A且资源正确，不只是编辑器改回A。详情刷新、键盘路径与手机宽度要再次正常；远程没有部署，证据只说明本机恢复。
