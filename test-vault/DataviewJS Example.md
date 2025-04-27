
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


##

%%dv
const recipes = dv.pages('"recipes"').map(recipe => `[[${recipe.file.name}]]`);
dv.header(3, "Recipes");
dv.paragraph(dv.markdownList(recipes));
%%

<!--dv-start KEEP THIS COMMENT -->
<h3><span><p dir="auto">Recipes</p></span></h3><p><span><ul>
<li dir="auto"><a data-href="pbj" href="pbj" class="internal-link" target="_blank" rel="noopener nofollow">pbj</a></li>
<li dir="auto"><a data-href="toast" href="toast" class="internal-link" target="_blank" rel="noopener nofollow">toast</a></li>
</ul></span></p>
<!--dv-end KEEP THIS COMMENT -->
