
enum ParserState {NORMAL,IN_COMMENT}

enum TokenType{
    MVE_NUMBER,MOVE,NAG,COMMENT,VARIATION_START,VARIATION_END,RESULT
}

class Token {
    type: TokenType;
    value: String;
    constructor(type: TokenType, value: String) {
        this.type = type;
        this.value = value;
    }
}

export class Variation {
    public root: MoveNode|null;
    public comments: Array<String> = [];
}

export class MoveNode{
    public number: String;
    public san: String;
    public color:String;
    public nags: Array<String> = [];
    public comments: Array<String> = [];
    public variations: Array<Variation> = [];
    public next: MoveNode;

    constructor(number: String, san: String, color: String) {
        this.number = number;
        this.san = san;
        this.color = color;
    }

    equals(move: MoveNode): boolean {
        return move!=void 0 && this.number == move.number && this.san == move.san && this.color == move.color;
    }
}

export class Game{
    public tags: Map<String, String> = new Map();
    public root: Variation;
    constructor(tags: Map<String, String>, root: Variation) {
        this.tags = tags;
        this.root = root;
    }

    getRootNode(): MoveNode|null {
        return this.root?.root;
    }

    public getMainStep():number{
        let step = 0;
        let node = this.getRootNode();
        while(node!=void 0){
            step++;
            node = node.next;
        }
        return step;
    }
}

export class VariationInfo {
    public moves: Array<MoveInfo> = [];
    public comments: Array<String> = [];
}

export class MoveInfo {
    public number: String;
    public san: String;
    public color:String;
    public nags: Array<String> = [];
    public comments: Array<String> = [];
    public variations: Array<VariationInfo> = [];

    constructor(number: String, san: String, color: String) {
        this.number = number;
        this.san = san;
        this.color = color;
    }
}


const tagPattern = /^\[(\w+)\s+"(.*)"\]$/;
const moveNumberPattern = /^(\d+)(?:\.\.\.|\.)/;
// 国际象棋移动记谱法（兼容多种格式）
const movePattern = /^([KQRBNP]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?|O-O(?:-O)?|[KQRBNP][a-h1-8]?x?[a-h][1-8]|[KQRBNP][1-8]x?[a-h][1-8]|[KQRBNP]x[a-h][1-8])[+#]?[!?]*/;

// 坐标记谱法模式 (如 H2-H6)，忽略大小写
const coordinateMovePattern = /^([A-I][0-9])-([A-I][0-9])/i;

// WXF记谱法模式 (如 H2+3, R1.2, C7-5)，忽略大小写
const wxfMovePattern = /^([KAEHRCP])([1-9])([+\-.]?)(10|[1-9])/i;

// 中国象棋传统记谱法模式（Unicode 支持）
const chineseMovePattern = /^([车马相仕帅炮兵将士象马车炮卒])([一二三四五六七八九１２３４５６７８９123456789])([进退平])([一二三四五六七八九１２３４５６７８９123456789])/;

// 中国象棋传统其它记谱法模式（Unicode 支持）
const chineseOtherMovePattern = /^([前后左右中])([车马相仕帅炮兵将士象马车炮卒])([进退平])([一二三四五六七八九１２３４５６７８９123456789])/;

// 虚着（仅匹配 ...）
const virtualMovePattern = /^(\.\.\.)/;

// 棋局评注符号（如 $1, !! 等）
const nagPattern = /^\$[0-9]+|!!|\?\?|!\?|\?!|!|\?/;

// 对局结果标记
const resultPattern = /^(1-0|0-1|1\/2-1\/2|\*)$/;

function isWhitespaceChar(char: string): boolean {
    // 确保输入是单个字符
    if (char.length !== 1) {
      throw new Error("输入必须是单个字符");
    }
    // 匹配空白字符（包括空格、制表符、换行符等）
    return /^\s$/.test(char);
  }

export class PgnParser {
    public parseTags(pgnText: String): Map<String, String> {
        const tags = new Map<String, String>();
        const lines = pgnText.split('\n');
        for (const line of lines) {
            const match = line.match(tagPattern);
            if (match) {
                tags.set(match[1], match[2]);
            }
        }
        return tags;
    }

    public separateTagsAndMoves(pgnText: String): Array<String> {
        const lines = pgnText.split('\n');
        let result: Array<String> = [];
        let tagStr = '';
        let mvStr = '';
        let inTags = true;
        for (let line of lines) {
            line = line.trim();
            if (line === '') {
                if(tagStr.length>0){
                    inTags = false;
                }
                continue;
            } else if (inTags && line.startsWith('[')) {
                tagStr += line + '\n';
            } else {
                inTags = false;
                mvStr += line + ' ';
            }
        }
        result.push(tagStr.trim());
        result.push(mvStr.trim());
        return result;
    }

    public tokenizeMove(moveText: String): Array<Token> {
        const tokens: Array<Token> = [];
        let state = ParserState.NORMAL;
        let i = 0;
        let commentStart = 0;
        while (i < moveText.length) {
            let c = moveText.charAt(i);
            switch (state) {
                case ParserState.NORMAL:{
                    if(isWhitespaceChar(c)){
                        i++;
                        continue;
                    }
                    if(c == '{'){
                        state = ParserState.IN_COMMENT;
                        commentStart = i;
                        i++;
                        continue;
                    }
                    if(c == '('){
                        tokens.push(new Token(TokenType.VARIATION_START, '('));
                        i++;
                        continue;
                    }
                    if(c == ')'){
                        tokens.push(new Token(TokenType.VARIATION_END, ')'));
                        i++;
                        continue;
                    }
                    // 尝试匹配回合标记
                    let match = moveText.substring(i).match(moveNumberPattern);
                    if(match){
                        tokens.push(new Token(TokenType.MVE_NUMBER, match[1]));
                        i += match[0].length;
                        continue;
                    }
                    // 尝试匹配移动
                    match = moveText.substring(i).match(movePattern);
                    if(match){
                        tokens.push(new Token(TokenType.MOVE, match[1]));
                        i += match[0].length;
                        continue;
                    }

                    match = moveText.substring(i).match(coordinateMovePattern);
                    if(match){
                        tokens.push(new Token(TokenType.MOVE, match[1]));
                        i += match[0].length;
                        continue;
                    }

                    match = moveText.substring(i).match(wxfMovePattern);
                    if(match){
                        tokens.push(new Token(TokenType.MOVE, match[1]));
                        i += match[0].length;
                        continue;
                    }

                    match = moveText.substring(i).match(chineseMovePattern);
                    if(match){
                        tokens.push(new Token(TokenType.MOVE, match[1]));
                        i += match[0].length;
                        continue;
                    }

                    match = moveText.substring(i).match(chineseOtherMovePattern);
                    if(match){
                        tokens.push(new Token(TokenType.MOVE, match[1]));
                        i += match[0].length;
                        continue;
                    }

                    match = moveText.substring(i).match(virtualMovePattern);
                    if(match){
                        tokens.push(new Token(TokenType.MOVE, match[1]));
                        i += match[0].length;
                        continue;
                    }
                    //NAG
                    match = moveText.substring(i).match(nagPattern);
                    if(match){
                        tokens.push(new Token(TokenType.NAG, match[1]));
                        i += match[0].length;
                        continue;
                    }
                    //RESULT
                    match = moveText.substring(i).match(resultPattern);
                    if(match){
                        tokens.push(new Token(TokenType.RESULT, match[1]));
                        i += match[0].length;
                        continue;
                    }
                    // 无法识别的字符，跳过
                    i++;
                    break;
                }
                case ParserState.IN_COMMENT:
                    if(c == '}'){
                        tokens.push(new Token(TokenType.COMMENT, moveText.substring(commentStart+1, i)));
                        state = ParserState.NORMAL;
                    }
                    i++;
                    break;
            }
        }
        return tokens;
    }

    public parsePgn(tokens: Token[]): VariationInfo{
        let mainLine = new VariationInfo();
        let variationStack: Array<VariationInfo> = [];
        let expectingWhiteMoveStack: Array<boolean> = [];
        let moveNumberStack: Array<String> = [];
        variationStack.push(mainLine);
        let currentMoveNumber = "1";
        let expectingWhiteMove = true;
        let lastMove = null;
        let i = 0;
        while(i < tokens.length){
            let token = tokens[i];
            switch(token.type){
                case TokenType.COMMENT:{
                    variationStack[variationStack.length-1].comments.push(token.value);
                    break;
                }
                case TokenType.MVE_NUMBER:{
                    let mvNumber = token.value;
                    let isBlackMove = mvNumber.includes("...");
                    currentMoveNumber = mvNumber.split(".")[0];
                    expectingWhiteMove = !isBlackMove;
                    i++;
                    break;
                }
                case TokenType.MOVE:{
                    let san = token.value;
                    if(san.includes("...")){
                        expectingWhiteMove = !expectingWhiteMove;
                        i++;
                        break;
                    }
                    let move = new MoveInfo(currentMoveNumber,san, expectingWhiteMove ? "white" : "black");
                    variationStack[variationStack.length-1].moves.push(move);
                    lastMove = move;
                    expectingWhiteMove = !expectingWhiteMove;
                    i++;
                    // 处理可能的NAG和注释
                    while(i < tokens.length){
                        let nextToken = tokens[i];
                        if(nextToken.type == TokenType.NAG){
                            move.nags.push(nextToken.value);
                            i++;
                        }else if(nextToken.type == TokenType.COMMENT){
                            move.comments.push(nextToken.value);
                            i++;
                        }else{
                            break;
                        }
                    }
                    break;
                }
                case TokenType.VARIATION_START:{
                    // 开始新的变例，保存当前状态
                    if(lastMove!=null){
                        moveNumberStack.push(currentMoveNumber);
                        expectingWhiteMoveStack.push(expectingWhiteMove);
                        currentMoveNumber = lastMove.number.toString();
                        // 变例应该从上一步的同一位置开始
                        // 如果上一步是白方，变例也应该从白方开始
                        // 如果上一步是黑方，变例也应该从黑方开始
                        if(lastMove.color == "white"){
                            expectingWhiteMove = true;
                        }else{
                            expectingWhiteMove = false;
                        }
                        let newVariation = new VariationInfo();
                        lastMove.variations.push(newVariation);
                        variationStack.push(newVariation);
                    }
                    i++;
                    break;
                }
                case TokenType.VARIATION_END:{
                    // 结束当前变例，恢复之前的状态
                    if(variationStack.length > 1){
                        variationStack.pop();
                        let mn = moveNumberStack.pop();
                        mn && (currentMoveNumber = mn.toString());
                        let ewm = expectingWhiteMoveStack.pop();
                        ewm && (expectingWhiteMove = ewm);
                        // 更新 lastMove 为当前分支的最后一步
                        if(variationStack.length > 0){
                            let currentVariation = variationStack[variationStack.length-1];
                            if(currentVariation.moves.length > 0){
                                lastMove = currentVariation.moves[currentVariation.moves.length-1];
                            }
                        }
                    }
                    i++;
                    break;
                }
                case TokenType.RESULT:
                    i++;
                    break;
                default:
                    i++;
                    break;
            }
        }
        return mainLine;
    }

    private buildMoveTree(info:VariationInfo):MoveNode|null{
        let moves = info.moves;
        if(moves.length == 0){
            return null;
        }
        let root = null;
        let current = null;
        for(let move of moves){
            let node = new MoveNode(move.number, move.san, move.color);
            node.nags = move.nags;
            node.comments = move.comments;
            // 处理变例
            for(let variation of move.variations){
                let variationRoot = this.buildMoveTree(variation);
                if(variationRoot!=null){
                    let variantionNode =  new Variation();
                    variantionNode.root = variationRoot;
                    variantionNode.comments = variation.comments;
                    node.variations.push(variantionNode);
                }
            }
            if(root == null){
                root = node;
                current = node;
            }else{
                current && (current.next = node);
                current = node;
            }
        }
        return root;
    }

    public buildGameTree(info:VariationInfo):Variation{
        let tree = new Variation();
        tree.root = this.buildMoveTree(info);
        tree.comments = info.comments;
        return tree;
    }

    public parse(pgn:String):Game{
        let separated = this.separateTagsAndMoves(pgn);
        let tags = this.parseTags(separated[0]);
        let tokens = this.tokenizeMove(separated[1]);
        let info = this.parsePgn(tokens);
        let tree = this.buildGameTree(info);
        return new Game(tags, tree);
    }
}







