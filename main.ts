/**
 * 狀態機：0=等待，1=前進，2=轉彎
 */
// 前進：所有電機以反向速度運行指定時間（修復反轉問題）
function moveForward (duration: number) {
    // 反轉速度
    move(-200, -200, -200, 100)
    // 顯示前進圖標
    basic.showLeds(`
        . . # . .
        . # # # .
        # . # . #
        . . # . .
        . . # . .
        `)
    // 持續指定時間
    basic.pause(duration)
    // 停止
    stop()
}
// 左轉：M1和M4反轉，M2和M3正轉（原地左轉90度）
function turnLeft (duration: number) {
    // 手動插入速度值（可修改，例如-120, 120, -120, 120）
    move(0, -150, -150, -150)
    // 顯示左轉圖標
    basic.showLeds(`
        . . # . .
        . # . . .
        # # # # #
        . # . . .
        . . # . .
        `)
    // 持續指定時間
    basic.pause(duration)
    // 停止
    stop()
}
// 停止：所有電機速度設為0
function stop () {
    let STOP_SPEED = 0
    move(STOP_SPEED, STOP_SPEED, STOP_SPEED, STOP_SPEED)
    // 顯示停止圖標
    basic.showLeds(`
        . . . . .
        . . . . .
        . # # # .
        . . . . .
        . . . . .
        `)
    basic.clearScreen()
}
// 校準按鈕（用於調整轉彎時間）
input.onButtonPressed(Button.A, function () {
    TURN_DURATION += 50
    basic.showNumber(TURN_DURATION)
    basic.clearScreen()
})
// 右轉：M1和M4正轉，M2和M3反轉（原地右轉90度）
function turnRight (duration: number) {
    // 手動插入速度值（可修改，例如120, -120, 120, -120）
    move(-180, -180, 0, 200)
    // 顯示右轉圖標
    basic.showLeds(`
        . . # . .
        . . . # .
        # # # # #
        . . . # .
        . . # . .
        `)
    // 持續指定時間
    basic.pause(duration)
    // 停止
    stop()
}
input.onButtonPressed(Button.AB, function () {
    // 測試左轉
    turnLeft(TURN_DURATION)
    basic.pause(1000)
    // 測試右轉
    turnRight(TURN_DURATION)
})
input.onButtonPressed(Button.B, function () {
    TURN_DURATION = Math.max(100, TURN_DURATION - 50)
    basic.showNumber(TURN_DURATION)
    basic.clearScreen()
})
// 標籤連續檢測次數
// 通用移動函數：控制四個電機的速度
function move (m1Speed: number, m2Speed: number, m3Speed: number, m4Speed: number) {
    SuperBit.MotorRunDual(
    SuperBit.enMotors.M1,
    m1Speed,
    SuperBit.enMotors.M2,
    m2Speed
    )
    SuperBit.MotorRunDual(
    SuperBit.enMotors.M3,
    m3Speed,
    SuperBit.enMotors.M4,
    m4Speed
    )
}
// 顯示錯誤並停止
function showError () {
    // 顯示錯誤圖標（叉形）
    basic.showLeds(`
        # . . . #
        . # . # .
        . . # . .
        . # . # .
        # . . . #
        `)
    basic.clearScreen()
    stop()
}
let tagCount = 0
let state = 0
let TURN_DURATION = 0
// 電機速度常數（僅前進速度可調，其他速度在函數內手動插入）
// 前進速度（標籤1，建議範圍：50-200）
let FORWARD_SPEED = 150
// 停止速度
// 轉彎持續時間（毫秒，校準為90度原地旋轉，建議範圍：400-800）
TURN_DURATION = 900
// 前進持續時間（毫秒）
let FORWARD_DURATION = 500
// 主循環刷新間隔（毫秒）
let LOOP_INTERVAL = 1000
// 標籤連續檢測次數
let TAG_STABILITY_COUNT = 2
// 初始化
// 顯示"對勾"表示初始化成功
basic.showIcon(IconNames.Yes)
// 初始化Huskylens的I2C通信
huskylens.initI2c()
// 設置標籤名稱
huskylens.writeName(1, "Forward")
// 原地左轉90度
huskylens.writeName(2, "Turn Left")
// 原地右轉90度
huskylens.writeName(3, "Turn Right")
if (!(huskylens.initMode(protocolAlgorithm.OBJECTCLASSIFICATION))) {
    // 初始化失敗，顯示錯誤並停止
    showError()
    // 進入空循環，停止程序
    basic.forever(() => { });
}
// 連續檢測計數器
// 上次檢測的標籤ID
let lastTag = -1
// 上次檢測的標籤ID
// 主循環
basic.forever(function () {
    // 獲取Huskylens數據
    huskylens.request()
    // 狀態機邏輯
    if (state == 0) {
        let currentTag = huskylens.isAppear(1, HUSKYLENSResultType_t.HUSKYLENSResultBlock) ? 1 :
            huskylens.isAppear(2, HUSKYLENSResultType_t.HUSKYLENSResultBlock) ? 2 :
                huskylens.isAppear(3, HUSKYLENSResultType_t.HUSKYLENSResultBlock) ? 3 : -1;
// 檢查標籤穩定性
        if (currentTag == lastTag && currentTag != -1) {
            tagCount += 1
            if (tagCount >= TAG_STABILITY_COUNT) {
                // 穩定檢測到標籤，執行對應動作
                if (currentTag == 1) {
                    state = 1
                    // 前進1秒並停止
                    moveForward(FORWARD_DURATION)
                } else if (currentTag == 2) {
                    state = 2
                    // 原地左轉90度並停止
                    turnLeft(TURN_DURATION)
                } else if (currentTag == 3) {
                    state = 2
                    // 原地右轉90度並停止
                    turnRight(TURN_DURATION)
                }
                // 返回等待狀態
                state = 0
                // 重置計數器
                tagCount = 0
                // 重置標籤
                lastTag = -1
            }
        } else {
            // 新標籤，計數從1開始
            tagCount = 1
            lastTag = currentTag
            // 未穩定檢測，保持停止
            stop()
        }
    } else if (state == 1) {
        // 前進狀態在moveForward中完成，立即返回狀態0
        state = 0
    } else if (state == 2) {
        // 轉彎狀態在turnLeft或turnRight中完成，立即返回狀態0
        state = 0
    }
    // 限制刷新頻率為每秒一次
    basic.pause(LOOP_INTERVAL)
})
