# 把响应式做扎实：独立完成一张社团页面

这阶段交付的作品有顶部导航、公告侧栏、活动列表、可展开详情和联系区。你会做出真正能打开的页面，解释每块布局为什么这样写，再用长内容、窄屏和键盘检查它。表单只检查条件；搜索、收藏和数据请求在下一阶段实现。

## 先准备文件，再决定布局

前提是能在 VS Code 新建 HTML、CSS，保存并用浏览器打开。如果还分不清文件夹和文件，先读“安装与起步教程”的 VS Code 与 Web 环境两篇。你不需要 C++、npm、框架或付费扩展。

1. 新建文件夹 `club-layout`。在 VS Code 选择“文件 → 打开文件夹”，选这个文件夹。不要只打开一个 HTML 文件，否则后面容易把 CSS 放在错误位置。
2. 在左侧文件区点“新建文件”，依次建 `index.html`、`style.css`、`app.js`、`wide.svg`、`tall.svg`。扩展名要完整；不要出现 `style.css.txt`。复制下面对应的完整文件，Ctrl+S；Mac 使用 Cmd+S。圆点消失才表示文件已保存。
3. 双击 `index.html`，地址以 `file:` 开头也能完成本课。若要看 Network 的 HTTP 状态码，在该文件夹打开终端：Windows 运行下列 PowerShell 命令；Mac/Linux 运行另一条。Python 安装方法见 Web 环境教程的本地服务器章节。

```powershell
py -m http.server 8760 --bind 127.0.0.1
```

```sh
python3 -m http.server 8760 --bind 127.0.0.1
```

4. 浏览器访问 `http://127.0.0.1:8760/`。终端出现服务启动信息而不返回输入位置是正常的，服务器正在等待请求；不要重复启动。结束时 Ctrl+C。
5. 首次页面应有四张带图卡片、公告、绿色按钮和“报名暂未开放”按钮。若只有黑字，先检查 CSS 是否与 HTML 在同一目录，文件名大小写是否一致，再刷新。

页面结构先由语义决定：`header` 是页眉，`nav` 是导航，`main` 是主要内容，`aside` 是相关公告，独立活动用 `article`。只有一个 h1，板块 h2，卡片 h3。标题等级表达从属关系，不是挑选字号的工具。

## Flex 处理一排：先理解空间再写数值

`display:flex` 写在父元素上，直接子元素成为 flex 项。本例导航项是一排，表单是一排字段与按钮，所以用 Flex。默认 `flex-direction:row` 的主轴沿横向、交叉轴沿纵向；改为 column 后这两个方向互换。`justify-content` 调整主轴的空间分配，`align-items` 调整交叉轴对齐，不能把它们永久记成“左右”和“上下”。

`flex:1 1 12rem` 按顺序表示 grow、shrink、basis。basis 是分配空间前的主轴基准尺寸；grow 决定剩余空间如何分享；shrink 在不够放时参与收缩。举例：去掉间距后容器还有 600px，两字段的 basis 都是 200px，按钮占 100px，剩余 100px；两个字段 grow 都是 1，各多分 50px，得到 250px。改成 2 和 1，额外空间约分成 66.7 与 33.3px。grow 的数字是比例，不是 px。

收缩也考虑原始尺寸。两项 basis 是 200 和 100px，shrink 都是 1，缺 60px 时收缩量按 200:100 分配，约减少 40 和 20px；不是两项各减 30px。真实页面还有最小内容尺寸、边框与内边距，所以用 DevTools 看最终结果，不凭公式断言所有元素都能缩到 0。

本例字段 `flex:1 1 12rem` 能增长、收缩；按钮 `flex:0 0 auto` 保持由文字决定的宽度。`flex-wrap:wrap` 允许整项换到下一行；不会把一个按钮拆成两半。字段设置 `min-width:0`，允许它小于其默认的最小内容宽度；输入再写 `width:100%` 填满字段。少了前者，长内容可能把容器撑出屏幕。

动手实验：先在 style.css 将表单 `flex-wrap:wrap` 改成 `nowrap`，保存，缩到 360px。记录是否发生挤压；再恢复 wrap。接着把第一字段 grow 改成 2：不要只看到“变大”，要在 Elements 选择字段，确认它获得了更多剩余空间。这个实验不需要编译，保存和刷新就是重新载入代码。[Flex 值与最小尺寸的官方说明](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/flex)。

## Grid 处理行列：卡片不需要手算百分比

Flex 更适合一维排列，换行后每行独立分配空间；Grid 定义共用的列轨道，适合列表中行列对齐。本例整体“公告 + 列表”与多张卡片都用 Grid。不要把所有元素 absolute 后按像素摆放，那样新增标题就会压住其他内容。

卡片规则是 `repeat(auto-fit,minmax(min(100%,16rem),1fr))`。从里向外读：`min(100%,16rem)` 取容器宽度与16rem中较小值，避免很窄的容器比最小卡片还窄；`minmax(最小,1fr)` 给每列一个下限并分配剩余空间；`repeat(auto-fit,...)` 自动放尽可能多的列，空轨道折叠。fr分剩余可用空间，不是视口宽度百分比，也不是固定长度。

浏览器默认字体16px时，16rem约256px。1440px视口中main最宽1216px，扣两侧padding共32px、公告208px与间隔24px，活动区约952px；三列最低需要3×256+2×16=800px，四列需要1072px，因此排三列。768px时活动区约504px，不足以放两列，卡片仍单列；整体公告与活动双列和活动卡片单列是两回事。调整浏览器默认字号后rem对应像素也会改变，所以仍要实测。若要768px卡片双列，应重新设计公告位置与卡片最小宽度，而不是硬塞两张不可读卡片。

第四张卡只新增article，无须写“第4张宽度”。新增第五张再检查换行，布局应该继续成立。

在浏览器 F12 → Elements，选 `.cards`，点 `grid` 小标记打开网格覆盖。宽度依次设360、768、1440px，记录 computed 的 `grid-template-columns`，验证每列同宽。移除一张卡片看看 auto-fit 如何分配空余轨道。[Grid 轨道、fr 与自动重复的官方概念](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Basic_concepts)。

## 定位与 z-index：偏移和叠放不是布局本身

普通元素在正常文档流中占位置，下一段排在它后面。`position:relative` 保留这个位置，即使 top/left 让它视觉偏移，周围元素也不会补上空位；同时它常作为绝对定位子元素的参照。

第一张 `.card` 设置 relative，`.badge` 设置 absolute、top/right。角标从正常流中拿出来，相对卡片的定位框移动；正文不会为角标额外留一行。角标覆盖图片区域，因此放在图片角上。若删除卡片的 relative，角标会去找更远的定位祖先，可能跑到页面角落。

`fixed` 通常相对视口，本例回顶部按钮随滚动保持右下角。带 transform 等属性的祖先可能改变它的参照，所以遇到“fixed 跟着某块滚”要检查祖先。fixed 不占正常流位置，因此 footer 留5rem底部空间，仍需在200%缩放时检查遮挡。

`sticky` 先占正常流位置，达到 top 阈值后粘住，受滚动祖先与所在容器范围限制。页眉 `top:0`；宽屏公告 `top:6rem`，避免压在页眉下面。只写 sticky 没有 top 不会得到预期粘附；父元素 overflow 建立的滚动环境也会改变效果。本例窄屏公告不粘住，因为它可能占满手机屏幕。

z-index 比较的是叠放上下文中的层级，不是全站统一排行榜。页眉5、回顶部6、跳到正文20，足够表达关系；把角标写成99999也不能跳出一个位于更低层的祖先上下文。relative + 非 auto z-index、transform、opacity 小于1等都可能产生上下文。实验：在 `.card` 上加 `z-index:0`，角标 z-index99999；滚动到页眉附近，角标仍不能凭自己的数值越过页眉。修复从祖先层级入手，随后删去实验规则。[叠放上下文的官方解释](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Positioned_layout/Stacking_context)。

## 断点、图片、变量与阅读体验

默认 CSS 是窄屏单列，这是移动优先。48rem 的 min-width 规则只在足够宽时把 `.layout` 增强为双列。断点来自“公告和正文并排是否仍能读”的内容要求，不是把某手机型号当永久标准。HTML 的 viewport 标签让手机布局视口按设备宽度计算；缺少它，手机可能先排一个很宽的网页再整体缩小。先放入真实长标题，再调整断点。

图片本身有尺寸比例，展示框也有比例。`aspect-ratio:16/9` 指展示框，`width:100%` 随卡片宽度变化，`height:auto` 不强制扭曲像素。`object-fit:cover` 会保留图片比例、填满框并裁掉多余部分；它不压缩文件，也不减少下载流量。`contain` 全部保留，但会有空白。竖图中主体被裁掉时，先改 `object-position:center 35%` 或改构图；涉及图表、文字的图片更适合 contain。

wide.svg 和 tall.svg 分别提供横竖图，完全本地，不受远程图床影响。width/height 属性说明原图尺寸，有助于浏览器提前预留空间；CSS 控制最终显示比例。第二行图片用 loading=lazy，让浏览器按需加载，首屏重要图片没有懒加载。真实照片应该导出接近显示尺寸的压缩版本，再通过 Network 看传输大小；不能靠 width=240 把5MB照片变成小文件。

`:root` 定义 `--background`、`--surface`、`--text`、`--brand`、`--space` 等变量，`var(--brand)` 使用它们。变量遵循作用域与继承；给某个 section 重新定义 brand，只影响该区域及其后代。变量名区分大小写。实验把 `--brand:#17624b` 改成 `#64368a`，保存后导航、按钮和链接一起变色，观察这种同步来自共用变量。换颜色后要重新检查文字对比度，不能只追求统一。

正文使用1rem字号、1.7行高；`.intro`、`.contact` 限为65ch左右，避免宽屏读一行跨半米。ch 以字体中“0”的宽度为参考，所以中文不是严格65个字。段落间距与行高分别处理段与行；把line-height改成1.1观察密集效果，再恢复1.7。长英文使用overflow-wrap:anywhere允许必要换行，标题不靠固定高度或省略号藏住信息。浏览器缩放200%，读者仍应读到全部文字。

## 正确语义与交互状态是操作契约

鼠标 hover 只在指针经过时反馈，键盘用户看不到它。`:focus-visible` 给键盘焦点明确的3px轮廓；不要写 outline:none 后不补替代样式。本例的disabled报名按钮是真的不可操作，它不会通过Tab获得焦点；变灰但仍可点击的普通div不能表达禁用。

label 的 for 与 input 的 id 必须完全相等；点击“所在城市”文字时应聚焦城市输入。placeholder 是例子，不是标签：用户输入后placeholder消失，label仍告诉他字段含义。button 自带焦点、Enter/空格激活和语义，div 不具备这些默认行为。本例submit按钮执行检查，disabled按钮明确未开放；不把检查结果伪装成“报名成功”。

浏览器先做 required 校验；仅空格不违反 required，因此 app.js 再trim并设置自定义有效性。event.preventDefault 阻止默认表单发送与跳转；如果去掉它，表单可能把条件编码进URL。两字段完成合法输入后，feedback以role=status说明“没有提交、保存或筛选活动”。重新输入立刻撤销旧反馈，避免拿旧条件的成功当新条件的成功。

图片alt描述与该活动有关的信息，不能每张都写“图片”。纯装饰图可用alt=""让辅助阅读忽略；有信息的图应给有意义替代文本。详情使用details/summary，浏览器提供展开、收起与键盘操作。颜色只是反馈的一部分；“报名暂未开放”的文字本身表达状态，即使不辨颜色也能理解。[键盘可操作的官方指引](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Understanding_WCAG/Keyboard)。

## 从设计到素材：自己画SVG，再导出透明PNG

素材不是把任意漂亮图塞进网页。先说它做什么：日历图标提示活动日期，封面建立活动主题，纯色背景提供分区。边框、圆角、阴影、渐变可以用CSS；有清晰几何轮廓的图标和插画适合SVG；照片适合JPEG或WebP；需要透明背景的位图可以用PNG或支持透明的WebP。SVG描述形状，放大可保持边缘；PNG/JPEG/WebP记录像素，放得远超原分辨率会模糊。PNG并不自动代表“透明”，它可以含不透明背景，导出时必须检查。

### HTML用img，SVG内部才有image

网页加载图文件用`<img src="./calendar.svg" alt="日历图标">`。HTML的标准标签是img，不写image。某些浏览器容忍历史写法不代表代码规范；复制`<image src=...>`会混淆HTML与SVG，不能作为教程推荐。

SVG内部的`<image href="./photo.png" width="100" height="100"/>`表示在SVG坐标系里嵌入已有位图，属性用href；它不是HTML的img替代。这意味着SVG文件也可能引用外部照片，别人只拿到SVG就缺素材。本课SVG只用自绘几何，没有外部依赖。[HTML img标准](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img)与[SVG image标准](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/image)。

### 不装绘图软件也能画出第一个图标

在同一文件夹新建calendar.svg，复制下面“完整文件：calendar.svg”代码，Ctrl+S，在浏览器打开该文件。应出现日历轮廓与一个日期点，背景透明。xmlns声明这是SVG；viewBox="0 0 24 24"定义从(0,0)到(24,24)的坐标空间，和实际显示24px/48px不是一回事。x往右，y往下。rect的x/y是左上角，width/height是尺寸，rx是圆角。path的M把画笔移到坐标、v画竖线、h画横线；circle的cx/cy是圆心，r是半径。

fill决定内部颜色，stroke决定轮廓颜色，stroke-width是坐标单位中的线宽；fill="none"让日历框不填实心，stroke-linecap="round"把线端变圆。文件里没画铺满画布的背景rect，因此背景透明。将stroke-width从2改为1，保存刷新，比较48px显示时的线条；将rx从2改为0，观察圆角是否和页面卡片风格一致。SVG后写的形状通常画在前写的上方，重叠时先检查顺序，不给SVG乱加CSS z-index。

然后新建poster-before.svg、poster-after.svg、assets.html并复制完整文件。浏览器打开assets.html，不必登录任何设计软件，就能并排比较原始图和改进图。先打开before再在VS Code逐个改色/尺寸，最后对照after，而不是直接跳过制作过程。[SVG入门与本地文件运行](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorials/SVG_from_scratch/Getting_started)。

### 从“颜色很多”到“素材有设计关系”

before的黄色背景、粉色圆、蓝色矩形和荧光绿三角没有共用配色，图形尺寸与边距不一致。after只用米白、品牌绿、浅绿和一处暖色；矩形和背景共用12单位圆角；主要图形距画布边缘至少24单位，底部线建立共用基线。两者都不是“只要用渐变就高级”，你要解释每一项视觉关系。

动手顺序：复制before另存自己的poster.svg；先把背景改成页面背景相近的浅色，接着把最大的形状改品牌色，再统一圆角，最后调整边距。每一步保存后刷新，与前一版比较。360×200坐标里，如果图形右边是320，剩下40单位外边距；不能只写“适当留白”而不观察实际空间。把自己的poster.svg放进第一张活动卡，用img引用，替代原图而非增加一张空白截图；更新alt描述新图片表达的内容。

assets.html示范两种引用：外部img引用calendar.svg，文件可重复使用和缓存，但图形颜色由该SVG自己定义，父链接color不会自动穿进去；内联svg写在HTML里面，stroke="currentColor"可以继承链接的文字颜色，本例悬停时紫色变绿。内联可直接用CSS控制，但HTML会更长、重复图标会增加标记，不能把来源不可信的SVG整段直接插进网页。仅装饰的内联图标aria-hidden="true"，链接仍有“查看活动页面”文字，不能让图标代替操作名称。

### 将自己画的图标导出2倍像素PNG

先在VS Code保存calendar.svg。HTTP访问assets.html时，可以直接点“下载96×96透明PNG”，页面会重新读取实际calendar.svg（包含日期点与你改过的线宽/圆角/配色），而非借用另一份内联图标。如果是双击本页、地址以file:开头，先点“选择自己编辑的SVG”，选择刚保存的calendar.svg，再下载；浏览器限制本地跨文件画布导出，所以这里通过你明确选择的文件读取，不能用假图绕过限制。每次编辑并保存后，重新选择该文件再导出。

浏览器下载calendar-2x.png，确认文件实际存在，再移动到club-layout，与index.html同级。脚本把实际SVG源文件以96×96绘到透明Canvas，导出PNG，不改源文件、也不使用付费服务。代码完整给出，不要求你这节就掌握异步与Canvas，可在下阶段回头读。导出后必须保留日历内的日期点；将SVG轮廓改成紫色、保存、重新选择后下载，PNG也应变成紫色，证明导出的是你的新素材。

在你自己的HTML中使用：

```html
<img src="./calendar-2x.png" width="48" height="48" alt="日历图标">
```

96×96的资源显示48×48，有2倍像素，可适配约2倍设备像素比的屏幕。它不是让图标变得96px大：显示尺寸仍由width/height或CSS决定。保持SVG源文件用于改色与重导出；把24px位图单纯拉到96px并不能增加细节。导出后在白底和绿色底各放一次，日历四角应露出底色；若出现白方块，透明背景没保留，应检查导出过程而不是给PNG设置opacity。

照片同理：实际展示320px宽，可从640px宽压缩图开始检查2倍屏幕清晰度、文件大小与加载时间，不直接上传几千像素原图。透明PNG适合少色图标、截取的物体；没有透明需求的大照片通常JPEG/WebP更省。SVG内含嵌入照片时也可能很大，不能凭扩展名说文件一定小。

### 有意义图片、装饰图与真实路径

有信息的封面alt描述内容，例如“山坡上的蓝色帐篷”；按钮旁已有同义文字的装饰图用alt=""，避免辅助阅读重复播报“日历图标”。不能省略alt以赌浏览器自动识别。[W3C装饰图片指引](https://www.w3.org/WAI/tutorials/images/decorative/)。纯装饰背景适合CSS background，承载文字/信息的图片应保持内容可替代。

./表示当前HTML所在目录，./assets/calendar.svg表示其assets子文件夹；/assets从域名根查找，在GitHub项目站可能漏仓库名。文件名大小写应完全一致，本机Windows可能放过Calendar.svg，线上仍可能404。图不显示时先Network过滤Img核对URL与Status，再看是否已下载本地文件、是否用错扩展名；请求200但裁切错误才去查object-fit/aspect-ratio。用cover会裁图，包含文字的海报优先contain，不能裁掉日期后还声称信息完整。

本例三份图由本仓库几何代码绘制，可以完整复制练习。获取外部素材时，去作者原页检查许可是否允许网页使用、改作与商用（若你的项目有商业用途），按要求署名并保存来源、作者、许可URL与取得日期。搜索结果或“可下载”按钮不等于授权。取得合法许可后把文件放项目本地，记录在README；别直接盗链别人图床。一个简单记录可以写“自绘calendar.svg；作者：本练习作者；用途：课程例子，无外部图源”。未知授权照片不用作默认配套。

可选工具流程：在Figma新建设计文件，建立24×24图标Frame或360×200插画Frame，用矩形/圆形画同样形状，先统一颜色和线宽；选择Frame，右侧Export添加SVG并Export。位图选PNG、2x，透明需求时关闭背景填充，再导出后检查角落透明。以当前界面Export区为准；不同账号的功能限制可能不同，本课无需购买软件。[Figma官方导出步骤](https://help.figma.com/hc/en-us/articles/360040028114-Export-static-designs-from-Figma)。导出文件仍须按上面文件名与相对路径放回项目，不是“Figma里看得见就网站能用”。

素材练习答案：自己加一个地点图标，先画24×24几何SVG，再以48px显示，观察线条；做一张封面，统一品牌色和24单位留白，再测试长标题旁是否抢夺阅读。参考做法是先定义坐标、形状、颜色和间距，再导出；不要一上来下载一堆风格不同的图标。用白/深底检查透明、Network检查大小与404、Tab检查带图按钮名称；好素材要同时可读、可加载、可维护。

## 完整文件：按文件名复制后运行

下面不是缺少容器的 CSS 片段。主页面五个文件与素材实作四个文件都放同一文件夹；不要把 CSS 或 JS 代码贴进 HTML 的正文。

### 完整文件：index.html

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>山风社团 · 响应式练习</title>
  <link rel="stylesheet" href="./style.css">
  <script src="./app.js" defer></script>
</head>
<body id="top">
  <a class="skip" href="#main">跳到正文</a>
  <header class="topbar">
    <a class="brand" href="#top">山风社团</a>
    <nav aria-label="主要导航"><a href="#activities">活动</a><a href="#notice">公告</a><a href="#contact">联系</a></nav>
  </header>
  <main id="main" tabindex="-1">
    <section class="intro"><p>本月一起动手</p><h1>从一张卡片，做出适合各种屏幕的页面</h1><p>页面有四张活动卡、公告侧栏和联系区。搜索表单只演示本地检查；下一阶段再实现筛选。</p></section>
    <div class="layout">
      <aside id="notice" class="notice"><h2>公告</h2><p>活动开放给初学者。请阅读活动详情；本页不接受报名。</p><a href="#contact">查看联系方法</a></aside>
      <section id="activities" class="activity-section">
        <h2>活动列表</h2>
        <form id="search-form">
          <div class="field"><label for="keyword">活动关键词</label><input id="keyword" name="keyword" required maxlength="40" placeholder="例如：摄影"></div>
          <div class="field"><label for="city">所在城市</label><input id="city" name="city" required maxlength="30" placeholder="例如：台北"></div>
          <button type="submit">检查条件</button>
          <button type="button" disabled>报名暂未开放</button>
        </form>
        <p id="feedback" role="status">此表单仅在浏览器检查字段，不提交、不保存。</p>
        <div class="cards">
          <article class="card"><img src="./wide.svg" width="800" height="450" alt="山坡上的蓝色帐篷"><span class="badge">新活动</span><div class="card-body"><h3>周末户外摄影</h3><p>学习观察光线和构图。图片展示框是 16:9；换成竖图后仍不会拉伸。</p><details><summary>活动详情</summary><p>周六 09:00，集合地点：社团教室。需要自带手机。</p></details></div></article>
          <article class="card"><img src="./tall.svg" width="450" height="800" alt="近处一棵树与远处山坡"><div class="card-body"><h3>认识城市里的植物</h3><p>本图本来是竖图。cover 会裁掉上下部分；若细节重要，应改用 contain 或调整构图。</p><details><summary>活动详情</summary><p>周日 14:00，图书馆门口。无需提前学习植物学。</p></details></div></article>
          <article class="card"><img src="./wide.svg" width="800" height="450" alt="山坡上的蓝色帐篷" loading="lazy"><div class="card-body"><h3>写给第一次参加活动、还不知道准备什么的新同学的完整介绍</h3><p>这是用于检查长标题的卡片；没有强行限制标题高度。正文能随内容自然增高。</p><details><summary>活动详情</summary><p>周三 18:00，社团教室。可以先来旁听。</p></details></div></article>
          <article class="card"><img src="./tall.svg" width="450" height="800" alt="近处一棵树与远处山坡" loading="lazy"><div class="card-body"><h3>第四张卡片无需手调宽度</h3><p>新增卡片只修改 HTML，Grid 负责排列。测试长英文地址：very-long-example-address-without-normal-word-breaks.example</p><details><summary>活动详情</summary><p>周五 19:00，线上交流；地址将在真实组织活动时另行提供。</p></details></div></article>
        </div>
      </section>
    </div>
    <section id="contact" class="contact"><h2>联系与使用边界</h2><p>这是本地教学页面。没有服务器、账号或报名功能；不要在练习表单填写真实隐私。模拟联系人：社团学习小组。</p><a href="mailto:club@example.invalid">示例邮箱（不可投递）</a></section>
  </main>
  <footer>四张卡片 · 三种屏幕 · 用键盘也能操作</footer>
  <a class="back-top" href="#top" aria-label="回到页面顶部">回顶部</a>
</body>
</html>
```

### 完整文件：style.css

```css
:root {
  --background: #f6f4ee;
  --surface: #fff;
  --text: #263b33;
  --brand: #17624b;
  --space: 1rem;
  --border: #c9d2cb;
}
* { box-sizing: border-box; }
html { scroll-padding-top: 6rem; }
body { margin: 0; background: var(--background); color: var(--text); font: 1rem/1.7 system-ui, sans-serif; }
a { color: var(--brand); text-underline-offset: .25em; }
a:hover { text-decoration-thickness: .18em; }
:focus-visible { outline: 3px solid #873600; outline-offset: 4px; }
[id] { scroll-margin-top: 6rem; }
.skip { position: absolute; left: var(--space); top: -5rem; z-index: 20; background: var(--surface); padding: .5rem; }
.skip:focus { top: var(--space); }
.topbar { position: sticky; top: 0; z-index: 5; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space); padding: 1rem max(1rem, calc((100vw - 76rem) / 2)); background: var(--surface); border-bottom: 1px solid var(--border); }
.brand { font-weight: 700; }
nav { display: flex; flex-wrap: wrap; gap: var(--space); }
main { max-width: 76rem; margin: auto; padding: var(--space); }
.intro { max-width: 65ch; margin-block: 2rem; }
h1 { font-size: clamp(1.7rem, 4vw, 2.5rem); line-height: 1.3; }
h2 { font-size: 1.35rem; }
h3 { margin: 0 0 .5rem; font-size: 1.15rem; line-height: 1.5; }
.layout { display: grid; gap: 1.5rem; }
.notice, .contact { padding: 1.25rem; border: 1px solid var(--border); background: var(--surface); }
.notice { align-self: start; }
.activity-section { min-width: 0; }
form { display: flex; align-items: end; flex-wrap: wrap; gap: .75rem; }
.field { flex: 1 1 12rem; min-width: 0; }
label { display: block; font-weight: 600; }
input { width: 100%; min-width: 0; padding: .6rem; border: 1px solid #718a7c; border-radius: .25rem; font: inherit; }
button { flex: 0 0 auto; padding: .6rem .85rem; border: 1px solid var(--brand); border-radius: .25rem; background: var(--brand); color: white; font: inherit; cursor: pointer; }
button:hover:not(:disabled) { background: #0e4937; }
button:disabled { color: #46534b; background: #e5e9e6; border-color: #87968d; cursor: not-allowed; }
#feedback { min-height: 3.4em; }
.cards { display: grid; gap: var(--space); grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr)); }
.card { position: relative; min-width: 0; background: var(--surface); border: 1px solid var(--border); overflow-wrap: anywhere; }
.card img { display: block; width: 100%; max-width: 100%; height: auto; aspect-ratio: 16 / 9; object-fit: cover; }
.badge { position: absolute; top: .75rem; right: .75rem; padding: .15rem .5rem; color: white; background: #843e15; }
.card-body { padding: var(--space); }
summary { cursor: pointer; color: var(--brand); text-decoration: underline; }
.contact { margin-top: 2rem; max-width: 65ch; }
footer { padding: 2rem 1rem 5rem; text-align: center; }
.back-top { position: fixed; bottom: 1rem; right: 1rem; z-index: 6; padding: .5rem .75rem; background: var(--surface); border: 2px solid var(--brand); }
@media (min-width: 48rem) {
  .layout { grid-template-columns: 13rem minmax(0, 1fr); }
  .notice { position: sticky; top: 6rem; }
}
```

### 完整文件：app.js

```js
'use strict';
const form = document.querySelector('#search-form');
const feedback = document.querySelector('#feedback');
form.addEventListener('input', () => {
  for (const input of form.querySelectorAll('input')) input.setCustomValidity('');
  feedback.textContent = '条件已修改，请重新检查；本页不执行筛选。';
});
form.addEventListener('submit', event => {
  event.preventDefault();
  for (const input of form.querySelectorAll('input')) {
    input.setCustomValidity(input.value.trim() ? '' : '不能只填写空格');
  }
  if (!form.reportValidity()) return;
  feedback.textContent = `关键词“${form.keyword.value.trim()}”、城市“${form.city.value.trim()}”通过本地检查；没有提交、保存或筛选活动。`;
});
```

### 完整文件：wide.svg

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450"><rect width="800" height="450" fill="#cbe7ef"/><circle cx="640" cy="90" r="44" fill="#fbe59b"/><path d="M0 380 240 130 480 350 640 190 800 380V450H0Z" fill="#75977a"/><path d="M290 370 400 250 510 370Z" fill="#235c86"/><path d="M380 370 400 310 420 370Z" fill="#f6f0de"/></svg>
```

### 完整文件：tall.svg

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 800"><rect width="450" height="800" fill="#d8edf0"/><path d="M0 480 150 280 300 460 450 320V800H0Z" fill="#a2b98b"/><rect x="214" y="350" width="24" height="400" fill="#71533d"/><ellipse cx="226" cy="330" rx="130" ry="180" fill="#3f7351"/><circle cx="330" cy="100" r="48" fill="#fae598"/></svg>
```


### 完整文件：calendar.svg

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#17624b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 11h18"/><circle cx="8" cy="15" r="1" fill="#17624b" stroke="none"/></svg>
```

### 完整文件：poster-before.svg

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200"><rect width="360" height="200" fill="#ffef14"/><circle cx="55" cy="52" r="42" fill="#fe2978"/><rect x="165" y="35" width="140" height="100" fill="#142fff"/><path d="M10 195 105 88 225 194Z" fill="#18fe31"/></svg>
```

### 完整文件：poster-after.svg

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200"><rect width="360" height="200" rx="12" fill="#f2f4ea"/><circle cx="66" cy="64" r="32" fill="#e8ca79"/><rect x="200" y="40" width="120" height="96" rx="12" fill="#7eac94"/><path d="M24 176 104 80 200 176Z" fill="#17624b"/><path d="M40 176H320" stroke="#263b33" stroke-width="4" stroke-linecap="round"/></svg>
```

### 完整文件：assets.html

```html
<!doctype html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>亲手制作素材</title><style>
* { box-sizing: border-box; } body { margin: 0; padding: 1rem; color: #263b33; background: #f6f4ee; font: 1rem/1.7 system-ui; } main { max-width: 65ch; margin: auto; } img { display: block; max-width: 100%; height: auto; } .calendar { width: 48px; } .inline-link { color: #64368a; display: inline-flex; gap: .5rem; align-items: center; } .inline-link svg { width: 24px; height: 24px; } .inline-link:hover { color: #17624b; } button { font: inherit; margin-block: 1rem; padding: .5rem; } :focus-visible { outline: 3px solid #873600; outline-offset: 4px; }
</style></head>
<body><main><h1>自己制作SVG，并导出透明PNG</h1>
<h2>外部SVG文件</h2><img class="calendar" src="./calendar.svg" width="24" height="24" alt="日历图标"><p>该图为透明背景，放大仍清楚；颜色在SVG文件中定义。</p>
<h2>内联SVG继承文字颜色</h2><a class="inline-link" href="./index.html"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 11h18"/></svg>查看活动页面</a>
<h2>原始草稿</h2><img src="./poster-before.svg" width="360" height="200" alt="草稿：强烈黄底，三个大小间距不统一的彩色几何形">
<h2>统一配色与间距后</h2><img src="./poster-after.svg" width="360" height="200" alt="改进：米色背景、绿色几何形、留白和统一圆角">
<h2>导出2倍像素的透明PNG图标</h2><p>导出上方calendar.svg原图，包含日期点和你修改的线宽、圆角、配色。HTTP访问可以直接点击下载；双击本页时，先在下面选择自己保存的calendar.svg。修改后请重新选择文件，再导出。结果为96×96像素，网页显示48×48时有2倍像素；不会改写SVG。</p><label for="svg-file">选择自己编辑的SVG（双击本页时需要）</label><input id="svg-file" type="file" accept=".svg,image/svg+xml"><button id="download" type="button">下载96×96透明PNG</button><p id="status" role="status"></p>
<a href="./index.html">返回作品</a>
</main><script>
// Export the actual source file, not the separate inline currentColor demo.
const fileInput = document.querySelector('#svg-file');
fileInput.addEventListener('change', () => {
  document.querySelector('#status').textContent = fileInput.files[0]
    ? `已选择${fileInput.files[0].name}，点击下载导出；修改源文件后请重新选择。`
    : '未选择本地SVG；HTTP访问会读取上方calendar.svg。';
});
document.querySelector('#download').addEventListener('click', async () => {
  const status = document.querySelector('#status');
  try {
    let source;
    const chosen = fileInput.files[0];
    if (chosen) {
      if (!/\.svg$/i.test(chosen.name)) throw new Error('请选择.svg文件');
      if (chosen.size > 128000) throw new Error('本练习只导出128KB以内的简单SVG');
      source = await chosen.text();
    } else {
      if (location.protocol === 'file:') {
        status.textContent = '请先选择自己保存的calendar.svg，再点击下载；双击打开时浏览器不允许直接导出本地跨文件画布。';
        fileInput.focus();
        return;
      }
      const response = await fetch(document.querySelector('.calendar').src, { cache: 'no-store' });
      if (!response.ok) throw new Error(`SVG读取失败：HTTP ${response.status}`);
      source = await response.text();
    }
    const image = new Image();
    const dataURL = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source);
    await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = dataURL; });
    const canvas = document.createElement('canvas');
    canvas.width = 96;
    canvas.height = 96;
    canvas.getContext('2d').drawImage(image, 0, 0, 96, 96);
    canvas.toBlob(blob => {
      if (!blob) { status.textContent = '导出失败，请保留SVG源文件。'; return; }
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'calendar-2x.png';
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      status.textContent = '已请求下载，请确认calendar-2x.png保存在下载文件夹。';
    }, 'image/png');
  } catch (error) { status.textContent = `导出失败：${error.message || 'SVG无法读取'}。保留源文件，检查保存状态和路径后再试。`; }
});
</script></body></html>
```

## 运行验收：正常、边界与失败都亲手做

正常流程：刷新页面，点击导航“活动”，应到活动区并且标题不被粘附页眉遮住；展开第一卡片的详情，显示周六09:00信息。关键词“摄影”、城市“台北”，点检查，地址栏保持原地址，四张卡片数量不变，反馈为下列文字。

```output
关键词“摄影”、城市“台北”通过本地检查；没有提交、保存或筛选活动。
```

边界流程：两个字段为空时点击检查，浏览器定位必填字段；只填空格时应提示“不能只填写空格”。填写后按Enter，同样只做本地检查。更改城市，反馈马上变成“条件已修改，请重新检查”。第三卡片长标题应完整换行；第四卡片长英文不能制造页面横向滚动。

360px时公告在列表上方，活动卡单列；768px时公告与活动区双列，活动卡单列；1440px时活动卡三列，第四卡在第二行。用浏览器缩放200%再检查一次。设备模拟只是布局检查，真实手机上的字体、触摸与工具栏仍要人工复查。

键盘流程：刷新，按Tab，第一焦点是“跳到正文”；Enter将焦点移到正文。继续Tab应能访问品牌、导航、公告链接、两字段、检查按钮、四个summary、联系链接、回顶部。禁用报名按钮不应获得焦点。把summary聚焦后按Enter/空格应能展开；Shift+Tab返回上一项。不要要求固定焦点数量来掩盖新加链接；关注所有主要操作是否可达、焦点是否可见。

失败实作A：临时把`.cards`改为`width:1200px`。360px出现横向滚动。F12打开Elements点卡片容器，Styles中取消width这一条，如果立即恢复，原因已得到证据。Computed搜索width，确认实际宽度。修复源文件并刷新；DevTools的临时取消不会自动写回VS Code。不要用body overflow-x:hidden掩盖卡片超出屏幕而看不到内容。

失败实作B：把第二张图片路径改为`./Tall.svg`后保存，在区分大小写的托管环境会404；本机Windows未必暴露这个错误。Network勾“Disable cache”后刷新，过滤Img，检查实际URL与Status，再改回`tall.svg`。本机file方式没有HTTP状态码，所以这项要用本地服务器。若图片加载200却拉伸，去Computed看height/object-fit，问题属于CSS，不属于服务器。

失败实作C：将city的label for改成cities。点击文字不再聚焦，Elements可见for与id不匹配。改回city；这比盲目添加aria-label更直接。

## 独立练习与参考答案

先写预测，再改代码、记录实际结果；看懂答案后仍需自己复现。

### 练习1：只用一个输入和一个按钮

把表单简化成一个关键词字段，要求输入占剩余空间，按钮不被拉宽。修改app.js，避免继续访问已删除的city。验证长关键词、320px和Enter。

### 参考答案1

字段用flex:1 1 12rem、min-width:0，按钮用flex:0 0 auto；父级wrap。反馈只读取仍存在的keyword。不能删HTML后保留form.city.value，否则submit会报TypeError。若想单排，先确认320px时输入仍有足够宽度，不适合就允许换行。

### 练习2：第五张卡与一张竖图

新增第五张卡，不写nth-child宽度。第二张图改为contain，比较cover两种结果，说明何时该选哪一种。

### 参考答案2

复制完整article改标题与详情，Grid自动继续排；contain不裁图但留空，cover填满但裁图。作品照片可按构图cover，海报有文字时应保留全文。新增后再按360/768/1440验收，原先第四张测试不能代表所有新增内容。

### 练习3：角标与层级

在第一卡片角标加z-index:10000，在卡片加transform:translateY(0)，滚动与页眉交叠，解释为什么角标不能任意越过页眉。然后恢复代码。

### 参考答案3

transform建立独立叠放上下文，子元素数值只在内部比较；页眉本身的上下文位置更高。应该决定整个卡片与页眉的关系，而非不断放大角标数字。正常设计中页眉在卡片上方合理，不需要“修”成角标盖住导航。

### 练习4：自主确定断点

将公告内容扩成两段，活动标题增长一倍，从360px逐渐拉宽。记录何时可以舒服地并排，再调整48rem断点。不要只报“使用了媒体查询”。

### 参考答案4

默认单列，min-width规则增强多列；断点必须给公告和卡片同时留下可读宽度。若公告在768px导致活动很窄，可把增强推到60rem或把公告改为顶部区。需要记录改变前后实际截图与Grid宽度，选择由内容证据支持。

### 练习5：可读性、变量和无障碍

改三个颜色变量、行高和介绍区行宽，检查按钮文字对比、键盘轮廓与200%缩放。删掉某张有意义图片的alt再描述读者会丢掉什么信息，随后补回。

### 参考答案5

主题变量改变多个区域，仍需检查所有组合；正文颜色与白底不要改成浅灰。行高过小会挤压，行宽过大会难回读；参数应按内容和字体调整。alt不是“图片已加载”的提示，而是内容替代。语义、文字状态、标题层级、焦点和图片解释要一起成立。

## 保存证据与下一步

在自己的notes/web记录360/768/1440三张截图、一次200%缩放与Tab检查、一个你故意制造并修好的故障。写出“导航为什么选Flex、活动为什么选Grid、角标为什么能脱离流而卡片不能”。运行参考作品不等于完成练习；独立修改后的验收才是证据。

准备好后进入[让页面回应操作](#/followup/web/1)，将“本地检查条件”变成真正的数据筛选和收藏。配套源码可在仓库 `exercises/web/followup-00` 阅读；代码不依赖远程素材或账号。
