'use strict';

///////////////////////////////////////
//                                   //
// GLOBAL VARIABLES                  //
//                                   //
///////////////////////////////////////

const $TIMER_DIV          = $('#timer_div');
const $BT_CANCEL          = $('#bt-cancel');
const $BT_PLAY_AGAIN      = $('#bt-play-again');
const $BT_START           = $('#bt-start');
const $BT_WORD_SUBMIT     = $('#bt-word-submit');
const $GRIDS_AND_TIMES    = $('#grids-and-times');
const $WORD_FORM          = $('#word_form');
const $BOARD              = $('#board');
const $MSG_AREA           = $('#msg_area');
const $FRM                = $('form *');
const $CARD               = $('#card');
const $CARD_WORD          = $('#card_word');
const $CARD_DEFINITIONS   = $('#card_definitions');
const $HISTORY_TABLE_DIV  = $('#history_table_div');
const $HISTORY_TABLE_BODY = $('#history_table_body');

let total        = 0;
let board_height = 0;
const HISTORY    = [];
const ENABLE     = true;
const DISABLE    = false;

// const DICT_URL     =
// "https://www.dictionaryapi.com/api/v3/references/computer/json/computer?key=05c306a9-222f-46cd-a1e3-b9b51b472e4f";
const DICT_DEFINITION_ENDPOINT = "https://wordsapiv1.p.rapidapi.com/words/";
const DICT_HEADERS             = {
  "Content-Type"   : "application/json",
  "x-rapidapi-key" : "181862af8fmshb9990531929a53dp1032ddjsn0c19d24edff3",
  "x-rapidapi-host": "wordsapiv1.p.rapidapi.com",
  "useQueryString" : true
};

const MESSAGES = {
  start         : {text: 'Select the grid size and click on [Start]', type: 'success'},
  'play-again'  : {text: 'Click on [Play Again] to start a new game', type: 'primary'},
  cancel        : {text: 'Click on [Cancel] to start a new game', type: 'danger'},
  'ok'          : {text: 'Good!', type: 'success'},
  'not-word'    : {text: 'The word you submitted isn\'t in our dictionary.', type: 'danger'},
  'not-on-board': {text: 'The word you submitted can\'t be built from the board', type: 'danger'},
  'invalid-size': {text: 'The word you submitted can\'t be built from the board', type: 'danger'}
};

const BUTTONS = {
  cancel       : {text: 'Cancel', type: 'danger'},
  'play-again' : {text: 'Play Again', type: 'primary'},
  start        : {text: 'Start', type: 'success'},
  'word-submit': {text: 'Submit', type: 'success'}
};

///////////////////////////////////////
//                                   //
// SETUP                             //
//                                   //
///////////////////////////////////////

$(document).ready(function () {
  msg('start');
  setButtonLayouts();
  showOneButton($BT_START);
  selectToInitialTime();
  updateTime();
  adjustSizes();
  setElemState($FRM, DISABLE);
  $(window).resize(adjustSizes);

});

///////////////////////////////////////
//                                   //
// FUNCTIONS                         //
//                                   //
///////////////////////////////////////

function adjustSizes() {
  $('.char_cell').each(function () {
    const w = $(this).width();
    const h = $(this).height();
    $(this).height(w);

  });
  board_height = $BOARD.height();
  $HISTORY_TABLE_DIV.height(board_height);

}

function checkValidWord(word) {
  $.get(`/word/${word}`, function (data) {
    updateHistory(word, data);
  });
}

function updateHistory(word, data) {
  let points = word.length;
  msg(data.result);
  if (data.result !== 'ok') {
    points *= -1;
  }
  total += points;
  HISTORY.push({word: word, points, total: total});
  updateHistoryTable();
  updateDefinitions(data.card);
}

function updateDefinitions(card) {
  $CARD_WORD.html('<strong>' + card.word + '</strong>');
  $CARD_DEFINITIONS.html(card.definitions.map(defn => '<li>' + defn + '</li>'));
}

function updateHistoryTable() {
  console.log(HISTORY);
  const last        = HISTORY[HISTORY.length - 1];
  const table_entry = `<tr><td>${last.word}</td><td>${last.points}</td><td>${last.total}</td></tr>`;
  $HISTORY_TABLE_BODY.append(table_entry);

}

async function make_board_ajax() {
  $BOARD.load(`/chars/${number_of_chars_per_side}`);
}

function msg(message_code) {
  const message = MESSAGES[message_code];
  $MSG_AREA.removeClass();
  $MSG_AREA.addClass(`text-${message.type}`)
           .text(`${message.text}`);
};

function selectToInitialTime() {
  $('#grids-and-times').val(grid_size);
}

function setElemState(elem, enable) {
  if (enable) {
    elem.removeAttr('disabled');
  } else {
    elem.attr('disabled', 'disabled');
  }
}

function setButtonLayouts() {
  $BT_CANCEL.addClass('btn-' + BUTTONS['cancel'].type).text(BUTTONS['cancel'].text);
  $BT_START.addClass('btn-' + BUTTONS['start'].type).text(BUTTONS['start'].text);
  $BT_WORD_SUBMIT.addClass('btn-' + BUTTONS['word-submit'].type).val(BUTTONS['word-submit'].text);
  $BT_PLAY_AGAIN.addClass('btn-' + BUTTONS['play-again'].type).text(BUTTONS['play-again'].text);
}

function showOneButton($bt) {
  $('.btn-control').hide();
  $bt.show();
}

function timer(duration) {
  let current = duration - 1000;
  let timer_id;
  return {
    start : function () {
      timer_id = setInterval(() => {

        $TIMER_DIV.text(`${current / 1000}s`);
        current -= 1000;
        if (current < 0) {
          // console.log('this', this);
          this.cancel();
          setElemState($WORD_FORM.find('input'), DISABLE);
        }
      }, 1000);
      return timer_id;
    },
    cancel: function () {
      clearInterval(timer_id);
      showOneButton($BT_PLAY_AGAIN);
      msg('play-again');
    }
  };
}

function updateTime() {
  // initial_time = time;
  $TIMER_DIV.text(`${initial_time}s`);
}

///////////////////////////////////////
//                                   //
// LISTENERS                         //
//                                   //
///////////////////////////////////////

$BT_START.on('click', async function (e) {
  e.preventDefault();
  showOneButton($BT_CANCEL);
  msg('cancel');
  setElemState($GRIDS_AND_TIMES, DISABLE);
  setElemState($FRM, ENABLE);

  await make_board_ajax();
  const t = timer(initial_time * 1000);
  t.start();
});

$('#bt-cancel, #bt-play-again').on('click', function (e) {
  e.preventDefault();
  window.location.href = `/?grid_size=${grid_size}`;
});

$GRIDS_AND_TIMES.on('change', function () {
  const grid           = $(this).val();
  window.location.href = `/?grid_size=${grid}`;
});

$WORD_FORM.on('submit', function (e) {
  e.preventDefault();
  e.stopPropagation();
  const word = $('[name="word_input"]').val();
  checkValidWord(word);
});

window.onresize = function () {
  console.log("window resized");
};
