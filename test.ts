/**
 *  +---+---+---+---+---+---+---+---+ 
 *  |   |   |   |   |   |   |   |   | 8 
 *  +---+---+---+---+---+---+---+---+ 
 *  |   |   |   |   |   |   |   |   | 7
 *  +---+---+---+---+---+---+---+---+ 
 *  |   |   |   |   |   |   |   |   | 6
 *  +---+---+---+---+---+---+---+---+
 *  |   |   |   |   |   |   |   |   | 5
 *  +---+---+---+---+---+---+---+---+
 *  |   |   |   |   |   |   |   |   | 4
 *  +---+---+---+---+---+---+---+---+
 *  |   |   |   |   |   |   |   |   | 3
 *  +---+---+---+---+---+---+---+---+
 *  |   |   |   |   |   |   |   |   | 2
 *  +---+---+---+---+---+---+---+---+
 *  |   |   |   |   |   |   |   |   | 1
 *  +---+---+---+---+---+---+---+---+
 *    a   b   c   d   e   f   g   h
 */

import { FCGame } from "./src/chess/engine/FCGame"

 /**
 *  +---+---+---+---+---+---+---+---+ 0
 *  |   |   |   | \ | / |   |   |   |  
 *  +---+---+---+---+---+---+---+---+ 1
 *  |   |   |   | / | \ |   |   |   | 
 *  +---╬---+---+---+---+---+---╬---+ 2
 *  |   |   |   |   |   |   |   |   | 
 *  ╠---+---╬---+---╬---+---╬---+---╬ 3
 *  |   |   |   |   |   |   |   |   | 
 *  +---+---+---+---+---+---+---+---+ 4
 *  |       楚河          汉界       | 
 *  +---+---+---+---+---+---+---+---+ 5
 *  |   |   |   |   |   |   |   |   | 
 *  ╠---+---╬---+---╬---+---╬---+---╬ 6
 *  |   |   |   |   |   |   |   |   | 
 *  +---╬---+---+---+---+---+---╬---+ 7
 *  |   |   |   | \ | / |   |   |   | 
 *  +---+---+---+---+---+---+---+---+ 8
 *  |   |   |   | / | \ |   |   |   | 
 *  +---+---+---+---+---+---+---+---+ 9
 *  A   B   C   D   E   F   G   H   I
 */

const pgnStr = `[Event "World Championship 20th"]
[Site "Moscow"]
[Date "1954.??.??"]
[Round "23"]
[White "Smyslov, Vassily"]
[Black "Botvinnik, Mikhail"]
[Result "1-0"]
[WhiteElo ""]
[BlackElo ""]
[ECO "A04"]

1.e4 e6 2.d3 c5 3.Nd2 Nc6 4.g3 g6 5.Bg2 Bg7 6.Ngf3 Nge7 7.O-O O-O 8.c3 d6
9.a4 f5 10.Qb3 d5 11.exd5 exd5 12.Re1 f4 13.Nf1 Bg4 14.gxf4 Bxf3 15.Bxf3 Kh8
16.Bd2 Bh6 17.Re6 Bxf4 18.Rae1 Bxd2 19.Nxd2 Nf5 20.Bg2 Nh4 21.Qxd5 Nxg2 22.Qxg2 Qxd3
23.Ne4 Rf5 24.Nd6 Rf3 25.Nxb7 Raf8 26.Nxc5 Qf5 27.Re8 Kg8 28.Rxf8+  1-0
`
let game = new FCGame
// console.log(game.boardDes())

let allCanMoves = game.generate_moves({
   square:"d2"
})

import {PgnParser} from './src/FPgnParser'
import { mv2xy } from "./src/chess/engine/FCUtils"
// PgnParser.pgn = pgnStr
// let mvs = PgnParser.readPgn().allMoves()
// for(let i = 0 ; i < mvs.length ; i ++){
//     let pgnMove= mvs[i].str
//     let mv = game.move_from_san(pgnMove)
//     console.log(pgnMove)
//     let from = mv2xy(mv.from)
//     let to = mv2xy(mv.to)
//     console.log(`${i}:(${from.x},${from.y})=>(${to.x},${to.y})`)
//     game.make_move(mv)
//     console.log(game.boardDes())
// }
// let history  = game.moveHistory()
// game.reset()
// console.log(game.boardDes())

import { FDGame, DMove, DrawRule, DSearch } from './src/draughts/engine/FDGame';
import { International_draughts, Brazilian_draughts, C_WHITE, C_BLACK } from './src/draughts/engine/FDConst';

// let dGame10x10 = new FDGame(International_draughts)
// console.log(dGame10x10.boardDes())
let dGame8x8 = new FDGame(Brazilian_draughts)
// √
// dGame8x8.startFromFen("W:W7,29-31:B12,20")
// console.log(dGame8x8.boardDes())
// let fen = dGame8x8.getFen()
// console.log(fen)
// dGame8x8.startFromFen("W:WK5:BK13,24")
// console.log(dGame8x8.boardDes())
let rule64 = new DrawRule()
//64:[3,15,{"0,1,0,1":5,"1,1,0,1":5,"0,1,1,1":5,"0,1,0,2":5,"0,2,0,1":5}]
rule64.homeType = 3
rule64.kingMove = 30
rule64.pieceNum = [{piece:"0,1,0,1",step:10},{piece:"1,1,0,1",step:10},{piece:"0,1,1,1",step:10},{piece:"0,1,0,2",step:10},{piece:"0,2,0,1",step:10}]
dGame8x8.setDrawRule(rule64)

dGame8x8.start()
// dGame8x8.startFromFen("B:WK1:BK5,K18,K22")
// console.log(dGame8x8.boardDes())
console.time(`game`)

let search = new DSearch()
let depth = 5
let mv = search.getBestMv(depth,dGame8x8)
while (mv.length>0) {
    let result = dGame8x8.makeMv(mv)
    if(result==false) break
    dGame8x8.checkEnd()
    console.log(mv)
    console.log(dGame8x8.boardDes())
    if(dGame8x8.turn == C_BLACK) depth=7
    else depth = 5
    mv = search.getBestMv(depth,dGame8x8)
}
console.log(dGame8x8.generatePdnBook())

console.timeEnd(`game`)
//5.g1-h2 f6-e5  6.g3-h4 e5xg3  7.h2xf4 g7-f6  8.f2-e3 f6-g5  9.h4xf6 e7xg5

import{FGoBoard} from "./src/go/FGoBoard"

let goBoard:FGoBoard = new FGoBoard([
    0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,2,0,
    0,0,0,0,0,0,0,0,0,0,0,2,1,1,0,0,0,0,1,
    0,0,0,0,0,0,0,0,0,0,2,0,2,1,0,0,0,1,0,
    0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,2,1,2,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,

],19)

console.log(goBoard.showBoard())

let mvList = [
    "q18","r17","r18","s18","t16","t15","r19","p19","t19",
    "p18","p17","q17","q19","s18","s19","t17",//"t16"
]

for(let i = 0; i < mvList.length; i++){
    let re = goBoard.play(mvList[i])
    if(re)
    console.log(goBoard.showBoard())
}
