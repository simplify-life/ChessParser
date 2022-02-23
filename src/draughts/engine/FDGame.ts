
import {International_draughts,Brazilian_draughts,C_NONE,C_WHITE,C_BLACK,KING,PIECE} from './FDConst'


/**  International draughts
 *  +---------------------------------------+
 *  |   | 1 |   | 2 |   | 3 |   | 4 |   | 5 | 10
 *  +---+---+---+---+---+---+---+---+---+---+
 *  | 6 |   | 7 |   | 8 |   | 9 |   | 10|   | 9
 *  +---+---+---+---+---+---+---+---+---+---+
 *  |   | 11|   | 12|   | 13|   | 14|   | 15| 8
 *  +---+---+---+---+---+---+---+---+---+---+
 *  | 16|   | 17|   | 18|   | 19|   | 20|   | 7
 *  +---+---+---+---+---+---+---+---+---+---+
 *  |   | 21|   | 22|   | 23|   | 24|   | 25| 6
 *  +---+---+---+---+---+---+---+---+---+---+
 *  | 26|   | 27|   | 28|   | 29|   | 30|   | 5
 *  +---+---+---+---+---+---+---+---+---+---+
 *  |   | 31|   | 32|   | 33|   | 34|   | 35| 4
 *  +---+---+---+---+---+---+---+---+---+---+
 *  | 36|   | 37|   | 38|   | 39|   | 40|   | 3
 *  +---+---+---+---+---+---+---+---+---+---+
 *  |   | 41|   | 42|   | 43|   | 44|   | 45| 2
 *  +---+---+---+---+---+---+---+---+---+---+
 *  | 46|   | 47|   | 48|   | 49|   | 50|   | 1
 *  +---------------------------------------+
 *    a   b   c   d   e   f   g   h   i   j
 */



/**  Brazilian draughts
 *  +-------------------------------+
 *  |   | 1 |   | 2 |   | 3 |   | 4 | 8
 *  +---+---+---+---+---+---+---+---+
 *  | 5 |   | 6 |   | 7 |   | 8 |   | 7
 *  +---+---+---+---+---+---+---+---+
 *  |   | 9 |   | 10|   | 11|   | 12| 6
 *  +---+---+---+---+---+---+---+---+
 *  | 13|   | 14|   | 15|   | 16|   | 5
 *  +---+---+---+---+---+---+---+---+
 *  |   | 17|   | 18|   | 19|   | 20| 4
 *  +---+---+---+---+---+---+---+---+
 *  | 21|   | 22|   | 23|   | 24|   | 3
 *  +---+---+---+---+---+---+---+---+
 *  |   | 25|   | 26|   | 27|   | 28| 2
 *  +---+---+---+---+---+---+---+---+
 *  | 29|   | 30|   | 31|   | 32|   | 1
 *  +-------------------------------+
 *    a   b   c   d   e   f   g   h
 */
export interface DMove{
    from: number,
    to:number,
    flag:number,//0 normal , 1 peice grade king, 2 x
}

export class FDGame {

    private board:Array<number>
    private gameType:number
    private turn:number
    private mvHistory:Array<Array<DMove>>
    constructor(gameType:number){
        this.gameType = gameType
        let defaultFen = ""
        if(gameType==International_draughts){
            defaultFen = "W:W31-50:B1-20"
        }else if(gameType==Brazilian_draughts){
            defaultFen = "W:W21-32:B1-12"
        }else{
            throw new Error(`not support this game type : ${gameType}`);
        }
        this.startFromFen(defaultFen);
    }
    /**
     * S -> [FEN "[Turn]:[Color][K][Square],[K][Square]...]:[Color][K][Square], [K][Square]...]"]
     * [Color] -> 'B' | 'W'
     * [K] -> 'K' | ''
     * [Square] -> (1 - 64 or 1-100)
     * @param fen 
     */
    startFromFen(fen:string){
        if(this.board == null){
            this.board = new Array(this.boardsize()).fill(C_NONE);
        }else
        this.board.fill(C_NONE);
        this.mvHistory = []
        let fenArr = fen.split(":")
        if(fenArr.length<3){
            throw new Error(`not support this fen : ${fen}`);
        }
        if(fenArr[0]=="W"){
            this.turn = C_WHITE
        }else if(fenArr[0]=="B"){
            this.turn = C_BLACK
        }else {
            throw new Error(`not support this fen : ${fen}`);
        }
        this.readPieceFromFen(fenArr[1])
        this.readPieceFromFen(fenArr[2])
    }

    /**
     * [Color][K][Square], [K][Square]...
     */
     readPieceFromFen(fenPiece:string){
         let color = C_NONE
        if(fenPiece[0]=="W"){
            color = C_WHITE
        }else if(fenPiece[0]=="B"){
            color = C_BLACK
        }
        fenPiece = fenPiece.substr(1)
        let pieceArr = fenPiece.split(",")
        for(let i = 0 ; i < pieceArr.length ; i ++){
            let p = pieceArr[i]
            let piece = PIECE
            if(p.startsWith('K')){
                piece = KING
                p = p.substr(1)
            }
            let parr = p.split("-")
            let start = parseInt(parr[0])
            let end = start
            if(parr.length=2){ 
                end = parseInt(parr[1])
            }
            for(let j = start ; j <= end ; j++){
                this.addPieceAtPdnPos(color|piece,j)
            }
        }
    }

    addPieceAtPdnPos(piece:number,pdnPos:number){
        let idx = this.pdnPos2Idx(pdnPos)
        this.board[idx] = piece
    }

    pdnPos2Idx(pdnPos:number){
        switch(this.gameType){
            case International_draughts:
                var p = ~~((pdnPos-1)/5)
                if(p%2==0) return pdnPos*2-1;
                return pdnPos*2-2;
            case Brazilian_draughts:
                var p = ~~((pdnPos-1)/4)
                if(p%2==0) return pdnPos*2-1;
                return pdnPos*2-2;
        }
        throw new Error(`not support this game type : ${this.gameType}`);
    }

    idx2Pdn(idx:number){
        switch(this.gameType){
            case International_draughts:
                if(idx<99){
                    var p = ~~(idx/10)
                    if(p%2==0){
                        if(idx%2==1)
                        return (idx+1)/2
                    }else{
                        if(idx%2==0)
                        return (idx+2)/2
                    }
                }
                return -1;
            case Brazilian_draughts:
                if(idx<63){
                    var p = ~~(idx/8)
                    if(p%2==0){
                        if(idx%2==1)
                        return (idx+1)/2
                    }else{
                        if(idx%2==0)
                        return (idx+2)/2
                    }
                }
                return -1;
        }
        return -1;
    }

    sanToIdx(san:string){
        if(this.gameType==Brazilian_draughts){
            let x = san.charCodeAt(0)-'a'.charCodeAt(0)
            let y = 8 - parseInt(san.substr(1))
            if(y>=0){
                return x+y*8
            }
        }
        return -1;
    }

    idx2San(idx:number){
        if(this.gameType==Brazilian_draughts){
            let x = idx%8
            let y = ~~(idx/8)
            return String.fromCharCode('a'.charCodeAt(0)+x)+`${8-y}`
        }
        return ""
    }

    boardsize(){
        if(this.gameType==International_draughts){
            return 100;
        }else if(this.gameType==Brazilian_draughts){
            return 64;
        }else{
            throw new Error(`not support this game type : ${this.gameType}`);
        }
    }

    pdnsize(){
        if(this.gameType==International_draughts){
            return 50;
        }else if(this.gameType==Brazilian_draughts){
            return 32;
        }else{
            throw new Error(`not support this game type : ${this.gameType}`);
        }
    }

    getMoveList():Array<Array<DMove>>{
        let mvList = []
        for(let i = 1; i <= this.pdnsize(); i++){
            let piece = this.getPieceOnPdnPos(i)
            if((piece & this.turn)==this.turn){
                //normal piece
                if((piece & PIECE)==PIECE){
                    //front  2 pos
                    if(this.turn == C_BLACK){
                        // let lB = this.leftBottom(i)
                        // let rB = this.rightBottom(i)
                        // let plB = this.getPieceOnPdnPos(lB)
                        // //1.normal
                        // if(plB==C_NONE){
                        //     mvList.push({
                        //         from: i,
                        //         to: plB,
                        //         flag:(this.is2Bottom(plB,this.turn) ? (0|1) : 0 )
                        //     })
                        // }
                        // let prB = this.getPieceOnPdnPos(rB)
                        // if(prB==C_NONE){
                        //     mvList.push({
                        //         from: i,
                        //         to: prB,
                        //         flag:(this.is2Bottom(prB,this.turn) ? (0|1) : 0 )
                        //     })
                        // }
                        //2.x
                        
                    }
                }
                //king piece
                else if((piece & KING)==PIECE){

                }
            }
        }
        return mvList
    }

    getPieceOnPdnPos(pdnPos: number): number{
        let idx = this.pdnPos2Idx(pdnPos)
        return this.board[idx]
    }


    is2Bottom(pdnPos: number,color:number){
        if(color==C_BLACK){
            switch(this.gameType){
                case International_draughts:
                    var p = ~~((pdnPos-1)/5)
                    return p==9
                case Brazilian_draughts:
                    var p = ~~((pdnPos-1)/4)
                    return p==7
            }
        }
        else if(color==C_WHITE){
            switch(this.gameType){
                case International_draughts:
                    var p = ~~((pdnPos-1)/5)
                    return p==0
                case Brazilian_draughts:
                    var p = ~~((pdnPos-1)/4)
                    return p==0
            }
        }
        return false
    }

    idxDiff(idx: number,x: number,y: number): number {
        let xLength = this.maxX()+1
        let ix = idx%xLength
        let iy = ~~(idx/xLength)
        let rX = ix+x
        let rY = iy+y
        let r = rY*xLength + rX
        if(r>=0&&r<this.boardsize())
        return r;
        return -1
    }

    maxX(){
        switch(this.gameType){
            case International_draughts:
                 return 9
            case Brazilian_draughts:
                 return 7
        }
        return -1
    }

    maxY(){
        switch(this.gameType){
            case International_draughts:
                 return 9
            case Brazilian_draughts:
                 return 7
        }
        return -1
    }

    mvScore(mv){
        /**
         * 局面评估 目标->获胜/和棋
         * 1. 普通 棋子---1子+1
         * 2. 王 --------1子+10
         * 3. 吃子(含胜败)----1子+1，1王+10 获胜+999
         * 4. 可走着法数目---- 有着法 +0 无着法 +999
         * 5. 是否符合和棋----看目标 。目标和棋，则 +999,否则-999
         */
    }

    pruning(){
      //剪枝
    }

    makeMv(){

    }

    undoMv(){

    }

    search(level: number,ms: number){

    }

    piece2Char(piece: number){
        if((piece & C_BLACK)==C_BLACK){
            if((piece & PIECE)==PIECE){
                return "p"
            }
            if((piece & KING)==KING){
                return "k"
            }
        }
        if((piece & C_WHITE)==C_WHITE){
            if((piece & PIECE)==PIECE){
                return "P"
            }
            if((piece & KING)==KING){
                return "K"
            }
        }
        return " ";
    }

    boardDes() {
        var s = this.boardStrStart();
        let maxX = this.maxX()+1
        for(let i = 0; i < this.maxY()+1; i++){
            let str='   |'
            for(let j = 0; j < maxX; j++){
                let jStr = this.piece2Char(this.board[i*maxX + j])
                str +=` ${jStr} |`
            }
            s += `${str} ${this.maxY()+1-i}\n`
            if(i!=this.maxY())
            s += this.boardStrline()
        }
        s += this.boardStrEnd()
        s += this.boardSan()
        return s;
    }

    boardStrStart(){
        switch(this.gameType){
            case International_draughts:
                return '   +---------------------------------------+\n'
           case Brazilian_draughts:
                return "   +-------------------------------+\n"
        }
        return ""
    }

    boardStrline(){
        switch(this.gameType){
            case International_draughts:
                return '   +---+---+---+---+---+---+---+---+---+---+\n';
           case Brazilian_draughts:
                return '   +---+---+---+---+---+---+---+---+\n';
        }
        return ""
    }

    boardStrEnd(){
        return this.boardStrStart()
    }

    boardSan(){
        switch(this.gameType){
            case International_draughts:
                return '     a   b   c   d   e   f   g   h   i   j\n'
           case Brazilian_draughts:
                return '     a   b   c   d   e   f   g   h\n'
        }
        return ""
    }

}