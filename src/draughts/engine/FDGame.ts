
import {NONE,C_WHITE,C_BLACK,KING,PAWNS,DRAW} from './FDConst'


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
    eatPos?:number,
    eatPiece?:number
    kingMove?:boolean
}

export class DrawRule{
    //同局面次数
    homeType:number
    //只移动王回合数
    kingMove:number
    //3特殊子数回合
    pieceNum:Array<{piece:string,step:number}>
}

export class FDGame {

    private board:Array<number>
    private type:number
    public turn:number
    private mvHistory:Array<Array<DMove>>

    private startColor:number
    private width:number
    private height:number
    private notation:string
    private startDirection:number
    private leftBottomValid:boolean
    private startFen:string
    private fenHistory:Array<string>
    /**
     *[white pawn,white king, black pawn, black king]
     */
    private pieceCnt:Array<number>

    private result:number // 0 未知 1 黑胜 2 白胜 3 和棋 
    private reason:number // 0。 未知 1。 吃光 2。 无子可动 3。 三次同型  4。 25回合/15回合 5。一王一王/5回合 6。两王一王5回合 7。三王对1王 16 回合 8. 三王对2王 16回合 9. 一王一王一普通
    //1同型次数 2只动王回合 3特殊子数回合
    /**
     * 100:[3,25,{"0,1,0,1":5,"0,1,0,2":5,"0,2,0,1":5,"0,3,0,1":16,"0,1,0,3":16,"0,3,0,2":16,"0,2,0,3":16}]
     * 64:[3,15,{"0,1,0,1":5,"1,1,0,1":5,"0,1,1,1":5,"0,1,0,2":5,"0,2,0,1":5}]
     */
    public drawRule:DrawRule
    setDrawRule(drawRule:DrawRule):void{
        this.drawRule = drawRule;
        this.gameDraw = new DrawRule()
        this.gameDraw.homeType = 0
        this.gameDraw.kingMove = 0
        this.gameDraw.pieceNum = []
        for(var i = 0; i <drawRule.pieceNum.length ; i++){
            this.gameDraw.pieceNum.push({piece:drawRule.pieceNum[i].piece,step:0})
        }
    }
    public gameDraw:DrawRule

    constructor(public gameInfo:string){
        this.initGameInfo(gameInfo)
    }

    start(){
        this.startFromFen(this.startFen)
    }

    cloneBoard(){
        return this.board.slice(0)
    }

    clone(){
       let newGame = new FDGame(this.gameInfo)
       newGame.turn = this.turn == C_BLACK ? C_BLACK : C_WHITE
       newGame.board = this.cloneBoard()
       return newGame
    }

    /**
     * Notation: A = alpha/numeric like chess
     *           N = numeric like draught
     *           S = SAN - short-form notation]
     * first Square: 0 = Bottom left
     *               1 = Bottom right
     *               2 = Top left
     *               3 = Top right
     * Invert-flag: 0 = The bottom left corner is a playing square
     *              1 = The bottom left corner is not a playing square
     * [type],[startColor],[boardWidth],[boardHeight],[Notation][first Square],[Invert-flag]
     * @returns 
     */
    initGameInfo(gameInfo:string){
        let infoArr = gameInfo.split(",")
        this.type = parseInt(infoArr[0])
        this.startColor = infoArr[1]=="W"?C_WHITE:C_BLACK
        this.width = parseInt(infoArr[2])
        this.height = parseInt(infoArr[3])
        this.notation = infoArr[4][0]
        this.startDirection = parseInt(infoArr[4][1])
        this.leftBottomValid = infoArr[5]=="0"
        if(this.type==20){
            this.startFen = "W:W31-50:B1-20"
        }
        if(this.type==26){
            this.startFen = "W:W21-32:B1-12"
        }
        this.result = 0
        this.pieceCnt = [0,0,0,0]
        this.mvHistory = []
        this.fenHistory = []
    }


    /**
     * S -> [FEN "[Turn]:[Color][K][Square],[K][Square]...]:[Color][K][Square], [K][Square]...]"]
     * [Color] -> 'B' | 'W'
     * [K] -> 'K' | ''
     * [Square] -> (1 - 64 or 1-100)
     * @param fen 
     */
    startFromFen(fen:string){
        this.result = 0
        this.startFen = fen
        this.pieceCnt = [0,0,0,0]
        this.mvHistory = []
        this.boardFromFen(fen)
        this.fenHistory = [this.getFen()]
    }

    boardFromFen(fen:string){
        this.result = 0
        if(this.board == null){
            this.board = new Array(this.width*this.height).fill(NONE);
        }else
        this.board.fill(NONE);
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
         let color = NONE
         let cntIdx = -1
        if(fenPiece[0]=="W"){
            color = C_WHITE
            cntIdx = 0
        }else if(fenPiece[0]=="B"){
            color = C_BLACK
            cntIdx = 2
        }
        fenPiece = fenPiece.substr(1)
        let pieceArr = fenPiece.split(",")
        for(let i = 0 ; i < pieceArr.length ; i ++){
            let p = pieceArr[i]
            let piece = PAWNS
            let diffCnt = 0
            if(p.startsWith('K')){
                piece = KING
                p = p.substr(1)
                diffCnt = 1
            }
            let parr = p.split("-")
            let start = parseInt(parr[0])
            let end = start
            if(2==parr.length){ 
                end = parseInt(parr[1])
            }
            for(let j = start ; j <= end ; j++){
                this.pieceCnt[cntIdx+diffCnt]++
                this.addPieceAtPdnPos(color|piece,j)
            }
        }
    }

    addPieceAtPdnPos(piece:number,pdnPos:number){
        let idx = this.pdnPos2Idx(pdnPos)
        this.board[idx] = piece
    }

    pdnPos2Idx(pdnPos:number){
        switch(this.type){
            case 20:
                var p = ~~((pdnPos-1)/5)
                if(p%2==0) return pdnPos*2-1;
                return pdnPos*2-2;
            case 26:
                var p = ~~((pdnPos-1)/4)
                if(p%2==0) return pdnPos*2-1;
                return pdnPos*2-2;
        }
        throw new Error(`not support this game type : ${this.type}`);
    }

    idx2Pdn(idx:number){
        switch(this.type){
            case 20:
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
            case 26:
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
        if(this.type==26){
            let x = san.charCodeAt(0)-'a'.charCodeAt(0)
            let y = 8 - parseInt(san.substr(1))
            if(y>=0){
                return x+y*8
            }
        }
        return -1;
    }

    idx2San(idx:number){
        if(this.type==26){
            let x = idx%this.width
            let y = ~~(idx/this.width)
            return String.fromCharCode('a'.charCodeAt(0)+x)+`${this.height-y}`
        }
        return ""
    }


    pdnSize(){
        if(this.type==20){
            return 50;
        }else if(this.type==26){
            return 32;
        }else{
            throw new Error(`not support this game type : ${this.type}`);
        }
    }

    getMoveList():Array<Array<DMove>>{
        let normalMvs:Array<Array<DMove>> = []
        this.pawnEatMvs = []
        this.kingEatMvs = []
        for(let i = 1; i <= this.pdnSize(); i++){
            let piece = this.getPieceOnPdnPos(i)
            if((piece & this.turn)==this.turn){
                //normal piece
                if((piece & PAWNS)==PAWNS){
                    this.searchPawnsEatMvs(i)
                    if(this.pawnEatMvs.length==0){
                        let mvs = this.getPawnsNormalMv(i,this.turn)
                        while(mvs.length>0){
                            normalMvs.push([mvs.pop()])
                        }
                    }
                }
                //king piece
                else if((piece & KING)==KING){
                    this.searchKingEatMvs(i)
                    if(this.kingEatMvs.length==0){
                        let mvs = this.getKingNormalMv(i)
                        while(mvs.length>0){
                            normalMvs.push([mvs.pop()])
                        }
                    }
                }
            }
        }
        if(this.pawnEatMvs.length==0 && this.kingEatMvs.length == 0){
            if(normalMvs.length>0){
                for(let i = 0 ; i < normalMvs.length;i++){
                    let moves = normalMvs[i];
                    let size = moves.length;
                    let dMove = moves[size - 1];
                    if(!dMove.kingMove){
                        if(this.isTop(dMove.to)){
                            dMove.flag = (dMove.flag | 1);
                        }
                    }

                }
                return normalMvs;
            }
        }else{
            let eatMvs = this.pawnEatMvs.concat(this.kingEatMvs);
            if(eatMvs.length>0){
                eatMvs.sort((a,b)=>b.length-a.length)
                let eatCnt = eatMvs[0].length
                let eatMvsFilter = []
                for(let j = 0; j < eatMvs.length; j++){
                    if(eatMvs[j].length < eatCnt) break;
                    let size = eatMvs[j].length
                    let dMove = eatMvs[j][size - 1];
                    if(!dMove.kingMove){
                        if(this.isTop(dMove.to)){
                            dMove.flag = (dMove.flag | 1);
                        }
                    }
                    eatMvsFilter.push(eatMvs[j])
                }
               return eatMvsFilter
            }
        }
        return []
    }

    isTop(pdnPos:number){
        let point = this.pdn2XY(pdnPos);
        let topY = 0;
        if(this.turn==C_BLACK){
            topY = this.height - 1;
        }
        return point.y == topY;
    }

    getPawnsNormalMv(from:number,turn: number):Array<DMove>{
        let type = 2
        if(turn==C_WHITE) type = 1
        let diffPos = this.pdnPosDiff(from,type)
        let mvs = []
        for(let i = 0; i < 2 ; i++){
            if(diffPos[i].length>0){
                let to = diffPos[i][0]
                if(this.getPieceOnPdnPos(to)==NONE){
                    mvs.push({
                        from:from,
                        to:to,
                        flag: (this.is2Bottom(to,turn) ? 1 : 0),
                        kingMove:false
                    })
                }
            }
        }
        return mvs;
    }

    getKingNormalMv(from:number):Array<DMove>{
        let diffPos = this.pdnPosDiff(from,0)
        let mvs = []
        for(let i = 0; i < 4; i++){
            let diff = diffPos[i]
            for(let j = 0; j < diff.length; j++){
                let to = diff[j]
                if(this.getPieceOnPdnPos(to)==NONE){
                    mvs.push({
                        from:from,
                        to:to,
                        flag: 0,
                        kingMove:true
                    })
                }else break
            }
        }
        return mvs;
    }

    getPieceOnPdnPos(pdnPos: number): number{
        let idx = this.pdnPos2Idx(pdnPos)
        return this.board[idx]
    }


    is2Bottom(pdnPos: number,color:number){
        if(color==C_BLACK){
            switch(this.type){
                case 20:
                    var p = ~~((pdnPos-1)/5)
                    return p==9
                case 26:
                    var p = ~~((pdnPos-1)/4)
                    return p==7
            }
        }
        else if(color==C_WHITE){
            switch(this.type){
                case 20:
                    var p = ~~((pdnPos-1)/5)
                    return p==0
                case 26:
                    var p = ~~((pdnPos-1)/4)
                    return p==0
            }
        }
        return false
    }

    pdn2XY(pdn:number):{x:number,y:number}{
        let idx = this.pdnPos2Idx(pdn);
        return {
            x:idx%this.width,
            y:~~(idx/this.width)
        }
    }

    idxDiff(idx: number,x: number,y: number): number {
        let ix = idx%this.width
        let iy = ~~(idx/this.width)
        let rX = ix+x
        let rY = iy+y
        let r = rY*this.width + rX
        if(r>=0&&r<this.width*this.height)
        return r;
        return -1
    }

    idxMaxDiffTopLeft(idx:number){
        let ix = idx%this.width
        let iy = ~~(idx/this.width)
        let minX = 0,minY = 0
        let maxTL = 0
        if(ix>minX && iy>minY ){
            while((ix- maxTL - 1)>=minX && (iy-maxTL-1)>=minY){
                maxTL++
            }
        }
        return maxTL
    }

    idxMaxDiffTopRight(idx: number){
        let ix = idx%this.width
        let iy = ~~(idx/this.width)
        let minY = 0
        let maxX = this.width-1
        let maxTR = 0
        if(ix<maxX && iy>minY){
            while((ix+maxTR+1)<=maxX && (iy-maxTR-1)>= minY){
                maxTR++
            }
        }
        return maxTR
    }

    idxMaxDiffBottomLeft(idx: number){
        let ix = idx%this.width
        let iy = ~~(idx/this.width)
        let minX = 0
        let maxY = this.height-1
        let maxBL = 0
        if(ix>minX && iy<maxY){
            while((ix-maxBL-1)>=minX && (iy+maxBL+1)<= maxY){
                maxBL++
            }
        }
        return maxBL
    }

    idxMaxDiffBottomRight(idx: number){
        let ix = idx%this.width
        let iy = ~~(idx/this.width)
        let maxX = this.width-1,maxY = this.height-1
        let maxBR = 0
        if(ix<maxX && iy<maxY){
            while((ix+maxBR+1)<=maxX && (iy+maxBR+1)<= maxY){
                maxBR++
            }
        }
        return maxBR
    }

    idxMaxDiff(idx: number,diffType: number) {
        if(diffType==0)
        return [this.idxMaxDiffTopLeft(idx),this.idxMaxDiffTopRight(idx),this.idxMaxDiffBottomLeft(idx),this.idxMaxDiffBottomRight(idx)]
        if(diffType==1)
        return [this.idxMaxDiffTopLeft(idx),this.idxMaxDiffTopRight(idx)]
        if(diffType==2)
        return [this.idxMaxDiffBottomLeft(idx),this.idxMaxDiffBottomRight(idx)]
    }

    /**
     * 
     * @param pdnPos 
     * @param diffType 0 所有， 1 上 2 下
     * @returns 
     */
    pdnPosDiff(pdnPos: number,diffType: number) {
       let res = []
       let idx = this.pdnPos2Idx(pdnPos)
       let diff = this.idxMaxDiff(idx,diffType)
       for(let i = 0; i < diff.length; i++){
           if(diff[i]>0){
                let r = []
                let dX = -1,dY = -1
                if(diffType==0){
                    if(i==1) dX=1
                    if(i==2) dY=1
                    if(i==3) dX=1,dY=1
                }
                if(diffType==1){
                    if(i==1) dX=1
                }
                if(diffType==2){
                    if(i==0) dX=-1,dY=1
                    if(i==1) dX=1,dY=1
                }
                for(let j = 1; j <= diff[i]; j++){
                    let idxD = this.idxDiff(idx,dX*j,dY*j)
                    if(idxD>=0)
                        r.push(this.idx2Pdn(idxD))
                }
                res.push(r)
           }else{
             res.push([])
           }
       }
       return res
    }

    pdnRange(pdnFrom:number,pdnTo:number){
        let from = this.pdnPos2Idx(pdnFrom)
        let xFrom = from%this.width
        let yFrom = ~~(from/this.width)
        let to = this.pdnPos2Idx(pdnTo)
        let xTo = to%this.width
        let yTo = ~~(to/this.width)
        let xDiff = xTo - xFrom
        let yDiff = yTo - yFrom
        let xAdd = xDiff>0
        let yAdd = yDiff>0
        // let y = xDiff>>31
        //  xDiff = (xDiff^y)-y
        let res = []
        xDiff = Math.abs(xDiff)
        if(xDiff>0)
        for (let i = 1; i < Math.abs(xDiff); i++){
            let x = xAdd ? xFrom+i : xFrom - i
            let y = yAdd ? yFrom+i : yFrom - i
            let p = this.idx2Pdn(y*this.width+x)
            res.push(p)
        }
        return res
    }

    playerScore(){
        /**
         * Pawn’s value: 5 + row number King’s value = 5 + # of rows + 2
         */
        let score = 0
        for(let i = 0 ; i < this.width*this.height ; i ++){
            let p = this.board[i]
            if((p & PAWNS) == PAWNS){
                let y = ~~(i/this.width)
                if(this.turn == C_BLACK){
                    if((p&C_BLACK)==C_BLACK){
                        score += 5 + y + 1
                    }else{
                        score -= 5 + this.height-y + 1
                    }
                }
                if(this.turn == C_WHITE){
                    if((p&C_BLACK)==C_BLACK){
                        score -= 5 + y + 1
                    }else{
                        score += 5 + this.height-y + 1
                    }
                }
            }
            if((p & KING) == KING){
                let x = i%this.width
                let y = ~~(i/this.width)
                let s = Math.min(x-0,y-0) + Math.min(this.width-1-x,y-0)
                       +Math.min(x-0,this.height-1-y)
                       +Math.min(this.width-1-x,this.height-1-y)+8
                if((p & this.turn) == this.turn) score +=s
                else score -=s
            }
        }
        return score
    }

    makeMv(cMv: Array<DMove>){
        if(this.result!=0) return false;
        let  mv = this.checkMv(cMv);
        if(mv!=null){
            this.mvHistory.push(mv)
            let handlerEat = true
            for(let i=0;i<mv.length;i++){
                let idxFrom = this.pdnPos2Idx(mv[i].from)
                let idxTo = this.pdnPos2Idx(mv[i].to)
                let p = this.board[idxFrom]
                if((mv[i].flag & 2) == 2){
                    //吃子
                    if((mv[i].flag&1)==1){
                        //升变
                        this.pieceCnt[this.turn==C_WHITE ? 0 : 2]--
                        this.pieceCnt[this.turn==C_WHITE ? 1 : 3]++
                    }
                    let idxEat = this.pdnPos2Idx(mv[i].eatPos)
                    this.board[idxEat] = NONE
                    let eatKing = ((mv[i].eatPiece&KING)==KING)
                    if(eatKing){
                        this.pieceCnt[this.turn==C_WHITE ? 3 : 1]--
                    }else{
                        this.pieceCnt[this.turn==C_WHITE ? 2 : 0]--
                    }
                    this.board[idxFrom] = NONE
                    this.board[idxTo] = ((mv[i].flag&1)==1) ? (KING|this.turn) : p
                    if(handlerEat){
                        handlerEat = false
                        if(this.gameDraw!=void 0){
                            this.gameDraw.kingMove = 0
                            for (let i = 0; i < this.gameDraw.pieceNum.length ; i ++){
                                this.gameDraw.pieceNum[i].step=0;
                            }
                        }
                    }
                }else{
                    //普通走子
                    if(this.gameDraw!=void 0){
                        if((this.board[idxFrom] & KING)==KING) this.gameDraw.kingMove++
                        else this.gameDraw.kingMove = 0
                    }
                    this.board[idxFrom] = NONE
                    this.board[idxTo] = ((mv[i].flag&1)==1) ? (KING|this.turn) : p
                    if((mv[i].flag&1)==1){
                        //升变
                        this.pieceCnt[this.turn==C_WHITE ? 0 : 2]--
                        this.pieceCnt[this.turn==C_WHITE ? 1 : 3]++
                    }
                    this.turn = this.turn==C_BLACK ? C_WHITE : C_BLACK
                    if(this.gameDraw!=void 0){
                        this.gameDraw.homeType = this.homeTypeCount(this.getFen())
                        this.fenHistory.push(this.getFen())
                    }
                    return true
                }
            }
            this.turn = this.turn==C_BLACK ? C_WHITE : C_BLACK
            if(this.gameDraw!=void 0){
                this.fenHistory.push(this.getFen())
                this.pieceNumKeyCheck()
            }
            return true;
        }
        return false;
    }

    undo(): void {
        if(this.mvHistory.length>0){
            this.turn = this.turn==C_BLACK ? C_WHITE : C_BLACK
            this.fenHistory.pop()
            let mvLast = this.mvHistory.pop()
            let undoMv = mvLast[0]
            if((undoMv.flag & 2) == 2){
                let len = mvLast.length
                for(let i = len - 1 ; i >= 0 ; i--){
                    let mv = mvLast[i]
                    let from = this.pdnPos2Idx(mv.from)
                    let to = this.pdnPos2Idx(mv.to)
                    this.board[from] = this.board[to]
                    this.board[to] = NONE
                    if((mv.flag & 1) == 1){
                        this.board[from] = this.turn | PAWNS
                        //升变
                        this.pieceCnt[this.turn==C_WHITE ? 0 : 2]++
                        this.pieceCnt[this.turn==C_WHITE ? 1 : 3]--
                    }
                    let eatPos = this.pdnPos2Idx(mv.eatPos)
                    this.board[eatPos] = mv.eatPiece
                    let eatKing = ((mv.eatPiece&KING)==KING)
                    if(eatKing){
                        this.pieceCnt[this.turn==C_WHITE ? 3 : 1]++
                    }else{
                        this.pieceCnt[this.turn==C_WHITE ? 2 : 0]++
                    }
                }
                this.gameDraw.kingMove = 0
                let breakKingMove = false
                for (var i = this.mvHistory.length - 1 ; i >= 0 ; i--){
                       //step? kingMove && pieceNum step ,from history
                       let mvs = this.mvHistory[i]
                       if((mvs[0].flag & 2) == 2 || (mvs[0].flag & 1) == 1) {
                           if(i==0){
                               //归零
                               this.gameDraw.kingMove = 0
                               for (let j = 0; j < this.gameDraw.pieceNum.length ; j ++){
                                this.gameDraw.pieceNum[j].step = 0
                               }
                           }
                           break
                       }
                       if(mvs[0].kingMove){
                           if(breakKingMove==false)
                           this.gameDraw.kingMove++ 
                       }else{
                           breakKingMove = true
                       }
                       this.pieceNumKeyCheck()
                }
            }else{
                //普通走子
                let from = this.pdnPos2Idx(undoMv.from)
                let to = this.pdnPos2Idx(undoMv.to)
                this.board[from] = this.board[to]
                if((undoMv.flag & 1) == 1){
                    this.board[from] = this.turn | PAWNS
                }
                for (let i = 0; i < this.gameDraw.pieceNum.length ; i ++){
                    if(this.gameDraw.pieceNum[i].step > 0){
                        this.gameDraw.pieceNum[i].step--;
                    }
                }
                if(this.gameDraw.homeType>0) this.gameDraw.homeType--
                if(this.gameDraw.kingMove>0) this.gameDraw.kingMove--
                if((undoMv.flag&1)==1){
                    //升变
                    this.pieceCnt[this.turn==C_WHITE ? 0 : 2]++
                    this.pieceCnt[this.turn==C_WHITE ? 1 : 3]--
                }
            }
            this.result = 0
        }
    }

    pieceNumKeyCheck(){
        if(this.gameDraw!=void 0){
            let key = this.pieceCnt.join()
            for (let i = 0; i < this.gameDraw.pieceNum.length ; i ++){
                if(this.gameDraw.pieceNum[i].piece == key){
                    this.gameDraw.pieceNum[i].step++;
                }else{
                    this.gameDraw.pieceNum[i].step=0;
                }
            }
        }
    }

    checkMv(mv: Array<DMove>){
        let strMv = this.mvStr(mv)
        let mvList = this.getMoveList()
        for(let i = 0; i < mvList.length; i++){
            if(strMv == this.mvStr(mvList[i])) return mvList[i]
        }
        return null
    }

    pdnPos2San(pdnPos:number){
        return this.idx2San(this.pdnPos2Idx(pdnPos))
    }

    mvStr(mv:Array<DMove>){
        let san = ""
        for(let i = 0; i < mv.length; i++){
            if((mv[i].flag & 2) == 0){
                if(this.notation=='N')
                san = `${mv[i].from}-${mv[i].to}`
                else if(this.notation=='A'){
                    san = `${this.pdnPos2San(mv[i].from)}-${this.pdnPos2San(mv[i].to)}`
                }
            }else{
                if(this.notation=='N'){
                    if(i==0)
                    san += `${mv[i].from}x${mv[i].to}`
                    else san += `x${mv[i].to}`
                } else if(this.notation=='A'){
                    if(i==0)
                    san += `${this.pdnPos2San(mv[i].from)}x${this.pdnPos2San(mv[i].to)}`
                    else san += `x${this.pdnPos2San(mv[i].to)}`
                }

            }
        }
        return san
    }

    piece2Char(piece: number){
        if((piece & C_BLACK)==C_BLACK){
            if((piece & PAWNS)==PAWNS){
                return "b"
            }
            if((piece & KING)==KING){
                return "k"
            }
        }
        if((piece & C_WHITE)==C_WHITE){
            if((piece & PAWNS)==PAWNS){
                return "w"
            }
            if((piece & KING)==KING){
                return "K"
            }
        }
        return " ";
    }

    boardDes() {
        var s = this.boardStrStart();
        for(let i = 0; i < this.height; i++){
            let str='   |'
            for(let j = 0; j < this.width; j++){
                let jStr = this.piece2Char(this.board[i*this.width + j])
                str +=` ${jStr} |`
            }
            s += `${str} ${this.height-i}\n`
            if(i!=this.height-1)
            s += this.boardStrLine()
        }
        s += this.boardStrEnd()
        s += this.boardSan()
        return s;
    }

    boardStrStart(){
        switch(this.type){
            case 20:
                return '   +---------------------------------------+\n'
           case 26:
                return "   +-------------------------------+\n"
        }
        return ""
    }

    boardStrLine(){
        switch(this.type){
            case 20:
                return '   +---+---+---+---+---+---+---+---+---+---+\n';
           case 26:
                return '   +---+---+---+---+---+---+---+---+\n';
        }
        return ""
    }

    boardStrEnd(){
        return this.boardStrStart()
    }

    boardSan(){
        switch(this.type){
            case 20:
                return '     a   b   c   d   e   f   g   h   i   j\n'
           case 26:
                return '     a   b   c   d   e   f   g   h\n'
        }
        return ""
    }

    generatePdnBook(){
        let book = `[GameType "${this.type}"]\n`
            book +=`[Fen "${this.startFen}"]\n`
            book +=`[Result "${this.resultStr()}"]\n`
            book += "\n"
        for(let i = 0; i <this.mvHistory.length ; i ++){
            if(i%2 == 0) book +=`  ${i/2 + 1}. ${this.mvStr(this.mvHistory[i])}`
            else book +=` ${this.mvStr(this.mvHistory[i])}`
        }
        book +=` ${this.resultStr()}`
        return book
    }

    getStep(){
        return this.mvHistory.length
    }

    resultStr(){
       if(this.result==0) return "*"
       if(this.result==DRAW) return "1-1"
       if(this.result==C_WHITE) return "2-0"
       if(this.result==C_BLACK) return "0-2"
    }

    searchPawnsEatMvs(start:number){
        for(let d = 0 ; d < 4 ; d++){
            this.searchPawnEatDirect(start,d,this.cloneBoard(),null)
        }
    }

    searchKingEatMvs(start:number){
        for(let d = 0 ; d < 4 ; d++){
            this.searchKingEatDirect(start,d,this.cloneBoard(),null)
        }
    }

    pawnEatMvs:Array<Array<DMove>> = [];
    kingEatMvs:Array<Array<DMove>> = [];

    /**
     * @param from 当前搜索点
     * @param d 方向 0 左上 1 右上 2 左下 3右下
     * @param b 棋盘
     * @param mvs 存储的搜索路径
     */
    searchPawnEatDirect(from:number,d:number,b:Array<number>,mvs:Array<DMove>){
        if(mvs==null){
            mvs=[];
        }
        let fromPos = this.pdn2XY(from);
        let tarPos = {x:fromPos.x-1,y:fromPos.y-1}
        let toPos = {x:fromPos.x-2,y:fromPos.y-2}
        switch(d){
            case 1:
                tarPos = {x:fromPos.x+1,y:fromPos.y-1}
                toPos = {x:fromPos.x+2,y:fromPos.y-2}
                break
            case 2:
                tarPos = {x:fromPos.x-1,y:fromPos.y+1}
                toPos = {x:fromPos.x-2,y:fromPos.y+2}
                break
            case 3:
                tarPos = {x:fromPos.x+1,y:fromPos.y+1}
                toPos = {x:fromPos.x+2,y:fromPos.y+2}
                break
        }
        let check = this.xyCheck(toPos.x,toPos.y)
        if(check){
            let fromIdx= this.pdnPos2Idx(from)
            let tarIdx = this.xy2Idx(tarPos.x,tarPos.y)
            let toIdx = this.xy2Idx(toPos.x,toPos.y)
            let fromPice = b[fromIdx]
            let tarPice = b[tarIdx]
            let toPice = b[toIdx]
            if(toPice==NONE && (tarPice!=NONE && (tarPice &this.turn)!=this.turn)){
                let toPdn = this.idx2Pdn(toIdx)
                //可以走
                let mv = {
                    from:from,
                    to:toPdn,
                    flag:2, //0 normal , 1 peice grade king, 2 x
                    eatPos:this.idx2Pdn(tarIdx),
                    eatPiece:tarPice,
                    kingMove:false
                }
                mvs.push(mv)
                b[fromIdx] = NONE;
                b[tarIdx] = NONE;
                b[toIdx] = fromPice;
                this.pawnEatMvs.push(mvs)
                for(let dn = 0 ; dn < 4 ; dn++){
                    this.searchPawnEatDirect(toPdn,dn,b.slice(0),mvs.slice(0))
                }
            }
        }
    }



    searchKingEatDirect(from:number,d:number,b:Array<number>,mvs:Array<DMove>){
        if(mvs==null){
            mvs=[];
        }
        let fromPos = this.pdn2XY(from);
        
        let dOff = [
            [-1,-1],[1,-1],[-1,1],[1,1]
        ]
        let dPos = dOff[d]
        for(let off = 1 ; off < this.width-1 ; off ++ ){
            let tarPos = {x:fromPos.x+dPos[0]*off,y:fromPos.y+dPos[1]*off}
            let toMin = {x:fromPos.x+dPos[0]*(off+1),y:fromPos.y+dPos[1]*(off+1)}
            if(!this.xyCheck(tarPos.x,tarPos.y)) return
            if(!this.xyCheck(toMin.x,toMin.y)) return
            let fromIdx= this.pdnPos2Idx(from)
            let tarIdx = this.xy2Idx(tarPos.x,tarPos.y)
            let fromPice = b[fromIdx]
            let tarPice = b[tarIdx]
            if(tarPice!=NONE ){
                if((tarPice &this.turn)!=this.turn){
                    for(let toOff = 1; toOff < this.width - 1; toOff++){
                        let l = off + toOff
                        let toPos = {x:fromPos.x+dPos[0]*l,y:fromPos.y+dPos[1]*l}
                        //后面没空格，直接返回
                        if(!this.xyCheck(toPos.x,toPos.y)) return
                        let toIdx = this.xy2Idx(toPos.x,toPos.y)
                        let toPice = b[toIdx]
                        //空格有子直接返回
                        if(toPice!=NONE) return

                        let toPdn = this.idx2Pdn(toIdx)
                        //可以走
                        let mv = {
                            from:from,
                            to:toPdn,
                            flag:2, //0 normal , 1 peice grade king, 2 x
                            eatPos:this.idx2Pdn(tarIdx),
                            eatPiece:tarPice,
                            kingMove:true
                        }
                        mvs.push(mv)
                        b[fromIdx] = NONE;
                        b[tarIdx] = NONE;
                        b[toIdx] = fromPice;
                        this.kingEatMvs.push(mvs)
                        for(let dn = 0 ; dn < 4 ; dn++){
                            this.searchKingEatDirect(toPdn,dn,b.slice(0),mvs.slice(0))
                        }
                    }
                }
                //找到一个没有空格的就返回
                return
            }
        }
    }

    xyCheck(x:number,y:number){
        return x>=0 && x<this.width && y>=0 && y<this.height
    }

    xy2Idx(x:number,y:number){
        return x + y * this.width
    }

    /**
     * @todo short fen
     * @param board 
     * @returns 
     */
    board2Fen(board:Array<number>):string{
        //"W:W7,29-31:B12,20"
        let res = `${this.turn==C_BLACK ? "B" : "W"}`
        let w = "W"
        let b = "B"
        for(let i = 0; i < board.length; i++){
            let p = board[i];
            if((board[i]&PAWNS) == PAWNS && (board[i]&C_BLACK) == C_BLACK){
                if(b.length>1) b+=","
                b+=`${this.idx2Pdn(i)}`
            }
            if((board[i]&PAWNS) == PAWNS && (board[i]&C_WHITE) == C_WHITE){
                if(w.length>1) w+=","
                w+=`${this.idx2Pdn(i)}`
            }
            if((board[i]&KING) == KING && (board[i]&C_BLACK) == C_BLACK){
                if(b.length>1) b+=","
                b+=`K${this.idx2Pdn(i)}`
            }
            if((board[i]&KING) == KING && (board[i]&C_WHITE) == C_WHITE){
                if(w.length>1) w+=","
                w+=`K${this.idx2Pdn(i)}`
            }
        }
        return `${res}:${w}:${b}`
    }

    shortFen(){
        let fen = this.getFen()
        let fenArr = fen.split(":")
        let fen1 = this.shortFenParse(fenArr[1].substr(1))
        let fen2 = this.shortFenParse(fenArr[2].substr(1))
        return `${fenArr[0]}:${fenArr[1][0]}${fen1}:${fenArr[2][0]}${fen2}`
    }

    /**
     * @return 1-5,8-9 or K1-2,3-5,8-9
     * @param f [1,2,3,4,5,8,9] or [K1,K2,3,4,5,8,9]
     */
    private shortFenParse(f:string){
        let ps = f.split(",")
        let pArr = []
        for(let i = 0 ; i<ps.length ; i ++){
            let isK = ps[i].startsWith("K")
            let start = this.fenPdn(ps[i])
            let end = start
            if(i<ps.length-1)
            for(let j = i+1 ; j < ps.length ; j ++){
                if(ps[j].startsWith("K")!=isK) break
                if(this.fenPdn(ps[j])!=end+1) break
                end++
            }
            let len = end - start
            if(len>0){
                pArr.push(`${ps[i]}-${end}`)
            }else{
                pArr.push(ps[i])
            }
            i += end - start
        }
        return pArr.join()
    }

    fenPdn(p:string){
        if(p.startsWith("K")) return parseInt(p.substr(1))
        return parseInt(p)
    }

    getFen():string{
        return this.board2Fen(this.board)
    }

    checkEnd(){
        //Draw 1-1
        if(this.gameDraw.kingMove >= this.drawRule.kingMove){
            //draw,只走王
            this.result = DRAW
            return true
        }
        if(this.gameDraw.homeType >= this.drawRule.homeType){
            //局面重复
            this.result = DRAW
            return true
        }

        for(let i = 0; i < this.drawRule.pieceNum.length ; i ++ ){
            if(this.gameDraw.pieceNum[i].step>=this.drawRule.pieceNum[i].step){
                //特殊局面
                this.result = DRAW
                return true
            }
        }
        let mvs = this.getMoveList()
        if(mvs.length<1){
            this.result = this.turn == C_WHITE ? C_BLACK : C_WHITE
            return true
        }
        return false
    }

    homeTypeCount(fen: string){
        let cnt = 0
        let len = this.fenHistory.length
        if(len>0)
        for(let i = len - 1; i >= 0; i--){
            if(this.fenHistory[i] == fen){
                cnt++;
            }
        }
        return cnt
    } 

}

export class DSearch {

    getBestMv(depth:number,game:FDGame){
        // console.time(`getBestMv:${depth}`)
        let v = Number.MIN_SAFE_INTEGER
        let bestMv:DMove[] = []
        let mvList = game.getMoveList()
        let alpha = Number.MIN_SAFE_INTEGER
        let beta = Number.MAX_SAFE_INTEGER
        for(let i = 0; i< mvList.length ; i ++){
            let mv = mvList[i]
            let g = game.clone()
            g.makeMv(mv)
            let score = this.alphaBetaScore(g,depth,alpha,beta,false)
            if(score>=v){
                v = score
                bestMv = mv
            }
            alpha = Math.max(alpha,v)
            if(beta<=alpha)
            break
        }
        // console.timeEnd(`getBestMv:${depth}`)
        return bestMv
    }

    alphaBetaScore(node:FDGame,depth:number,alpha:number,beta:number,isPlayer:boolean){
        if(depth==0)
         return node.playerScore()
         let mvList = node.getMoveList()
         if(isPlayer){
             let v = Number.MIN_SAFE_INTEGER
             for(let mv of mvList){
                let g = node.clone()
                g.makeMv(mv)
                v = Math.max(v,this.alphaBetaScore(g,depth-1,alpha,beta,false))
                alpha = Math.max(alpha,v)
                if(beta<=alpha)
                break
             }
             return v
         }else{
            let v = Number.MAX_SAFE_INTEGER
            for(let mv of mvList){
               let g = node.clone()
               g.makeMv(mv)
               v = Math.min(v,this.alphaBetaScore(g,depth-1,alpha,beta,true))
               beta = Math.min(beta,v)
               if(beta<=alpha)
               break
            }
            return v
         }
    }
}