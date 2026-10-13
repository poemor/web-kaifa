# JavaScript：先把输入、处理和输出分开

用户只有30分钟空闲，页面应筛出能在30分钟内完成的活动。这不是先给按钮写一串代码，而是先定义输入是什么、用什么规则处理、最后显示什么。本课先写一个计算函数，再接到数字输入框与按钮上。即使以后改成别的页面，这个函数仍能复用。前置是能运行完整HTML文件；代码放在body末尾的script中，由浏览器执行，不需要先安装Node或编译器。

## 把原理一步一步拆开

### 1. 字符串、数字、布尔值与空值
`'HTML'`是字符串，20是数字，`20<=30`产生布尔值true。输入框的value即使看起来是30，读出来仍是字符串，需要显式Number转换。`'30'+1`得到字符串'301'，`Number('30')+1`得到31。特别注意Number('')得到0，因此本例先检查原始输入是否空白，不能把空输入当作用户选择了0分钟。NaN表示数值转换没得到有效数字，Number.isFinite再过滤NaN与无穷值。

### 2. 数组组织多个对象
activities是数组，每项对象包含title与minutes两个属性；`item.minutes`读取某项时长。数组顺序与对象属性职责不同：数组可以有第0项、第1项，对象则以字段名表达意义。const让activities这个变量不能重新绑定到别的数组，但不自动冻结数组内部；直接改某项title仍可能改变原数据。不要把const误解为深度不可变。

### 3. filter挑选，map转换
filter对每个活动执行判断，返回true的项保留在新数组中，<=使刚好30分钟的CSS活动也被包含。map把每个保留对象转换成title字符串。二者返回新数组，不会因这两步直接删除原数组项，但新数组里若仍是对象引用，并非深度复制。排序sort会修改原数组，想保留原顺序时需先复制数组；本课没有排序，先把筛选规则讲清楚。

### 4. 函数要明确参数与返回值
selectTitles(items,limit)的items是活动数组，limit是数字。函数返回标题数组，不读取输入框、不改页面、不发请求，这使它容易用固定输入核对。函数体里的return把结果交给调用者；console.log只是打印，不能替代return。把计算与DOM分开以后，错误可能来自转换、筛选或显示，每一步都能单独观察，而不是把所有问题叫作“按钮坏了”。

### 5. 分支与结果显示
if先拒绝空输入、非法数字与越界，再做计算。titles.length代表数量，join把多个标题拼成读得懂的一行。没有匹配时给空结果说明，不把空数组当异常。大括号、圆括号和比较符号都有语法意义；先格式化、看Console具体错误行，再修改。

## 在 VS Code 中创建、保存与运行

1. 在自己的练习目录里新建 `web-js` 文件夹，例如放在 `exercises/web/` 下；不要在 materials 原教材中覆盖文件。打开 VS Code，选择“文件 → 打开文件夹”，选中这个新文件夹。
2. 在左侧资源管理器用“新建文件”按下面清单创建文件。带 `/` 的名字表示子文件夹，例如 `assets/style.css` 需要 assets 文件夹，不能把斜杠当普通名字。逐个复制对应完整代码，Windows 用 Ctrl+S，macOS 用 Command+S 保存全部文件。
3. 在 VS Code 资源管理器中右键 index.html，选择“在文件资源管理器中显示”（macOS为Finder），然后双击该文件用浏览器打开。浏览器显示页面，VS Code负责编辑；不要只点编辑器的播放图标，也无需编译HTML。每次修改先保存，再回浏览器刷新。

文件清单：

- `index.html`


## 完整可运行示例

### 完整文件：index.html

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>活动时长筛选</title>
    <style>
    *{
      box-sizing:border-box
    }
    body{
      font:1rem/1.7 sans-serif;
      max-width:36rem;
      margin:1rem auto;
      padding:1rem
    }
    input,button{
      max-width:100%;
      padding:8px
    }
    pre{
      white-space:pre-wrap;
      overflow-wrap:anywhere
    }
    </style>
  </head>
  <body>
    <h1>活动时长筛选</h1>
    <label for="limit">最多有几分钟（0—120）</label>
    <input id="limit" type="number" value="30" min="0" max="120">
    <button type="button" id="run">计算</button>
    <pre id="output" aria-live="polite">点击计算，查看筛选结果。</pre>
    <script>
    const activities=[{
      title:'HTML',minutes:20
    },{
      title:'CSS',minutes:30
    },{
      title:'Go',minutes:40
    }];
    function selectTitles(items,limit){
      return items.filter(item=>item.minutes<=limit).map(item=>item.title);
    }
    document.querySelector('#run').addEventListener('click',()=>{
      const raw=document.querySelector('#limit').value.trim();
      const limit=Number(raw);
      const output=document.querySelector('#output');
      if(raw===''||!Number.isFinite(limit)||limit<0||limit>120){
        output.textContent='请输入 0—120 之间的有限数字。';
        return;
      }
      const titles=selectTitles(activities,limit);
      output.textContent=titles.length?`匹配 ${titles.length} 项：${titles.join('、')}`:'没有匹配活动。';
    });
    </script>
  </body>
</html>
```

## 具体结果与解释

```output
输入30并点击计算，显示“匹配 2 项：HTML、CSS”；输入20显示一项HTML；输入0显示“没有匹配活动”；清空输入或输入超出0—120的值显示输入错误。
```

脚本第一行定义三个活动；第二步把筛选算法放入selectTitles；按钮监听读取输入、转换并检查；合法时调用函数，最后只在一处更新output。页面初次打开没有自动计算，结果区说明下一步，让用户知道需要点击按钮。

打开浏览器Console，输入 `selectTitles(activities,30)` 应看到两项标题数组；输入 `activities.length` 仍为3，证明筛选没有删原数据。再把<=改<，预测30时CSS会被排除，保存、刷新、验证。这种变化测试能揭示边界符号的重要性，不能只使用远离边界的20与40。

## 两种常见问题与排查顺序

### 情况一：数字被拼接成奇怪字符串
检查输入框value的类型，用Console的typeof观察，不要根据视觉形状判断。先trim检查空白，再转换，再检查有限数与业务范围；只调用Number而不做前后检查并不完整。type=number改善输入体验，但脚本与真实后端仍要验证数据。

### 情况二：函数算对了，页面仍然空
检查函数是否有return，调用处是否读取返回值，DOM选择器是否匹配。Console.log能看到值，不代表页面会自动显示。另一个边界是大小写：属性是minutes，写Minutes得到undefined，比较结果不会按期望工作。记录一条实际活动对象与函数输出，逐步定位错误，不要一次改三层。

## 变化练习

增加活动“测试”，时长30；把筛选上限设30，预测标题与数量。再要求只显示时长大于0且不超过上限的活动，加入0分钟项验证它被排除。

### 参考答案

新活动30满足<=30，所以结果变成HTML、CSS、测试，共3项。若要求排除0分钟，判断应为 `item.minutes>0 && item.minutes<=limit`。&&要求两个条件同时成立，不是写成 `0<item.minutes<=limit`，后者会先产生布尔值再进行下一次比较。保留原数组并增加边界项，核对过滤后的新数组。

## 本课自查

- value为什么需要转换，空字符串转换为什么危险？
- filter与map各返回什么？
- return与console.log有什么区别？
- const是否阻止对象属性被改？
- 刚好等于上限应怎样用例验证？

能运行示例是起点，不等于已经学完。请先遮住参考答案，预测变化结果，再独立修改并记录实际结果。如果仍有问题，向AI提供目标、文件结构、自己的代码、具体操作、期待与实际结果、已尝试步骤；让它先定位最小问题，再自己验证修改。

## 继续查证

- [MDN：JavaScript首步](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/A_first_splash)
- [MDN：filter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter)
- [MDN：Number.isFinite](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isFinite)
