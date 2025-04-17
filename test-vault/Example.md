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
return dv.markdownTaskList(tasks)
%%

- [ ] Bread
- [ ] Peanut Butter
- [ ] Jelly
- [ ] Bread
- [ ] Butter

## Self reference example

param1:: value1

%%dv LIST this.param1  FROM "Example" %%

- [[Example.md|Example]]: value1
