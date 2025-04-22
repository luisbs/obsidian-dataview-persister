# Example of persisted query

%%dv
table cuisine, needsStove from "recipes"
%%

| File      | cuisine  | needsStove |
| --------- | -------- | ---------- |
| [[pbj]]   | American | false      |
| [[toast]] | British  | true       |

%%dv list from "recipes" %%

- [[pbj]]
- [[toast]]

%%dv task from "recipes" %%

- [ ] Bread
- [ ] Peanut Butter
- [ ] Jelly
- [ ] Bread
- [ ] Butter

%%da- calendar from "recipes" %%

---

## Self reference example

param1:: value1

%%dv LIST this.param1  FROM "Example" %%

- [[Example]]: value1
