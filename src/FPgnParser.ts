const pgnChessExample:string = `[Event "Rated game"]
[Site "http://lichess.org/PNWbB3rh"]
[Date "2016.01.30"]
[White "MarioL"]
[Black "mistborn"]
[Result "0-1"]
[WhiteElo "1914"]
[BlackElo "2040"]
[PlyCount "122"]
[Variant "Standard"]
[TimeControl "60+0"]
[ECO "A56"]
[Opening "Benoni Defence, Modern Variation"]
[Termination "Time forfeit"]
[Annotator "lichess.org"]
 
1. d4 Nf6 2. c4 c5 { Benoni Defence, Modern Variation } 3. Nc3 cxd4 4. Qxd4 Nc6 5. Qd1 a6 6. a3 e6 7. Nf3 d5 8. e3 Be7 9. cxd5 exd5 10. Be2 h6 11. O-O O-O 12. Bd3 Be6 13. Bb1 Rc8 14. Nd4 Qc7 15. Nxe6 fxe6 16. Qc2 e5 17. Bd2 e4 18. Ne2 Rfd8 19. Bc3 Ne5 20. Rc1 Nd3 21. Rd1 Bd6 22. Qd2 Be5 23. Bxd3 exd3 24. Qxd3 Bxc3 25. Nxc3 Qe5 26. Qe2 Qg5 27. Rd4 b5 28. Rad1 Qe5 29. h3 Rd6 30. Qf3 Rcd8 31. Ne2 Qg5 32. Qg3 Qxg3 33. Nxg3 Ne8 34. Ne2 Nc7 35. Nf4 g5 36. Nh5 Ne6 37. R4d3 Nc5 38. R3d2 Ne4 39. Rd4 Nf6 40. Nxf6+ Rxf6 41. Rxd5 Rxd5 42. Rxd5 Rc6 43. Rd8+ Kf7 44. Rd2 Ke6 45. Kh2 Rc1 46. Kg3 Rc5 47. b4 Re5 48. Rd3 Re4 49. Rd4 Re5 50. Re4 Rxe4 51. f3 Re5 52. f4 Rd5 53. f5+ Kxf5 54. e4+ Kg6 55. exd5 Kf6 56. d6 Ke5 57. d7 Ke6 58. h4 Kd5 59. hxg5 Kc4 60. gxh6 Kb3 61. d8=Q Kxa3 { White forfeits on time } 0-1

`
const pgnCnChessExample:string = `[Game "Chinese Chess"]
[Event "20分"]
[Site "-"]
[Date "2020-04-18"]
[Round "-"]
[Black "棋友4c08"]
[Red "棋友a674"]
[Result "1-0"]

 1. G0-E2 H9-G7
 2. G3-G4 H7-I7
 3. B0-C2 I9-H9
 4. H0-F1 B9-C7
 5. A0-A1 A9-A8
 6. A1-D1 A8-F8
 7. C3-C4 H9-H5
 8. C2-D4 C6-C5
 9. C4-C5 H5-C5
 10. I0-I1 C5-D5
 11. F1-G3 G6-G5
 12. G4-G5 D5-G5
 13. B2-B3 G5-D5
 14. B3-C3 C9-E7
 15. H2-G2 F8-F7
 16. C3-C6 G7-H5
 17. G3-H5 D5-H5
 18. I1-F1 F7-F1
 19. D1-F1 H5-D5
 20. D4-F5 I6-I5
 21. F5-H6 D9-E8
 22. F0-E1 B7-B8
 23. G2-G8 B8-D8
 24. G8-D8 D5-D8
 25. H6-G8 E9-D9
 26. C6-C2 E8-F7
 27. G8-I7 G9-I7
 28. F1-F7 D8-E8
 29. E2-C4 I7-G9
 30. F7-F9 E8-E9
 31. F9-E9 D9-E9
 32. C2-C7 E7-C5
 33. E3-E4 G9-E7
 34. A3-A4 E9-D9
 35. C7-D7 D9-E9
 36. D7-D3 E9-D9
 37. D3-A3 1-0`

const CHAR_EOF = "CHAR_EOF"

const PgnTag = ["Event","Site","Date","Round","White","Black","Result",
                // from here, the keys are optional, order may be different
                "Board","ECO","WhitemyELO","BlackmyELO","WhiteDays","BlackDays","myChessNo",
                // From here it was from Wikipedia
                "Annotator","PlyCount","TimeControl","Time","Termination","Mode","SetUp","FEN"]

export enum TOKEN_TYPE{
    ERROR = -1,
    EOF = 256,
    SYMBOL = 257,
    STRING = 258,
    INTEGER = 259,
    NAG = 260,
    RESULT = 261,
    MOVE = 262 //走子
 };

 export interface PgnToken {
     type:number
     str:string
 }


export class FPgnParser {
    private $pgn:string=""
    private currentIdx:number
    private readChar:boolean
    private readToken:boolean
    private curChar:string
    private tokenType:TOKEN_TYPE
    private tokenString:string
    private tokenLen:number
    private curToken:PgnToken
    public allTokens:Array<PgnToken>

    private initData(){
        this.currentIdx = 0
        this.readChar = true
        this.readToken = true
        this.curChar = ''
        this.tokenType = TOKEN_TYPE.ERROR
        this.tokenLen = 0
        this.allTokens = []
    }

    get pgn(){
        return this.$pgn
    }

    set pgn(p:string){
        this.initData()
        this.$pgn = p
    }

    setPgn(p:string){
        this.initData()
        this.$pgn = p
        return this
    }

    private is_symbol_start(c:string):boolean{
        return "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".indexOf(c)!=-1
    }

    private is_symbol_next(c:string):boolean{
        return "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_+#=:-/".indexOf(c)!=-1
    }

    private charNext(){
        if(false == this.readChar){
            this.readChar = true
            return
        }
        if(this.readChar){
            let len = this.pgn.length
            if(this.currentIdx>=0 && this.currentIdx< len){
                this.curChar = this.pgn[this.currentIdx]
                this.currentIdx++
            }else{
                this.curChar = CHAR_EOF
            }
            if('\0'==this.curChar) this.curChar = CHAR_EOF
        }
    }

    getNextToken():PgnToken{
        this.tokenRead()
        if (this.tokenType == TOKEN_TYPE.EOF) this.curToken =  null;
        else {
            this.curToken =  {
                type:this.tokenType,
                str:this.tokenString
            }
        }
        return this.curToken
    }

    private tokenRead(){
        if(this.readToken==false){
            this.readToken = true
            return
        }
        this.skipBlanks()
        this.tokenString = ''
        this.tokenLen = 0
        if ( CHAR_EOF == this.curChar) {
            this.tokenType = TOKEN_TYPE.EOF;
         } else if(".[]()<>{}".indexOf(this.curChar)!=-1){
            // single-character token
            this.tokenType = this.curChar.charCodeAt(0)
            this.tokenString = this.curChar
            this.tokenLen = 1
        }else if (this.curChar == '*') {
            this.tokenType = TOKEN_TYPE.RESULT
            this.tokenString = this.curChar
            this.tokenLen = 1
        }else if (this.curChar == '!') {
            this.charNext()
            if (this.curChar == '!') { // "!!"
               this.tokenType = TOKEN_TYPE.NAG;
               this.tokenString = "3"
               this.tokenLen = 1
            } else if (this.curChar == '?') { // "!?"
               this.tokenType = TOKEN_TYPE.NAG;
               this.tokenString = "5"
               this.tokenLen = 1
            } else { // "!"
               //不再读取
               this.readChar = false
               this.tokenType = TOKEN_TYPE.NAG;
               this.tokenString = "1"
               this.tokenLen = 1
            }
        } else if (this.curChar == '?') {
            this.charNext()
            if (this.curChar == '?') { // "??"
               this.tokenType = TOKEN_TYPE.NAG
               this.tokenString="4"
               this.tokenLen = 1
            } else if (this.curChar == '!') { // "?!"
               this.tokenType = TOKEN_TYPE.NAG;
               this.tokenString = "6";
               this.tokenLen = 1;
            } else { // "?"
               //不再读取
               this.readChar = false
               this.tokenType = TOKEN_TYPE.NAG;
               this.tokenString = "2";
               this.tokenLen = 1;
            }
        }
        else if (this.is_symbol_start(this.curChar)) {
                  // symbol, integer, or result
            this.tokenType = TOKEN_TYPE.INTEGER;
            this.tokenLen = 0;
            do {
               if (this.tokenLen >= 256 - 1) {
                    throw Error(`Symbol ${this.tokenString} too long`)
               }
               let code = this.curChar.charCodeAt(0)
               if(code<48||code>57) this.tokenType = TOKEN_TYPE.SYMBOL;
                this.tokenString += this.curChar
                this.tokenLen ++
                this.charNext()
            }while (this.curChar != CHAR_EOF && this.is_symbol_next(this.curChar));
                this.readChar = false
                this.tokenString += '\0'
                if (this.tokenString.indexOf("1-0")!= -1 ||
                this.tokenString.indexOf("0-1")!= -1 ||
                this.tokenString.indexOf("1/2-1/2")!= -1) {
                   this.tokenType = TOKEN_TYPE.RESULT;
                }
        } else if (this.curChar == '"') {
            this.tokenType = TOKEN_TYPE.STRING
            this.tokenLen = 0
            while(true){
                this.charNext()
                let w = this.curChar
                if(w == CHAR_EOF){
                    throw Error(`Unterminated string: ${this.tokenString}`)
                }
                if (this.curChar == '"') break
                if (this.curChar == '\\'){
                    this.charNext()
                    if(w == CHAR_EOF){
                        throw Error(`Unterminated string: ${this.tokenString}`)
                    }
                    if (this.curChar != '"' && this.curChar != '\\') {
                        if (this.tokenLen >= 256 - 1) {
                            throw Error(`String ${this.tokenString} too long`)
                       }
                       this.tokenString += '\\'
                       this.tokenLen ++
                    }
                } 
                if (this.tokenLen >= 256 - 1) {
                    throw Error(`String ${this.tokenString} too long`)
               }
               this.tokenString += this.curChar
               this.tokenLen ++
            }
            this.tokenString += '\0'
        }
        else if (this.curChar == '$') {
            this.tokenType = TOKEN_TYPE.NAG
            this.tokenLen = 0
            while (true) {
                this.charNext()
                let code = this.curChar.charCodeAt(0)
                if(code<48||code>57) break
                if (this.tokenLen >= 3) {
                    throw Error(`NAG ${this.tokenString} too long`)
                }
                this.tokenString += this.curChar
                this.tokenLen ++
             }
             this.readChar = false
             if (this.tokenLen == 0) {
                throw Error(`NAG Invalid:${this.tokenString}`)
             }
             this.tokenString += '\0'
        }
        else {
            // unknown token
        }
        
    }

    private skipBlanks(){
        while(true){
            this.charNext()
            if('\n'==this.curChar){
                // skip new line character 
            }
            else if(' '==this.curChar){
                // skip white space
            }else if(';'==this.curChar){
                // skip comment to EOL
                do {
                    this.charNext()
                    let w = this.curChar
                    if(w == CHAR_EOF){
                        throw Error("Unterminated comment")
                    }
                    if('\n'==w){
                        break
                    }
                }while (true)
            } else if (this.curChar == '%' && this.currentIdx >= 2 &&
            this.pgn[this.currentIdx - 2] == '\n') { 
                // skip comment to EOL
                do {
                    this.charNext()
                    let w = this.curChar
                    if(w == CHAR_EOF){
                        throw Error("")
                    }
                    if('\n'==w){
                        break
                    }
                }while (true)
            }else break   
        }
    }

    /**
     * 读取注释
     */
    readOnlyComment():Array<string>{
        let cstr:string = "",
            len = this.pgn.length,
            c = '',
            depth = 0
        for(let i = 0 ; i <len ; i++){
            c = this.pgn[i]
            if('{'==c) depth++
            else if('}'==c) depth--
            if(0==depth) continue
            if('\n'==c || '\r'==c) c=' '
            cstr += c
        }
        cstr = cstr.replace(/\ +/g,"").replace(/[\r\n]/g,"")
        return cstr.split('{')
    }

    /**
     * 读取tag标签
     */
    readOnlyPgnTags(){
        this.initData()
        let token:PgnToken,
            tagKey:string,
            tagValue:string,
            pgnTags:Array<[string,string]>=[]
        while(true){
            token = this.getNextToken()
            
            if(null == token) break
            this.allTokens.push(token)
            if (token.type != '['.charCodeAt(0)) break;
            token = this.getNextToken()
           
            if(null == token) break
            this.allTokens.push(token)
            if (token.type != TOKEN_TYPE.SYMBOL){
                throw Error(`Invalid pgn header`)
            }
            tagKey = token.str
            token = this.getNextToken()
            if(null == token) break
            this.allTokens.push(token)
            if (token.type != TOKEN_TYPE.STRING){
                throw Error(`Invalid pgn header`)
            }
            tagValue = token.str
            token = this.getNextToken()
            
            if(null == token) break
            this.allTokens.push(token)
            if (token.type != ']'.charCodeAt(0)){
                throw Error(`Invalid pgn header`)
            }
            console.log(tagKey,tagValue)
            pgnTags.push([tagKey,tagValue])
        }
        return pgnTags
    }

    /**
     * 从中间读取注释
     */
    private readComment():string{
        let cstr:string = "",
            len = this.pgn.length,
            c = '',
            depth = 1
            if(this.currentIdx>=0&&this.currentIdx<=len){
                c = this.pgn[this.currentIdx]
                this.currentIdx++
                for( ; c!="\0" ; ){
                    if('}'==c) depth--
                    if(0==depth) break
                    if('\n'==c || '\r'==c) c=' '
                    cstr += c
                    if(this.currentIdx>=0&&this.currentIdx<=len){
                        c = this.pgn[this.currentIdx]
                        this.currentIdx++
                    }else break
                }
            }
        return cstr
    }

    readPgn(){
        this.readOnlyPgnTags()
        let token:PgnToken = this.curToken,
            depth = 0
        do{
            if(null==token){}
            else if(TOKEN_TYPE.ERROR == token.type){
                throw Error(`Unknown token`)
            }
            else if (token.type == '{'.charCodeAt(0)){
                console.log("COMMENT:",this.readComment())
            }else  if (token.type == '('.charCodeAt(0)){
                // Beginning of a RAV.
                depth++
            }else  if (token.type == ')'.charCodeAt(0)){
                // End of a RAV.
                depth--
            }else if(token.type == TOKEN_TYPE.NAG){
                console.log("NAG:",token.str)
            }else if (depth == 0 && token.type == TOKEN_TYPE.SYMBOL) {
                token.type = TOKEN_TYPE.MOVE
                console.log("MOVE:",token.str)
            }else if (token.type == TOKEN_TYPE.RESULT || token.type == TOKEN_TYPE.EOF) {
                console.log("END:",token.str)
                break
            }
            if(token){
                token.str = token.str.replace(String.fromCharCode(0),'') 
                this.allTokens.push(token)
            }
            token = this.getNextToken()
        }while(token)

        return this
    }
    
    allMoves(){
        return this.allTokens.filter(e=>e.type==TOKEN_TYPE.MOVE)
    }

    test(){
        // this.pgn = pgnChessExample
        // this.readPgn()
        // this.pgn = pgnCnChessExample
        // this.readPgn().filter(e=>e.type==TOKEN_TYPE.MOVE)
        this.pgn = `[Event "Rated game"]
        [Site "http://lichess.org/PNWbB3rh"]
        [Date "2016.01.30"]
        [White "MarioL"]
        [Black "mistborn"]
        [Result "0-1"]
        [WhiteElo "1914"]
        [BlackElo "2040"]
        [PlyCount "122"]
        [Variant "Standard"]
        [TimeControl "60+0"]
        [ECO "A56"]
        [Opening "Benoni Defence, Modern Variation"]
        [Termination "Time forfeit"]
        [Annotator "lichess.org"]
        `
        this.readPgn()
    }

}


/**
 * @description pgn 解析工具类
 * @example 
 * `
 *   PgnParser.pgn = "Your Pgn string"
 *   let moves = PgnParser.readPgn().filter(e=>e.type==TOKEN_TYPE.TOKEN_MOVE)
 * `
 */

export const PgnParser = new FPgnParser