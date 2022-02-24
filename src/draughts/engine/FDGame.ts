
import {C_NONE,C_WHITE,C_BLACK,KING,PIECE} from './FDConst'


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
    private type:number
    private turn:number
    private mvHistory:Array<Array<DMove>>

    private startColor:number
    private width:number
    private height:number
    private notation:string
    private startDirection:number
    private leftBottomValid:boolean
    private startFen:string


    constructor(gameInfo:string){
        this.initGameInfo(gameInfo)
        this.startFromFen(this.startFen);
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
    }


    /**
     * S -> [FEN "[Turn]:[Color][K][Square],[K][Square]...]:[Color][K][Square], [K][Square]...]"]
     * [Color] -> 'B' | 'W'
     * [K] -> 'K' | ''
     * [Square] -> (1 - 64 or 1-100)
     * @param fen 
     */
    startFromFen(fen:string){
        this.startFen = fen
        if(this.board == null){
            this.board = new Array(this.width*this.height).fill(C_NONE);
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
            if(2==parr.length){ 
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
            let x = idx%8
            let y = ~~(idx/8)
            return String.fromCharCode('a'.charCodeAt(0)+x)+`${8-y}`
        }
        return ""
    }


    pdnsize(){
        if(this.type==20){
            return 50;
        }else if(this.type==26){
            return 32;
        }else{
            throw new Error(`not support this game type : ${this.type}`);
        }
    }

    getMoveList():Array<Array<DMove>>{
        let eatMvs:Array<Array<DMove>> = []
        let normalMvs:Array<Array<DMove>> = []
        for(let i = 1; i <= this.pdnsize(); i++){
            let piece = this.getPieceOnPdnPos(i)
            if((piece & this.turn)==this.turn){
                //normal piece
                if((piece & PIECE)==PIECE){
                    this.searchPieceEatMvs(i,i,[],[],eatMvs)
                    if(eatMvs.length==0){
                        let mvs = this.getPieceNormalMv(i,this.turn)
                        while(mvs.length>0){
                            normalMvs.push([mvs.pop()])
                        }
                    }
                }
                //king piece
                else if((piece & KING)==KING){
                    this.searchKingEatMvs(i,i,[],[],eatMvs)
                    if(eatMvs.length==0){
                        let mvs = this.getKingNormalMv(i)
                        while(mvs.length>0){
                            normalMvs.push([mvs.pop()])
                        }
                    }
                }
            }
        }

        if(eatMvs.length==0){
            if(normalMvs.length>0){
                return normalMvs;
            }
        }else{
            if(eatMvs.length>0){
                eatMvs.sort((a,b)=>b.length-a.length)
                let eatCnt = eatMvs[0].length
                let eatMvsFilter = []
                for(let j = 0; j < eatMvs.length; j++){
                    if(eatMvs[j].length < eatCnt) continue;
                    eatMvsFilter.push(eatMvs[j])
                }
               return eatMvsFilter
            }
        }
        return []
    }

    getPieceNormalMv(from:number,turn: number):Array<DMove>{
        let type = 2
        if(turn==C_WHITE) type = 1
        let diffPos = this.pdnPosDiff(from,type)
        let mvs = []
        if(diffPos[0].length>0){
            let normalL = diffPos[0][0]
            if(this.getPieceOnPdnPos(normalL)==C_NONE){
                mvs.push({
                    from:from,
                    to:normalL,
                    flag: (this.is2Bottom(normalL,turn) ? 1 : 0)
                })
            }
        }
        if(diffPos[1].length>0){
            let normalR = diffPos[1][0]
            if(this.getPieceOnPdnPos(normalR)==C_NONE){
                mvs.push({
                    from:from,
                    to:normalR,
                    flag: (this.is2Bottom(normalR,turn) ? 1 : 0)
                })
            }
        }
        return mvs;
    }

    getKingNormalMv(from:number):Array<DMove>{
        let diffPos = this.pdnPosDiff(from,0)
        let mvs = []
        for(let i = 0; i < 4; i++){
            let diff = diffPos[0]
            for(let j = 0; j < diff.length; j++){
                let pndPos = diff[j]
                if(this.getPieceOnPdnPos(pndPos)==C_NONE){
                    mvs.push({
                        from:from,
                        to:pndPos,
                        flag: 0
                    })
                }else continue
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
        for (let i = 1; i < Math.abs(xDiff); i++){
            let x = xAdd ? xFrom+i : xFrom - i
            let y = yAdd ? yFrom+i : yFrom - i
            let p = this.idx2Pdn(y*this.width+x)
            res.push(p)
        }
        return res
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

    makeMv(mv: Array<DMove>){
        if(this.checkMv(mv)){
            this.mvHistory.push(mv)
            for(let i=0;i<mv.length;i++){
                let idxFrom = this.pdnPos2Idx(mv[i].from)
                let idxTo = this.pdnPos2Idx(mv[i].to)
                let p = this.board[idxFrom]
                if((mv[i].flag & 2) == 2){
                    //吃子
                    let range = this.pdnRange(mv[i].from, mv[i].to)
                    for(let j = 0; j < range.length; j++){
                        let jdx = this.pdnPos2Idx(range[j])
                        this.board[jdx] = C_NONE
                    }
                    this.board[idxFrom] = C_NONE
                    this.board[idxTo] = ((mv[i].flag&1)==1) ? (KING|this.turn) : p
                }else{
                    //普通走子
                    this.board[idxFrom] = C_NONE
                    let tag = (mv[i].flag&1)
                    this.board[idxTo] = ((mv[i].flag&1)==1) ? (KING|this.turn) : p
                    break
                }
            }
            this.turn = this.turn==C_BLACK ? C_WHITE : C_BLACK
            return true;
        }
        return false;
    }

    checkMv(mv: Array<DMove>){
        let strMv = this.mvStr(mv)
        let mvList = this.getMoveList()
        for(let i = 0; i < mvList.length; i++){
            if(strMv == this.mvStr(mvList[i])) return true
        }
        return false
    }

    mvStr(mv:Array<DMove>){
        let san = ""
        for(let i = 0; i < mv.length; i++){
            if((mv[i].flag & 2) == 0){
                san = `${mv[i].from}-${mv[i].to}`
            }else{
                if(i==0)
                san += `${mv[i].from}x${mv[i].to}`
                else san += `x${mv[i].to}`
            }
        }
        return san
    }

    undoMv(){

    }

    search(level: number,ms: number){

    }

    piece2Char(piece: number){
        if((piece & C_BLACK)==C_BLACK){
            if((piece & PIECE)==PIECE){
                return "b"
            }
            if((piece & KING)==KING){
                return "k"
            }
        }
        if((piece & C_WHITE)==C_WHITE){
            if((piece & PIECE)==PIECE){
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
            s += this.boardStrline()
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

    boardStrline(){
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
            book += "\n"
        for(let i = 0; i <this.mvHistory.length ; i ++){
            if(i%2 == 0) book +=`  ${i/2 + 1}.${this.mvStr(this.mvHistory[i])}`
            else book +=` ${this.mvStr(this.mvHistory[i])}`
        }
        return book
    }

    /**
     * 普通吃子搜索
     * @param start 起点
     * @param current 当前点
     * @param history 历史点
     * @param currentMv 当前吃子序列
     * @param mvs 吃子走子集合
     */
    searchPieceEatMvs(start: number,current: number,history: Array<number>,currentMv: Array<DMove>,mvs: Array<Array<DMove>>){
        let diff = this.pdnPosDiff(current,0)
        let hasContinue = false
        for(let i = 0 ; i < 4 ; i++){
            let dir = diff[i]
            let mvD:Array<DMove>= []
            for(let k = 0 ; k < currentMv.length ; k++){
                mvD.push(currentMv[k])
            }
            for(let i = 0; i < dir.length; i++){
                let p = dir[i]
                if(history.indexOf(p)!=-1) break
                let pi = this.getPieceOnPdnPos(p)
                if(pi==C_NONE) break

                if((pi&this.turn)==this.turn){
                    break;
                }
                //敌方棋子
                if(i!=0) break;
                //考虑后面 dis 是否有多余1个空位
                if(dir.length<=i+1) break;
                let pN = dir[i+1]
                if(history.indexOf(pN)!=-1) break
                let piN = this.getPieceOnPdnPos(pN)
                if(piN==C_NONE){
                    mvD.push({
                        from:current,
                        to:pN,
                        flag:2
                    })
                    let range = this.pdnRange(current,pN)
                    for(let j = 0; j <range.length; j++){
                        if(history.indexOf(range[j])==-1){
                            history.push(range[j])
                        }
                    }
                    history.push(current)
                    history.push(pN)
                    hasContinue = true;
                    this.searchPieceEatMvs(start,pN,history,mvD,mvs)
                }
            }
        }
        if(hasContinue==false){
            if(currentMv.length>0){
                if(this.is2Bottom(currentMv[currentMv.length-1].to,this.turn)){
                    currentMv[currentMv.length-1].flag |= 2
                }
                mvs.push(currentMv)
            }
        }
    }

    /**
     * 后吃子搜索
     * @param start 起点
     * @param current 当前点
     * @param history 历史点
     * @param currentMv 当前吃子序列
     * @param mvs 吃子走子集合
     */
     searchKingEatMvs(start: number,current: number,history: Array<number>,currentMv: Array<DMove>,mvs: Array<Array<DMove>>){
        //迭代搜索
        // let startIdx = this.pdnPos2Idx(current)
        let diff = this.pdnPosDiff(current,0)
        let hasContinue = false
        for(let i = 0 ; i < 4 ; i++){
            let dir = diff[i]
            for(let i = 0; i < dir.length; i++){
                let p = dir[i]
                if(history.indexOf(p)!=-1) break
                let pi = this.getPieceOnPdnPos(p)
                if(pi==C_NONE){
                    continue;
                }
                if((pi&this.turn)==this.turn){
                    break;
                }
                //考虑后面 dis 是否有空位
                if(i+1 >= dir.length) break;
                for(let j=i+1;j<dir.length;j++){
                    let pN = dir[j]
                    if(history.indexOf(pN)!=-1) break
                    let piN = this.getPieceOnPdnPos(pN)
                    if(piN==C_NONE){
                        let mvD:Array<DMove>= []
                        for(let k = 0 ; k < currentMv.length ; k++){
                            mvD.push(currentMv[k])
                        }
                        mvD.push({
                            from:current,
                            to:pN,
                            flag:2
                        })
                        let range = this.pdnRange(current,pN)
                        for(let j = 0; j <range.length; j++){
                            if(history.indexOf(range[j])==-1){
                                history.push(range[j])
                            }
                        }
                        history.push(current)
                        history.push(pN)
                        hasContinue = true;
                        this.searchKingEatMvs(start,pN,history,mvD,mvs)
                    }else break
                }
            }
        }
        if(hasContinue==false){
            if(currentMv.length>0){
                mvs.push(currentMv)
            }
        }
    }

}