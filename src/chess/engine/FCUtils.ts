/**
 *  8
 *  7
 *  6    棋盘
 *  5
 *  4
 *  3
 *  2
 *  1
 *    a b c d e f g h 
 */

import { FCColor } from "./FCConst";

export const COLUMNS = 'abcdefgh'.split('')

export const validMove = function(move:string) {
    // move should be a string
    if (typeof move !== 'string') return false;
  
    // move should be in the form of "e2-e4", "f6-d5"
    var tmp = move.split('-');
    if (tmp.length !== 2) return false; 
    return (validSquare(tmp[0]) === true && validSquare(tmp[1]) === true);
}


export const validSquare = function(square:string) {
    if (typeof square !== 'string') return false;
    return (square.search(/^[a-h][1-8]$/) !== -1);
}

export const validPieceCode =  function(code:string) {
    if (typeof code !== 'string') return false;
    return (code.search(/^[bw][KQRNBP]$/) !== -1);
  }

export const validFen = function(fen:string) {
    if (typeof fen !== 'string') return false;
  
    // cut off any move, castling, etc info from the end
    // we're only interested in position information
    fen = fen.replace(/ .+$/, '');
  
    // FEN should be 8 sections separated by slashes
    var chunks = fen.split('/');
    if (chunks.length !== 8) return false;
  
    // check the piece sections
    for (var i = 0; i < 8; i++) {
      if (chunks[i] === '' ||
          chunks[i].length > 8 ||
          chunks[i].search(/[^kqrbnpKQRNBP1-8]/) !== -1) {
        return false;
      }
    }
    return true;
}

export const validPositionObject = function(pos:Object) {
    if (typeof pos !== 'object') return false;
  
    for (var i in pos) {
      if (pos.hasOwnProperty(i) !== true) continue;
  
      if (validSquare(i) !== true || validPieceCode(pos[i]) !== true) {
        return false;
      }
    }
    return true;
  }

  // convert FEN piece code to bP, wK, etc
export function fenToPieceCode(piece:string) {
    // black piece
    if (piece.toLowerCase() === piece) {
      return 'b' + piece.toUpperCase();
    }
  
    // white piece
    return 'w' + piece.toUpperCase();
}

// convert bP, wK, etc code to FEN structure
export function pieceCodeToFen(piece:string) {
    var tmp = piece.split('');
  
    // white piece
    if (tmp[0] === 'w') {
      return tmp[1].toUpperCase();
    }
  
    // black piece
    return tmp[1].toLowerCase();
}
  
  // convert FEN string to position object
  // returns false if the FEN string is invalid
export function fenToObj(fen:string) {
    if (validFen(fen) !== true) {
      return false;
    }
  
    // cut off any move, castling, etc info from the end
    // we're only interested in position information
    fen = fen.replace(/ .+$/, '');
  
    var rows = fen.split('/');
    var position = {};
  
    var currentRow = 8;
    for (var i = 0; i < 8; i++) {
      var row = rows[i].split('');
      var colIndex = 0;
  
      // loop through each character in the FEN section
      for (var j = 0; j < row.length; j++) {
        // number / empty squares
        if (row[j].search(/[1-8]/) !== -1) {
          var emptySquares = parseInt(row[j], 10);
          colIndex += emptySquares;
        }
        // piece
        else {
          var square = COLUMNS[colIndex] + currentRow;
          position[square] = fenToPieceCode(row[j]);
          colIndex++;
        }
      }
  
      currentRow--;
    }
  
    return position;
  }
  
  // position object to FEN string
  // returns false if the obj is not a valid position object
  export function objToFen(obj:Object) {
    if (validPositionObject(obj) !== true) {
      return false;
    }
  
    var fen = '';
  
    var currentRow = 8;
    for (var i = 0; i < 8; i++) {
      for (var j = 0; j < 8; j++) {
        var square = COLUMNS[j] + currentRow;
  
        // piece exists
        if (obj.hasOwnProperty(square) === true) {
          fen += pieceCodeToFen(obj[square]);
        }
  
        // empty space
        else {
          fen += '1';
        }
      }
  
      if (i !== 7) {
        fen += '/';
      }
  
      currentRow--;
    }
  
    // squeeze the numbers together
    // haha, I love this solution...
    fen = fen.replace(/11111111/g, '8');
    fen = fen.replace(/1111111/g, '7');
    fen = fen.replace(/111111/g, '6');
    fen = fen.replace(/11111/g, '5');
    fen = fen.replace(/1111/g, '4');
    fen = fen.replace(/111/g, '3');
    fen = fen.replace(/11/g, '2');
  
    return fen;
  }

  export function is_digit(c:string) {
    return '0123456789'.indexOf(c) !== -1;
  }
  
  export function CY(i:number) {
    return i >> 4;
  }

  export function CX(i:number) {
    return i & 15;
  }

  export function coord2str(i:number){
    var f = CX(i), r = CY(i);
    return 'abcdefgh'.substring(f,f+1) + '87654321'.substring(r,r+1);
  }

  export function swap_color(c:FCColor) {
    return c === FCColor.WHITE ? FCColor.BLACK : FCColor.WHITE;
  }

  export function clone(obj) {
    var dupe = (obj instanceof Array) ? [] : {};

    for (var property in obj) {
      if (typeof property === 'object') {
        dupe[`${property}`] = clone(obj[property]);
      } else {
        dupe[property] = obj[property];
      }
    }

    return dupe;
  }

  export function trim(str:string) {
    return str.replace(/^\s+|\s+$/g, '');
  }

  //棋盘上的点转为xy
  export function mv2xy(mv){
    return {
        x:CX(mv),
        y:CY(mv)
    }
 }


