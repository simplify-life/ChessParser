enum ParserState {
    SGF_START,
    NORMAL,
    IN_NODE,
}

enum TokenType {
    VARIATION_START,
    VARIATION_END,
    NODE_START,
    KEY,
    VALUE,
}
//TokenType 转为 String
function tokenTypeToString(type: TokenType): String {
    switch (type) {
        case TokenType.VARIATION_START:
            return "VARIATION_START";
        case TokenType.VARIATION_END:
            return "VARIATION_END";
        case TokenType.NODE_START:
            return "NODE_START";
        case TokenType.KEY:
            return "KEY";
        case TokenType.VALUE:
            return "VALUE";
    }
}
class Token {
    type: TokenType;
    value: String;
    constructor(type: TokenType, value: String) {
        this.type = type;
        this.value = value;
    }

    toString(): String {
        return `${tokenTypeToString(this.type)}  ${this.value}`;
    }
}

export class Node {
    public next: Node;
    public children: Node[];
    public properties: Map<String, String[]>;
    constructor() {
        this.children = [];
        this.properties = new Map();
    }

    public propertiesString(): String {
        let result = "";
        this.properties.forEach((values, key) => {
            result += `(${key}: ${values.join(", ")}) `;
        })
        return result;
    }
}

export class Game {
    public root: Node;
    constructor(root: Node) {
        this.root = root;
    }
}



export class SGFParser {

    public parse(sgf: String): Game {
        return new Game(this.parseNode(this.tokennize(sgf)));
    }

    public parseNode(tokens: Token[]): Node {
        let root = new Node();
        let current = root;
        let stack: Node[] = [];
        let parentStack: Node[] = [];
        let k = "";
        let branchStart = false;
        for (let i = 1; i < tokens.length-1; i++) {
            let token = tokens[i];
            switch (token.type) {
                case TokenType.VARIATION_START:
                    parentStack.push(current);
                    branchStart = true;
                    break;
                case TokenType.VARIATION_END:
                    if (parentStack.length > 0) {
                        current = parentStack.pop()!;
                    }
                    break;
                case TokenType.NODE_START:
                    if (branchStart) {
                        //分支开始
                        branchStart = false;
                        let newNode = new Node();
                        current.children.push(newNode);
                        current = newNode;
                    } else {
                        // 当前分支的下一个节点
                        let newNode = new Node();
                        current.next = newNode;
                        current = newNode;
                    }
                    break;
                case TokenType.KEY:
                    k = token.value.toString();
                    current.properties.set(k, []);
                    break;
                case TokenType.VALUE:
                    current.properties.get(k)?.push(token.value);
                    break;
            }
        }

        return root.next;
    }

    public tokennize(sgf: String): Token[] {
        let tokens: Token[] = [];
        let state = ParserState.SGF_START;
        let i = 0;
        let currentKey = "";
        let currentValue = "";
        let readValue = false;
        while (i < sgf.length) {
            let c = sgf[i];
            switch (state) {
                case ParserState.SGF_START:
                    if (c == '(') {
                        tokens.push(new Token(TokenType.VARIATION_START, c));
                        state = ParserState.NORMAL;
                    }
                    break;
                case ParserState.NORMAL:
                    if (c == '(') {
                        tokens.push(new Token(TokenType.VARIATION_START, c));
                    } else if (c == ')') {
                        tokens.push(new Token(TokenType.VARIATION_END, c));
                    } else if (c == ';') {
                        tokens.push(new Token(TokenType.NODE_START, c));
                        state = ParserState.IN_NODE;
                    }
                    break;
                case ParserState.IN_NODE:
                    // 读取key,应该是字母或者数字，并且不能是空格
                    for (; i < sgf.length; i++) {
                        c = sgf[i];
                        // 如果没有读取Value,直接读取key
                        if (!readValue) {
                            if (c.match(/[a-zA-Z0-9]/)) {
                                currentKey += c;
                            } else if (c == '[') {
                                tokens.push(new Token(TokenType.KEY, currentKey));
                                currentKey = "";
                                readValue = true;
                            }
                        } else {
                            // 如果读取了Value,直接读取Value
                            if (c == ']') {
                                tokens.push(new Token(TokenType.VALUE, currentValue));
                                readValue = false;
                                currentValue = "";
                                break;
                            } else {
                                currentValue += c;
                            }
                        }
                    }
                    //有可能处理下一个value
                    for (; i < sgf.length; i++) {
                        c = sgf[i];
                        if (!readValue && c == ';') {
                            tokens.push(new Token(TokenType.NODE_START, c));
                            state = ParserState.IN_NODE;
                            currentKey = "";
                            currentValue = "";
                            break;
                        }
                        if (!readValue && c == '(') {
                            tokens.push(new Token(TokenType.VARIATION_START, c));
                            state = ParserState.NORMAL;
                            currentKey = "";
                            currentValue = "";
                            break;
                        }
                        if (!readValue && c == ')') {
                            tokens.push(new Token(TokenType.VARIATION_END, c));
                            state = ParserState.NORMAL;
                            currentKey = "";
                            currentValue = "";
                            break;
                        }
                        if (!readValue && c.match(/[a-zA-Z0-9]/)) {
                            currentKey += c;
                        }
                        if (!readValue && c == '[') {
                            if (currentKey != "") {
                                tokens.push(new Token(TokenType.KEY, currentKey));
                                currentKey = "";
                            }
                            readValue = true;
                            break;
                        }
                        if (readValue) {
                            if (c == ']') {
                                tokens.push(new Token(TokenType.VALUE, currentValue));
                                readValue = false;
                                currentValue = "";
                            } else {
                                currentValue += c;
                            }
                        }
                    }
                    break;
            }
            i++;
        }
        return tokens;
    }
}