import { shuffleDivs } from "./utils";
import { EventEmitter } from "./helpers";

class QuizMC extends EventEmitter {
  constructor(el, data) {
    super();
    this.qData = data;
    this.node = el;
    this.sel = `[data-iquiz="${this.qData.number}"]`;

    if (this.qData.answer && this.qData.answer !== "") {
      try {
        this.qData.answer = JSON.parse(this.qData.answer);
      } catch (e) {
        console.error(
          "iQuiz Error parsing data-answer from JSON to object: ",
          e
        );
        alert("Error parsing data-answer from JSON to object: " + e);
      }
    }

    if (
      this.qData.state &&
      this.qData.state !== "" &&
      !typeof this.qData.state === "Array"
    ) {
      try {
        this.qData.state = JSON.parse(this.qData.state);
      } catch (e) {
        console.error(
          "iQuiz Error parsing data-state from JSON to object: ",
          e
        );
        alert("Error parsing data-state from JSON to object: " + e);
      }
    }

    if (
      this.qData.params &&
      this.qData.params !== "" &&
      !typeof this.qData.params === "Object"
    ) {
      try {
        this.qData.params = JSON.parse(this.qData.params.replace(/#/gi, '"'));
      } catch (e) {
        console.error(
          "iQuiz Error parsing data-params from JSON to object: ",
          e
        );
        alert("Error parsing data-params from JSON to object: " + e);
      }
    }

    //let qData = btoa(qData); // base-64 encoding (reverse with atob)
    console.log("qData:", this.qData);
  }

  startUp() {
    console.log("initQuiz");
    var group = this.node.querySelector(".js-answer-group");
    var answers = group.querySelectorAll(".js-answer");

    for (var i = answers.length; i >= 0; i--) {
      group.appendChild(answers[(Math.random() * i) | 0]);
    }
    //shuffleDivs(".js-answer-group", ".js-answer");
    this.initQuizNav();
    this.initQuizClickText();
    this.reState(true);
  }

  initQuizNav() {
    console.log("initQuizNav");
    // FastClick.attach(document.body);

    this.node.querySelector(".js-submit").onclick = e => this.doSubmit(e);
    Array.from(this.node.querySelectorAll(".js-next-question")).forEach(
      element =>
        element.addEventListener("click", this.doNextQuestion.bind(this))
    );

    $(".iquiz_popClose, .iquiz_popBG").click(() => {
      this.closePop();
    });
    //document.body.addEventListener("touchmove", this.freezeVp, false);
    //document.querySelector(".l-nav-bar").addEventListener("touchmove", this.freezeVp, false);
  }

  initQuizClickText() {
    Array.from(this.node.querySelectorAll(".quiz_clickText")).forEach(element =>
      element.addEventListener("click", this.setAnswer.bind(this))
    );
  }

  doNextQuestion(e) {
    console.log("doNextQuestion:", e);
    this.closePop(true);
    this.trigger("nextQuestion", { a: 11 });
  }

  freezeVp(e) {
    //console.log("freezeVp ", e);
    e.preventDefault();
  }

  stopBodyScrolling(bool) {
    //console.log("stopBodyScrolling ", bool);
    if (bool === true) {
      document.querySelector(this.sel + " .iquiz_popBG").addEventListener("touchmove", this.freezeVp, false);
    } else {
      document.querySelector(this.sel + " .iquiz_popBG").removeEventListener("touchmove", this.freezeVp, false);
    }
  }

  showPop() {
    console.log("showPop");
    this.stopBodyScrolling(true);
    const app = this;
    $(this.sel + " .iquiz_popBG")
      .fadeIn({ queue: false, duration: 200 })
      .promise()
      .done(function () {
        $(app.sel + " .iquiz_popContainer")
          .css({ top: "0px" })
          .fadeIn({ queue: false, duration: 200 })
          .animate({ top: "80px" }, 200);
        //
        $(app.sel + " .iquiz_innerScroll").scrollTop(0); // set scroll to top
      });
  }

  closePop(goNext = false) {
    console.log("closePop");
    this.stopBodyScrolling(false);
    // $('.iquiz_innerScroll').scrollTop(0); // set scroll to top
    $(this.sel + " .iquiz_popContainer")
      .fadeOut({ queue: false, duration: 200 })
      .animate({ top: "0px" }, 200);
    $(this.sel + " .iquiz_popBG")
      .fadeOut({ queue: false, duration: 200 })
      .promise()
      .done(function () {
        if (goNext == true) {
          // loadNextPage(true); action next question screen load
          //this.trigger("nextQuestion");
          //alert("loadNext Question Page");
        }
      });

    // allowScroll('.player_container'); // allow scroll on main content
  }

  setAnswer(e) {
    let el = e.target;
    console.log("setAnswer:", e);
    console.log("setAnswer:", el);
    //
    // SET SUBMIT BTN to active
    //
    this.node.querySelector(".js-submit").classList.remove("disabled");
    //
    // SET HIGHLIGHT BAR
    //
    //
    // GET CLICKED ELEMENTS
    //
    var clickTextID = Number($(el).data("answer"));
    var clickGroupID = this.qData.number;

    var newTop = $(el).position().top + parseInt($(el).css("marginTop"));
    var newLeft = $(el).position().left + parseInt($(el).css("marginLeft"));
    var newHeight = $(el).outerHeight();

    console.log("################# this.qData.params.multipleAnswers:", this.qData.params);

    if (
      this.qData.params.multipleAnswers == false ||
      this.qData.params.multipleAnswers === "false"
    ) {
      let highlight = this.node.querySelector(".js-highlight");
      highlight.classList.remove("hide");
      Array.from(this.node.querySelectorAll(".quiz_clickText")).forEach(el => {
        el.classList.remove("selected");
      });

      $(highlight).animate(
        { top: newTop + "px", height: newHeight + "px" },
        200,
        function () {
          $(el).addClass("selected notransition");
          $(this).addClass("hide");
        }
      );
    } else {
      $(el).toggleClass("selected");
    }

    //
    // ADD SCORES TO QDATA OBJECT FOR LOCAL STORAGE
    //

    //clickGroupID = clickGroupID.replace("g", ""); // remove letters from ID
    //var userAnswerArr = this.qData.questionArray[clickGroupID - 1].userAnswer;
    let userAnswerArr = this.qData.state;
    console.log("userAnswerArr ", userAnswerArr);

    //        console.log(clickTextID);
    //        console.log(clickGroupID);
    //     qData.questionArray[(clickGroupID-1)].userAnswer = Number(clickTextID);

    // USER ANSWER ARRAY STUFF
    if (
      this.qData.params.multipleAnswers == false ||
      this.qData.params.multipleAnswers === "false"
    ) {
      // ONLY ALLOW 1 ANSWER
      userAnswerArr[0] = clickTextID;
    } else {
      //  ALLOW MULTIPLE ANSWERS
      if ($(el).hasClass("selected")) {
        // MULTIPLE ANSWERS & Selected
        if ($.inArray(clickTextID, userAnswerArr) < 0) {
          // If answer doesnt exist in userAnswerArr Push ANSWER in
          userAnswerArr.push(clickTextID);
        }
      } else {
        // MULTIPLE ANSWERS & DE-Selected
        if ($.inArray(clickTextID, userAnswerArr) > -1) {
          // If answer DOES exist in userAnswerArr REMOVE it
          userAnswerArr.splice($.inArray(clickTextID, userAnswerArr), 1);
        }
      }
    }
    console.log("this.qData ", this.qData);
  }

  reState(showAns) {
    console.log("reState:showAns:" + showAns);
    let state = this.qData.state;
    for (let i = 0; i < state.length; i++) {
      // LOOP THROUGH GROUPS OF ANSWERS
      let selected = this.node.querySelector(`[data-answer="${state[i]}"]`);
      selected.classList.add("selected");
      console.log("selected:" + selected);
      /* var answerArr;
      if (showAns == true) {
        answerArr = this.qData.questionArray[i].ans;
      } else {
        answerArr = this.qData.questionArray[i].userAnswer;
      } */

      //if (answerArr.length > 0) {
      // FIRST CHECK THERE ARE SOME ANSWERS TO LOOP THROUGH IN THIS GROUP
      //console.log("userAnswerArr:" + answerArr);
      /* for (let ii = 0; ii < answerArr.length; ii++) {
        var s = "#g" + (i + 1) + " #" + answerArr[ii]; // Build string to target Click Element in Group
        var el = $(s).get(0);
        $(el).toggleClass("selected"); // Set Element to selected
      } */
      //}
    }

    //var s = '#g1 #1';
    //var el = $(s).get(0);
    //console.log('el:'+el);
    //setAnswer(el, false); // pass element and ANIMATE flag
    //$(el).toggleClass("selected");
  }

  doSubmit(e) {
    console.log("doSubmit:", e);
    let el = e.target;
    if ($(el).hasClass("disabled")) { return }

    let state = this.qData.state,
      answers = this.qData.answer;

    const arraysAreEqual = (a, b) => {
      if (a.length !== b.length) {
        return false;
      }
      const aSorted = a.sort(),
        bSorted = b.sort();
      return aSorted
        .map((val, i) => bSorted[i] === val)
        .every(isSame => isSame);
    };

    $(this.sel + " .iquiz_feedback.wrong").css({ display: "none" });
    $(this.sel + " .iquiz_feedback.correct").css({ display: "none" });

    if (arraysAreEqual(state, answers)) {
      console.log("correct");
      $(this.sel + " .iquiz_feedback.correct").css({ display: "block" });
      if (
        this.qData.params &&
        this.qData.params.maxScore &&
        state.length === this.qData.state.maxScore
      ) {
        //
      } else {
        //
      }
    } else {
      console.log("wrong");
      $(this.sel + " .iquiz_feedback.wrong").css({ display: "block" });
    }

    this.showPop();
  }
}

export default QuizMC;
