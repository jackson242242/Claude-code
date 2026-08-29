#!/usr/bin/env python3
"""6 个月减脂塑形计划 — 每日卡片生成器。

对象：男 · 43 岁 · 178cm · 起始 230 lb · 有训练经验 · 每周健身房 3-4 次 / 每次 2 小时
目标：26 周内降到 203-206 lb（-24 ~ -27 lb），体脂下降、肩背练开、穿衣显瘦。

用法：
    python3 fitness/plan.py                  # 今天的卡片
    python3 fitness/plan.py --tomorrow       # 明天的卡片（前一晚预告用）
    python3 fitness/plan.py --date 2026-09-01
    python3 fitness/plan.py --week 5         # 整周概览
    python3 fitness/plan.py --render         # 生成 fitness/schedule/week-01..26.md
    python3 fitness/plan.py --selftest       # 校验 26 周每一天都能生成
"""

from __future__ import annotations

import argparse
import os
import sys
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

TZ = ZoneInfo("America/New_York")  # 所有「今天」按美东算，服务器跑在 UTC 也不会错天

# ---------------------------------------------------------------- 基础常量

START = date(2026, 8, 24)          # 第 1 周周一
TOTAL_WEEKS = 26
START_LB = 230
DELOAD_WEEKS = {8, 18}             # 强制减载 + 饮食休整（43 岁，恢复优先，不可跳）

WEEKDAY_CN = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]

# ---------------------------------------------------------------- 训练分块

BLOCKS = [
    dict(
        n=1, weeks=range(1, 5), name="重建基础",
        focus="把动作模式和关节找回来。重量保守，宁可轻也不要代偿——43 岁受伤一次要赔掉一个月。",
        main="3 组 × 8 次 @RPE 7（还能再做 3 次就停）",
        acc="3 组 × 10-12 次 @RPE 8",
        pump="2 组 × 15 次",
        rest="主项组间 150 秒 / 辅助 90 秒",
        steps=8000,
        cardio="低强度稳态 20 分钟（能完整说话的强度）",
    ),
    dict(
        n=2, weeks=range(5, 9), name="加容量",
        focus="总组数上调，肌肉开始有形状。第 8 周强制减载 + 吃到维持热量，让身体喘口气。",
        main="4 组 × 6-8 次 @RPE 8",
        acc="3-4 组 × 10 次 @RPE 8-9",
        pump="3 组 × 15 次",
        rest="主项组间 150-180 秒 / 辅助 75 秒",
        steps=9000,
        cardio="低强度稳态 25 分钟",
    ),
    dict(
        n=3, weeks=range(9, 14), name="上强度",
        focus="主项上重量保肌肉——减脂期最怕掉的是肌肉，重量是唯一的保险。",
        main="顶组 5-4-3 逐组加重，再回落 2 组 × 8（顶组重量的 85%）",
        acc="3 组 × 10 次 @RPE 9",
        pump="3 组 × 12-15 次",
        rest="主项组间 180 秒 / 辅助 75 秒",
        steps=10000,
        cardio="低强度稳态 25 分钟，或间歇 10 组（30 秒快 / 90 秒慢）",
    ),
    dict(
        n=4, weeks=range(14, 19), name="提密度",
        focus="缩短组间休息，同样的活干得更快，心肺和消耗一起上。第 18 周强制减载 + 饮食休整。",
        main="4 组 × 6 次 @RPE 8（组间只休 90 秒）",
        acc="超级组配对（A1/A2 连做），3 轮 × 10-12 次，轮间 60 秒",
        pump="3 组 × 20 次",
        rest="主项 90 秒 / 超级组轮间 60 秒",
        steps=11000,
        cardio="低强度稳态 25 分钟，或爬楼机 15 分钟",
    ),
    dict(
        n=5, weeks=range(19, 23), name="力量与线条",
        focus="主项回到大重量低次数保力量；肩中束和背阔加倍容量——这两块决定穿衬衫的 V 型。",
        main="3 组 × 5 次 @RPE 8-9（重）",
        acc="4 组 × 8-10 次",
        pump="3 组 × 15 次（肩/背的孤立动作做双倍组数）",
        rest="主项组间 180 秒 / 辅助 75 秒",
        steps=11000,
        cardio="低强度稳态 30 分钟",
    ),
    dict(
        n=6, weeks=range(23, 27), name="收官定型",
        focus="力量维持不再追求 PR，泵感和有氧拉满，把最后几磅刮掉。第 26 周拍照 + 过渡到维持期。",
        main="4 组 × 5 次 @RPE 8（维持，不冲极限）",
        acc="3 组 × 12 次",
        pump="4 组 × 15-20 次",
        rest="主项 150 秒 / 辅助 60 秒",
        steps=12000,
        cardio="低强度稳态 30 分钟 + 每周六一次 60-90 分钟长走/骑行",
    ),
]

DELOAD_OVERRIDE = dict(
    main="2 组 × 8 次 @平时重量的 55-60%",
    acc="2 组 × 10 次，轻",
    pump="2 组 × 15 次",
    rest="随意，不追求泵感也不追求力竭",
    cardio="有氧减半（10-15 分钟散步即可）",
)

# ---------------------------------------------------------------- 营养分期

NUTRITION_PHASES = [
    dict(weeks=range(1, 8),   name="减脂 I",   train=2450, rest=2100, protein=185, fat=80,
         note="起始缺口 500 kcal/天。第 1 周会掉 3-4 磅，其中一半是水和糖原——正常，别高兴太早也别怀疑。"),
    dict(weeks=range(8, 9),   name="饮食休整", train=2750, rest=2750, protein=180, fat=85,
         note="整周吃到维持热量。目的不是放纵，是让瘦素/甲状腺/训练状态回位。体重会涨 1-2 磅（水），下周掉回来。"),
    dict(weeks=range(9, 18),  name="减脂 II",  train=2400, rest=2030, protein=180, fat=75,
         note="体重降了，热量随之下调。这是最容易松懈的阶段——靠流程不靠意志力。"),
    dict(weeks=range(18, 19), name="饮食休整", train=2700, rest=2700, protein=180, fat=80,
         note="第二次整周维持热量。同上，别把它当作破戒周。"),
    dict(weeks=range(19, 27), name="减脂 III", train=2350, rest=1980, protein=180, fat=70,
         note="最后阶段。蛋白不降、重量不降，降的只有碳水和脂肪。饿是正常的，用蔬菜和水撑体积。"),
]

# ---------------------------------------------------------------- 月度里程碑

MILESTONES = [
    dict(m=1, weeks=range(1, 5),   lb="223-225 lb", waist="-2.5 ~ -3.5 cm",
         win="裤腰第一次松，晨起不那么沉。动作模式回来了，深蹲不再别扭。"),
    dict(m=2, weeks=range(5, 10),  lb="218-220 lb", waist="-5 ~ -6 cm",
         win="脸和下颌线开始出来（第一个别人能看出来的变化）。衬衫肩部变紧、腰部变松。"),
    dict(m=3, weeks=range(10, 14), lb="214-216 lb", waist="-7 ~ -8 cm",
         win="上胸和肩中束有轮廓。旧衬衫扣得上了，可能需要换小一码的裤子。"),
    dict(m=4, weeks=range(14, 19), lb="210-212 lb", waist="-9 ~ -10 cm",
         win="背阔练开，V 型初现——这是「穿衣好看」的真正来源。手臂开始有分离度。"),
    dict(m=5, weeks=range(19, 23), lb="207-209 lb", waist="-11 ~ -12 cm",
         win="腹部上半段隐约有形。静息心率明显下降，爬楼不喘。"),
    dict(m=6, weeks=range(23, 27), lb="203-206 lb", waist="-12 ~ -14 cm",
         win="整体紧致（tone）达成：肩宽腰细、衣服挂得住。26 周拍对比照，然后转入维持期。"),
]

# ---------------------------------------------------------------- 动作菜单（四天全覆盖）
# 每个槽位给多个等效选择：器械被占、吃腻了、关节不舒服，就地换一个同槽位动作即可。
# 规则：同一槽位内互换不影响计划；★ = 43 岁关节更友好的选项。

LEG_MENU = [
    ("蹲类（股四头主导）", [
        "杠铃深蹲（高杠）",
        "箱蹲 ★（控制深度，膝友好）",
        "前蹲（躯干更直立，腰友好）",
        "颈前壶铃/高脚杯深蹲 ★（最容易做标准）",
        "史密斯机深蹲（固定轨迹，疲劳时更安全）",
        "哈克深蹲机 / V-squat",
    ]),
    ("铰链类（髋/后链主导）", [
        "六角杠硬拉 ★（下背压力最小的硬拉）",
        "罗马尼亚硬拉 RDL",
        "架上拉 rack pull ★（幅度小，下背敏感时用）",
        "杠铃臀推 hip thrust ★",
        "壶铃摆动 kettlebell swing（轻重量高次数，兼有氧）",
        "45° 背屈伸（负重）",
    ]),
    ("单腿类", [
        "保加利亚分腿蹲",
        "反向箭步蹲 ★（比前跨膝盖压力小）",
        "行走箭步蹲",
        "登台阶 step-up ★（选膝盖高度的箱）",
        "单腿腿举",
        "滑盘/滑轮后撤腿 reverse slider lunge",
    ]),
    ("腿弯举（腘绳肌孤立）", [
        "坐姿腿弯举（拉伸位更足，优先）",
        "俯卧腿弯举",
        "北欧腿弯举 Nordic curl（离心，进阶）",
        "健身球/滑盘腿弯举（家里也能做）",
    ]),
    ("腿举/腿屈伸（股四头补充）", [
        "腿举 leg press（脚位高偏臀腘、脚位低偏股四头）",
        "腿屈伸 leg extension（轻重量、顶峰停 1 秒）",
        "西西里深蹲/靠墙静蹲 ★（膝盖养护兼塑形）",
    ]),
    ("小腿", [
        "站姿提踵（直腿，练腓肠肌）",
        "坐姿提踵（屈膝，练比目鱼肌）",
        "腿举机上提踵",
        "单腿哑铃提踵（补两侧不平衡）",
    ]),
]

PUSH_MENU = [
    ("水平推（胸主力）", [
        "杠铃卧推",
        "哑铃卧推 ★（轨迹自由，肩前侧友好）",
        "器械推胸 ★（疲劳时最安全）",
        "史密斯卧推",
        "负重俯卧撑（家里/器械全占时）",
    ]),
    ("上斜推（上胸——T 恤形状的关键）", [
        "上斜哑铃卧推（30 度）",
        "上斜杠铃卧推",
        "上斜史密斯",
        "器械上斜推",
        "低位绳索上斜飞鸟（孤立收尾用）",
    ]),
    ("肩推（垂直推）", [
        "站姿杠铃肩推",
        "坐姿哑铃肩推 ★（腰零压力）",
        "器械肩推 ★",
        "地雷管单臂推 landmine press ★（肩活动度差的首选）",
    ]),
    ("夹胸/飞鸟（孤立胸）", [
        "绳索夹胸（低位/中位）",
        "蝴蝶机 pec-deck",
        "哑铃飞鸟（平板/上斜，轻重量）",
    ]),
    ("侧平举（肩中束——肩宽的来源）", [
        "哑铃侧平举",
        "绳索侧平举（全程有张力，优先）",
        "器械侧平举",
        "哑铃前平举+侧平举交替（前束弱才加）",
    ]),
    ("三头", [
        "绳索下压（直杆/绳索）",
        "绳索过顶三头伸（长头拉伸位）",
        "窄距卧推",
        "仰卧杠铃臂屈伸 skull crusher",
    ]),
]

PULL_MENU = [
    ("垂直拉（背阔宽度——V 型的一半）", [
        "引体向上（加重/自重/辅助带）",
        "高位下拉（宽握/中握）",
        "中立握引体 ★（肘肩最顺的握法）",
        "绳索直臂下压（孤立背阔，感受差时先做它找感觉）",
    ]),
    ("水平划船（背厚度）", [
        "杠铃划船",
        "T 杠划船",
        "胸支撑划船 ★（下背零压力，晚间疲劳时优先）",
        "单臂哑铃划船",
        "坐姿绳索划船（V 柄）",
    ]),
    ("背阔孤立（找发力感/收尾）", [
        "绳索直臂下压",
        "绳索仰卧上拉 pullover",
        "单臂绳索下拉（补两侧不平衡）",
    ]),
    ("后束/上背（体态——穿衣挺拔的关键）", [
        "面拉 Face Pull（默认必做，治含胸）",
        "俯身哑铃反向飞鸟",
        "绳索反向飞鸟（交叉）",
        "器械反向飞鸟 pec-deck 反向",
    ]),
    ("二头收尾", [
        "锤式弯举（肱肌，撑围度）",
        "哑铃交替弯举",
        "杠铃/曲杆弯举",
        "斜托弯举（底部拉伸位）",
        "绳索弯举（全程张力）；21 响礼炮（泵感周用）",
    ]),
]

LEG_RULE = ("换法：主项从蹲类+铰链类各选 1 个；辅助从单腿+腿弯举+腿举/屈伸各选 1 个；"
            "小腿收尾。同一个动作连用 4 周（一个分块）再换，天天换练不出进步。")
PUSH_RULE = ("换法：主项从水平推+肩推各选 1 个；辅助从上斜推+夹胸+侧平举各选 1 个；"
             "三头选 2 个收尾。明天是拉日：今天不碰任何背部动作。同一个动作连用 4 周（一个分块）再换。")
PULL_RULE = ("换法：主项从垂直拉+水平划船各选 1 个；辅助从划船第二动作+背阔孤立+后束各选 1 个"
             "（面拉尽量保留，它是体态动作）；二头选 2 个收尾。昨天是推日：今天不碰卧推/肩推/三头。"
             "同一个动作连用 4 周再换。")

SESSION_MENUS = {
    "A": ("腿部动作菜单", LEG_MENU, LEG_RULE),
    "C": ("腿部动作菜单", LEG_MENU, LEG_RULE),
    "B": ("推日动作菜单（纯推）", PUSH_MENU, PUSH_RULE),
    "D": ("拉日动作菜单（纯拉）", PULL_MENU, PULL_RULE),
}

# ---------------------------------------------------------------- 训练课表

SESSIONS = {
    "A": dict(
        title="下肢 A · 股四头主导",
        main=[
            ("杠铃深蹲 Back Squat", "膝盖不软塌；蹲到大腿平行即可，不追求极限深度"),
            ("罗马尼亚硬拉 RDL", "杠贴腿走，腰背中立，感觉在腘绳肌不在下背"),
        ],
        acc=[
            ("保加利亚分腿蹲（每侧）", "手扶哑铃，前脚掌吃力，膝盖对准脚尖"),
            ("腿举 Leg Press", "不要锁死膝关节，下放到臀部即将离垫为止"),
            ("坐姿腿弯举", "顶峰收缩停 1 秒"),
        ],
        pump=[("站姿提踵", "全幅度，底部拉伸 1 秒"), ("悬垂举腿 / 卷腹", "不甩腿，腹肌发力")],
        cardio="跑步机坡度走：坡度 10-15%、速度 4.8-5.5 km/h（能说话但不能唱歌）",
        swap="膝盖不适 → 深蹲换箱蹲或腿举；髋不适 → RDL 换坐姿腿弯举 + 臀桥",
    ),
    "B": dict(
        title="上肢 · 纯推（胸/肩/三头）",
        main=[
            ("杠铃卧推 Bench Press", "肩胛收紧下沉，杠落乳头线，手肘约 45 度"),
            ("站姿杠铃肩推 / 坐姿哑铃肩推", "夹臀绷腹别用腰顶；肩不适选坐姿哑铃版"),
        ],
        acc=[
            ("上斜哑铃卧推", "30 度上斜，练上胸——这块决定 T 恤的形状"),
            ("绳索夹胸 / 蝴蝶机", "顶端停 1 秒，练中缝和拉伸位"),
            ("哑铃侧平举", "小重量高次数，肘略高于腕，别耸肩"),
        ],
        pump=[("绳索三头下压", "肘固定在体侧"), ("绳索过顶三头伸", "长头拉伸位，充分下放")],
        cardio="动感单车间歇 8 组（40 秒冲 / 80 秒缓），或坡度走 15 分钟",
        swap="肩前侧不适 → 杠铃卧推换哑铃卧推或器械推胸；明天是拉日，今天不做任何背部动作",
    ),
    "C": dict(
        title="下肢 B · 后链主导",
        main=[
            ("硬拉 Deadlift（六角杠 trap bar 优先）", "六角杠对下背更友好，43 岁首选；起杠先绷腹再拉"),
            ("前蹲 / 高杠箱蹲", "躯干更直立，膝友好；箱蹲控制下放不砸箱"),
        ],
        acc=[
            ("杠铃臀推 Hip Thrust", "顶端夹臀停 1 秒，肋骨别外翻"),
            ("坐姿腿弯举", "顶峰收缩"),
            ("腿屈伸", "轻重量，膝关节热身兼塑形"),
        ],
        pump=[("农夫行走 Farmer's Carry", "两手重哑铃走 40 米 × 3 趟，练握力和核心"),
              ("侧平板支撑（每侧）", "30-45 秒")],
        cardio="椭圆机或爬楼机 20 分钟",
        swap="下背敏感 → 硬拉换臀推 + 坐姿腿弯举；改用架上拉（rack pull）降低幅度",
    ),
    "D": dict(
        title="上肢 · 纯拉（背/后束/二头）",
        main=[
            ("引体向上（加重或辅助）", "做不满就用辅助带/器械，宁可标准也不要甩"),
            ("杠铃划船 / T 杠划船", "躯干约 45 度，拉向肚脐——背的厚度全靠划船"),
        ],
        acc=[
            ("胸支撑划船 / 单臂哑铃划船", "昨天刚推完，选下背零压力的版本"),
            ("绳索直臂下压", "孤立背阔，找不到背发力感就先做它"),
            ("面拉 Face Pull", "拉到脸侧，外旋肩——对付含胸驼背，穿衣挺拔全靠它"),
        ],
        pump=[("锤式弯举", "中立握，练肱肌撑手臂围度"), ("哑铃/绳索弯举", "慢放 2 秒，不摆身体")],
        cardio="爬楼机 15 分钟 + 雪橇推/战绳 5 组收尾（没有就快走 20 分钟）",
        swap="握力先没劲 → 用助力带；昨天是推日，今天不做卧推/肩推/三头",
    ),
}

# 一周排布（2026-08-28 起）：周二/四/五晚 + 周六早，周日整天不进健身房
# 周二 A(下肢·股四头) · 周四 B(纯推) · 周五 D(纯拉) · 周六 C(下肢·后链)
# 周四推/周五拉连续两天，故 B 不含背、D 不含推，互不抢恢复；下肢隔 3-4 天
WEEK_MAP = {
    0: ("rest", None),
    1: ("gym", "A"),
    2: ("rest", None),
    3: ("gym", "B"),
    4: ("gym", "D"),
    5: ("gym", "C"),
    6: ("log", None),
}

# 每个训练日的固定时段（写进日历的就是这些）
SESSION_TIME = {1: "19:30-21:30", 3: "19:30-21:30", 4: "19:30-21:30", 5: "09:00-11:00"}
LOG_WEEKDAY = 6          # 周日上午 10:00-11:30 复盘 + 称重量围 + 备餐
LATE_WEEKDAYS = {1, 3, 4}  # 晚间训练日，有氧要前置以免影响睡眠

SESSION_STRUCTURE = [
    ("0-10 分钟", "有氧热身 + 动态活动度（快走/单车 5 分钟 + 髋绕环、胸椎旋转、肩绕环）"),
    ("10-15 分钟", "激活：臀桥 2×15、死虫 2×10、弹力带面拉 2×15"),
    ("15-75 分钟", "主项 + 辅助（下方动作表）"),
    ("75-95 分钟", "孤立/泵感动作"),
    ("95-115 分钟", "有氧（下方指定）"),
    ("115-120 分钟", "拉伸 5 分钟：髋屈肌、腘绳肌、胸小肌各 2 组 × 30 秒"),
]

# ---------------------------------------------------------------- 餐单

BREAKFASTS = [
    dict(name="牛油果炒蛋吐司", kcal=480, p=34,
         items="全蛋 3 个 + 蛋白 2 个炒蛋 · 全麦吐司 1 片 · 牛油果 1/2 个 · 黑咖啡",
         swap="鸡蛋→100g 火鸡胸/2 个蛋+30g 乳清；吐司→燕麦 40g 或全麦馒头 1 个；牛油果→杏仁 15g 或花生酱 15g"),
    dict(name="希腊酸奶碗", kcal=470, p=38,
         items="无糖希腊酸奶 200g + 乳清蛋白 1/2 勺 · 蓝莓 100g · 燕麦 30g · 杏仁 12g",
         swap="希腊酸奶→无糖 skyr 或低脂白干酪 200g；蓝莓→任意浆果/半个苹果；杏仁→核桃 12g"),
    dict(name="蛋白燕麦粥", kcal=490, p=36,
         items="燕麦 55g 煮 · 乳清蛋白 1 勺（煮好后拌入）· 香蕉 1 根 · 肉桂",
         swap="燕麦→小米粥 250g 或全麦面包 2 片；乳清→鸡蛋 3 个；香蕉→苹果/橙子"),
    dict(name="中式快手早餐", kcal=455, p=33,
         items="水煮蛋 2 个 · 无糖豆浆 400ml · 全麦馒头 1 个 · 凉拌黄瓜",
         swap="豆浆→无糖牛奶 300ml；馒头→杂粮粥 250g；加 100g 鸡胸提蛋白到 55g"),
]

LUNCHES = [
    dict(name="鸡胸米饭菜", kcal=680, p=58,
         items="鸡胸 200g（烤/煎，少油）· 熟米饭 150g · 西兰花 250g · 橄榄油 1 茶匙",
         swap="鸡胸→火鸡胸 200g / 瘦牛肉 180g / 虾 260g / 老豆腐 400g；米饭→红薯 200g / 土豆 250g / 意面 45g 干"),
    dict(name="瘦牛肉红薯沙拉", kcal=700, p=56,
         items="瘦牛排/牛腱 180g · 红薯 200g · 大份沙拉（生菜番茄黄瓜）· 醋+柠檬调味",
         swap="牛肉→猪里脊 210g / 三文鱼 170g；沙拉酱一律换成醋/柠檬/辣酱（省 150-250 kcal）"),
    dict(name="三文鱼藜麦", kcal=690, p=50,
         items="三文鱼 170g · 熟藜麦 150g · 芦笋/四季豆 200g · 柠檬",
         swap="三文鱼→鳕鱼 220g（更瘦，可多加半份碳水）/ 鸡腿去皮 200g；藜麦→糙米 150g"),
    dict(name="中式家常两菜一饭", kcal=670, p=55,
         items="蒜蓉虾仁 220g · 番茄炒蛋（蛋 2 个）· 清炒时蔬 250g · 米饭 130g",
         swap="虾仁→鸡胸 180g / 鱼片 200g；控油关键：炒菜每道 1 茶匙油封顶，用不粘锅"),
    dict(name="外食：Chipotle 式沙拉碗", kcal=690, p=60,
         items="双份鸡肉 · 半份糙米 · 黑豆 · 生菜双份 · 莎莎酱（fajita 蔬菜随意）· 不要奶酪/酸奶油/tortilla",
         swap="Subway：30cm 烤鸡全麦、双份肉、免奶酪美乃滋、蔬菜加满、配苹果不配薯片；"
              "日料：刺身定食 / 鸡肉照烧饭（饭吃一半、酱另上）；"
              "中餐外食：清蒸鱼 + 白灼菜 + 半碗饭，避开糖醋红烧干锅"),
]

DINNERS = [
    dict(name="牛肉番茄意面", kcal=650, p=52,
         items="瘦牛肉末 200g（脂肪≤7%）· 意面 70g 干 · 番茄基底酱 · 蔬菜 200g",
         swap="牛肉末→鸡胸肉末/火鸡肉末 200g；意面→米饭 150g / 全麦面包 2 片；番茄酱选无糖款"),
    dict(name="烤鸡腿配土豆", kcal=660, p=50,
         items="去皮鸡腿肉 220g（烤）· 土豆 250g（烤/蒸，不炸）· 蒸时蔬 250g",
         swap="鸡腿→鸡胸 190g（更瘦，可加 1 茶匙油）；土豆→红薯 200g / 米饭 130g"),
    dict(name="清蒸白鱼菠菜饭", kcal=620, p=52,
         items="鳕鱼/鲈鱼 230g（清蒸）· 米饭 120g · 蒜炒菠菜 300g",
         swap="白鱼→虾 260g / 鸡胸 180g；蒜炒改水煮+1 茶匙香油拌"),
    dict(name="豆腐虾仁荞麦面（轻食日）", kcal=600, p=48,
         items="老豆腐 250g · 虾仁 150g · 荞麦面 60g 干 · 大量青菜 · 清汤",
         swap="荞麦面→乌冬 150g 熟 / 米粉 60g 干；豆腐→鸡蛋 3 个"),
    dict(name="外食：烤肉/火锅版", kcal=700, p=58,
         items="烤肉：瘦牛舌/牛里脊/鸡腿 300g + 大量烤蔬菜 + 白饭半碗，蘸盐或柠檬不蘸甜酱。"
               "火锅：清汤锅，涮牛肉/虾/鱼片/豆腐/绿叶菜，蘸料用醋+蒜+少量酱油（不要麻酱/沙茶）",
         swap="麻酱一勺≈130 kcal，沙茶酱一勺≈120 kcal——换成醋碟直接省下一顿宵夜的热量；"
              "酒：每周≤2 次、每次≤2 份，选烈酒+苏打水/干红，当天碳水扣掉一半"),
]

SNACKS = [
    dict(name="乳清 + 苹果", kcal=250, p=28, items="乳清蛋白 1 勺 + 苹果 1 个",
         swap="乳清→希腊酸奶 170g；苹果→橙子/梨/浆果 150g"),
    dict(name="毛豆 + 酸奶", kcal=260, p=26, items="带荚毛豆 200g + 无糖希腊酸奶 150g",
         swap="毛豆→鹰嘴豆 100g；酸奶→低脂白干酪 150g"),
    dict(name="芝士 + 坚果", kcal=250, p=20, items="低脂芝士条 2 根 + 杏仁 15g",
         swap="芝士→鸡蛋 2 个；坚果 15g 封顶（这是最容易失控的食物，先数好再吃）"),
    dict(name="蛋白棒 + 黑咖", kcal=240, p=22, items="蛋白棒 1 根（<220 kcal / >20g 蛋白）+ 黑咖啡",
         swap="蛋白棒→即食鸡胸 120g；应急用，不要天天吃"),
]

POST_WORKOUT = "训练后 30-60 分钟内：乳清蛋白 30g + 香蕉 1 根（约 220 kcal / 26g 蛋白）。若训练紧接正餐，直接吃正餐即可，不必额外补。"

# ---------------------------------------------------------------- 查询函数


def week_of(d: date) -> int:
    return (d - START).days // 7 + 1


def block_of(week: int) -> dict:
    for b in BLOCKS:
        if week in b["weeks"]:
            return b
    raise ValueError(f"第 {week} 周超出 26 周计划范围")


def nutrition_of(week: int) -> dict:
    for p in NUTRITION_PHASES:
        if week in p["weeks"]:
            return p
    raise ValueError(f"第 {week} 周超出营养分期")


def milestone_of(week: int) -> dict:
    for m in MILESTONES:
        if week in m["weeks"]:
            return m
    raise ValueError(f"第 {week} 周超出里程碑范围")


def scheme_of(week: int) -> dict:
    """返回本周的组数次数方案，减载周覆盖。"""
    b = block_of(week)
    s = dict(main=b["main"], acc=b["acc"], pump=b["pump"], rest=b["rest"], cardio=b["cardio"])
    if week in DELOAD_WEEKS:
        s.update(DELOAD_OVERRIDE)
    return s


def day_kind(d: date):
    return WEEK_MAP[d.weekday()]


def kcal_of(d: date):
    """返回 (当日热量, 蛋白 g, 脂肪 g, 碳水 g, 标签)。"""
    week = week_of(d)
    n = nutrition_of(week)
    kind, _ = day_kind(d)
    is_train = kind == "gym"
    kcal = n["train"] if is_train else n["rest"]
    protein, fat = n["protein"], n["fat"]
    carbs = max(0, round((kcal - protein * 4 - fat * 9) / 4))
    label = "训练日 / 高碳" if is_train else "休息日 / 低碳"
    if n["name"] == "饮食休整":
        label = "饮食休整周 / 吃到维持热量"
    return kcal, protein, fat, carbs, label


def menu_of(d: date):
    """按日期确定性轮换餐单，保证有变化又可复现。"""
    i = (d - START).days
    return (
        BREAKFASTS[i % len(BREAKFASTS)],
        LUNCHES[i % len(LUNCHES)],
        DINNERS[(i + 2) % len(DINNERS)],
        SNACKS[i % len(SNACKS)],
    )

# ---------------------------------------------------------------- 渲染


def render_workout(d: date) -> str:
    week = week_of(d)
    kind, code = day_kind(d)
    s = scheme_of(week)
    out = []

    if kind == "rest":
        out.append("### 今天不练 · 主动休息")
        out.append("- 走路 30-45 分钟（凑当日步数），或做 10 分钟拉伸/泡沫轴")
        out.append("- 训练日之间的恢复日就是长肌肉的日子，别偷偷加练")
        return "\n".join(out)

    if kind == "active":
        out.append("### 今天不进健身房 · 主动恢复")
        out.append("- 60-90 分钟户外快走 / 骑行 / 打球，强度能聊天为准（周五，为周末两练留恢复）")
        out.append("- 全身拉伸 10 分钟，重点髋屈肌和胸小肌（久坐的两个死穴）")
        out.append("- 这天的热量按休息日算，但如果活动量特别大可以加 150 kcal 碳水")
        return "\n".join(out)

    if kind == "log":
        out.append("### 今天不进健身房 · 复盘 + 备餐日（上午 10:00-11:30）")
        out.append("- **晨起空腹称重**，算最近 7 天均值，和上周均值比，按下方校准规则决定加减热量")
        out.append("- **每 4 周量一次**：腰围（肚脐水平、呼气末、不收腹）、胸围、臂围、大腿围")
        out.append("- **每 4 周拍一次**：正面/侧面/背面，同一位置同一光线同一条裤子")
        out.append("- 备餐 90 分钟：烤 1kg 鸡胸、蒸 1kg 米饭或红薯、洗切 1kg 蔬菜、水煮 12 个蛋、分装 4 份坚果")
        out.append("- 下午自由：走路凑步数即可——本周 4 练（二/四/五/六）已经完成，别加练")
        return "\n".join(out)

    sess = SESSIONS[code]
    slot = SESSION_TIME.get(d.weekday(), "")
    out.append(f"### 训练 {code} · {sess['title']} · {slot} · 约 2 小时")
    if d.weekday() in LATE_WEEKDAYS:
        out.append("> 🌙 **晚间训练日**：有氧提到热身之后立刻做 10 分钟，力量部分做完就走，"
                   "争取 21:30 前离开健身房——练太晚会推迟入睡，而睡眠是这个计划里最不能省的一环。"
                   "省下的有氧挪到周一/周三的走路里补。")
    if week in DELOAD_WEEKS:
        out.append("> ⚠️ **本周是强制减载周**：重量降到平时的 55-60%，绝不力竭。43 岁的恢复窗口比 25 岁窄，"
                   "这一周省下来的是后面 4 周的进步。")
    out.append("")
    out.append("**时间结构**")
    for span, what in SESSION_STRUCTURE:
        out.append(f"- {span}｜{what}")
    out.append("")
    out.append(f"**主项** — {s['main']}")
    for i, (name, cue) in enumerate(sess["main"], 1):
        out.append(f"{i}. {name}　·　{cue}")
    out.append("")
    out.append(f"**辅助** — {s['acc']}")
    for name, cue in sess["acc"]:
        out.append(f"- {name}　·　{cue}")
    out.append("")
    out.append(f"**孤立/泵感** — {s['pump']}")
    for name, cue in sess["pump"]:
        out.append(f"- {name}　·　{cue}")
    out.append("")
    out.append(f"**有氧** — {s['cardio']}")
    out.append(f"　{sess['cardio']}")
    out.append("")
    out.append(f"**组间休息** — {s['rest']}")
    out.append(f"**替代动作** — {sess['swap']}")
    out.append("")
    title, menu, rule = SESSION_MENUS[code]
    out.append(f"**{title}（同槽位任选互换，★ = 关节更友好）**")
    for slot, moves in menu:
        out.append(f"- {slot}：{'；'.join(moves)}")
    out.append(f"　{rule}")
    out.append("")
    out.append("**加重规则（双递增）**：某个动作所有组都做到次数区间上限且 RPE ≤8，下次上肢 +2.5kg、下肢 +5kg，"
               "次数回到区间下限重新爬。做不到就保持重量，不要为了加重牺牲动作。")
    return "\n".join(out)


def render_meals(d: date) -> str:
    kcal, p, f, c, label = kcal_of(d)
    kind, _ = day_kind(d)
    b, l, dn, sn = menu_of(d)
    out = [f"### 今天吃什么 · {kcal} kcal｜蛋白 {p}g｜脂肪 {f}g｜碳水 {c}g　— {label}", ""]

    if kind != "gym" and nutrition_of(week_of(d))["name"] != "饮食休整":
        out.append("> 休息日执行方式：下面每餐标的是**训练日份量**。休息日 **蛋白一克不减，只砍碳水**——"
                   "主食减 1/3（米饭 150g→100g、吐司 2 片→1 片、燕麦 55g→35g），蔬菜加倍补体积，"
                   "扣完正好落在今天的目标热量上。")
        out.append("")

    for tag, m in (("早餐", b), ("午餐", l), ("晚餐", dn), ("加餐", sn)):
        out.append(f"**{tag}｜{m['name']}** — 约 {m['kcal']} kcal / 蛋白 {m['p']}g")
        out.append(f"　{m['items']}")
        out.append(f"　*代替品：{m['swap']}*")
        out.append("")

    if kind == "gym":
        out.append(f"**训练后**　{POST_WORKOUT}")
        out.append("")

    out.append("**三条底线（比餐单更重要）**")
    out.append("1. **不喝任何有热量的饮料** — 果汁、奶茶、可乐、加糖咖啡。这一条单独就值 200-400 kcal/天。")
    out.append("2. **每餐先吃蛋白和蔬菜，最后吃主食** — 同样的食物，饱腹感差一倍。")
    out.append("3. **酱料另上** — 沙拉酱/麻酱/沙茶/蛋黄酱一勺就 100-150 kcal，换成醋、柠檬、辣酱、蒜蓉、酱油。")
    return "\n".join(out)


def render_day(d: date) -> str:
    if d < START:
        return f"计划从 {START} 开始，还有 {(START - d).days} 天。这几天可以先做两件事：买一个体重秤和一卷软尺；把冰箱里的含糖饮料清掉。"
    week = week_of(d)
    if week > TOTAL_WEEKS:
        return "26 周计划已经走完了。跑 `python3 fitness/plan.py --week 26` 看收官周的维持期过渡说明。"

    blk = block_of(week)
    ms = milestone_of(week)
    nut = nutrition_of(week)
    day_in_plan = (d - START).days + 1

    out = [
        f"# 第 {week}/26 周 · {WEEKDAY_CN[d.weekday()]} · {d.isoformat()}（第 {day_in_plan}/182 天）",
        "",
        f"**分块 {blk['n']}｜{blk['name']}** — {blk['focus']}",
        f"**第 {ms['m']} 个月目标**：{ms['lb']}　·　腰围 {ms['waist']}",
        f"**营养分期**：{nut['name']} — {nut['note']}",
        "",
        render_workout(d),
        "",
        render_meals(d),
        "",
        "### 今天的 4 件小事",
        f"- 步数 **{blk['steps']:,}**（走路是减脂里最被低估的一环，比多做一组有氧管用）",
        "- 水 **3.5 L**",
        "- 睡 **7-8 小时**（43 岁，睡不够直接掉训练表现和意志力，这不是鸡汤是激素）",
        "- 晨起空腹称重记一笔（只看 7 日均值）",
        "",
        "### 每周自动校准",
        "周日算最近 7 天体重均值，和上周均值比：",
        "- 掉 **0.7-1.0 kg**（1.5-2.2 磅）→ 完美，什么都别改",
        "- 掉 **< 0.35 kg**（0.8 磅）连续两周 → 每天减 150 kcal（从碳水扣），或步数 +1500",
        "- 掉 **> 1.1 kg**（2.4 磅）连续两周 → 每天加 150 kcal（掉太快会掉肌肉，43 岁尤其）",
    ]
    return "\n".join(out)


def render_week(week: int) -> str:
    if not 1 <= week <= TOTAL_WEEKS:
        return f"周数需在 1-26 之间，收到 {week}"
    blk = block_of(week)
    nut = nutrition_of(week)
    ms = milestone_of(week)
    mon = START + timedelta(days=(week - 1) * 7)
    out = [
        f"# 第 {week}/26 周　{mon.isoformat()} → {(mon + timedelta(days=6)).isoformat()}",
        "",
        f"- **分块 {blk['n']}｜{blk['name']}**：{blk['focus']}",
        f"- **营养**：{nut['name']}　训练日 {nut['train']} kcal / 休息日 {nut['rest']} kcal　·　"
        f"蛋白 {nut['protein']}g / 脂肪 {nut['fat']}g",
        f"- **步数**：{blk['steps']:,}/天　·　**第 {ms['m']} 月目标**：{ms['lb']}（腰围 {ms['waist']}）",
    ]
    if week in DELOAD_WEEKS:
        out.append("- ⚠️ **减载 + 饮食休整周**：重量 55-60%，热量吃到维持。不许跳过。")
    out.append("")
    out.append("| 日期 | 星期 | 内容 | 热量 |")
    out.append("| --- | --- | --- | --- |")
    for i in range(7):
        d = mon + timedelta(days=i)
        kind, code = day_kind(d)
        if kind == "gym":
            slot = SESSION_TIME.get(i, "")
            what = f"{slot}　训练 {code} · {SESSIONS[code]['title']}"
        elif kind == "active":
            what = "主动恢复（60-90 分钟快走/骑行）"
        elif kind == "log":
            what = "复盘 · 称重量围 · 备餐"
        else:
            what = "休息（走路 30 分钟）"
        kcal = kcal_of(d)[0]
        out.append(f"| {d.isoformat()} | {WEEKDAY_CN[i]} | {what} | {kcal} kcal |")
    out.append("")
    out.append("每天的完整卡片（含动作组数、餐单、代替品）：`python3 fitness/plan.py --date YYYY-MM-DD`")
    return "\n".join(out)


def render_all(root: str) -> int:
    outdir = os.path.join(root, "schedule")
    os.makedirs(outdir, exist_ok=True)
    for w in range(1, TOTAL_WEEKS + 1):
        with open(os.path.join(outdir, f"week-{w:02d}.md"), "w", encoding="utf-8") as fh:
            fh.write(render_week(w) + "\n")
    return TOTAL_WEEKS


def selftest() -> int:
    bad = []
    for i in range(TOTAL_WEEKS * 7):
        d = START + timedelta(days=i)
        try:
            text = render_day(d)
            assert "今天" in text, d
            assert kcal_of(d)[0] > 1500, d
        except Exception as exc:  # noqa: BLE001 — 自检就是要抓所有异常
            bad.append((d, exc))
    for w in range(1, TOTAL_WEEKS + 1):
        try:
            render_week(w)
        except Exception as exc:  # noqa: BLE001
            bad.append((f"week {w}", exc))
    if bad:
        for k, exc in bad:
            print(f"FAIL {k}: {exc}", file=sys.stderr)
        return 1
    print(f"OK — {TOTAL_WEEKS * 7} 天 + {TOTAL_WEEKS} 周全部生成通过")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description="6 个月减脂塑形计划 — 每日卡片生成器")
    ap.add_argument("--date", help="YYYY-MM-DD，默认今天")
    ap.add_argument("--tomorrow", action="store_true", help="明天的卡片（前一晚预告用）")
    ap.add_argument("--week", type=int, help="输出整周概览")
    ap.add_argument("--render", action="store_true", help="生成 schedule/week-NN.md")
    ap.add_argument("--selftest", action="store_true", help="校验全部 182 天可生成")
    args = ap.parse_args()

    if args.selftest:
        return selftest()
    if args.render:
        n = render_all(os.path.dirname(os.path.abspath(__file__)))
        print(f"已生成 {n} 个周文件到 fitness/schedule/")
        return 0
    if args.week:
        print(render_week(args.week))
        return 0

    d = date.fromisoformat(args.date) if args.date else datetime.now(TZ).date()
    if args.tomorrow:
        d += timedelta(days=1)
    print(render_day(d))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
