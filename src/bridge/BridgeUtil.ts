
export namespace BridgeUtil {
    /**
     * 局况信息
     */
    export const  VUL_INFO = [
            [0,0],[1,0],[0,1],[1,1]
    ];

    /**
     * IMP 区间
     */
    export const IMP_MinMax = [
            [Number.MIN_VALUE,10],
            [20,40],[50,80],[90,120],[130,160],[170,210],[220,260],
            [270,310],[320,360],[370,420],[430,490],[500,590],[600,740],
            [750,890],[900,1090],[1100,1290],[1300,1490],[1500,1740],[1750,1990],
            [2000,2240],[2250,2490],[2500,2990],[3000,3490],[3500,3990],[4000,Number.MAX_VALUE],
    ];

    /**
     * 基本分差转IMP
     * @param diffScore 
     * @returns 
     */
    export const score2IMP = (diffScore:number):number=>{
        let left = 0, right = IMP_MinMax.length - 1;
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            if (diffScore >= IMP_MinMax[mid][0] && diffScore <= IMP_MinMax[mid][1]) {
                return mid;
            } else if (diffScore < IMP_MinMax[mid][0]) {
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        }
        return 0;
    }


    /**
     * 计算基本分
     * @param contract des. '1D','7NT' ...
     * @param multiple des. normal : 1 double: 2 twice double: 4
     * @param trickResult des. "=" , "+1" or "-3"
     * @param slide des. "NS" or "EW"
     * @param bd 第几副牌，从 1 开始
     * @returns 
     */
    export const calculateScore = (contract:string,multiple:number,trickResult:string,slide:string,bd:number):number=>{
        let score = 0;
        let value = parseInt(contract.substring(0,1))
        let trump = ["D","C","H","S","NT"].indexOf(contract.substring(1))
        let perScore = trump<2? 20: 30;
        let firstScore = trump==4?40:perScore;
        let trickScore = firstScore + perScore*(value-1)
        trickScore *= multiple

        let idxV = bd % 16 - 1;
        let vul = (idxV%4 + Math.floor(idxV/4))%4;
        let vulInfo = VUL_INFO[vul][["NS","EW"].indexOf(slide)];
        let trickWin = 0
        if(trickResult.substring(0,1)=="=") trickWin = 0
        else if(trickResult.substring(0,1)=="+") trickWin = parseInt(trickResult.substring(1))
        else if(trickResult.substring(0,1)=="-") trickWin = -parseInt(trickResult.substring(1))
        if(trickWin>=0){
            score += trickScore
            let complete = trickScore >= 100;
            let half = trickScore < 100;
            let minorSlam = complete&&value == 6;
            let grandSlam = complete&&value == 7;
            let score1 = multiple == 1 ? perScore*trickWin : 50*multiple*(1+vulInfo)*trickWin
            let score2 = half ? 50 : 0;
            let score3 = multiple>1 ? 25*multiple : 0
            let score4 = complete ? 300+200*vulInfo : 0
            let score5 = minorSlam ? 500+750*vulInfo : 0
            let score6 = grandSlam ? 1000+500*vulInfo : 0
            score += score1 + score2 + score3 + score4 + score5 + score6
        }else{
            let downScore = 0
            let doubleDown =
            [
                [
                    0   ,  100,  300,  500,  800, 1100, 1400, 1700,
                            2000, 2300, 2600, 2900, 3200, 3500
                ],
                [
                    0   ,  200,  500,  800, 1100, 1400, 1700, 2000,
                            2300, 2600, 2900, 3200, 3500, 3800
                ]
            ]
            if(1==multiple){
                downScore += 50*(1+vulInfo)*trickWin
            }else{
                downScore += -doubleDown[vulInfo][-trickWin]*(multiple/2)
            }
            score += downScore
        }
        return score
    }
}

// let score = BridgeUtil.calculateScore('3H',2,'+4','EW',2)

// console.log(score)