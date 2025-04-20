# Example of persisted query

%%dv
table cuisine, needsStove from "recipes"
%%

| File                        | cuisine  | needsStove |
| --------------------------- | -------- | ---------- |
| [[recipes/pbj.md\|pbj]]     | American | false      |
| [[recipes/toast.md\|toast]] | British  | true       |

%%dv list from "recipes" %%

- [[recipes/pbj.md|pbj]]
- [[recipes/toast.md|toast]]

%%dv task from "recipes" %%

- [ ] Bread
- [ ] Peanut Butter
- [ ] Jelly
- [ ] Bread
- [ ] Butter

%%da- calendar from "recipes" %%

---

## Dataviewjs example

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

## Self reference example

param1:: value1

%%dv LIST this.param1  FROM "Example" %%

- [[Example.md|Example]]: value1
