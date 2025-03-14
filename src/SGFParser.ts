enum ParserState {
    SGF_START,NORMAL,IN_NODE,
}

enum TokenType {
    VARIATION_START,VARIATION_END,NODE_START,KEY,VALUE,
}

class Token {
    type: TokenType;
    value: String;
    constructor(type: TokenType, value: String) {
        this.type = type;
        this.value = value;
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
                        branchStart = false;
                        let newNode = new Node();
                        current.children.push(newNode);
                        current = newNode;
                    } else {
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
        let currentKey = "";
        let currentValue = "";
        let readValue = false;
        for (let i = 0 ; i < sgf.length; i++) {
            const c = sgf[i];
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
                    if(readValue){
                        if (c == ']') {
                            tokens.push(new Token(TokenType.VALUE, currentValue));
                            readValue = false;
                            currentValue = "";
                        } else {
                            currentValue += c;
                        }
                    }else{
                        if (c.match(/[a-zA-Z0-9]/)) {
                            currentKey += c;
                        }else if (c == ';') {
                            tokens.push(new Token(TokenType.NODE_START, c));
                            state = ParserState.IN_NODE;
                            currentKey = "";
                            currentValue = "";
                        }
                        else if(c == '(') {
                            tokens.push(new Token(TokenType.VARIATION_START, c));
                            state = ParserState.NORMAL;
                            currentKey = "";
                            currentValue = "";
                        }
                        else if(c == ')') {
                            tokens.push(new Token(TokenType.VARIATION_END, c));
                            state = ParserState.NORMAL;
                            currentKey = "";
                            currentValue = "";
                        }
                        else if(c == '[') {
                            if (currentKey != "") {
                                tokens.push(new Token(TokenType.KEY, currentKey));
                                currentKey = "";
                            }
                            readValue = true;
                        }
                    }
                    break;
            }
        }
        return tokens;
    }
}