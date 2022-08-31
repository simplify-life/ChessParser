

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

    constructor(board:Array<number>,width:number){
        this.width = width;
        this.board = board;
        this.height = board.length/width;
        this.capture = [0,0];
        this.moveHistory = [];
        this.turn = BLACK;
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
            let x = pos%this.width;
            let y = ~~(pos/this.width);
            return (this.otherColor()==BLACK?"B":"W") +"["+String.fromCharCode(x+97)+String.fromCharCode(y+97) +"]";
        }
        return null;
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
}