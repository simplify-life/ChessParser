import { FDGame, DrawRule, DSearch } from '../src/draughts/engine/FDGame';
import { Brazilian_draughts, C_BLACK } from '../src/draughts/engine/FDConst';

// let dGame10x10 = new FDGame(International_draughts)
// console.log(dGame10x10.boardDes())
let dGame8x8 = new FDGame(Brazilian_draughts);

let rule64 = new DrawRule();

rule64.homeType = 3;
rule64.kingMove = 30;
rule64.pieceNum = [{piece:"0,1,0,1",step:10},{piece:"1,1,0,1",step:10},{piece:"0,1,1,1",step:10},{piece:"0,1,0,2",step:10},{piece:"0,2,0,1",step:10}];

dGame8x8.setDrawRule(rule64);

dGame8x8.start();

// dGame8x8.startFromFen("B:WK1:BK5,K18,K22")
// console.log(dGame8x8.boardDes())
console.time(`game`)

let search = new DSearch();
let depth = 5;
let mv = search.getBestMv(depth,dGame8x8);
while (mv.length>0) {
    let result = dGame8x8.makeMv(mv);
    if(result==false) break;
    dGame8x8.checkEnd();
    console.log(mv);
    console.log(dGame8x8.boardDes());
    if(dGame8x8.turn == C_BLACK) depth=7;
    else depth = 5;
    mv = search.getBestMv(depth,dGame8x8);
}
console.log(dGame8x8.generatePdnBook());

console.timeEnd(`game`);