

export const EMPTY = 0
export const BLACK = 1
export const WHITE = 2

export interface CaptureNeighbors{
    liberty:number,
    neighbors:Array<number>
}

export interface MoveResult{
    result: boolean,
    info:Array<number>
}

export interface GoMove{
    color:number,
    pos:number,
    result?:MoveResult
}


export class FGoBoard {
    private width:number;
    private height:number;
    private board:Array<number>;
    private capture:[number, number];
    private turn:number;
    private moveHistory:Array<GoMove> ;
    private AB:string
    private AW:string
    constructor(board:Array<number>,width:number){
        this.width = width;
        this.board = board;
        this.height = board.length/width;
        this.capture = [0,0];
        this.moveHistory = [];
        this.turn = BLACK;
        this.setABAW();
    }

    public setABAW(){
        let ab = "";
        let aw = "";
        for(let i = 0 ; i< this.board.length ; i++){
            if(this.board[i] == BLACK){
                ab += this.pos2Sgf(i)
            };
            if(this.board[i] == WHITE){
                aw += this.pos2Sgf(i)
            };
        }
        this.AB = ab;
        this.AW = aw;
    }

    public clearBoard():void{
        for(let i = 0 ; i< this.board.length ; i++){
            this.board[i] = EMPTY;
        }
        this.capture[0] = 0;
        this.capture[1] = 0;
        this.moveHistory = [];
        this.turn = BLACK;
    }
    /**
     * 一、有子，不能下
     * 二、无子
     *       1 有气 可下
     *       2 无气
     *         2.1 可提子/对方子无气
     *           2.1.1 打劫判断
     *         2.2 不可下
     *
     * @param mv
     */
    public makeMove(mv:GoMove):boolean{
        if(this.turn!=mv.color) return false;
        let pos = mv.pos;
        if(pos<0 || pos>this.board.length-1) return false;
        if(this.board[pos]!=EMPTY) return false;
        let result:MoveResult = this.tryMove(mv);
        if(result!=null){
            let info = result.info;
            for(let i of info){
                this.capture[this.turn-1] += 1;
                this.board[i] = EMPTY;
            }
            this.board[pos] = this.turn;
            mv.result = result;
            this.moveHistory.push(mv);
            this.changeTurn();
            return true;
        }
        return false;
    }

    public otherColor():number{
        return BLACK==this.turn ? WHITE : BLACK;
    }

    private changeTurn():void{
        this.turn = this.otherColor();
    }

    private searchInfo(board:Array<number>,info:Array<number>,searchPos:number,color:number):Array<number>{
        if(info.indexOf(searchPos) == -1){
            let cNeighbors:CaptureNeighbors = {liberty:0,neighbors:[]};
            this.searchNeighbors(cNeighbors,board, searchPos,color,null);
            if(cNeighbors.liberty == 0){
                info = info.concat(...cNeighbors.neighbors);
            }
        }
        return info;
    }

    public tryMove( mv:GoMove):MoveResult{
        let newBoard = this.board.slice(0);
        let pos = mv.pos;
        newBoard[pos] = mv.color;
        let cNeighbors:CaptureNeighbors = {liberty:0,neighbors:[]};
        this.searchNeighbors(cNeighbors,newBoard, pos,mv.color,null);
        let info = new Array();
        let x = pos%this.width;
        let y = ~~(pos/this.width);
        if(x>0)
            info = this.searchInfo(newBoard,info,pos-1,this.otherColor());
        if(x<this.width-1)
            info = this.searchInfo(newBoard,info,pos+1,this.otherColor());
        if(y>0)
            info = this.searchInfo(newBoard,info,pos-this.width,this.otherColor());
        if(y<this.height-1)
            info = this.searchInfo(newBoard,info,pos+this.width,this.otherColor());
        if(cNeighbors.liberty==0){
            if(info.length==0) return null;
            if(info.length == 1){
                let lastMvPos = info[0];
                let lastCapturePos = pos;
                if(this.moveHistory.length>0){
                    let lastMv:GoMove = this.moveHistory[this.moveHistory.length-1];
                    if(lastMv!=null && lastMv.pos == lastMvPos){
                        if(lastMv.result.info.length == 1 && lastMv.result.info[0] == lastCapturePos){
                            return  null;
                        }
                    }
                }
            }
            let result:MoveResult = {result:true,info:info};
            return result;
        }else{
            let result:MoveResult = {result:true,info:info};
            return result;
        }
    }


    public searchNeighbors(cNeighbors:CaptureNeighbors, board:Array<number>, searchPos:number, color:number, searchList:Array<number>):void{
        if(searchList == null) searchList = [];
        if(searchPos<0 || searchPos > board.length -1) return;
        if(searchList.indexOf(searchPos)!=-1) return;
        searchList.push(searchPos);
        let piece = board[searchPos];
        if(piece == color){
            cNeighbors.neighbors.push(searchPos);
            let x = searchPos%this.width;
            let y = ~~(searchPos/this.width);
            if(x>0)
            this.searchNeighbors(cNeighbors,board,searchPos-1,color,searchList);
            if(x<this.width-1)
            this.searchNeighbors(cNeighbors,board,searchPos+1,color,searchList);
            if(y>0)
            this.searchNeighbors(cNeighbors,board,searchPos-this.width,color,searchList);
            if(y<this.height-1)
            this.searchNeighbors(cNeighbors,board,searchPos+this.width,color,searchList);
        }else if(piece == EMPTY){
            cNeighbors.liberty += 1;
        }
    }


    private  boardStr(board:Array<number>):string{
        let columnTag = "  ";
        for(let i = 65; i< this.width+65 ; i ++){
            columnTag += " "+ String.fromCharCode(i<73 ? i : (i+1));
        }
        columnTag += "\n";
        let boardStr = "";
        for(let i = 0 ; i < this.height; i ++){
            boardStr += this.height - i >9 ? ""+ (this.height - i) : " "+(this.height - i);
            for(let j = 0 ; j < this.width ; j ++){
                let piece = board[i*this.width+j];
                if(EMPTY == piece){
                    boardStr += " .";
                }
                if(BLACK == piece){
                    boardStr += " X";
                }
                if(WHITE == piece){
                    boardStr += " O";
                }
            }
            boardStr+="\n";
        }
        return columnTag+boardStr;
    }

    public showBoard():string{
        return this.boardStr(this.board);
    }

    public play(coord:string):boolean{
        if(coord.length>0){
            let x = coord.substring(0,1).toUpperCase();
            let y = coord.substring(1);
            let xx = x.charCodeAt(0) - 65;
            if(xx>=8) xx -= 1;
            let yy = this.height - parseInt(y);
            return this.makeMove({color:this.turn,pos:yy*this.width + xx});
        }
        return false;
    }

    public pass(){
        this.moveHistory.push(null);
        this.changeTurn();
    }

    public lastPassCnt():number{
        let cnt = 0;
        let size = this.moveHistory.length;
        for(let i = size-1 ; i>0;i--){
            let goMove = this.moveHistory[i];
            if(goMove==null) cnt ++;
            else break;
        }
        return cnt;
    }

    public  getMvList():Array<GoMove>{
        let mvList:Array<GoMove> = [];
        for(let i = 0 ; i < this.board.length ; i ++ ){
            if(this.board[i]==EMPTY){
                let mv = {color:this.turn,pos:i};
                let result = this.tryMove(mv);
                if(result!=null){
                    mvList.push(mv);
                }
            }
        }
        return mvList;
    }

    public isEye(pos:number, color:number,maxArea:number){
        let eye = [];
        this.searchEye(eye,pos,color,null,maxArea);
        return eye.length>0;
    }

    private searchEye(eye:Array<number>,searchPos:number,color:number,searchList:Array<number>, maxEyeArea:number){
        if(searchList == null) searchList = [];
        if(searchPos<0 || searchPos > this.board.length -1) return;
        if(searchList.indexOf(searchPos)!=-1) return;
        searchList.push(searchPos);
        let piece = this.board[searchPos];
        if(piece == EMPTY){
            eye.push(searchPos);
            if(eye.length>maxEyeArea) {
                eye=[];
                return;
            }
            let x = searchPos%this.width;
            let y = ~~(searchPos/this.width);
            if(x>0)
                this.searchEye(eye,searchPos-1,color,searchList,maxEyeArea);
            if(x<this.width-1 && eye.length>0)
                this.searchEye(eye,searchPos+1,color,searchList,maxEyeArea);
            if(y>0&& eye.length>0)
                this.searchEye(eye,searchPos-this.width,color,searchList,maxEyeArea);
            if(y<this.height-1 && eye.length>0)
                this.searchEye(eye,searchPos+this.width,color,searchList,maxEyeArea);
        }else if(piece!=color){
            //失败
            eye=[];
        }
    }

    public getLastSgfMv():string {
        let s = this.moveHistory.length;
        if(s>0){
            let mv = this.moveHistory[s-1];
            if(mv==null){
                return (this.otherColor()==BLACK?"B":"W") +"[]";
            }
            let pos = mv.pos;
            return (this.otherColor()==BLACK?"B":"W")+this.pos2Sgf(pos)
        }
        return null;
    }

    public getSgfMv(idx:number):string{
        let s = this.moveHistory.length;
        if(s>0 && idx<s && idx>=0){
            let mv = this.moveHistory[idx];
            if(mv==null){
                return ((idx%2==0)?"B":"W") +"[]";
            }
            let pos = mv.pos;
            return ((idx%2==0)?"B":"W")+this.pos2Sgf(pos)
        }
        return null;
    }

    private pos2Sgf(pos:number):string{
        let x = pos%this.width;
        let y = ~~(pos/this.width);
        return  "["+String.fromCharCode(x+97)+String.fromCharCode(y+97) +"]";
    }

    public  getLastGTPMv():string{
        let s = this.moveHistory.length;
        if(s>0){
            let mv = this.moveHistory[s-1];
            if(mv==null){
                return "play " + (this.otherColor()==BLACK?"black ":"white ") +"pass";
            }
            let pos = mv.pos;
            let x = pos%this.width;
            let y = ~~(pos/this.width);
            let cx = x+97;
            if(cx>104) cx += 1;
            let cy = this.height-y;
            return (this.otherColor()==BLACK?"play black ":"play white ") +String.fromCharCode(cx)+cy;
        }
        return null;
    }

    public totalStep():number{
        return this.moveHistory.length;
    }

    public sgf():string{
        //let s = "(;FF[4]KM[7.5]RU[Chinese]GM[1]RE[W+65.75]SZ[19]GN[5分 30秒]PW[棋友800b]AP[弈战2.0]DT[2020-04-22]BR[18K]EV[5分 30秒]PB[棋友e875]HA[0]TM[0]WR[18K]CA[utf-8];B[kc];W[dp];B[co];W[cp];B[bo];W[do];B[cm];W[dm];B[dl];W[em];B[el];W[fl];B[fk];W[gk];B[fj];W[gl];B[hj];W[gj];B[fi];W[gi];B[fh];W[hg];B[gg];W[hf];B[gh];W[hh];B[jg];W[gf];B[ff];W[fe];B[ef];W[ee];B[df];W[de];B[ce];W[cd];B[be];W[id];B[ic];W[hc];B[ib];W[hd];B[fc];W[hb];B[ha];W[ga];B[ia];W[fb];B[eb];W[dc];B[cb];W[bd];B[db];W[ae];B[bf];W[ab];B[af];W[ad];B[bc];W[ac];B[cc];W[kd];B[ld];W[jc];B[ke];W[jd];B[le];W[lc];B[mc];W[kb];B[lb];W[pp];B[kc];W[qd];B[qe];W[pd];B[rd];W[rc];B[rb];W[re];B[rf];W[sd];B[qb];W[pb];B[ob];W[pa];B[oa];W[oc];B[nb];W[qm];B[qf];W[qj];B[sf];W[of];B[se];W[rd];B[sb];W[oh];B[ng];W[og];B[nf];W[ne];B[nd];W[oe];B[od];W[pe];B[nc];W[pc];B[lc];W[qh];B[nh];W[ni];B[mi];W[mj];B[lj];W[nj];B[lk];W[mh];B[li];W[mf];B[me];W[lm];B[ka];W[jb];B[je];W[ml];B[mk];W[nk];B[nl];W[nm];B[ol];W[om];B[pl];W[pm];B[ql];W[rl];B[rk];W[rm];B[rp];W[qq];B[rq];W[rr];B[qp];W[pq];B[qr];W[pr];B[rs];W[qs];B[sr];W[ss];B[sq];W[qo];B[ro];W[rn];B[so];W[rs];B[nq];W[sn];B[oq];W[lq];B[lr];W[kr];B[kq];W[mr];B[jr];W[ls];B[js];W[gq];B[hr];W[gr];B[hq];W[kp];B[jq];W[lo];B[iq];W[gp];B[ho];W[jo];B[jp];W[io];B[ip];W[hp];B[go];W[fo];B[dn];W[en];B[cn];W[bp];B[ap];W[aq];B[ao];W[br];B[bn];W[hs];B[is];W[gs];B[fp];W[ks];B[ll];W[mm];B[km];W[kn];B[jn];W[in];B[jm];W[im];B[il];W[ik];B[jk];W[hl];B[jl];W[ij];B[jj];W[ii];B[ji];W[ir];B[ih];W[ja];B[la];W[sp];B[ro])"
        let book = "(;GM[1]FF[4]RU[Chinese]SZ["+this.width+"]";
        if(this.AB!=""){
            book +="AB"+this.AB;
        }
        if(this.AW!=""){
            book +="AW"+this.AW;
        }
        book +=";"
        let s = this.moveHistory.length;
        for(let i = 0; i<s; i ++){
            if(i==s-1)
            book += this.getSgfMv(i)+")";
            else
            book += this.getSgfMv(i)+";";
        }
        return book;
    }
}