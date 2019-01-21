/**
 * Created by kirkgoble on 24/07/2018.
 */

/**
 * Return random number between min and max
 * @param min
 * @param max
 * @returns {number}
 */
export function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Suffle and return supplied array
 * @param array
 * @returns {*}
 */
export function shuffle(array) {
  var currentIndex = array.length,
    temporaryValue,
    randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

export function shuffleDivs(p, c) {
  console.log("shuffleDivs p ", p);
  console.log("shuffleDivs c ", c);
  var parent = $(p);
  var divs = parent.children(c);
  console.log("shuffleDivs parent ", parent);
  console.log("shuffleDivs divs ", divs);
  while (divs.length) {
    parent.append(divs.splice(Math.floor(Math.random() * divs.length), 1)[0]);
  }
}

// //base64 encoding
//
// var encodedData = btoa("stringToEncode");
//
// //If you are using nodejs:
//
//
//     var encodedStr = new Buffer("Hello World").toString('base64') //decode to original value:
//
//     var originalString = new Buffer("SGVsbG8gV29ybGQ=", 'base64').toStr
