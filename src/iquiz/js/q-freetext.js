/**
 * Created by kirkgoble on 02/01/2019.
 */
import { EventEmitter } from "./helpers";
import { $log } from './helpers';

class QuizFT extends EventEmitter {
  constructor(el, data) {
    super();
    this.qData = data;
    this.node = el;
    this.sel = `[data-iquiz="${this.qData.number}"]`;
    this.txtBoxStartHeight = "45px"
    // this.resetBtnActiveFlag = false;
    // $log("qData:", this.qData);
  }

  startUp() {
    this.initQuizNav();
    this.initQuiz();
    // this.reState(true);
  }

  initQuizNav() {
    console.log("FT-initQuizNav");
    //console.log("fixedUserAnswers:"+this.qData.params.fixedUserAnswers);
    //
    // ADD EVENTS
    //
    this.node.querySelector(".js-reveal").onclick = e => this.doSubmit(e);
    this.node.querySelector(".js-reset").onclick = e => this.initQuiz(e);
    this.node.querySelector(".js-user-answers").oninput = e => this.doOnInput(e);
    this.node.querySelector(".js-user-answers").onclick = e => this.removeEditable(e);
    // console.log(!!this.node.querySelector(".js-add-ans"));
    if(!!this.node.querySelector(".js-add-ans")){ // ONLY APPLY EVENT IF ELEMENT EXISTS
      this.node.querySelector(".js-add-ans").onclick = e => this.addNewEditable(e);
    }

    //this.node.querySelector(".js-remove-ans").onclick = e => this.removeEditable(e);
  }

  initQuiz(e) {
    console.log("FT-initQuiz:"+e);

    if(e === undefined || !this.node.querySelector(".js-reset").classList.contains("disabled")){
      //ONLY INIT IF STARTUP (e=undefined) OR REVEAL BTN ACTIVE

      // CLOSE ANSWER BOXES IF OPEN
      if(getComputedStyle(this.node.querySelector(".js-ans-container"), null).display != 'none') {
        $('.js-ans-container').slideUp("fast", e => {
          // Animation complete
          this.node.querySelector(".js-reveal").innerText = 'REVEAL';
          // this.resetBtnActiveFlag = true;
        });
      }

      // RESET TEXTAREAS
      var ftArr = this.node.querySelectorAll(".js-textarea-container");
      // console.log("ftArr:"+ftArr.length);
      for (let i = 0; i < ftArr.length; i++) {
        //IF TEXTBOXES ARE FIXED NUMBER - ie IN TABLE
        if (this.qData.params.fixedUserAnswers == true || this.qData.params.fixedUserAnswers === "true") {
          // Clear TEXTAREA
          ftArr[i].querySelector(".js-textarea").value = '';
          ftArr[i].querySelector(".js-textarea").style.height = this.txtBoxStartHeight;
          // WHEN LAST BOX CLEAR SET BUTTON STATES
          if (i == (ftArr.length - 1)) {
            console.log('aaa');
            this.shouldRevealBeActive();
            // this.shouldResetBeActive();
          }
        } else {
          //IF TEXTBOXES ARE FLEXIBLE NUMBER - ie USER ADDS UNLIMITED
          if (i == 0) {
            // Clear first TEXTAREA only : don't delete it as we need 1
            ftArr[i].querySelector(".js-textarea").value = '';
            ftArr[i].querySelector(".js-textarea").style.height = this.txtBoxStartHeight;
            // SET BUTTON STATES
            this.shouldRevealBeActive();
            // this.shouldResetBeActive();
          } else {
            // Remove all other TEXTAREA's
            $(ftArr[i]).slideUp("fast", e => {
              // Animation complete
              this.node.querySelector(".js-user-answers").removeChild(ftArr[i]);
              // IF LAST TEXT AREA
              if (i == (ftArr.length - 1)) {
                // SET button states
                this.shouldRevealBeActive();
                // this.shouldResetBeActive();
                this.checkRemoveBtnDisabled();
              }
            });
          }
        }
      }

      // SET FOCUS TO FIRST TEXTAREA INPUT BOX
      ftArr[0].querySelector('textarea').focus();

    }
  }

  doOnInput(e) {
    console.log("FT-doOnInput:", e);
    // console.log("FT-doOnInput:", e.target);
    // console.log("FT-doOnInput:", e.key);
    e.target.style.height = this.txtBoxStartHeight;
    e.target.style.height = (e.target.scrollHeight)+"px";
    // console.log("e.target.style.height:", e.target.style.height);
    //
    // SET SUBMIT BTN to active if user data in any textarea
    //
    this.shouldRevealBeActive();
    // this.shouldResetBeActive();
  }

  doOnKeyUp(e) {
    // console.log("FT-doOnKeyUp:", e);
    console.log("FT-doOnKeyUp:", e.key);
    if (e.key === 'Enter'){
      console.log("Enter pressed: ", e.key);
      console.log("e.innerHTML: ", e.target.innerHTML);
    }
  }

  addNewEditable(e) {
    console.log("addNewEditable: ");
    var div = document.createElement('div');
    div.setAttribute( 'style', 'display: none' );
    div.setAttribute( 'class', 'iquiz-textarea-container with-btn js-textarea-container' );
    div.innerHTML = "<textarea class='iquiz-ft-freetext js-textarea'></textarea><button class='iquiz-btn-remove js-remove-ans'>&times;</button>";

    $( div ).appendTo(this.node.querySelector(".js-user-answers")).slideDown("fast", e => {
      // Animation complete

      this.checkRemoveBtnDisabled();
      this.shouldRevealBeActive();
      div.querySelector('textarea').focus();
    });
  }

  removeEditable(e) {
    console.log("FT-removeEditable:", e.target);
    var divToRemove = e.target.parentNode; // e.target is BUTTON : we need parent DIV
    if(e.target.classList.contains('js-remove-ans') && !e.target.classList.contains('disabled')){
      // console.log('js-remove-ans : Remove me');
      // console.log(e.target.parentNode);
      $( divToRemove ).slideUp("fast", e => {
        // Animation complete
        this.node.querySelector(".js-user-answers").removeChild( divToRemove );
        this.checkRemoveBtnDisabled();
      });
    }
  }

  checkRemoveBtnDisabled(){
    var count = this.node.querySelector(".js-user-answers").getElementsByTagName('div').length;
    // console.log('.js-textarea-container : ' + count);
    if (count>1) {
      Array.from(this.node.querySelectorAll(".js-textarea-container")).forEach(el => {
        el.querySelector(".js-remove-ans").classList.remove("disabled");
        // console.log(el);
      });
    }else{
      this.node.querySelector(".js-remove-ans").classList.add("disabled");
    }

  }

  countTextAreasWithContent() {
    var rCount = 0;
    var arrCount = this.node.querySelectorAll(".js-textarea").length;
    Array.from(this.node.querySelectorAll(".js-textarea")).forEach(el => {
      if(el.value != '') {
        rCount++;
      }
      console.log("rCount:", rCount);
    });
    return([rCount, arrCount]);
  }

  shouldRevealBeActive() {
    console.log("FT-shouldRevealBeActive:");
    //
    // REVEAL
    //
    // Count textfields have values
    var getCount = this.countTextAreasWithContent();
    var showReveal = false;
    var showReset = false;
    //
    if (this.qData.params.fixedUserAnswers == true || this.qData.params.fixedUserAnswers === "true") {
      //IF TEXTBOXES ARE FIXED NUMBER (ie IN TABLE) ALL NEED USER DATA BEFORE REVEAL ACTIVE
      console.log("fixedUserAnswers:");
      if (getCount[0] == getCount[1]) {
        showReveal = true;
      }
      if(getCount[0]>0) {
        showReset = true;
      }
    }else{
      //IF TEXTBOXES ARE FLEXIBLE NUMBER ONLY MAKE SURE AT LEAST 1 HAS USER DATA BEFORE REVEAL ACTIVE
      if(getCount[0]>0) {
        showReveal = true;
        showReset = true;
      }
    }
    //
    if(showReveal === true) {
      this.node.querySelector(".js-reveal").classList.remove("disabled");
    }else{
      this.node.querySelector(".js-reveal").classList.add("disabled");
    }
    //
    // RESET
    //
    if(showReset === true) {
      this.node.querySelector(".js-reset").classList.remove("disabled");
    }else{
      this.node.querySelector(".js-reset").classList.add("disabled");
    }
  }

  // shouldResetBeActive() {
  //     console.log("FT-shouldResetBeActive:");
  //     // CHECK IF ANSWER BOX IF OPEN
  //     var btnFlag = false;
  //     if(!this.node.querySelector(".js-reveal").classList.contains("disabled")){
  //         btnFlag = true;
  //     }
  //     //
  //     if (this.qData.params.fixedUserAnswers == true || this.qData.params.fixedUserAnswers === "true") {
  //
  //     }
  //     // if(this.node.querySelectorAll(".js-textarea-container").length > 1){
  //     //     btnFlag = true;
  //     // }
  //     //
  //     if(btnFlag == true) {
  //         this.node.querySelector(".js-reset").classList.remove("disabled");
  //     }else{
  //         this.node.querySelector(".js-reset").classList.add("disabled");
  //     }
  // }

  doSubmit(e) {
    console.log("FT-doSubmit:", e);
    // FIRST CHECK REVEAL BTN IS ACTIVE AND NOT DISABLED
    if(!this.node.querySelector(".js-reveal").classList.contains("disabled")){
      if(getComputedStyle(this.node.querySelector(".js-ans-container"), null).display === 'none') {
        //console.log("NONE");
        //
        // $('.js-ans-container').slideDown("fast", e => {

        $(this.node.querySelectorAll('.js-ans-container')).slideDown("fast", e => {
          // Animation complete
          this.node.querySelector(".js-reveal").innerText = 'HIDE';
        });

      }else{
        $(this.node.querySelectorAll('.js-ans-container')).slideUp("fast", e => {
          // Animation complete
          this.node.querySelector(".js-reveal").innerText = 'REVEAL';
        });
      }
    }
  }

}

export default QuizFT;
