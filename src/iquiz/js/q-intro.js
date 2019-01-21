import { EventEmitter } from "./helpers";
export default class Intro extends EventEmitter {
  constructor(el, data) {
    super();
    this.qData = data;
    this.node = el;

    Array.from(this.node.querySelectorAll(".js-begin-quiz")).forEach(element =>
      element.addEventListener("click", this.doBeginQuiz.bind(this))
    );
  }

  doBeginQuiz(e) {
    console.log("doBeginQuiz:", e);
    this.trigger("beginQuiz", { a: 11 });
  }
}
