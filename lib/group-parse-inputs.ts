const CHINESE_WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]

function cloneDate(date: Date) {
  return new Date(date.getTime())
}

function shiftDate(date: Date, days: number) {
  const shifted = cloneDate(date)
  shifted.setDate(shifted.getDate() + days)
  return shifted
}

function formatMonthDay(date: Date) {
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

function formatSlashDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}/${month}/${day}`
}

function formatFullDate(date: Date) {
  return `${date.getFullYear()}年${formatMonthDay(date)}`
}

export function getRelativeGroupDates(baseDate = new Date()) {
  const today = cloneDate(baseDate)
  const tomorrow = shiftDate(baseDate, 1)
  const nextWeek = shiftDate(baseDate, 7)

  return {
    today,
    tomorrow,
    nextWeek,
    todayLabel: formatMonthDay(today),
    tomorrowLabel: formatMonthDay(tomorrow),
    todaySlash: formatSlashDate(today),
    tomorrowSlash: formatSlashDate(tomorrow),
    nextWeekSlash: formatSlashDate(nextWeek),
    todayFullLabel: formatFullDate(today),
    tomorrowFullLabel: formatFullDate(tomorrow),
    todayWeekday: CHINESE_WEEKDAYS[today.getDay()],
    tomorrowWeekday: CHINESE_WEEKDAYS[tomorrow.getDay()],
  }
}

export function buildSecurityGroupParseText(baseDate = new Date()) {
  const { todaySlash, nextWeekSlash, todayFullLabel, todayWeekday } = getRelativeGroupDates(baseDate)

  return `【奖励计划经验宣讲会通知】
会议主题：奖励计划经验宣讲会
会议时间：${todaySlash} 14:30-16:30 (GMT+08:00)
重复周期：${todaySlash}-${nextWeekSlash}，每周${todayWeekday.replace("周", "")} 14:30-16:30
腾讯会议链接：https://meeting.tencent.com/dm/xxxx
腾讯会议号：xxx-xxx-xxx

【开源安全奖励计划经验宣讲会日程】
讲座时间：${todayFullLabel}（${todayWeekday}）14:30—16:30
讲座方式：腾讯会议（会议室号：xxx-xxx-xxx）
讲座流程：
14:30—15:00 原创开源软件赛道一等奖分享
15:00—15:30 开源软件改写赛道二等奖分享
15:30—16:00 优秀指导教师分享`
}

export function buildNoticeGroupParseText(baseDate = new Date()) {
  const { tomorrowFullLabel, tomorrowWeekday, tomorrowLabel } = getRelativeGroupDates(baseDate)

  return `【活动预告】"赢在创新大赛"第二十三季第一期
时间：${tomorrowFullLabel}（${tomorrowWeekday}）14:30
地点：***校区***负一层报告厅
请提前15分钟微信签到入场。满10次计两个创新学分，先到先得。
比赛通知链接：https://***.edu.cn/${baseDate.getFullYear()}/0421/***

【就业指导课开课通知】
明天${tomorrowLabel}15点50分，***课室，企业导师给大家授课【简历制作与指导】，大家请携带好简历，课堂上再根据老师的指导完善修改。
@所有人`
}

export function buildMathGroupParseText(baseDate = new Date()) {
  const { tomorrowLabel } = getRelativeGroupDates(baseDate)

  return `同学A：大家讨论一下，关于函数一致连续性的证明，这里取 δ = ε/2 为什么不行？
助教：因为你在闭区间上无法保证 δ 的取值对所有点都成立，需要考虑区间端点的特殊情况...
老师：请大家在明天（${tomorrowLabel}）晚上20:00前，将第三章课后习题证明（手写版扫描件）上传至超星学习通。
老师：命名格式：学号-姓名-第三章作业。逾期不候！
同学B：收到，谢谢老师。顺便问下第四题的积分区间是 [0,1] 还是 [0, +∞) ？`
}

export const SECURITY_GROUP_PARSE_TEXT = buildSecurityGroupParseText()
export const NOTICE_GROUP_PARSE_TEXT = buildNoticeGroupParseText()
export const MATH_GROUP_PARSE_TEXT = buildMathGroupParseText()

export const GROUP_PARSE_INPUTS = {
  "group-1": SECURITY_GROUP_PARSE_TEXT,
  "group-2": NOTICE_GROUP_PARSE_TEXT,
  "group-4": MATH_GROUP_PARSE_TEXT,
} as const
