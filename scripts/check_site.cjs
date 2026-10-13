/* Run with Node.js: validates published assets and curriculum coverage. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({ window: {} });
for (const name of ['curriculum', 'adaptations', 'resources', 'ai-guide', 'learning-lab', 'getting-started', 'knowledge-guides']) {
  const source = fs.readFileSync(path.join(root, 'assets/data', name + '.js'), 'utf8');
  vm.runInContext(source, context, { filename: name + '.js' });
}
new vm.Script(fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8'));
new vm.Script(fs.readFileSync(path.join(root, 'assets/workbench.js'), 'utf8'));
new vm.Script(fs.readFileSync(path.join(root, 'assets/learning.js'), 'utf8'));
new vm.Script(fs.readFileSync(path.join(root, 'assets/getting-started.js'), 'utf8'));
require('node:child_process').execFileSync(process.execPath, [path.join(__dirname, 'build_getting_started.cjs'), '--check'], { stdio: 'inherit' });
require('node:child_process').execFileSync(process.execPath, [path.join(__dirname, 'build_knowledge_guides.cjs'), '--check'], { stdio: 'inherit' });
require('node:child_process').execFileSync(process.execPath, [path.join(__dirname, 'build_course_book.cjs'), '--check'], { stdio: 'inherit' });
require('node:child_process').execFileSync('python', [path.join(__dirname, 'build_course_projects.py'), '--check'], { stdio: 'inherit' });
require('node:child_process').execFileSync('python', [path.join(__dirname, 'build_followup_examples.py'), '--check'], { stdio: 'inherit' });
require('node:child_process').execFileSync('python', [path.join(__dirname, 'build_vscode_starter.py'), '--check'], { stdio: 'inherit' });
require('node:child_process').execFileSync(process.execPath, [path.join(__dirname, 'version_site_assets.cjs'), '--check'], { stdio: 'inherit' });
assert.equal(context.window.GETTING_STARTED.length, 4);
for (const guide of context.window.GETTING_STARTED) assert(guide.markdown.includes('##') && fs.existsSync(path.join(root, guide.source)));
for (const guide of context.window.GETTING_STARTED) {
  for (const image of guide.markdown.matchAll(/!\[[^\]]*\]\(\.\.\/\.\.\/(assets\/images\/tutorials\/[\w-]+\.png)\)/g)) assert(fs.existsSync(path.join(root,image[1])),'Missing tutorial screenshot '+image[1]);
}
const courses = context.window.LEARNING_CURRICULUM;
const ids = new Set();
for (const [track, count] of [['web', 14], ['go', 28]]) {
  const course = courses[track];
  assert.equal(course.lessons.length, count, track + ' lesson coverage');
  for (let i = 0; i < count; i++) {
    const lesson = course.lessons[i];
    assert.equal(lesson.id, track + '-' + String(i + 1).padStart(2, '0'));
    assert.equal(lesson.day, i + 1);
    assert(!ids.has(lesson.id)); ids.add(lesson.id);
    for (const field of ['title', 'summary', 'task', 'hint', 'sourceMarkdown']) assert.equal(typeof lesson[field], 'string', lesson.id + ' ' + field);
    assert(lesson.sourceMarkdown.length > 100, lesson.id + ' full source lesson');
    assert(lesson.checks.length >= 2 && lesson.checks.length <= 4);
    assert.equal(lesson.quiz.options.length, 3);
    assert(Number.isInteger(lesson.quiz.answer) && lesson.quiz.answer >= 0 && lesson.quiz.answer < 3);
    assert(course.stages.some(stage => stage.id === lesson.stageId && stage.lessonIds.includes(lesson.id)));
  }
  const listed = course.stages.flatMap(stage => Array.from(stage.lessonIds));
  assert.deepEqual([...listed].sort(), Array.from(course.lessons, lesson => lesson.id).sort());
}
assert.equal(courses.web.followups.length, 12);
for (const followup of courses.web.followups) assert(followup.task && followup.checks.length && followup.sourceSection.length > 100);
assert.equal(Object.keys(context.window.LEARNING_FOLLOWUP_GUIDES).length,12);
for(let index=0;index<12;index++){
  const id='web-'+String(index).padStart(2,'0'),guide=context.window.LEARNING_FOLLOWUP_GUIDES[id];
  assert(guide&&fs.existsSync(path.join(root,guide.source)),id+' complete stage source');
  assert(fs.existsSync(path.join(root,guide.examplePath,'README.md')),id+' runnable source README');
  assert(fs.existsSync(path.join(root,guide.archivePath)),id+' complete source download');
  assert(guide.markdown.includes('```') && guide.markdown.includes('## '),id+' teaching and examples');
}
const adaptation = context.window.LEARNING_ADAPTATIONS;
assert.equal(adaptation.goBeginner02.checks.length, courses.go.lessons[1].checks.length);
assert(!adaptation.goBeginner02.task.includes('熟悉的 C++'));
assert(adaptation.webPreviews['web-05'].includes('topbar'));
const resources = context.window.LEARNING_RESOURCES;
assert.equal(resources.length, 23);
assert.equal(new Set(resources.map(item => item.id)).size, resources.length);
for (const resource of resources) assert.equal(new URL(resource.url).protocol, 'https:');
const ai = context.window.AI_LEARNING_GUIDE;
assert.equal(ai.prompts.length, 10);
assert.equal(new Set(ai.prompts.map(item => item.id)).size, 10);
for (const prompt of ai.prompts) assert(prompt.prompt && prompt.why && prompt.nextStep);
const lab = context.window.LEARNING_LAB;
assert.equal(lab.topics.length, 24);
assert.equal(lab.exercises.length, 18);
const topicIds = new Set(lab.topics.map(item => item.id));
const exerciseIds = new Set(lab.exercises.map(item => item.id));
const sourceIds = new Set(lab.sources.map(item => item.id));
assert.equal(topicIds.size, lab.topics.length);
assert.equal(exerciseIds.size, lab.exercises.length);
assert.equal(sourceIds.size, lab.sources.length);
for (const source of lab.sources) assert.equal(new URL(source.url).protocol, 'https:');
for (const item of [...lab.topics, ...lab.exercises]) {
  assert(['web', 'go'].includes(item.track), item.id + ' track');
  assert(['foundation', 'applied', 'project'].includes(item.level), item.id + ' level');
  for (const id of item.lessonIds) assert(ids.has(id) && id.startsWith(item.track + '-'), item.id + ' related lesson');
  if (item.followup !== undefined) assert(item.track === 'web' && Number.isInteger(item.followup) && courses.web.followups[item.followup], item.id + ' followup');
}
for (const topic of lab.topics) {
  const guide=context.window.LEARNING_KNOWLEDGE_GUIDES[topic.id];
  assert(guide&&fs.existsSync(path.join(root,guide.source)),topic.id+' detailed lesson source');
  assert(guide.markdown.includes('```')&&guide.markdown.includes('## '),topic.id+' examples and explanation');
  for (const field of ['title', 'group', 'summary', 'why', 'example', 'expected', 'pitfall']) assert(typeof topic[field] === 'string' && topic[field].trim(), topic.id + ' ' + field);
  assert(topic.points.length >= 3 && topic.points.every(pair => pair.length === 2 && pair.every(Boolean)));
  assert(topic.recall.length === 2 && topic.recall.every(Boolean));
  for (const id of topic.prerequisites) assert(topicIds.has(id) && id !== topic.id, topic.id + ' prerequisite');
  for (const id of topic.sourceIds) assert(sourceIds.has(id), topic.id + ' source');
  assert(lab.exercises.some(exercise => exercise.topicIds.includes(topic.id)), topic.id + ' linked exercise');
}
assert.equal(Object.keys(context.window.LEARNING_KNOWLEDGE_GUIDES).length,lab.topics.length);
assert(context.window.LEARNING_LESSON_GUIDES['go-06'].starterCode.includes('example.com/learn/go-packages/calc'));
assert(fs.existsSync(path.join(root,context.window.LEARNING_LESSON_GUIDES['go-06'].source)));
function visitTopic(id, pathIds = new Set()) {
  assert(!pathIds.has(id), 'cyclic prerequisites at ' + id);
  const next = new Set(pathIds); next.add(id);
  for (const prerequisite of lab.topics.find(topic => topic.id === id).prerequisites) visitTopic(prerequisite, next);
}
for (const id of topicIds) visitTopic(id);
for (const id of ids) assert(lab.topics.some(topic => topic.lessonIds.includes(id)), id + ' supplementary explanation');
for (const exercise of lab.exercises) {
  for (const field of ['title', 'goal', 'task', 'stretch', 'starter', 'run', 'limitations']) assert(typeof exercise[field] === 'string' && exercise[field].trim(), exercise.id + ' ' + field);
  assert(Number.isInteger(exercise.minutes) && exercise.minutes > 0);
  assert(exercise.steps.length === 3 && exercise.checks.length >= 3);
  assert(exercise.cases.length >= 3 && exercise.cases.every(pair => pair.length === 2 && pair.every(Boolean)));
  for (const id of exercise.topicIds) assert(topicIds.has(id) && id.startsWith(exercise.track + '-'), exercise.id + ' topic');
  if (exercise.preview) assert(exercise.track === 'web' && exercise.language === 'html' && exercise.starter.includes('<meta charset="UTF-8">'));
  if (exercise.files) {
    const directory = path.resolve(root, exercise.files);
    assert(directory.startsWith(root + path.sep) && exercise.files.startsWith('exercises/' + exercise.track + '/'), exercise.id + ' exercise directory');
    assert(fs.existsSync(path.join(directory, 'README.md')));
    assert(fs.existsSync(path.join(directory, exercise.track === 'web' ? 'index.html' : 'go.mod')));
  }
}
for (const course of Object.values(courses)) for (const stage of course.stages.filter(stage => stage.lessonIds.length)) {
  const milestone = lab.milestones[stage.id];
  assert(milestone?.outcome && milestone.evidence, stage.id + ' stage acceptance');
  for (const id of milestone.exerciseIds) assert(exerciseIds.has(id));
}
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  const reference = match[1];
  if (/^(?:#|https?:|data:)/.test(reference)) continue;
  assert(fs.existsSync(path.resolve(root, reference.split(/[?#]/)[0])), 'missing asset: ' + reference);
}
assert(fs.existsSync(path.join(root, '.nojekyll')));
console.log('PASS: 42 lessons, 12 followups, 24 knowledge topics, 18 exercises, 23 resources, 10 AI templates; linked learning coverage and all entry assets.');
