
## Basic usage

%%dv
const tasks = dv.pages('"recipes"').file.tasks
dv.paragraph(dv.markdownTaskList(tasks))
%%

<!--dv-start KEEP THIS COMMENT -->
<p><span><ul class="contains-task-list">
<li data-task="" class="task-list-item" dir="auto"><input type="checkbox" class="task-list-item-checkbox">Bread</li>
<li data-task="" class="task-list-item" dir="auto"><input type="checkbox" class="task-list-item-checkbox">Peanut Butter</li>
<li data-task="" class="task-list-item" dir="auto"><input type="checkbox" class="task-list-item-checkbox">Jelly</li>
<li data-task="" class="task-list-item" dir="auto"><input type="checkbox" class="task-list-item-checkbox">Bread</li>
<li data-task="" class="task-list-item" dir="auto"><input type="checkbox" class="task-list-item-checkbox">Butter</li>
</ul></span></p>
<!--dv-end KEEP THIS COMMENT -->

---

## Views usage

%%dv
console.log('before')
await dv.view('views/viewExample')
console.log('after')
%%

<!--dv-start KEEP THIS COMMENT -->
<p><span><ul class="contains-task-list">
<li data-task="" class="task-list-item" dir="auto"><input type="checkbox" class="task-list-item-checkbox">Bread</li>
<li data-task="" class="task-list-item" dir="auto"><input type="checkbox" class="task-list-item-checkbox">Peanut Butter</li>
<li data-task="" class="task-list-item" dir="auto"><input type="checkbox" class="task-list-item-checkbox">Jelly</li>
<li data-task="" class="task-list-item" dir="auto"><input type="checkbox" class="task-list-item-checkbox">Bread</li>
<li data-task="" class="task-list-item" dir="auto"><input type="checkbox" class="task-list-item-checkbox">Butter</li>
</ul></span></p>
<!--dv-end KEEP THIS COMMENT -->
