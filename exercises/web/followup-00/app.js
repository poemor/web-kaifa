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
