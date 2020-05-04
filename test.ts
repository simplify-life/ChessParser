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
console.log(game.boardDes())

let allCanMoves = game.generate_moves({
   square:"d2"
})

import {PgnParser} from './src/FPgnParser'
import { mv2xy } from "./src/chess/engine/FCUtils"
PgnParser.pgn = pgnStr
let mvs = PgnParser.readPgn().allMoves()
for(let i = 0 ; i < mvs.length ; i ++){
    let pgnMove= mvs[i].str
    let mv = game.move_from_san(pgnMove)
    console.log(pgnMove)
    let from = mv2xy(mv.from)
    let to = mv2xy(mv.to)
    console.log(`${i}:(${from.x},${from.y})=>(${to.x},${to.y})`)
    game.make_move(mv)
    console.log(game.boardDes())
}
let history  = game.moveHistory()
game.reset()
console.log(game.boardDes())
