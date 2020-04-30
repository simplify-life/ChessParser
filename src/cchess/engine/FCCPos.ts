import { FCCUtil } from "./FCCUtil";
import { FCCBook } from "./FCCBook";



function RC4(key) {
  this.x = this.y = 0;
  this.state = [];
  for (var i = 0; i < 256; i ++) {
    this.state.push(i);
  }
  var j = 0;
  for (var i = 0; i < 256; i ++) {
    j = (j + this.state[i] + key[i % key.length]) & 0xff;
    this.swap(i, j);
  }
}

RC4.prototype.swap = function(i, j) {
  var t = this.state[i];
  this.state[i] = this.state[j];
  this.state[j] = t;
}

RC4.prototype.nextByte = function() {
  this.x = (this.x + 1) & 0xff;
  this.y = (this.y + this.state[this.x]) & 0xff;
  this.swap(this.x, this.y);
  var t = (this.state[this.x] + this.state[this.y]) & 0xff;
  return this.state[t];
}

RC4.prototype.nextLong = function() {
  var n0 = this.nextByte();
  var n1 = this.nextByte();
  var n2 = this.nextByte();
  var n3 = this.nextByte();
  return n0 + (n1 << 8) + (n2 << 16) + ((n3 << 24) & 0xffffffff);
}

var PreGen_zobristKeyPlayer, PreGen_zobristLockPlayer;
var PreGen_zobristKeyTable = [], PreGen_zobristLockTable = [];

var rc4 = new RC4([0]);
PreGen_zobristKeyPlayer = rc4.nextLong();
rc4.nextLong();
PreGen_zobristLockPlayer = rc4.nextLong();
for (var i = 0; i < 14; i ++) {
  var keys = [];
  var locks = [];
  for (var j = 0; j < 256; j ++) {
    keys.push(rc4.nextLong());
    rc4.nextLong();
    locks.push(rc4.nextLong());
  }
  PreGen_zobristKeyTable.push(keys);
  PreGen_zobristLockTable.push(locks);
}

export class F_CCPos{
    public sdPlayer:number
    
    

    /**
     * 棋盘数据16x16
     * 20-19-18-17-16-17-18-19-20
     * --------------------------
     *    21                21
     * 22    22    22    22    22
     * --------------------------
     * --------------------------
     * 14    14    14    14    14
     *    13                13
     * -------------------------- 
     * 12-11-10-09-08-09-10-11-12
     */
    public squares:Array<number>
    public zobristKey:number
    public zobristLock:number
    private vlWhite:number
    private vlBlack:number

    clearBoard(){
        this.sdPlayer = 0;
        this.squares = [];
        for (var sq = 0; sq < 256; sq ++) {
          this.squares.push(0);
        }
        this.zobristKey = this.zobristLock = 0;
        this.vlWhite = this.vlBlack = 0;
    }

    public mvList:Array<number>
    public pcList:Array<number>
    private keyList:Array<number>
    private chkList:Array<boolean>
    public distance:number

    setIrrev(){
        this.mvList = [0];
        this.pcList = [0];
        this.keyList = [0];
        this.chkList = [this.checked()];
        this.distance = 0;
    }

    checked(){
        var pcSelfSide = FCCUtil.SIDE_TAG(this.sdPlayer);
        var pcOppSide = FCCUtil.OPP_SIDE_TAG(this.sdPlayer);
        for (var sqSrc = 0; sqSrc < 256; sqSrc ++) {
          if (this.squares[sqSrc] != pcSelfSide + FCCUtil.PIECE_KING) {
            continue;
          }
          if (this.squares[FCCUtil.SQUARE_FORWARD(sqSrc, this.sdPlayer)] == pcOppSide + FCCUtil.PIECE_PAWN) {
            return true;
          }
          for (var delta = -1; delta <= 1; delta += 2) {
            if (this.squares[sqSrc + delta] == pcOppSide + FCCUtil.PIECE_PAWN) {
              return true;
            }
          }
          for (var i = 0; i < 4; i ++) {
            if (this.squares[sqSrc + FCCUtil.ADVISOR_DELTA[i]] != 0) {
              continue;
            }
            for (var j = 0; j < 2; j ++) {
              var pcDst = this.squares[sqSrc + FCCUtil.KNIGHT_CHECK_DELTA[i][j]];
              if (pcDst == pcOppSide + FCCUtil.PIECE_KNIGHT) {
                return true;
              }
            }
          }
          for (var i = 0; i < 4; i ++) {
            var delta = FCCUtil.KING_DELTA[i];
            var sqDst = sqSrc + delta;
            while (FCCUtil.IN_BOARD(sqDst)) {
              var pcDst = this.squares[sqDst];
              if (pcDst > 0) {
                if (pcDst == pcOppSide + FCCUtil.PIECE_ROOK || pcDst == pcOppSide + FCCUtil.PIECE_KING) {
                  return true;
                }
                break;
              }
              sqDst += delta;
            }
            sqDst += delta;
            while (FCCUtil.IN_BOARD(sqDst)) {
              var pcDst = this.squares[sqDst];
              if (pcDst > 0) {
                if (pcDst == pcOppSide + FCCUtil.PIECE_CANNON) {
                  return true;
                }
                break;
              }
              sqDst += delta;
            }
          }
          return false;
        }
        return false;
    }

    addPiece(sq, pc, bDel=null){
        var pcAdjust;
        this.squares[sq] = bDel ? 0 : pc;
        if (pc < 16) {
          pcAdjust = pc - 8;
          this.vlWhite += bDel ? -FCCUtil.PIECE_VALUE[pcAdjust][sq] :
          FCCUtil.PIECE_VALUE[pcAdjust][sq];
        } else {
          pcAdjust = pc - 16;
          this.vlBlack += bDel ? -FCCUtil.PIECE_VALUE[pcAdjust][FCCUtil.SQUARE_FLIP(sq)] :
          FCCUtil.PIECE_VALUE[pcAdjust][FCCUtil.SQUARE_FLIP(sq)];
          pcAdjust += 7;
        }
        this.zobristKey ^= PreGen_zobristKeyTable[pcAdjust][sq];
        this.zobristLock ^= PreGen_zobristLockTable[pcAdjust][sq];
    }

    /**
     * 移动棋子
     * @param mv 
     */
    movePiece(mv){
        var sqSrc = FCCUtil.SRC(mv);
        var sqDst = FCCUtil.DST(mv);
        var pc = this.squares[sqDst];
        this.pcList.push(pc);
        if (pc > 0) {
          this.addPiece(sqDst, pc, FCCUtil.DEL_PIECE);
        }
        pc = this.squares[sqSrc];
        this.addPiece(sqSrc, pc, FCCUtil.DEL_PIECE);
        this.addPiece(sqDst, pc, FCCUtil.ADD_PIECE);
        this.mvList.push(mv);
    }

    undoMovePiece(){
        var mv = this.mvList.pop();
        var sqSrc = FCCUtil.SRC(mv);
        var sqDst = FCCUtil.DST(mv);
        var pc = this.squares[sqDst];
        this.addPiece(sqDst, pc, FCCUtil.DEL_PIECE);
        this.addPiece(sqSrc, pc, FCCUtil.ADD_PIECE);
        pc = this.pcList.pop();
        if (pc > 0) {
          this.addPiece(sqDst, pc, FCCUtil.ADD_PIECE);
        }
    }

    /**
     * 下棋玩家易位
     */
    changeSide(){
        this.sdPlayer = 1 - this.sdPlayer;
        this.zobristKey ^= PreGen_zobristKeyPlayer;
        this.zobristLock ^= PreGen_zobristLockPlayer;
    }

    makeMove(mv):boolean{
        var zobristKey = this.zobristKey;
        this.movePiece(mv);
        if (this.checked()) {
        //   this.undoMovePiece(mv);
          this.undoMovePiece();
          return false;
        }
        this.keyList.push(zobristKey);
        this.changeSide();
        this.chkList.push(this.checked());
        this.distance ++;
        return true;
    }

    undoMakeMove(){
        this.distance --;
        this.chkList.pop();
        this.changeSide();
        this.keyList.pop();
        this.undoMovePiece();
    }

    nullMove(){
        this.mvList.push(0);
        this.pcList.push(0);
        this.keyList.push(this.zobristKey);
        this.changeSide();
        this.chkList.push(false);
        this.distance ++;
    }

    undoNullMove(){
        this.distance --;
        this.chkList.pop();
        this.changeSide();
        this.keyList.pop();
        this.pcList.pop();
        this.mvList.pop();
    }

    /**
     * 从fen开始初始化
     * @param fen 
     */
    fromFen(fen){
        this.clearBoard();
        var y = FCCUtil.RANK_TOP;
        var x = FCCUtil.FILE_LEFT;
        var index = 0;
        if (index == fen.length) {
          this.setIrrev();
          return;
        }
        var c = fen.charAt(index);
        while (c != " ") {
          if (c == "/") {
            x = FCCUtil.FILE_LEFT;
            y ++;
            if (y > FCCUtil.RANK_BOTTOM) {
              break;
            }
          } else if (c >= "1" && c <= "9") {
            for (var k = 0; k < (FCCUtil.ASC(c) - FCCUtil.ASC("0")); k ++) {
              if (x >= FCCUtil.FILE_RIGHT) {
                break;
              }
              x ++;
            }
          } else if (c >= "A" && c <= "Z") {
            if (x <= FCCUtil.FILE_RIGHT) {
              var pt = FCCUtil.CHAR_TO_PIECE(c);
              if (pt >= 0) {
                this.addPiece(FCCUtil.COORD_XY(x, y), pt + 8);
              }
              x ++;
            }
          } else if (c >= "a" && c <= "z") {
            if (x <= FCCUtil.FILE_RIGHT) {
              var pt = FCCUtil.CHAR_TO_PIECE(FCCUtil.CHR(FCCUtil.ASC(c) 
              + FCCUtil.ASC("A") 
              - FCCUtil.ASC("a")));
              if (pt >= 0) {
                this.addPiece(FCCUtil.COORD_XY(x, y), pt + 16);
              }
              x ++;
            }
          }
          index ++;
          if (index == fen.length) {
            this.setIrrev();
            return;
          }
          c = fen.charAt(index);
        }
        index ++;
        if (index == fen.length) {
          this.setIrrev();
          return;
        }
        if (this.sdPlayer == (fen.charAt(index) == "b" ? 0 : 1)) {
          this.changeSide();
        }
        this.setIrrev();
    }

    toFen(){
        var fen = "";
        for (var y = FCCUtil.RANK_TOP; y <= FCCUtil.RANK_BOTTOM; y ++) {
        var k = 0;
        for (var x = FCCUtil.FILE_LEFT; x <= FCCUtil.FILE_RIGHT; x ++) {
            var pc = this.squares[FCCUtil.COORD_XY(x, y)];
            if (pc > 0) {
                if (k > 0) {
                    fen += FCCUtil.CHR(FCCUtil.ASC("0") + k);
                    k = 0;
                }
                fen += FCCUtil.FEN_PIECE.charAt(pc);
            } else {
                k ++;
            }
        }   
        if (k > 0) {
            fen += FCCUtil.CHR(FCCUtil.ASC("0") + k);
        }
        fen += "/";
        }
        return fen.substring(0, fen.length - 1) + " " +
        (this.sdPlayer == 0 ? 'w' : 'b');
    }

    generateMoves (vls:Array<number>,sq:number=null) {
        var mvs = [];
        var pcSelfSide = FCCUtil.SIDE_TAG(this.sdPlayer);
        var pcOppSide = FCCUtil.OPP_SIDE_TAG(this.sdPlayer);
        for (var sqSrc = 0; sqSrc < 256; sqSrc ++) {
          if(sq!==null){
            if(sqSrc!=sq) continue
          }
          var pcSrc = this.squares[sqSrc];
          if ((pcSrc & pcSelfSide) == 0) {
            continue;
          }
          switch (pcSrc - pcSelfSide) {
          case FCCUtil.PIECE_KING:
            for (var i = 0; i < 4; i ++) {
              var sqDst = sqSrc + FCCUtil.KING_DELTA[i];
              if (!FCCUtil.IN_FORT(sqDst)) {
                continue;
              }
              var pcDst = this.squares[sqDst];
              if (vls == null) {
                if ((pcDst & pcSelfSide) == 0) {
                  mvs.push(FCCUtil.MOVE(sqSrc, sqDst));
                }
              } else if ((pcDst & pcOppSide) != 0) {
                mvs.push(FCCUtil.MOVE(sqSrc, sqDst));
                vls.push(FCCUtil.MVV_LVA(pcDst, 5));
              }
            }
            break;
          case FCCUtil.PIECE_ADVISOR:
            for (var i = 0; i < 4; i ++) {
              var sqDst = sqSrc + FCCUtil.ADVISOR_DELTA[i];
              if (!FCCUtil.IN_FORT(sqDst)) {
                continue;
              }
              var pcDst = this.squares[sqDst];
              if (vls == null) {
                if ((pcDst & pcSelfSide) == 0) {
                  mvs.push(FCCUtil.MOVE(sqSrc, sqDst));
                }
              } else if ((pcDst & pcOppSide) != 0) {
                mvs.push(FCCUtil.MOVE(sqSrc, sqDst));
                vls.push(FCCUtil.MVV_LVA(pcDst, 1));
              }
            }
            break;
          case FCCUtil.PIECE_BISHOP:
            for (var i = 0; i < 4; i ++) {
              var sqDst = sqSrc + FCCUtil.ADVISOR_DELTA[i];
              if (!(FCCUtil.IN_BOARD(sqDst) 
              && FCCUtil.HOME_HALF(sqDst, this.sdPlayer) &&
                  this.squares[sqDst] == 0)) {
                continue;
              }
              sqDst += FCCUtil.ADVISOR_DELTA[i];
              var pcDst = this.squares[sqDst];
              if (vls == null) {
                if ((pcDst & pcSelfSide) == 0) {
                  mvs.push(FCCUtil.MOVE(sqSrc, sqDst));
                }
              } else if ((pcDst & pcOppSide) != 0) {
                mvs.push(FCCUtil.MOVE(sqSrc, sqDst));
                vls.push(FCCUtil.MVV_LVA(pcDst, 1));
              }
            }
            break;
          case FCCUtil.PIECE_KNIGHT:
            for (var i = 0; i < 4; i ++) {
              var sqDst = sqSrc + FCCUtil.KING_DELTA[i];
              if (this.squares[sqDst] > 0) {
                continue;
              }
              for (var j = 0; j < 2; j ++) {
                sqDst = sqSrc + FCCUtil.KNIGHT_DELTA[i][j];
                if (!FCCUtil.IN_BOARD(sqDst)) {
                  continue;
                }
                var pcDst = this.squares[sqDst];
                if (vls == null) {
                  if ((pcDst & pcSelfSide) == 0) {
                    mvs.push(FCCUtil.MOVE(sqSrc, sqDst));
                  }
                } else if ((pcDst & pcOppSide) != 0) {
                  mvs.push(FCCUtil.MOVE(sqSrc, sqDst));
                  vls.push(FCCUtil.MVV_LVA(pcDst, 1));
                }
              }
            }
            break;
          case FCCUtil.PIECE_ROOK:
            for (var i = 0; i < 4; i ++) {
              var delta = FCCUtil.KING_DELTA[i];
              var sqDst = sqSrc + delta;
              while (FCCUtil.IN_BOARD(sqDst)) {
                var pcDst = this.squares[sqDst];
                if (pcDst == 0) {
                  if (vls == null) {
                    mvs.push(FCCUtil.MOVE(sqSrc, sqDst));
                  }
                } else {
                  if ((pcDst & pcOppSide) != 0) {
                    mvs.push(FCCUtil.MOVE(sqSrc, sqDst));
                    if (vls != null) {
                      vls.push(FCCUtil.MVV_LVA(pcDst, 4));
                    }
                  }
                  break;
                }
                sqDst += delta;
              }
            }
            break;
          case FCCUtil.PIECE_CANNON:
            for (var i = 0; i < 4; i ++) {
              var delta = FCCUtil.KING_DELTA[i];
              var sqDst = sqSrc + delta;
              while (FCCUtil.IN_BOARD(sqDst)) {
                var pcDst = this.squares[sqDst];
                if (pcDst == 0) {
                  if (vls == null) {
                    mvs.push(FCCUtil.MOVE(sqSrc, sqDst));
                  }
                } else {
                  break;
                }
                sqDst += delta;
              }
              sqDst += delta;
              while (FCCUtil.IN_BOARD(sqDst)) {
                var pcDst = this.squares[sqDst];
                if (pcDst > 0) {
                  if ((pcDst & pcOppSide) != 0) {
                    mvs.push(FCCUtil.MOVE(sqSrc, sqDst));
                    if (vls != null) {
                      vls.push(FCCUtil.MVV_LVA(pcDst, 4));
                    }
                  }
                  break;
                }
                sqDst += delta;
              }
            }
            break;
          case FCCUtil.PIECE_PAWN:
            var sqDst = FCCUtil.SQUARE_FORWARD(sqSrc, this.sdPlayer);
            if (FCCUtil.IN_BOARD(sqDst)) {
              var pcDst = this.squares[sqDst];
              if (vls == null) {
                if ((pcDst & pcSelfSide) == 0) {
                  mvs.push(FCCUtil.MOVE(sqSrc, sqDst));
                }
              } else if ((pcDst & pcOppSide) != 0) {
                mvs.push(FCCUtil.MOVE(sqSrc, sqDst));
                vls.push(FCCUtil.MVV_LVA(pcDst, 2));
              }
            }
            if (FCCUtil.AWAY_HALF(sqSrc, this.sdPlayer)) {
              for (var delta = -1; delta <= 1; delta += 2) {
                sqDst = sqSrc + delta;
                if (FCCUtil.IN_BOARD(sqDst)) {
                  var pcDst = this.squares[sqDst];
                  if (vls == null) {
                    if ((pcDst & pcSelfSide) == 0) {
                      mvs.push(FCCUtil.MOVE(sqSrc, sqDst));
                    }
                  } else if ((pcDst & pcOppSide) != 0) {
                    mvs.push(FCCUtil.MOVE(sqSrc, sqDst));
                    vls.push(FCCUtil.MVV_LVA(pcDst, 2));
                  }
                }
              }
            }
            break;
          }
        }
        return mvs;
    }

    legalMove(mv){
        var sqSrc = FCCUtil.SRC(mv);
        var pcSrc = this.squares[sqSrc];
        var pcSelfSide = FCCUtil.SIDE_TAG(this.sdPlayer);
        if ((pcSrc & pcSelfSide) == 0) {
          return false;
        }
      
        var sqDst = FCCUtil.DST(mv);
        var pcDst = this.squares[sqDst];
        if ((pcDst & pcSelfSide) != 0) {
          return false;
        }
      
        switch (pcSrc - pcSelfSide) {
        case FCCUtil.PIECE_KING:
          return FCCUtil.IN_FORT(sqDst) && FCCUtil.KING_SPAN(sqSrc, sqDst);
        case FCCUtil.PIECE_ADVISOR:
          return FCCUtil.IN_FORT(sqDst) && FCCUtil.ADVISOR_SPAN(sqSrc, sqDst);
        case FCCUtil.PIECE_BISHOP:
          return FCCUtil.SAME_HALF(sqSrc, sqDst) && FCCUtil.BISHOP_SPAN(sqSrc, sqDst) &&
              this.squares[FCCUtil.BISHOP_PIN(sqSrc, sqDst)] == 0;
        case FCCUtil.PIECE_KNIGHT:
          var sqPin = FCCUtil.KNIGHT_PIN(sqSrc, sqDst);
          return sqPin != sqSrc && this.squares[sqPin] == 0;
        case FCCUtil.PIECE_ROOK:
        case FCCUtil.PIECE_CANNON:
          var delta;
          if (FCCUtil.SAME_RANK(sqSrc, sqDst)) {
            delta = (sqDst < sqSrc ? -1 : 1);
          } else if (FCCUtil.SAME_FILE(sqSrc, sqDst)) {
            delta = (sqDst < sqSrc ? -16 : 16);
          } else {
            return false;
          }
          var sqPin = sqSrc + delta;
          while (sqPin != sqDst && this.squares[sqPin] == 0) {
            sqPin += delta;
          }
          if (sqPin == sqDst) {
            return pcDst == 0 || pcSrc - pcSelfSide == FCCUtil.PIECE_ROOK;
          }
          if (pcDst == 0 || pcSrc - pcSelfSide != FCCUtil.PIECE_CANNON) {
            return false;
          }
          sqPin += delta;
          while (sqPin != sqDst && this.squares[sqPin] == 0) {
            sqPin += delta;
          }
          return sqPin == sqDst;
        case FCCUtil.PIECE_PAWN:
          if (FCCUtil.AWAY_HALF(sqDst, this.sdPlayer) && (sqDst == sqSrc - 1 || sqDst == sqSrc + 1)) {
            return true;
          }
          return sqDst == FCCUtil.SQUARE_FORWARD(sqSrc, this.sdPlayer);
        default:
          return false;
        }
    }

    isMate(){
        var mvs = this.generateMoves(null);
        for (var i = 0; i < mvs.length; i ++) {
          if (this.makeMove(mvs[i])) {
            this.undoMakeMove();
            return false;
          }
        }
        return true;  
    }

    mateValue(){
        return this.distance - FCCUtil.MATE_VALUE
    }

    banValue(){
        return this.distance - FCCUtil.BAN_VALUE
    }

    drawValue(){
        return (this.distance & 1) == 0 ? -FCCUtil.DRAW_VALUE : FCCUtil.DRAW_VALUE;
    }

    /**
     * 评估
     */
    evaluate(){
        var vl = (this.sdPlayer == 0 ? this.vlWhite - this.vlBlack :
            this.vlBlack - this.vlWhite) + FCCUtil.ADVANCED_VALUE;
        return vl == this.drawValue() ? vl - 1 : vl;
    }

    nullOkay(){
        return (this.sdPlayer == 0 ? this.vlWhite : this.vlBlack) > FCCUtil.NULL_OKAY_MARGIN;
    }

    nullSafe(){
        return (this.sdPlayer == 0 ? this.vlWhite : this.vlBlack) > FCCUtil.NULL_SAFE_MARGIN;
    }

    inCheck(){
        return this.chkList[this.chkList.length - 1];
    }

    captured(){
        return this.pcList[this.pcList.length - 1] > 0;
    }

    repValue(vlRep){
        var vlReturn = ((vlRep & 2) == 0 ? 0 : this.banValue()) +
        ((vlRep & 4) == 0 ? 0 : -this.banValue());
        return vlReturn == 0 ? this.drawValue() : vlReturn;
    }

    repStatus(recur_){
        var recur = recur_;
        var selfSide = false;
        var perpCheck = true;
        var oppPerpCheck = true;
        var index = this.mvList.length - 1;
        while (this.mvList[index] > 0 && this.pcList[index] == 0) {
          if (selfSide) {
            perpCheck = perpCheck && this.chkList[index];
            if (this.keyList[index] == this.zobristKey) {
              recur --;
              if (recur == 0) {
                return 1 + (perpCheck ? 2 : 0) + (oppPerpCheck ? 4 : 0);
              }
            }
          } else {
            oppPerpCheck = oppPerpCheck && this.chkList[index];
          }
          selfSide = !selfSide;
          index --;
        }
        return 0;
    }

    mirror(){
        var pos = new F_CCPos();
        pos.clearBoard();
        for (var sq = 0; sq < 256; sq ++) {
          var pc = this.squares[sq];
          if (pc > 0) {
            pos.addPiece(FCCUtil.MIRROR_SQUARE(sq), pc);
          }
        }
        if (this.sdPlayer == 1) {
          pos.changeSide();
        }
        return pos;
    }

    bookMove(){
        let BOOK_DAT = FCCBook.BOOK
        if (typeof BOOK_DAT != "object" || BOOK_DAT.length == 0) {
            return 0;
          }
          var mirror = false;
          var lock = this.zobristLock >>> 1; // Convert into Unsigned
          var index = FCCUtil.binarySearch (BOOK_DAT, lock);
          if (index < 0) {
            mirror = true;
            lock = this.mirror().zobristLock >>> 1; // Convert into Unsigned
            index = FCCUtil.binarySearch(BOOK_DAT, lock);
          }
          if (index < 0) {
            return 0;
          }
          index --;
          while (index >= 0 && BOOK_DAT[index][0] == lock) {
            index --;
          }
          var mvs = [], vls = [];
          var value = 0;
          index ++;
          while (index < BOOK_DAT.length && BOOK_DAT[index][0] == lock) {
            var mv = BOOK_DAT[index][1];
            mv = (mirror ? FCCUtil.MIRROR_MOVE(mv) : mv);
            if (this.legalMove(mv)) {
              mvs.push(mv);
              var vl = BOOK_DAT[index][2];
              vls.push(vl);
              value += vl;
            }
            index ++;
          }
          if (value == 0) {
            return 0;
          }
          value = Math.floor(Math.random() * value);
          for (index = 0; index < mvs.length; index ++) {
            value -= vls[index];
            if (value < 0) {
              break;
            }
          }
          return mvs[index];
    }

    historyIndex(mv){
        return ((this.squares[FCCUtil.SRC(mv)] - 8) << 8) + FCCUtil.DST(mv);
    }
}