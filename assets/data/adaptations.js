/* 新增教学补充：原教材保留不动，预览底板只提供HTML结构。 */
(() => {
  const illustration = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="480" viewBox="0 0 960 480"><rect width="960" height="480" fill="#e9f1eb"/><circle cx="730" cy="120" r="72" fill="#d5b967"/><path d="M0 390 245 140 450 335 610 200 960 480H0Z" fill="#96b39f"/><path d="M0 470 280 280 570 480H0Z" fill="#607e6c"/></svg>'
  );
  const image = (alt, width = 960) => `<img src="${illustration}" alt="${alt}" width="${width}" height="${width / 2}">`;
  const card = (title, index, withImage = false) => `<article class="card" id="activity-${index}">${withImage ? image('活动示意图：青绿色山丘和太阳') : ''}<div class="card-content"><h3>${title}</h3><p>周六下午，一起练习并交流遇到的问题。</p><a href="#activity-${index}">查看活动介绍</a></div></article>`;
  const localForm = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>社团留言：本地检查</title>
  <style>
    * { box-sizing: border-box; }
    body { max-width: 36rem; margin: 2rem auto; padding: 1rem; font: 1rem/1.7 sans-serif; }
    label, input, textarea { display: block; }
    input, textarea { width: 100%; padding: .6rem; margin-bottom: 1rem; }
    button { padding: .6rem; }
    :focus-visible { outline: 3px solid #164e80; outline-offset: 3px; }
  </style>
</head>
<body>
  <h1>社团留言</h1>
  <p>演示表单暂不接受报名。这里只检查本地输入，不发送或保存信息。</p>
  <form id="local-form">
    <label for="student-name">称呼（必填）</label>
    <input id="student-name" name="name" type="text" required maxlength="30">
    <label for="message">你希望增加什么活动？（必填）</label>
    <textarea id="message" name="message" rows="3" required maxlength="500"></textarea>
    <button type="submit">检查表单字段</button>
    <button type="button" id="clear-input">清空本地输入</button>
  </form>
  <p id="feedback" role="status">尚未检查。</p>
  <script>
    const form = document.querySelector('#local-form');
    const feedback = document.querySelector('#feedback');
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      for (const id of ['student-name', 'message']) {
        const field = document.getElementById(id);
        if (!field.value.trim()) {
          feedback.textContent = '必填内容不能只包含空格，请检查称呼与留言。';
          field.focus();
          return;
        }
      }
      feedback.textContent = '字段通过本地检查，尚未提交或保存。';
    });
    form.addEventListener('input', function () {
      feedback.textContent = '输入已修改，请重新检查。';
    });
    document.querySelector('#clear-input').addEventListener('click', function () {
      form.reset();
      feedback.textContent = '本地输入已清空，未发送数据。';
      document.querySelector('#student-name').focus();
    });
  </script>
</body>
</html>`;

  window.LEARNING_ADAPTATIONS = {
    webForm12: {
      starterCode: localForm,
      sourceMarkdown: `# 做一个诚实的表单界面

本课在自己电脑上检查称呼和活动建议；没有后端，因此不会接收报名。仅写 form action="#" 仍可能产生带姓名与留言的请求，不能用注释代替阻止提交的代码。下面是完整本地演示，原教材在资料索引中保留供对照。

## 在 VS Code 保存和运行

1. 新建独立练习文件夹 web-form，使用“文件 → 打开文件夹”打开。
2. 新建 index.html，复制下面完整代码，Ctrl+S（Mac 用 Cmd+S）保存。
3. 在资源管理器中右键文件，选“在文件资源管理器中显示”（Mac 为 Finder），双击用浏览器打开。不需要编译 HTML，也不需要安装后端。
4. 先点击 label，确认聚焦对应输入框；空输入点检查应出现原生必填提示。填写测试称呼与留言，点击检查，预期显示“尚未提交或保存”，浏览器地址不变。
5. 修改一个字段，旧通过反馈立即失效；只填空格时提示修正并聚焦该字段。点击“清空本地输入”，两个字段变空，焦点回到称呼框。每次改代码都先保存再刷新。

## 完整文件：index.html

\`\`\`html
${localForm}
\`\`\`

## 关键代码怎样连接

label 的 for 和控件 id 配对；name 是提交数据的字段名，不是可见标签。required 检查空值，maxlength 控制长度，但空格需要脚本用 trim 再检查。监听表单的 submit 能处理按钮和键盘 Enter；event.preventDefault 阻止默认导航，随后才做本地检查。input 事件表示字段改变，要撤销旧反馈；清空按钮明确 type=button，不会提交。不要把控件 id/name 命名为 reset，否则可能遮蔽 form.reset() 方法。

role=status 提供可感知的反馈；textContent 写入普通文字，不把用户内容当 HTML。Tab 应依次经过称呼、留言、检查、清空，Shift+Tab 返回，可见边框提示当前焦点。浏览器检查能被绕过；以后真正连接后端时，服务器仍必须校验和授权。

## 独立修改与验收

把问题改成你自己的社团需求，保持标签、焦点、空格检查和反馈真实。用普通内容、空字符串、全空格和很长文本各试一次，写下实际结果。能解释为什么显示“检查通过”却不能说“报名成功”，再按本课验收记录自己的成果。
`
    },
    goBeginner02: {
      title: '用循环和判断完成三个小练习',
      summary: '不需要C++基础：先求总和，再判断分数，最后让函数返回几个结果。',
      task: '在第1课的练习模块中完成三件事：① SumTo(n)计算1到n的总和，n=5得到15，n=0得到0，负数报告输入无效。② Passed(score)判断是否达到60分，59得到false，60得到true；小于0或大于100报告输入无效。③ Stats(scores)返回总分和平均分，[60,80,100]得到240和80，[60,61]得到121和60.5；空列表或非法分数报告输入无效。先自己写下预期，再运行核对。',
      checks: [
        '三个练习都核对了指定输入输出；0、负数、59/60分、空列表与非法分数有实际结果记录',
        '能用for累加、用if判断，能写返回总分与平均分等多个值的函数',
        '能解释函数中的:=、变量作用域，以及为什么算平均分时要用float64显式转换'
      ],
      hint: '先只做SumTo：total存总和，循环里每次加一个数。再写Passed的if。Stats先累加，除法前检查列表不为空，再用float64(total)/float64(len(scores))计算平均值。bool是true或false；函数可以用逗号返回两个结果。遇到新词先查这一课讲义，或在提问台要求只解释一个词。',
      starterCode: `package main

import "fmt"

func main() {
    // 小示例：先预测1+2+3，再运行；它不是三个练习的完整答案。
    n := 3
    total := 0
    for i := 1; i <= n; i++ {
        total += i
    }
    fmt.Println("总和：", total)

    average, valid := mean(total, n)
    if valid {
        fmt.Println("平均值：", average)
    } else {
        fmt.Println("数量必须大于0")
    }
    // 接着自己实现SumTo、Passed和Stats，按任务逐项验证。
}

// 演示多返回值；valid为false时，不把average当作有效结果。
func mean(total, count int) (float64, bool) {
    if count <= 0 {
        return 0, false
    }
    return float64(total) / float64(count), true
}`,
      language: 'go'
    },
    webPreviews: {
      'web-03': '<main><h1>算法社团</h1><section><h2>关于我们</h2><p>每周写一点代码，再交流各自的做法。</p></section><section><h2>近期活动</h2><p class="highlight">本周六：基础图论交流。</p><p>这段普通文字不使用highlight类，可以比较两段文字的变化。</p></section></main>',
      'web-04': '<article class="card"><h3>周六算法训练</h3><p><time datetime="2026-10-17">10月17日，14:00</time></p><p>带上自己的电脑，一起完成一道小题并交流解法。</p><a href="#details">活动介绍</a></article><section id="details"><h2>活动说明</h2><p>观察卡片宽度与内外间距的变化。</p></section>',
      'web-05': '<header class="topbar"><h1>算法社团</h1><nav aria-label="页面导航"><a href="#about">关于我们</a><a href="#events">近期活动</a><a href="#contact">联系我们</a></nav></header><main><section id="about"><h2>关于我们</h2><p>每周一次训练，一起读题、写代码和复盘。</p></section><section id="events"><h2>近期活动</h2><p>周六：基础图论交流。</p></section><section id="contact"><h2>联系我们</h2><p>欢迎在活动现场交流。</p></section></main>',
      'web-06': `<section class="cards" aria-label="近期活动">${card('算法训练', 1, true)}${card('读题交流', 2, true)}${card('代码复盘', 3, true)}</section>`,
      'web-08': `<section class="cards" aria-label="活动网格">${card('基础图论', 1)}${card('动态规划', 2)}${card('双指针练习', 3)}${card('二分查找', 4)}${card('一起分析ThisIsAnUnusuallyLongActivityTitleWithoutSpaces', 5)}</section>`,
      'web-09': `<main class="container"><section class="intro"><div><h1>一起把题目做出来</h1><p>先读清楚输入和输出，画一张小图，再写出自己想到的做法。</p><p>每周六下午有开放训练。新手可以先做一道简单题，带着结果和卡住的位置来交流。</p></div><aside>${image('社团活动示意图：山丘与太阳')}<p>活动时间：周六14:00</p></aside></section></main>`,
      'web-10': '<main class="container"><h1>周六一起写点代码</h1><p>带上你正在练习的小题，不需要一次把所有功能写完。把一个具体问题说清楚，就可以开始讨论。</p><p class="muted">本周六14:00 · 机房开放训练</p><section><h2>先做哪件事</h2><p>先读题，再写出一版自己的代码。遇到不确定的输出，手算一组小输入，然后运行核对。</p><p>长段落可以帮助你观察正文的行长和行高。缩窄预览区域后，检查文字是否仍然容易阅读。</p></section></main>',
      'web-11': `<main class="flex-main"><article><h1 class="long-title">社团活动公告：ThisIsAVeryLongTitleWithoutSpacesThatNeedsToWrapOnSmallScreens</h1><p>拖窄预览区域，检查这段长标题、导航和右侧图片有没有把页面撑宽。</p><nav aria-label="活动导航"><a href="#training">本周训练安排</a> <a href="#discussion">读题与解法交流</a> <a href="#review">代码问题复盘</a></nav><section id="training"><h2>训练安排</h2><p>周六14:00开始。</p></section><section id="discussion"><h2>解法交流</h2><p>试着解释自己的做法。</p></section><section id="review"><h2>代码复盘</h2><p>记录一个问题和验证结果。</p></section></article><aside>${image('活动预览插图：山丘与太阳', 1280)}<p>这张图有较大的原始宽度，请观察它怎样适应父容器。</p></aside></main>`
    }
  };
})();
