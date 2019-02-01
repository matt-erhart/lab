import { App, render } from "./App";

render(App);

if ((module as any).hot) (module as any).hot.accept("./App", () => render(App));
