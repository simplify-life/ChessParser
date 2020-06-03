import { SQUARES, BITS, EMPTY, FCColor, DEFAULT_POSITION, SYMBOLS, FLAGS, 
    cmove, 
    KING,
    PAWN,
    RANK_8,
    RANK_1,
    KNIGHT,
    BISHOP,
    ROOK,
    QUEEN,
    RANK_7,
    RANK_2,
    PAWN_OFFSETS,
    PIECE_OFFSETS,
    ATTACKS,
    SHIFTS,
    RAYS} from "./FCConst";
import { is_digit, coord2str, clone, CY, swap_color, CX ,trim} from "./FCUtils";


export class FCGame {
    public ROOKS:{
        w: [{square: number, flag: BITS},
            {square: number, flag: BITS}],
        b: [{square: number, flag: BITS},
            {square: number, flag: BITS}]
    }

    public board:Array<{type:string,color:FCColor}>
    public kings:{w:number,b:number}
    public turn:FCColor
    public castling:{w:number,b:number}
    public ep_square:number
    public half_moves:number
    public move_number:number
    private history:Array<any>
    public header:{}

    constructor(fen?:string){
        this.initData()
        if (typeof fen === 'undefined') {
            this.loadFen(DEFAULT_POSITION);
          } else {
            this.loadFen(fen);
          }
    }

      /**
       * ============= PUBLIC API START ==================
       */

     load(fen:string){
        return this.loadFen(fen)
     }

    reset() {
        this.loadFen(DEFAULT_POSITION);
     }

     moves(options){
        /* The internal representation of a chess move is in 0x88 format, and
       * not meant to be human-readable.  The code below converts the 0x88
       * square coordinates to algebraic coordinates.  It also prunes an
       * unnecessary move keys resulting from a verbose call.
       */
      var ugly_moves = this.generate_moves(options);
      var moves = [];

      for (var i = 0, len = ugly_moves.length; i < len; i++) {

        /* does the user want a full move object (most likely not), or just
         * SAN
         */
        if (typeof options !== 'undefined' && 'verbose' in options &&
            options.verbose) {
          moves.push(this.make_pretty(ugly_moves[i]));
        } else {
          moves.push(this.move_to_san(ugly_moves[i]));
        }
      }
      return moves;
     }

     king_attacked(color) {
        return this.attacked(swap_color(color), this.kings[color]);
     }
      in_check() {
        return this.king_attacked(this.turn);
      }
      in_checkmate() {
        return this.in_check() && this.generate_moves().length === 0;
      }
      in_stalemate() {
        return !this.in_check() && this.generate_moves().length === 0;
      }

      in_draw() {
        return this.half_moves >= 100 ||
               this.in_stalemate() ||
               this.insufficient_material_() ||
               this.in_threefold_repetition_();
      }

      insufficient_material(){
          return this.insufficient_material_()
      }

      in_threefold_repetition(){
          return this.in_threefold_repetition_()
      }

      game_over() {
        return this.half_moves >= 100 ||
               this.in_checkmate() ||
               this.in_stalemate() ||
               this.insufficient_material() ||
               this.in_threefold_repetition();
      }

      fen(){
          return this.generate_fen()
      }

      pgn(options) {
        /* using the specification from http://www.chessclub.com/help/PGN-spec
         * example for html usage: .pgn({ max_width: 72, newline_char: "<br />" })
         */
        var newline = (typeof options === 'object' &&
                       typeof options.newline_char === 'string') ?
                       options.newline_char : '\n';
        var max_width = (typeof options === 'object' &&
                         typeof options.max_width === 'number') ?
                         options.max_width : 0;
        var result = [];
        var header_exists = false;
  
        /* add the PGN header headerrmation */
        for (var i in this.header) {
          /* TODO: order of enumerated properties in header object is not
           * guaranteed, see ECMA-262 spec (section 12.6.4)
           */
          result.push('[' + i + ' \"' + this.header[i] + '\"]' + newline);
          header_exists = true;
        }
  
        if (header_exists && this.history.length) {
          result.push(newline);
        }
  
        /* pop all of history onto reversed_history */
        var reversed_history = [];
        while (this.history.length > 0) {
          reversed_history.push(this.undo_move());
        }
  
        var moves = [];
        var move_string = '';
        var pgn_move_number = 1;
  
        /* build the list of moves.  a move_string looks like: "3. e3 e6" */
        while (reversed_history.length > 0) {
          var move = reversed_history.pop();
  
          /* if the position started with black to move, start PGN with 1. ... */
          if (pgn_move_number === 1 && move.color === 'b') {
            move_string = '1. ...';
            pgn_move_number++;
          } else if (move.color === 'w') {
            /* store the previous generated move_string if we have one */
            if (move_string.length) {
              moves.push(move_string);
            }
            move_string = pgn_move_number + '.';
            pgn_move_number++;
          }
  
          move_string = move_string + ' ' + this.move_to_san(move);
          this.make_move(move);
        }
  
        /* are there any other leftover moves? */
        if (move_string.length) {
          moves.push(move_string);
        }
  
        /* is there a result? */
        if (typeof this.header["Result"] !== 'undefined') {
          moves.push(this.header["Result"]);
        }
  
        /* history should be back to what is was before we started generating PGN,
         * so join together moves
         */
        if (max_width === 0) {
          return result.join('') + moves.join(' ');
        }
  
        /* wrap the PGN output at max_width */
        var current_width = 0;
        for (var ii = 0; ii < moves.length; ii++) {
          /* if the current move will push past max_width */
          if (current_width + moves[ii].length > max_width && ii !== 0) {
  
            /* don't end the line with whitespace */
            if (result[result.length - 1] === ' ') {
              result.pop();
            }
  
            result.push(newline);
            current_width = 0;
          } else if (ii !== 0) {
            result.push(' ');
            current_width++;
          }
          result.push(moves[i]);
          current_width += moves[i].length;
        }
  
        return result.join('');
      }

      move_from_san(move) {
        var to, from, flags = BITS.NORMAL, promotion;
        var parse = move.match(/^([NBKRQ])?([abcdefgh12345678][12345678]?)?(x)?([abcdefgh][12345678])(=?[NBRQ])?/);
        if (move.slice(0, 5) === 'O-O-O') {
          from = this.kings[this.turn];
          to = from - 2;
          flags = BITS.QSIDE_CASTLE;
        } else if (move.slice(0, 3) === 'O-O') {
          from = this.kings[this.turn];
          to = from + 2;
          flags = BITS.KSIDE_CASTLE;
        } else if (parse && parse[1]) {
          // regular moves
          var piece = parse[1].toLowerCase();
          if (parse[3]) {
            // capture
            flags = BITS.CAPTURE;
          }
          to = SQUARES[parse[4]];

          for (var j = 0, len = PIECE_OFFSETS[piece].length; j < len; j++) {
            var offset = PIECE_OFFSETS[piece][j];
            var square = to;

            while (true) {
              square += offset;
              if (square & 0x88) break;

              var b = this.board[square];
              if (b) {
                if (b.color === this.turn && b.type === piece && (!parse[2] || coord2str(square).indexOf(parse[2]) >= 0)) {
                  let mv = this.build_move(this.board, square, to, flags, promotion);
                  if(mv){
                    this.make_move(mv)
                    if(this.king_attacked(b.color)){
                      this.undo_move()
                      break
                    }
                    this.undo_move()
                  }
                  from = square; 
                }
                break;
              }
              /* break, if knight or king */
              if (piece === 'n' || piece === 'k') break;
            }
          }
        } else if (parse) {
          // pawn move
          if (parse[3]) {
            // capture
            to = SQUARES[parse[4]];
            for (var j = 2; j < 4; j++) {
              var square:any = to - PAWN_OFFSETS[this.turn][j];
              if (square & 0x88) continue;

              if (this.board[square] != null &&
                  this.board[square].color === this.turn &&
                  coord2str(square)[0] === parse[2]) {
                from = square;
              }
            }
            if (this.board[to]) {
              flags = BITS.CAPTURE;
            } else {
              flags = BITS.EP_CAPTURE;
            }
          } else {
            // normal move
            to = SQUARES[move.slice(0,2)];
            var c = to - PAWN_OFFSETS[this.turn][0],
                b = this.board[c];
            if (b && b.type === PAWN && b.color === this.turn) {
              from = c;
            } else {
              c = to - PAWN_OFFSETS[this.turn][1];
              b = this.board[c];
              if (b && b.type === PAWN && b.color === this.turn) {
                from = c;
                flags = BITS.BIG_PAWN;
              }
            }
          }
          // promotion?
          if (parse[5]) {
            if(typeof parse[5][1] == 'undefined') {
              promotion = parse[5][0].toLowerCase();
            } else {
              promotion = parse[5][1].toLowerCase();
            }
          }
        }
        if (from >=0 && to >=0 && flags) {
          return this.build_move(this.board, from, to, flags, promotion);
        } else if (move.length > 0) {
          /* alert(move); // error in PGN, or in parsing. */
        }
      }

      move(move) {
        /* The move function can be called with in the following parameters:
         *
         * .move('Nxb7')      <- where 'move' is a case-sensitive SAN string
         *
         * .move({ from: 'h7', <- where the 'move' is a move object (additional
         *         to :'h8',      fields are ignored)
         *         promotion: 'q',
         *      })
         */
        var move_obj = null;
        var moves = this.generate_moves();
  
        if (typeof move === 'string') {
          /* convert the move string to a move object */
          for (var i = 0, len = moves.length; i < len; i++) {
            if (move === this.move_to_san(moves[i])) {
              move_obj = moves[i];
              break;
            }
          }
        } else if (typeof move === 'object') {
          /* convert the pretty move object to an ugly move object */
          for (var i = 0, len = moves.length; i < len; i++) {
            if (move.from === coord2str(moves[i].from) &&
                move.to === coord2str(moves[i].to) &&
                (!('promotion' in moves[i]) ||
                move.promotion === moves[i].promotion)) {
              move_obj = moves[i];
              break;
            }
          }
        }
  
        /* failed to find move */
        if (!move_obj) {
          return null;
        }
  
        /* need to make a copy of move because we can't generate SAN after the
         * move is made
         */
        var pretty_move = this.make_pretty(move_obj);
  
        this.make_move(move_obj);
  
        return pretty_move;
      }

      undo() {
        var move = this.undo_move();
        return (move) ? this.make_pretty(move) : null;
      }

      square_color(square) {
        if (square in SQUARES) {
          var sq_0x88 = SQUARES[square];
          return ((CY(sq_0x88) + CY(sq_0x88)) % 2 === 0) ? 'light' : 'dark';
        }
        return null;
      }

      moveHistory(){
        var reversed_history = [];
        var move_history:Array<cmove> = [];

  
        while (this.history.length > 0) {
          reversed_history.push(this.undo_move());
        }
  
        while (reversed_history.length > 0) {
          var move = reversed_history.pop();
          move_history.push(this.make_pretty(move));
          this.make_move(move);
        }
        return move_history;
      }

      pgnMoveHistory() {
        var reversed_history = [];
        var move_history:Array<string> = [];
        while (this.history.length > 0) {
          reversed_history.push(this.undo_move());
        }
        while (reversed_history.length > 0) {
          var move = reversed_history.pop();
          move_history.push(this.move_to_san(move));
          this.make_move(move);
        }
        return move_history;
      }

      /**
       * ============= PUBLIC API END ==================
       */

      get_move_obj(move) {
        return this.move_from_san(trim(move));
      }

    loadFen(fen:string) {
        var tokens = fen.split(/\s+/);
        var position = tokens[0];
        var square = 0;
        var valid = SYMBOLS + '12345678/';
        if (!this.validate_fen(fen).valid) {
          return false;
        }
        this.clear();
        for (var i = 0; i < position.length; i++) {
          var piece = position.charAt(i);
    
          if (piece === '/') {
            square += 8;
          } else if (is_digit(piece)) {
            square += parseInt(piece, 10);
          } else {
            var color = (piece < 'a') ? FCColor.WHITE : FCColor.BLACK;
            this.put({type: piece.toLowerCase(), color: color}, coord2str(square));
            square++;
          }
        }
    
        this.turn = <FCColor>(tokens[1]);
    
        if (tokens[2].indexOf('K') > -1) {
          this.castling.w |= BITS.KSIDE_CASTLE;
        }
        if (tokens[2].indexOf('Q') > -1) {
          this.castling.w |= BITS.QSIDE_CASTLE;
        }
        if (tokens[2].indexOf('k') > -1) {
          this.castling.b |= BITS.KSIDE_CASTLE;
        }
        if (tokens[2].indexOf('q') > -1) {
          this.castling.b |= BITS.QSIDE_CASTLE;
        }
    
        this.ep_square = (tokens[3] === '-') ? EMPTY : SQUARES[tokens[3]];
        this.half_moves = parseInt(tokens[4], 10);
        this.move_number = parseInt(tokens[5], 10);
    
        this.update_setup(this.generate_fen());
        return true;
      }



    initData(){
        this.ROOKS = {
            w: [{square: SQUARES.a1, flag: BITS.QSIDE_CASTLE},
                {square: SQUARES.h1, flag: BITS.KSIDE_CASTLE}],
            b: [{square: SQUARES.a8, flag: BITS.QSIDE_CASTLE},
                {square: SQUARES.h8, flag: BITS.KSIDE_CASTLE}]
        }
        this.board = new Array(128)
        this.kings = {w:EMPTY,b:EMPTY}
        this.turn = FCColor.WHITE
        this.castling = {w:0,b:0}
        this.ep_square = EMPTY
        this.half_moves = 0
        this.move_number = 1
        this.history = []
        this.header = {}
    }

    

      validate_fen(fen) {
        var errors = {
           0: 'No errors.',
           1: 'FEN string must contain six space-delimited fields.',
           2: '6th field (move number) must be a positive integer.',
           3: '5th field (half move counter) must be a non-negative integer.',
           4: '4th field (en-passant square) is invalid.',
           5: '3rd field (castling availability) is invalid.',
           6: '2nd field (side to move) is invalid.',
           7: '1st field (piece positions) does not contain 8 \'/\'-delimited rows.',
           8: '1st field (piece positions) is invalid [consecutive numbers].',
           9: '1st field (piece positions) is invalid [invalid piece].',
          10: '1st field (piece positions) is invalid [row too large].',
        };
    
        /* 1st criterion: 6 space-seperated fields? */
        var tokens = fen.split(/\s+/);
        if (tokens.length !== 6) {
          return {valid: false, error_number: 1, error: errors[1]};
        }
    
        /* 2nd criterion: move number field is a integer value > 0? */
        if (isNaN(tokens[5]) || (parseInt(tokens[5], 10) <= 0)) {
          return {valid: false, error_number: 2, error: errors[2]};
        }
    
        /* 3rd criterion: half move counter is an integer >= 0? */
        if (isNaN(tokens[4]) || (parseInt(tokens[4], 10) < 0)) {
          return {valid: false, error_number: 3, error: errors[3]};
        }
    
        /* 4th criterion: 4th field is a valid e.p.-string? */
        if (!/^(-|[abcdefgh][36])$/.test(tokens[3])) {
          return {valid: false, error_number: 4, error: errors[4]};
        }
    
        /* 5th criterion: 3th field is a valid castle-string? */
        if( !/^(KQ?k?q?|Qk?q?|kq?|q|-)$/.test(tokens[2])) {
          return {valid: false, error_number: 5, error: errors[5]};
        }
    
        /* 6th criterion: 2nd field is "w" (white) or "b" (black)? */
        if (!/^(w|b)$/.test(tokens[1])) {
          return {valid: false, error_number: 6, error: errors[6]};
        }
    
        /* 7th criterion: 1st field contains 8 rows? */
        var rows = tokens[0].split('/');
        if (rows.length !== 8) {
          return {valid: false, error_number: 7, error: errors[7]};
        }
    
        /* 8th criterion: every row is valid? */
        for (var i = 0; i < rows.length; i++) {
          /* check for right sum of fields AND not two numbers in succession */
          var sum_fields = 0;
          var previous_was_number = false;
    
          for (var k = 0; k < rows[i].length; k++) {
            if (!isNaN(rows[i][k])) {
              if (previous_was_number) {
                return {valid: false, error_number: 8, error: errors[8]};
              }
              sum_fields += parseInt(rows[i][k], 10);
              previous_was_number = true;
            } else {
              if (!/^[prnbqkPRNBQK]$/.test(rows[i][k])) {
                return {valid: false, error_number: 9, error: errors[9]};
              }
              sum_fields += 1;
              previous_was_number = false;
            }
          }
          if (sum_fields !== 8) {
            return {valid: false, error_number: 10, error: errors[10]};
          }
        }
    
        /* everything's okay! */
        return {valid: true, error_number: 0, error: errors[0]};
      }

      clear() {
        this.initData()
        this.update_setup(this.generate_fen());
      }




      generate_fen() {
        var empty = 0;
        var fen = '';
    
        for (var i = SQUARES.a8; i <= SQUARES.h1; i++) {
          if (this.board[i] == null) {
            empty++;
          } else {
            if (empty > 0) {
              fen += empty;
              empty = 0;
            }
            var color = this.board[i].color;
            var piece = this.board[i].type;
    
            fen += (color === FCColor.WHITE) ?
                     piece.toUpperCase() : piece.toLowerCase();
          }
    
          if ((i + 1) & 0x88) {
            if (empty > 0) {
              fen += empty;
            }
    
            if (i !== SQUARES.h1) {
              fen += '/';
            }
    
            empty = 0;
            i += 8;
          }
        }
    
        var cflags = '';
        if (this.castling[FCColor.WHITE] & BITS.KSIDE_CASTLE) { cflags += 'K'; }
        if (this.castling[FCColor.WHITE] & BITS.QSIDE_CASTLE) { cflags += 'Q'; }
        if (this.castling[FCColor.BLACK] & BITS.KSIDE_CASTLE) { cflags += 'k'; }
        if (this.castling[FCColor.BLACK] & BITS.QSIDE_CASTLE) { cflags += 'q'; }
    
        /* do we have an empty castling flag? */
        cflags = cflags || '-';
        var epflags = (this.ep_square === EMPTY) ? '-' : coord2str(this.ep_square);
    
        return [fen, this.turn, cflags, epflags, this.half_moves, this.move_number].join(' ');
      }

      set_header(args) {
        for (var i = 0; i < args.length; i += 2) {
          if (typeof args[i] === 'string' &&
              typeof args[i + 1] === 'string') {
            this.header[args[i]] = args[i + 1];
          }
        }
        return this.header;
      }

      update_setup(fen) {
        if (this.history.length > 0) return;
    
        if (fen !== DEFAULT_POSITION) {
          this.header['SetUp'] = fen;
          this.header['FEN'] = '1';
        } else {
          delete this.header['SetUp'];
          delete this.header['FEN'];
        }
      }
      get(square) {
        var piece = this.board[SQUARES[square]];
        return (piece) ? {type: piece.type, color: piece.color} : null;
      }

      put(piece, square) {
        /* check for valid piece object */
        if (!('type' in piece && 'color' in piece)) {
          return false;
        }
    
        /* check for piece */
        if (SYMBOLS.indexOf(piece.type.toLowerCase()) === -1) {
          return false;
        }
    
        /* check for valid square */
        if (!(square in SQUARES)) {
          return false;
        }
    
        var sq = SQUARES[square];
        this.board[sq] = {type: piece.type, color: piece.color};
        if (piece.type === KING) {
          this.kings[piece.color] = sq;
        }
    
        this.update_setup(this.generate_fen());
    
        return true;
      }

      remove(square) {
        var piece = this.get(square);
        this.board[SQUARES[square]] = null;
        if (piece && piece.type === KING) {
          this.kings[piece.color] = EMPTY;
        }
    
        this.update_setup(this.generate_fen());
    
        return piece;
      }

      build_move(board, from, to, flags, promotion?) {
        var move = {
          color: this.turn,
          from: from,
          to: to,
          flags: flags,
          piece: board[from].type,
          promotion:"",
          captured:""
        };
    
        if (promotion) {
          move.flags |= BITS.PROMOTION;
          move.promotion = promotion;
        }
    
        if (board[to]) {
          move.captured = board[to].type;
        } else if (flags & BITS.EP_CAPTURE) {
            move.captured = PAWN;
        }
        return move;
      }

      add_move(board, moves, from, to, flags) {
        /* if pawn promotion */
        if (board[from].type === PAWN &&
           (CY(to) === RANK_8 || CY(to) === RANK_1)) {
            var pieces = [QUEEN, ROOK, BISHOP, KNIGHT];
            for (var i = 0, len = pieces.length; i < len; i++) {
              moves.push(this.build_move(board, from, to, flags, pieces[i]));
            }
        } else {
         moves.push(this.build_move(board, from, to, flags));
        }
      }

      generate_moves(options?) {
        var moves = [];
        var us = this.turn;
        var them = swap_color(us);
        var second_rank = {b: RANK_7, w: RANK_2};
    
        var first_sq = SQUARES.a8;
        var last_sq = SQUARES.h1;
        var single_square = false;
    
        /* do we want legal moves? */
        var legal = (typeof options !== 'undefined' && 'legal' in options) ?
                    options.legal : true;
    
        /* are we generating moves for a single square? */
        if (typeof options !== 'undefined' && 'square' in options) {
          if (options.square in SQUARES) {
            first_sq = last_sq = SQUARES[options.square];
            single_square = true;
          } else {
            /* invalid square */
            return [];
          }
        }

    
        for (var i = first_sq; i <= last_sq; i++) {
          /* did we run off the end of the board */
          if (i & 0x88) { i += 7; continue; }
    
          var piece = this.board[i];
          if (piece == null || piece.color !== us) {
            continue;
          }
    
          if (piece.type === PAWN) {
            /* single square, non-capturing */
            var square = i + PAWN_OFFSETS[us][0];
            if (this.board[square] == null) {
                this.add_move(this.board, moves, i, square, BITS.NORMAL);
    
              /* double square */
              var square = i + PAWN_OFFSETS[us][1];
              if (second_rank[us] === CY(i) && this.board[square] == null) {
                this.add_move(this.board, moves, i, square, BITS.BIG_PAWN);
              }
            }
    
            /* pawn captures */
            for (j = 2; j < 4; j++) {
              var square = i + PAWN_OFFSETS[us][j];
              if (square & 0x88) continue;
    
              if (this.board[square] != null &&
                  this.board[square].color === them) {
                  this.add_move(this.board, moves, i, square, BITS.CAPTURE);
              } else if (square === this.ep_square) {
                  this.add_move(this.board, moves, i, this.ep_square, BITS.EP_CAPTURE);
              }
            }
          } else {
            for (var j = 0, len = PIECE_OFFSETS[piece.type].length; j < len; j++) {
              var offset = PIECE_OFFSETS[piece.type][j];
              var square = i;
    
              while (true) {
                square += offset;
                if (square & 0x88) break;
    
                if (this.board[square] == null) {
                  this.add_move(this.board, moves, i, square, BITS.NORMAL);
                } else {
                  if (this.board[square].color === us) break;
                  this.add_move(this.board, moves, i, square, BITS.CAPTURE);
                  break;
                }
    
                /* break, if knight or king */
                if (piece.type === 'n' || piece.type === 'k') break;
              }
            }
          }
        }
    
        /* check for castling if: a) we're generating all moves, or b) we're doing
         * single square move generation on the king's square
         */
        if ((!single_square) || last_sq === this.kings[us]) {
          /* king-side castling */
          if (this.castling[us] & BITS.KSIDE_CASTLE) {
            var castling_from = this.kings[us];
            var castling_to = castling_from + 2;
    
            if (this.board[castling_from + 1] == null &&
                this.board[castling_to]       == null &&
                !this.attacked(them, this.kings[us]) &&
                !this.attacked(them, castling_from + 1) &&
                !this.attacked(them, castling_to)) {
              this.add_move(this.board, moves, this.kings[us] , castling_to,
                       BITS.KSIDE_CASTLE);
            }
          }
    
          /* queen-side castling */
          if (this.castling[us] & BITS.QSIDE_CASTLE) {
            var castling_from = this.kings[us];
            var castling_to = castling_from - 2;
    
            if (this.board[castling_from - 1] == null &&
                this.board[castling_from - 2] == null &&
                this.board[castling_from - 3] == null &&
                !this.attacked(them, this.kings[us]) &&
                !this.attacked(them, castling_from - 1) &&
                !this.attacked(them, castling_to)) {
              this.add_move(this.board, moves, this.kings[us], castling_to,
                       BITS.QSIDE_CASTLE);
            }
          }
        }
    
        /* return all pseudo-legal moves (this includes moves that allow the king
         * to be captured)
         */
        if (!legal) {
          return moves;
        }
    
        /* filter out illegal moves */
        var legal_moves = [];
        for (var i = 0, lenth = moves.length; i < lenth; i++) {
          this.make_move(moves[i]);
          if (!this.king_attacked(us)) {
            legal_moves.push(moves[i]);
          }
          this.undo_move();
        }
    
        return legal_moves;
      }

    move_to_san(move) {
        var output = '';
    
        if (move.flags & BITS.KSIDE_CASTLE) {
          output = 'O-O';
        } else if (move.flags & BITS.QSIDE_CASTLE) {
          output = 'O-O-O';
        } else {
          var disambiguator = this.get_disambiguator(move);
    
          if (move.piece !== PAWN) {
            output += move.piece.toUpperCase() + disambiguator;
          }
    
          if (move.flags & (BITS.CAPTURE | BITS.EP_CAPTURE)) {
            if (move.piece === PAWN) {
              output += coord2str(move.from)[0];
            }
            output += 'x';
          }
    
          output += coord2str(move.to);
    
          if (move.flags & BITS.PROMOTION) {
            output += '=' + move.promotion.toUpperCase();
          }
        }
    
        this.make_move(move);
        if (this.in_check()) {
          if (this.in_checkmate()) {
            output += '#';
          } else {
            output += '+';
          }
        }
        this.undo_move();
    
        return output;
      }

      attacked(color, square) {
        for (var i = SQUARES.a8; i <= SQUARES.h1; i++) {
          /* did we run off the end of the board */
          if (i & 0x88) { i += 7; continue; }
    
          /* if empty square or wrong color */
          if (this.board[i] == null || this.board[i].color !== color) continue;
    
          var piece = this.board[i];
          var difference = i - square;
          var index = difference + 119;
    
          if (ATTACKS[index] & (1 << SHIFTS[piece.type])) {
            if (piece.type === PAWN) {
              if (difference > 0) {
                if (piece.color === FCColor.WHITE) return true;
              } else {
                if (piece.color === FCColor.BLACK) return true;
              }
              continue;
            }
    
            /* if the piece is a knight or a king */
            if (piece.type === 'n' || piece.type === 'k') return true;
    
            var offset = RAYS[index];
            var j = i + offset;
    
            var blocked = false;
            while (j !== square) {
              if (this.board[j] != null) { blocked = true; break; }
              j += offset;
            }
    
            if (!blocked) return true;
          }
        }
    
        return false;
      }


      insufficient_material_() {
        var pieces = {};
        var bishops = [];
        var num_pieces = 0;
        var sq_color = 0;
    
        for (var i = SQUARES.a8; i<= SQUARES.h1; i++) {
          sq_color = (sq_color + 1) % 2;
          if (i & 0x88) { i += 7; continue; }
    
          var piece = this.board[i];
          if (piece) {
            pieces[piece.type] = (piece.type in pieces) ?
                                  pieces[piece.type] + 1 : 1;
            if (piece.type === BISHOP) {
              bishops.push(sq_color);
            }
            num_pieces++;
          }
        }
    
        /* k vs. k */
        if (num_pieces === 2) { return true; }
    
        /* k vs. kn .... or .... k vs. kb */
        else if (num_pieces === 3 && (pieces[BISHOP] === 1 ||
                                     pieces[KNIGHT] === 1)) { return true; }
    
        /* kb vs. kb where any number of bishops are all on the same color */
        else if (num_pieces === pieces[BISHOP] + 2) {
          var sum = 0;
          var len = bishops.length;
          for (var i = 0; i < len; i++) {
            sum += bishops[i];
          }
          if (sum === 0 || sum === len) { return true; }
        }
    
        return false;
      }

      in_threefold_repetition_() {
        /* TODO: while this function is fine for casual use, a better
         * implementation would use a Zobrist key (instead of FEN). the
         * Zobrist key would be maintained in the make_move/undo_move functions,
         * avoiding the costly that we do below.
         */
        var moves = [];
        var positions = {};
        var repetition = false;
    
        while (true) {
          var move = this.undo_move();
          if (!move) break;
          moves.push(move);
        }
    
        while (true) {
          /* remove the last two fields in the FEN string, they're not needed
           * when checking for draw by rep */
          var fen = this.generate_fen().split(' ').slice(0,4).join(' ');
    
          /* has the position occurred three or move times */
          positions[fen] = (fen in positions) ? positions[fen] + 1 : 1;
          if (positions[fen] >= 3) {
            repetition = true;
          }
    
          if (!moves.length) {
            break;
          }
          this.make_move(moves.pop());
        }
    
        return repetition;
      }

      push(move) {
        this.history.push({
          move: move,
          kings: {b: this.kings.b, w: this.kings.w},
          turn: this.turn,
          castling: {b: this.castling.b, w: this.castling.w},
          ep_square: this.ep_square,
          half_moves: this.half_moves,
          move_number: this.move_number
        });
      }

      make_move(move) {
        var us = this.turn;
        var them = swap_color(us);
        this.push(move);
    
        this.board[move.to] = this.board[move.from];
        this.board[move.from] = null;
    
        /* if ep capture, remove the captured pawn */
        if (move.flags & BITS.EP_CAPTURE) {
          if (this.turn === FCColor.BLACK) {
            this.board[move.to - 16] = null;
          } else {
            this.board[move.to + 16] = null;
          }
        }
    
        /* if pawn promotion, replace with new piece */
        if (move.flags & BITS.PROMOTION) {
          this.board[move.to] = {type: move.promotion, color: us};
        }
    
        /* if we moved the king */
        if (this.board[move.to].type === KING) {
          this.kings[this.board[move.to].color] = move.to;
    
          /* if we castled, move the rook next to the king */
          if (move.flags & BITS.KSIDE_CASTLE) {
            var castling_to = move.to - 1;
            var castling_from = move.to + 1;
            this.board[castling_to] = this.board[castling_from];
            this.board[castling_from] = null;
          } else if (move.flags & BITS.QSIDE_CASTLE) {
            var castling_to:number = move.to + 1;
            var castling_from:any = move.to - 2;
            this.board[castling_to] = this.board[castling_from];
            this.board[castling_from] = null;
          }
    
          /* turn off castling */
          this.castling[<string><any>us] = '';
        }
    
        /* turn off castling if we move a rook */
        if (this.castling[<string><any>us]) {
          for (var i = 0, len = this.ROOKS[us].length; i < len; i++) {
            if (move.from === this.ROOKS[us][i].square &&
                this.castling[us] & this.ROOKS[us][i].flag) {
              this.castling[us] ^= this.ROOKS[us][i].flag;
              break;
            }
          }
        }
    
        /* turn off castling if we capture a rook */
        if (this.castling[them]) {
          for (var i = 0, len = this.ROOKS[them].length; i < len; i++) {
            if (move.to === this.ROOKS[them][i].square &&
                this.castling[them] & this.ROOKS[them][i].flag) {
              this.castling[them] ^= this.ROOKS[them][i].flag;
              break;
            }
          }
        }
    
        /* if big pawn move, update the en passant square */
        if (move.flags & BITS.BIG_PAWN) {
          if (this.turn === 'b') {
            this.ep_square = move.to - 16;
          } else {
            this.ep_square = move.to + 16;
          }
        } else {
          this.ep_square = EMPTY;
        }
    
        /* reset the 50 move counter if a pawn is moved or a piece is captured */
        if (move.piece === PAWN) {
          this.half_moves = 0;
        } else if (move.flags & (BITS.CAPTURE | BITS.EP_CAPTURE)) {
          this.half_moves = 0;
        } else {
          this.half_moves++;
        }
    
        if (this.turn === FCColor.BLACK) {
          this.move_number++;
        }
        this.turn = swap_color(this.turn);
      }

      undo_move() {
        var old = this.history.pop();
        if (old == null) { return null; }
    
        var move = old.move;
        this.kings = old.kings;
        this.turn = old.turn;
        this.castling = old.castling;
        this.ep_square = old.ep_square;
        this.half_moves = old.half_moves;
        this.move_number = old.move_number;
    
        var us = this.turn;
        var them = swap_color(this.turn);
    
        this.board[move.from] = this.board[move.to];
        this.board[move.from].type = move.piece;  // to undo any promotions
        this.board[move.to] = null;
    
        if (move.flags & BITS.CAPTURE) {
          this.board[move.to] = {type: move.captured, color: them};
        } else if (move.flags & BITS.EP_CAPTURE) {
          var index;
          if (us === FCColor.BLACK) {
            index = move.to - 16;
          } else {
            index = move.to + 16;
          }
          this.board[index] = {type: PAWN, color: them};
        }
    
    
        if (move.flags & (BITS.KSIDE_CASTLE | BITS.QSIDE_CASTLE)) {
          var castling_to, castling_from;
          if (move.flags & BITS.KSIDE_CASTLE) {
            castling_to = move.to + 1;
            castling_from = move.to - 1;
          } else if (move.flags & BITS.QSIDE_CASTLE) {
            castling_to = move.to - 2;
            castling_from = move.to + 1;
          }
    
          this.board[castling_to] = this.board[castling_from];
          this.board[castling_from] = null;
        }
    
        return move;
      }

      get_disambiguator(move) {
        var moves = this.generate_moves();
    
        var from = move.from;
        var to = move.to;
        var piece = move.piece;
    
        var ambiguities = 0;
        var same_rank = 0;
        var same_file = 0;
    
        for (var i = 0, len = moves.length; i < len; i++) {
          var ambig_from = moves[i].from;
          var ambig_to = moves[i].to;
          var ambig_piece = moves[i].piece;
    
          /* if a move of the same piece type ends on the same to square, we'll
           * need to add a disambiguator to the algebraic notation
           */
          if (piece === ambig_piece && from !== ambig_from && to === ambig_to) {
            ambiguities++;
    
            if (CY(from) === CY(ambig_from)) {
              same_rank++;
            }
    
            if (CX(from) === CX(ambig_from)) {
              same_file++;
            }
          }
        }
    
        if (ambiguities > 0) {
          /* if there exists a similar moving piece on the same rank and file as
           * the move in question, use the square as the disambiguator
           */
          if (same_rank > 0 && same_file > 0) {
            return coord2str(from);
          }
          /* if the moving piece rests on the same file, use the rank symbol as the
           * disambiguator
           */
          else if (same_file > 0) {
            return coord2str(from).charAt(1);
          }
          /* else use the file symbol */
          else {
            return coord2str(from).charAt(0);
          }
        }
    
        return '';
      }

      boardDes() {
        var s = '   +------------------------+\n';
        for (var i = SQUARES.a8; i <= SQUARES.h1; i++) {
          /* display the rank */
          if (CX(i) === 0) {
            s += ' ' + '87654321'[CY(i)] + ' |';
          }
    
          /* empty piece */
          if (this.board[i] == null) {
            s += ' . ';
          } else {
            var piece = this.board[i].type;
            var color = this.board[i].color;
            var symbol = (color === FCColor.WHITE) ?
                         piece.toUpperCase() : piece.toLowerCase();
            s += ' ' + symbol + ' ';
          }
    
          if ((i + 1) & 0x88) {
            s += '|\n';
            i += 8;
          }
        }
        s += '   +------------------------+\n';
        s += '     a  b  c  d  e  f  g  h\n';
    
        return s;
      }
    
       /* pretty = external move object */
    make_pretty(ugly_move:cmove) {
        var move = clone(ugly_move) as cmove;
        move.san = this.move_to_san(move);

        move.to = coord2str(move.to as number);
        move.from = coord2str(move.from as number);

        var flags = 0;
        let bits = [1,2,4,8,16,32,64]
        for (var flag in bits) {
            if (bits[flag] & Number(move.flags)) {
                flags += bits[flag];
            }
        }
        move.flags =  flags;
        return move;
  }
}