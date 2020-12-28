from flask import Flask, render_template, jsonify, request
import requests

from boggle import Boggle

app = Flask(__name__)
app.config['SECRET_KEY'] = 'password123'

boggle_game = Boggle()

# Classes
ROW_CLASS = "row d-flex flex-nowrap justify-content-center"

# Fixed due my choice of the design
LATERAL_AREA_WIDTH_IN_COLS = 3
BOARD_MIN_chars_PER_SIDE = 3
BOARD_MAX_chars_PER_SIDE = 6
# <chars: cols>
BOARD_SIZE_IN_COLS_PER_GRID_SIZE = {'3x3': 6, '4x4': 4, '5x5': 5, '6x6': 6}
BOARD_AND_TIME = {'3x3': 450, '4x4': 500, '5x5': 750, '6x6': 900}

# This is the variable that triggers the layout
DEFAULT_GRID = '4x4'

# External Dictionary

DICT_DEFINITION_ENDPOINT = "https://wordsapiv1.p.rapidapi.com/words/{word}"
DICT_HEADERS = {
    "Content-Type": "application/json",
    "x-rapidapi-key": "181862af8fmshb9990531929a53dp1032ddjsn0c19d24edff3",
    "x-rapidapi-host": "wordsapiv1.p.rapidapi.com",
    "useQueryString": "true"
}


@app.route('/')
def root_view():
    grid_size = request.args.get('grid_size', DEFAULT_GRID)
    board_size_in_cols = get_board_size_in_cols(grid_size)
    number_of_chars_per_side = get_number_of_chars_per_side(grid_size)
    char_cell_size_in_cols = get_char_cell_size_in_cols(board_size_in_cols, grid_size)
    boggle_game.set_number_of_chars_per_side(number_of_chars_per_side)
    board = make_empty_board(number_of_chars_per_side)
    return render_template('index.html', board_size_in_cols=board_size_in_cols,
                           number_of_chars_per_side=number_of_chars_per_side,
                           char_cell_size_in_cols=char_cell_size_in_cols,
                           # char_cell_size_in_pct=char_cell_size_in_pct,
                           lateral_area_width_in_cols=LATERAL_AREA_WIDTH_IN_COLS,
                           row_class=ROW_CLASS,
                           board_and_time=BOARD_AND_TIME,
                           grid_size=grid_size,
                           board=board,
                           initial_time=BOARD_AND_TIME.get(grid_size))


@app.route('/chars/<int:number_of_chars_per_side>')
def make_board_ajax(number_of_chars_per_side):
    board = boggle_game.make_board(number_of_chars_per_side)
    return render_template('board.html', board=board,
                           number_of_chars_per_side=number_of_chars_per_side)


@app.route('/word/<word>')
def check_valid_word_ajax(word):
    result = boggle_game.check_valid_word(word)
    # print('is_valid:', is_valid)
    result_dict = {'result': result}
    # if result == "ok":
    url = DICT_DEFINITION_ENDPOINT.format(word=word)
    print(f"url: {url}")
    print(DICT_HEADERS)
    res = requests.get(url, headers=DICT_HEADERS)
    card = {'word': word, 'definitions': []}
    if res.status_code == 200:
        jres = res.json()  # jres will be treated as a dict
        if jres.get('results', None):
            defs = [j['definition'] for j in jres['results']]
            card['definitions'] = defs
    result_dict['card'] = card
    json_result = jsonify(result_dict)
    return json_result


def make_empty_board(number_of_chars_per_side):
    return [['🦉'] * number_of_chars_per_side] * number_of_chars_per_side


def get_board_size_in_cols(grid_size):
    return BOARD_SIZE_IN_COLS_PER_GRID_SIZE.get(grid_size)


def get_char_cell_size_in_cols(board_size_in_cols, grid_size):
    number_of_chars_per_side = get_number_of_chars_per_side(grid_size)
    return int(board_size_in_cols / number_of_chars_per_side)


def get_number_of_chars_per_side(grid_size):
    chars_per_side = grid_size.split('x')
    print(chars_per_side)
    return int(chars_per_side[0])
