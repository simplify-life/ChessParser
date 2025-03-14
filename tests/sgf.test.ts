
import {SGFParser} from '../src/SGFParser'

const sgf = "(;SZ[19]AP[MultiGo:3.6.0 \\[escaped\\] tail ]AB[pb:pc][oc][od][ne][nf][og][pg][qg][rg][rf]AW[qf][pf][of][oe][re][qd][qc][pd]\n"
        +"(;B[sd]"
            +"(;W[rb]    ;B[qe]"
                +"(;W[pe]    ;B[rd]    ;W[se]    ;B[sf]    ;W[qe]    ;B[qb]    ;W[rc]    ;B[ra])\n"
                +"(;W[rd]    ;B[sc]    ;W[se]    ;B[pe]    ;W[qb]    ;B[qa]    ;W[ra]    ;B[sb])\n"
            +")\n"
            +"(;W[se]    ;B[rb]    ;W[rc]    ;B[sc]    ;W[qb]    ;B[qa])\n"
        +")\n"
        +"(;B[rb]    ;W[rc]    ;B[sd]    ;W[sc]    ;B[se]    ;W[qb]    ;B[qa]    ;W[ra]    ;B[sa]    ;W[sb])\n"
        +")";

let parser = new SGFParser()
let g = parser.parse(sgf)
let root = g.root;
let tokens = parser.tokennize(sgf)
for(let i = 0; i < tokens.length; i++){
    console.log(tokens[i].toString())
}